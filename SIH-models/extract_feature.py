"""
Step 2: Build a flat, per-flight feature table.

For each flight in flight_data (dict: Master Index -> numpy array of
shape [n_seconds, 23]), compute a fixed-size set of statistical
features per sensor column, then join with the relevant label columns
from flight_header.

Output: one row per flight, ready to feed into a classical model
(Random Forest / XGBoost) as a first baseline.
"""

import pandas as pd
import numpy as np
import os

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"  # same folder as before

header_path = os.path.join(DATA_DIR, "flight_header.csv")
stats_path = os.path.join(DATA_DIR, "stats.csv")
pkl_path = os.path.join(DATA_DIR, "flight_data.pkl")

flight_header = pd.read_csv(header_path)
stats = pd.read_csv(stats_path)
flight_data = pd.read_pickle(pkl_path)

metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
sensor_cols = [c for c in stats.columns if c not in metadata_cols]

print("Sensor columns:", len(sensor_cols))
print("Total flights in flight_data:", len(flight_data))

# ---------------------------------------------------------------
# Step 2a — per-flight feature extraction
# ---------------------------------------------------------------

def extract_features(arr: np.ndarray, columns: list) -> dict:
    """
    arr: shape (n_seconds, n_sensors)
    Returns a flat dict of {sensor}_{stat}: value

    IMPORTANT: raw sensor arrays contain occasional literal inf/-inf
    values (a logging/sensor artifact affecting most flights). A single
    inf in a column poisons mean()/std() for the WHOLE flight if not
    handled first. Fix: replace inf -> NaN at the array level, then use
    nan-aware stats (nanmean etc.) so one bad timestep doesn't wipe out
    an entire flight's feature.
    """
    feats = {}

    # Replace inf/-inf with NaN across the whole array up front
    clean_arr = arr.astype(float)
    clean_arr[np.isinf(clean_arr)] = np.nan

    df = pd.DataFrame(clean_arr, columns=columns)

    for col in columns:
        series = df[col]
        safe_name = col.replace(" ", "_")
        valid = series.dropna()

        if len(valid) == 0:
            # entire column is bad for this flight — record as NaN,
            # not 0, so it's still visible as missing, not a fake value
            feats[f"{safe_name}_mean"] = np.nan
            feats[f"{safe_name}_std"] = np.nan
            feats[f"{safe_name}_min"] = np.nan
            feats[f"{safe_name}_max"] = np.nan
            feats[f"{safe_name}_trend"] = np.nan
            continue

        feats[f"{safe_name}_mean"] = valid.mean()
        feats[f"{safe_name}_std"] = valid.std()
        feats[f"{safe_name}_min"] = valid.min()
        feats[f"{safe_name}_max"] = valid.max()

        n = len(valid)
        if n >= 3:
            third = n // 3
            feats[f"{safe_name}_trend"] = valid.iloc[-third:].mean() - valid.iloc[:third].mean()
        else:
            feats[f"{safe_name}_trend"] = np.nan

    feats["n_seconds"] = arr.shape[0]
    return feats


rows = []
master_indices = []

keys = list(flight_data.keys())
total = len(keys)

for i, key in enumerate(keys):
    arr = flight_data[key]

    if arr.shape[1] != len(sensor_cols):
        # skip anything that doesn't match the expected shape rather
        # than silently mislabeling columns
        continue

    feats = extract_features(arr, sensor_cols)
    rows.append(feats)
    master_indices.append(key)

    if (i + 1) % 1000 == 0:
        print(f"Processed {i + 1}/{total} flights")

feature_df = pd.DataFrame(rows)
feature_df["Master Index"] = master_indices

print()
print("Feature table shape:", feature_df.shape)
print(feature_df.head())

# ---------------------------------------------------------------
# Step 2b — join with the label columns from flight_header
# ---------------------------------------------------------------

label_cols = ["Master Index", "label", "class", "target_class", "hclass",
              "before_after", "date_diff", "number_flights_before", "flight_length"]
label_cols = [c for c in label_cols if c in flight_header.columns]

joined = feature_df.merge(
    flight_header[label_cols],
    on="Master Index",
    how="left"
)

print()
print("Joined table shape:", joined.shape)
print(joined.head())

# ---------------------------------------------------------------
# Step 2c — save so we don't have to redo this expensive step
# ---------------------------------------------------------------

out_path = os.path.join(DATA_DIR, "flight_features.csv")
joined.to_csv(out_path, index=False)
print()
print(f"Saved feature table to {out_path}")