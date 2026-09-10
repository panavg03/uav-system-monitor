"""
Step 3: First baseline model — fault-type classification head only.

Uses the pre-made 'fold' column from flight_header (joined into
flight_features.csv) as the train/test split, since it's very likely
built to avoid leaking the same aircraft across train and test.

This is intentionally the SIMPLEST possible model first: Random Forest
on the statistical features. Get this working and understood before
adding the proximity-to-failure head or any deep learning.
"""

import pandas as pd
import numpy as np
import os
import warnings
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.impute import SimpleImputer

warnings.filterwarnings("ignore", category=RuntimeWarning)

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
features_path = os.path.join(DATA_DIR, "flight_features.csv")

df = pd.read_csv(features_path)
print("Loaded feature table:", df.shape)
print()

# ---------------------------------------------------------------
# Step 3a — pick the target for this first pass
# Start with 'hclass' (broad category) rather than fine-grained 'class' —
# fewer, more populated categories means a more learnable first model.
# Switch to 'class' later once this works.
# ---------------------------------------------------------------

TARGET_COL = "hclass"

print(f"=== {TARGET_COL} distribution ===")
print(df[TARGET_COL].value_counts())
print()

# ---------------------------------------------------------------
# Step 3b — check how much NaN we actually have in the features
# ---------------------------------------------------------------

feature_cols = [c for c in df.columns if c not in
                ["Master Index", "label", "class", "target_class", "hclass",
                 "before_after", "date_diff", "number_flights_before",
                 "flight_length", "fold"]]

nan_frac = df[feature_cols].isna().mean().sort_values(ascending=False)
print("Top 10 features by fraction NaN:")
print(nan_frac.head(10))
print()

# ---------------------------------------------------------------
# Step 3c — split using the provided 'fold' column, not a random split
# ---------------------------------------------------------------

if "fold" not in df.columns:
    raise ValueError("Expected a 'fold' column from flight_header but didn't find one.")

print("=== fold value counts ===")
print(df["fold"].value_counts())
print()

# 'fold' is a proper 5-fold CV split (roughly even ~2289/2290 each).
# Train on 4 folds, test on the held-out one — NOT the other way around.
test_fold = 0
train_mask = df["fold"] != test_fold
test_mask = df["fold"] == test_fold

print(f"Train rows: {train_mask.sum()}, Test rows: {test_mask.sum()}")
print()

X = df[feature_cols]
y = df[TARGET_COL]

X_train, X_test = X[train_mask], X[test_mask]
y_train, y_test = y[train_mask], y[test_mask]

# ---------------------------------------------------------------
# Step 3d — impute NaNs (median), train, evaluate
# ---------------------------------------------------------------

imputer = SimpleImputer(strategy="median")
X_train_imp = imputer.fit_transform(X_train)
X_test_imp = imputer.transform(X_test)

clf = RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    class_weight="balanced",  # dataset is likely imbalanced across fault types
    random_state=42,
    n_jobs=-1
)

clf.fit(X_train_imp, y_train)
preds = clf.predict(X_test_imp)

print("=== Classification report ===")
print(classification_report(y_test, preds, zero_division=0))
print()
print("=== Confusion matrix ===")
print(confusion_matrix(y_test, preds))
print()

# Find which columns the imputer actually kept (it silently drops any
# column that is 100% NaN in the training fold — no median to compute)
kept_features = imputer.get_feature_names_out(feature_cols)
dropped_features = [c for c in feature_cols if c not in kept_features]
print(f"Imputer dropped {len(dropped_features)} all-NaN columns:")
print(dropped_features)
print()

# ---------------------------------------------------------------
# Step 3e — quick feature importance check
# ---------------------------------------------------------------

importances = pd.Series(clf.feature_importances_, index=kept_features)
print("=== Top 15 most important features ===")
print(importances.sort_values(ascending=False).head(15))