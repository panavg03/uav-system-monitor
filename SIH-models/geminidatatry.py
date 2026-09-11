"""
16: Run the trained model on the Gemini-generated CSV (single file,
multiple flights grouped by flight_id).

IMPORTANT, read before trusting the output:
This file has only ~11 of the 23 sensors the model was trained on
(no volt/amp channels, no oil temp/pressure, no OAT, and only ONE
EGT/CHT reading per flight instead of 4). Missing sensors are filled
with 0 (the training-normalized "neutral" value) -- predictions here
are a rough smoke-test, not a reliable evaluation. Document this
limitation if you report these results.
"""

import pandas as pd
import numpy as np
import os
import torch
import torch.nn as nn

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"          # trained model files
EXTERNAL_CSV_PATH = r"C:\Users\dhruv\Desktop\Gemini.csv"   # <-- adjust if not here

TARGET_LEN = 1000

model_path = os.path.join(DATA_DIR, "synthetic_fault_cnn.pt")
norm_path = os.path.join(DATA_DIR, "synthetic_norm_stats.npz")
data_path = os.path.join(DATA_DIR, "synthetic_fault_dataset.npz")
stats_path = os.path.join(DATA_DIR, "stats.csv")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# ---------------------------------------------------------------
# Model's expected sensor order (unchanged, from training)
# ---------------------------------------------------------------

stats = pd.read_csv(stats_path)
metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
MODEL_SENSOR_COLS = [c for c in stats.columns if c not in metadata_cols]

# ---------------------------------------------------------------
# Mapping based on the ACTUAL columns in Gemini.csv:
# flight_id, time_step_sec, pitch_deg, roll_deg, heading_deg, ias_kt,
# tas_kt, alt_msl_ft, vertical_speed_fpm, engine_rpm, fuel_flow_gph,
# norm_accel_g, lat_accel_g, long_accel_g, egt_deg_f, cht_deg_f
#
# Only 6 of the model's 23 sensors have a real match here. Everything
# else stays at 0 (neutral placeholder) -- listed explicitly so it's
# not a silent gap.
# ---------------------------------------------------------------

COLUMN_MAP = {
    "engine_rpm": "E1 RPM",
    "fuel_flow_gph": "E1 FFlow",
    "egt_deg_f": "E1 EGT1",       # model has 4 EGT channels; only 1 available here
    "cht_deg_f": "E1 CHT1",       # model has 4 CHT channels; only 1 available here
    "ias_kt": "IAS",
    "alt_msl_ft": "AltMSL",
    "vertical_speed_fpm": "VSpd",
    "norm_accel_g": "NormAc",     # NOTE: units/baseline likely differ -- see caution below
}

MISSING_SENSORS = [c for c in MODEL_SENSOR_COLS if c not in COLUMN_MAP.values()]
print(f"{len(MISSING_SENSORS)} of {len(MODEL_SENSOR_COLS)} model sensors have NO match in this file:")
print(MISSING_SENSORS)
print("These will be filled with 0 (neutral placeholder).\n")

# ---------------------------------------------------------------
# Load and group by flight
# ---------------------------------------------------------------

df = pd.read_csv(EXTERNAL_CSV_PATH)
flight_ids = df["flight_id"].unique()
print(f"Found {len(flight_ids)} flights: {list(flight_ids)}\n")

inv_map = {v: k for k, v in COLUMN_MAP.items()}


def prepare_flight(flight_df: pd.DataFrame) -> np.ndarray:
    flight_df = flight_df.sort_values("time_step_sec")
    n_seconds = len(flight_df)
    out = np.zeros((len(MODEL_SENSOR_COLS), TARGET_LEN), dtype=np.float32)

    orig_x = np.linspace(0, 1, n_seconds)
    target_x = np.linspace(0, 1, TARGET_LEN)

    for i, model_col in enumerate(MODEL_SENSOR_COLS):
        if model_col not in inv_map:
            # neutral fill = this sensor's OWN training mean (raw units),
            # so after normalization it becomes exactly 0 -- truly neutral.
            # Filling with raw 0 is WRONG for sensors whose real values
            # never sit near 0 (e.g. oil pressure ~77) -- it creates a
            # fake extreme-low reading that can look like a real fault.
            out[i, :] = train_mean[0, i, 0]
            continue

        col = flight_df[inv_map[model_col]].to_numpy(dtype=float).copy()
        col[np.isinf(col)] = np.nan
        if np.all(np.isnan(col)):
            out[i, :] = 0.0
            continue

        s = pd.Series(col).interpolate(limit_direction="both").to_numpy()
        out[i, :] = np.interp(target_x, orig_x, s)

    return out


# Load normalization stats BEFORE processing flights (prepare_flight
# needs train_mean for the neutral-fill fix above)
norm = np.load(norm_path)
train_mean, train_std = norm["mean"], norm["std"]

X_list = []
for fid in flight_ids:
    X_list.append(prepare_flight(df[df["flight_id"] == fid]))

X_external = np.stack(X_list).astype(np.float32)
print("External dataset shape:", X_external.shape)

# ---------------------------------------------------------------
# Load model, run inference
# ---------------------------------------------------------------

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


model = FlightCNN(len(MODEL_SENSOR_COLS), len(class_names)).to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

X_norm = (X_external - train_mean) / train_std
X_tensor = torch.tensor(X_norm, dtype=torch.float32).to(device)

with torch.no_grad():
    logits = model(X_tensor)
    probs = torch.softmax(logits, dim=1).cpu().numpy()

pred_idx = probs.argmax(axis=1)
pred_labels = [class_names[i] for i in pred_idx]
confidences = probs[np.arange(len(probs)), pred_idx]

results = pd.DataFrame({
    "flight_id": flight_ids,
    "predicted_label": pred_labels,
    "confidence": confidences,
})
for i, name in enumerate(class_names):
    results[f"prob_{name}"] = probs[:, i]

out_dir = os.path.dirname(EXTERNAL_CSV_PATH)
out_path = os.path.join(out_dir, "gemini_csv_predictions.csv")
results.to_csv(out_path, index=False)
print(f"\nSaved predictions to {out_path}\n")
print(results[["flight_id", "predicted_label", "confidence"]])