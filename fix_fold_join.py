"""
Patch: flight_features.csv is missing 'fold' because of a bug in the
original join list. Fix by re-merging against flight_header, using
Master Index as the key. Does NOT redo the slow per-flight feature
extraction.
"""

import pandas as pd
import os

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"  # same folder as before

header_path = os.path.join(DATA_DIR, "flight_header.csv")
features_path = os.path.join(DATA_DIR, "flight_features.csv")

flight_header = pd.read_csv(header_path)
features = pd.read_csv(features_path)

print("Before fix — features columns include 'fold'?", "fold" in features.columns)

# Drop any of these if they already exist in features, to avoid _x/_y
# suffix collisions on re-merge, then pull the full label set fresh
# from flight_header (which we know has 'fold').
already_have = ["label", "class", "target_class", "hclass",
                 "before_after", "date_diff", "number_flights_before",
                 "flight_length", "fold"]
features_clean = features.drop(columns=[c for c in already_have if c in features.columns])

label_cols = ["Master Index"] + [c for c in already_have if c in flight_header.columns]

fixed = features_clean.merge(
    flight_header[label_cols],
    on="Master Index",
    how="left"
)

print("After fix — shape:", fixed.shape)
print("After fix — features columns include 'fold'?", "fold" in fixed.columns)
print()
print("=== fold value counts ===")
print(fixed["fold"].value_counts())

out_path = os.path.join(DATA_DIR, "flight_features.csv")
fixed.to_csv(out_path, index=False)
print()
print(f"Re-saved fixed feature table to {out_path}")