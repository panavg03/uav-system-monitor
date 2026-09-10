"""
11: Real-time inference demo.

Simulates what the deployed system would do with a live flight:
- Pick a real healthy baseline flight
- Optionally inject a fault (simulating "this is what's happening right now")
- Run it through the trained synthetic-fault CNN
- Print a health-monitoring style report

This is the script to run live in front of judges. Change FAULT_TO_SIMULATE
to show different scenarios.
"""

import pandas as pd
import numpy as np
import os
import torch
import torch.nn as nn

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
TARGET_LEN = 1000

header_path = os.path.join(DATA_DIR, "flight_header.csv")
stats_path = os.path.join(DATA_DIR, "stats.csv")
cache_path = os.path.join(DATA_DIR, f"seq_cache_{TARGET_LEN}.npz")
model_path = os.path.join(DATA_DIR, "synthetic_fault_cnn.pt")
norm_path = os.path.join(DATA_DIR, "synthetic_norm_stats.npz")
data_path = os.path.join(DATA_DIR, "synthetic_fault_dataset.npz")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------------------------------------------------------
# CHANGE THIS to demo different scenarios:
# None = show a real healthy flight as-is
# or one of: "misfire", "injector_abnormality", "coking_degradation",
# "lubrication_issue", "sensor_drift", "combustion_instability",
# "overheating_trend", "abnormal_vibration"
# ---------------------------------------------------------------
FAULT_TO_SIMULATE = "overheating_trend"

# ---------------------------------------------------------------
# Load everything needed
# ---------------------------------------------------------------

stats = pd.read_csv(stats_path)
metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
SENSOR_COLS = [c for c in stats.columns if c not in metadata_cols]
IDX = {name: i for i, name in enumerate(SENSOR_COLS)}

cache = np.load(cache_path)
X_all = cache["X"]
master_indices = cache["master_indices"]
flight_header = pd.read_csv(header_path).set_index("Master Index")
hclass = flight_header.loc[master_indices, "hclass"].to_numpy()
X_healthy = X_all[hclass == 0]

norm = np.load(norm_path)
train_mean, train_std = norm["mean"], norm["std"]

data = np.load(data_path, allow_pickle=True)
class_names = list(data["class_names"])

# ---------------------------------------------------------------
# Same fault injectors as step 09 (kept in sync manually -- if you
# change 09's injectors, mirror the change here)
# ---------------------------------------------------------------

rng = np.random.default_rng()

def inject_misfire(arr):
    out = arr.copy()
    rpm, egt = out[IDX["E1 RPM"]], out[IDX["E1 EGT1"]]
    for _ in range(rng.integers(15, 40)):
        t = rng.integers(0, TARGET_LEN - 5)
        rpm[t:t+3] -= rpm[t] * rng.uniform(0.08, 0.2)
        egt[t:t+3] += egt[t] * rng.uniform(0.05, 0.15)
    return out

def inject_injector_abnormality(arr):
    out = arr.copy()
    fflow = out[IDX["E1 FFlow"]]
    fflow += rng.normal(0, fflow.std() * 0.3, size=TARGET_LEN)
    out[IDX["E1 EGT1"]] += out[IDX["E1 EGT1"]].std() * 0.4
    out[IDX["E1 EGT3"]] -= out[IDX["E1 EGT3"]].std() * 0.3
    return out

def inject_coking_degradation(arr):
    out = arr.copy()
    ramp = np.linspace(0, 1, TARGET_LEN)
    for c in ["E1 EGT1", "E1 EGT2", "E1 EGT3", "E1 EGT4", "E1 CHT1"]:
        out[IDX[c]] += ramp * out[IDX[c]].std() * rng.uniform(0.5, 1.0)
    return out

def inject_lubrication_issue(arr):
    out = arr.copy()
    ramp = np.linspace(0, 1, TARGET_LEN)
    out[IDX["E1 OilP"]] -= ramp * abs(out[IDX["E1 OilP"]].mean()) * rng.uniform(0.2, 0.4)
    out[IDX["E1 OilT"]] += ramp * out[IDX["E1 OilT"]].std() * rng.uniform(0.5, 1.0)
    return out

def inject_sensor_drift(arr):
    out = arr.copy()
    channel = rng.choice(["E1 RPM", "E1 CHT2", "OAT"])
    ramp = np.linspace(0, 1, TARGET_LEN)
    out[IDX[channel]] += ramp * out[IDX[channel]].std() * rng.uniform(1.0, 2.5)
    return out

def inject_combustion_instability(arr):
    out = arr.copy()
    for c in ["E1 EGT1", "E1 EGT2", "E1 RPM"]:
        out[IDX[c]] += rng.normal(0, out[IDX[c]].std() * 0.5, size=TARGET_LEN)
    return out

def inject_overheating_trend(arr):
    out = arr.copy()
    ramp = np.linspace(0, 1, TARGET_LEN) ** 1.5
    for c in ["E1 CHT1", "E1 CHT2", "E1 CHT3", "E1 CHT4", "E1 OilT"]:
        out[IDX[c]] += ramp * out[IDX[c]].std() * rng.uniform(0.8, 1.5)
    return out

def inject_abnormal_vibration(arr):
    out = arr.copy()
    vib = out[IDX["NormAc"]]
    vib += rng.normal(0, vib.std() * rng.uniform(1.5, 3.0), size=TARGET_LEN)
    return out

INJECTORS = {
    "misfire": inject_misfire,
    "injector_abnormality": inject_injector_abnormality,
    "coking_degradation": inject_coking_degradation,
    "lubrication_issue": inject_lubrication_issue,
    "sensor_drift": inject_sensor_drift,
    "combustion_instability": inject_combustion_instability,
    "overheating_trend": inject_overheating_trend,
    "abnormal_vibration": inject_abnormal_vibration,
}

# ---------------------------------------------------------------
# Generate the "live" flight
# ---------------------------------------------------------------

src_idx = rng.integers(0, X_healthy.shape[0])
live_flight = X_healthy[src_idx].copy()

if FAULT_TO_SIMULATE is not None:
    live_flight = INJECTORS[FAULT_TO_SIMULATE](live_flight)
    true_label = FAULT_TO_SIMULATE
else:
    true_label = "normal"

print(f"Simulating live flight. Ground truth (for demo purposes): {true_label}")

# ---------------------------------------------------------------
# Load model, run inference
# ---------------------------------------------------------------

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


model = FlightCNN(len(SENSOR_COLS), len(class_names)).to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

x_norm = (live_flight - train_mean[0]) / train_std[0]
x_tensor = torch.tensor(x_norm, dtype=torch.float32).unsqueeze(0).to(device)

with torch.no_grad():
    logits = model(x_tensor)
    probs = torch.softmax(logits, dim=1).cpu().numpy()[0]

pred_idx = probs.argmax()
pred_label = class_names[pred_idx]

# ---------------------------------------------------------------
# Health-monitoring style report
# ---------------------------------------------------------------

print()
print("=" * 50)
print("DIGITAL TWIN -- ENGINE HEALTH REPORT")
print("=" * 50)
print(f"Predicted status: {pred_label.upper()}")
print(f"Confidence: {probs[pred_idx]*100:.1f}%")
print()
print("Full probability breakdown:")
for name, p in sorted(zip(class_names, probs), key=lambda x: -x[1]):
    bar = "#" * int(p * 40)
    print(f"  {name:<25} {p*100:5.1f}% {bar}")

if pred_label != "normal":
    print()
    print(f"ALERT: {pred_label.replace('_', ' ')} detected -- recommend maintenance review.")