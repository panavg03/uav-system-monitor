"""
Step 1: Load and inspect the NGAFID-style dataset
(flight_header.csv, stats.csv, flight_data.pkl)
"""

import pandas as pd
import os

# CHANGE THIS to the folder that contains all three files
DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"

# ---------------------------------------------------------------
# Step 1a — load the small files first
# ---------------------------------------------------------------

header_path = os.path.join(DATA_DIR, "flight_header.csv")
stats_path = os.path.join(DATA_DIR, "stats.csv")

flight_header = pd.read_csv(header_path)
stats = pd.read_csv(stats_path)

print("=== flight_header ===")
print("shape:", flight_header.shape)
print("columns:", list(flight_header.columns))
print()

print("=== stats ===")
print("shape:", stats.shape)
print("columns:", list(stats.columns))
print()

if "label" in flight_header.columns:
    print("=== label value counts ===")
    print(flight_header["label"].value_counts())
    print()

if "class" in flight_header.columns:
    print("=== class value counts ===")
    print(flight_header["class"].value_counts())
    print()

# ---------------------------------------------------------------
# Step 1b — figure out the sensor column names for flight_data
# stats.csv has 26 columns; 3 are metadata (Unnamed: 0, timestep, cluster),
# the remaining 23 should match the 23 columns in each flight's numpy array.
# ---------------------------------------------------------------

metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
sensor_cols = [c for c in stats.columns if c not in metadata_cols]

print("Derived sensor column names (should be 23):", len(sensor_cols))
print(sensor_cols)
print()

# ---------------------------------------------------------------
# Step 1c — load flight_data.pkl (a dict: key -> numpy array)
# ---------------------------------------------------------------

pkl_path = os.path.join(DATA_DIR, "flight_data.pkl")
flight_data = pd.read_pickle(pkl_path)

print(f"Loaded flight_data. Type: {type(flight_data)}, entries: {len(flight_data)}")

keys = list(flight_data.keys())
sample_key = keys[0]
sample_array = flight_data[sample_key]

print("Sample key:", sample_key)
print("Sample array shape:", sample_array.shape)
print("Number of derived sensor columns:", len(sensor_cols))

# ---------------------------------------------------------------
# Step 1d — wrap one flight into a labeled DataFrame and sanity check it
# ---------------------------------------------------------------

if sample_array.shape[1] == len(sensor_cols):
    sample_df = pd.DataFrame(sample_array, columns=sensor_cols)
    print()
    print("SUCCESS: column count matches. Preview of one flight as a DataFrame:")
    print(sample_df.head())
    print()
    print(sample_df.describe())
else:
    print()
    print("MISMATCH: array has", sample_array.shape[1],
          "columns but derived sensor_cols has", len(sensor_cols))
    print("Don't guess past this — the column order/count needs confirming")
    print("(check the readme, or an NGAFID data dictionary) before proceeding.")

# ---------------------------------------------------------------
# Step 1e — confirm the join key between flight_header and flight_data
# ---------------------------------------------------------------

header_keys = set(flight_header["Master Index"])
data_keys = set(flight_data.keys())
overlap = header_keys & data_keys
print()
print("Master Index values in header:", len(header_keys))
print("Keys in flight_data dict:", len(data_keys))
print("Overlap:", len(overlap))