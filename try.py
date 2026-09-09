"""
13: Random (but physically plausible) flight generator + inference.

Generates a NEW flight that isn't derived from any real recorded flight
at all -- each sensor's values are randomly sampled within the realistic
range that sensor actually operates in (from stats.csv), with a smooth
random walk over time rather than pure per-timestep noise, so it looks
like a plausible flight instead of static.

This is different from 09/11: those start from a REAL healthy flight
and add a targeted fault signature. This script builds a flight from
nothing but statistical bounds -- useful for testing how the model
handles genuinely novel input, not just variations of real flights.
"""

import pandas as pd
import numpy as np
import os
import torch
import torch.nn as nn

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
TARGET_LEN = 1000

stats_path = os.path.join(DATA_DIR, "stats.csv")
model_path = os.path.join(DATA_DIR, "synthetic_fault_cnn.pt")
norm_path = os.path.join(DATA_DIR, "synthetic_norm_stats.npz")
data_path = os.path.join(DATA_DIR, "synthetic_fault_dataset.npz")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

stats = pd.read_csv(stats_path)
metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
SENSOR_COLS = [c for c in stats.columns if c not in metadata_cols]
n_sensors = len(SENSOR_COLS)

# Use the two cluster rows in stats.csv as realistic mean/range per sensor.
# Each sensor gets a plausible min/max derived from these two references.
sensor_stats = {}
for col in SENSOR_COLS:
    vals = stats[col].to_numpy()
    center = np.nanmean(vals)
    spread = np.nanstd(vals) if np.nanstd(vals) > 0 else abs(center) * 0.1 + 1.0
    sensor_stats[col] = (center, spread)

# ---------------------------------------------------------------
# Generate one random-but-plausible flight
# ---------------------------------------------------------------

def generate_random_flight(seed=None):
    rng = np.random.default_rng(seed)
    flight = np.zeros((n_sensors, TARGET_LEN), dtype=np.float32)

    for i, col in enumerate(SENSOR_COLS):
        center, spread = sensor_stats[col]

        # random walk: start near the sensor's typical value, drift smoothly,
        # not pure independent noise per timestep (that would look nothing
        # like a real continuous sensor trace)
        steps = rng.normal(0, spread * 0.02, size=TARGET_LEN)
        walk = np.cumsum(steps)
        walk -= walk.mean()  # re-center so it doesn't drift unrealistically far

        flight[i, :] = center + walk + rng.normal(0, spread * 0.05, size=TARGET_LEN)

    return flight


live_flight = generate_random_flight(seed=None)  # remove seed for a new random flight each run

# ---------------------------------------------------------------
# Load model + normalization stats, run inference
# ---------------------------------------------------------------

norm = np.load(norm_path)
train_mean, train_std = norm["mean"], norm["std"]

synth_data = np.load(data_path, allow_pickle=True)
class_names = list(synth_data["class_names"])


class FlightCNN(nn.Module):
    def __init__(self, n_channels, n_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(n_channels, 32, kernel_size=7, padding=3),
            nn.BatchNorm1d(32), nn.ReLU(), nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.BatchNorm1d(64), nn.ReLU(), nn.MaxPool1d(2),
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128), nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.fc = nn.Linear(128, n_classes)

    def forward(self, x):
        x = self.net(x).squeeze(-1)
        return self.fc(x)


model = FlightCNN(n_sensors, len(class_names)).to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

x_norm = (live_flight - train_mean[0]) / train_std[0]
x_tensor = torch.tensor(x_norm, dtype=torch.float32).unsqueeze(0).to(device)

with torch.no_grad():
    logits = model(x_tensor)
    probs = torch.softmax(logits, dim=1).cpu().numpy()[0]

pred_idx = probs.argmax()
pred_label = class_names[pred_idx]

print("=== Random synthetic flight (not derived from any real recorded flight) ===")
print(f"Predicted: {pred_label} ({probs[pred_idx]*100:.1f}% confidence)")
print()
print("Full breakdown:")
for name, p in sorted(zip(class_names, probs), key=lambda x: -x[1]):
    print(f"  {name:<25} {p*100:5.1f}%")  