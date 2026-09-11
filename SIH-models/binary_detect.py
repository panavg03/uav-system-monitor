"""
try4: Binary reframe — normal (hclass==0) vs any-fault (hclass!=0).

Purpose: test whether the features carry real fault signal at all,
isolated from the multi-class rare-class imbalance problem we just
saw in try3. If this also performs poorly, the issue is the features
themselves. If this performs reasonably, the multi-class weakness is
specifically about separating rare fault TYPES, not detecting a
fault's presence.
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
# Build the binary target
# ---------------------------------------------------------------

df["is_fault"] = (df["hclass"] != 0).astype(int)

print("=== is_fault distribution ===")
print(df["is_fault"].value_counts())
print()

feature_cols = [c for c in df.columns if c not in
                ["Master Index", "label", "class", "target_class", "hclass",
                 "before_after", "date_diff", "number_flights_before",
                 "flight_length", "fold", "is_fault"]]

test_fold = 0
train_mask = df["fold"] != test_fold
test_mask = df["fold"] == test_fold

print(f"Train rows: {train_mask.sum()}, Test rows: {test_mask.sum()}")
print()

X = df[feature_cols]
y = df["is_fault"]

X_train, X_test = X[train_mask], X[test_mask]
y_train, y_test = y[train_mask], y[test_mask]

imputer = SimpleImputer(strategy="median")
X_train_imp = imputer.fit_transform(X_train)
X_test_imp = imputer.transform(X_test)

clf = RandomForestClassifier(
    n_estimators=300,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

clf.fit(X_train_imp, y_train)
preds = clf.predict(X_test_imp)
probs = clf.predict_proba(X_test_imp)[:, 1]

print("=== Classification report (binary: normal vs any-fault) ===")
print(classification_report(y_test, preds, zero_division=0))
print()
print("=== Confusion matrix ===")
print(confusion_matrix(y_test, preds))
print()

# ROC-AUC is a better summary metric than accuracy here, since it's
# threshold-independent and less misleading under class imbalance
from sklearn.metrics import roc_auc_score
auc = roc_auc_score(y_test, probs)
print(f"ROC-AUC: {auc:.4f}")
print()

kept_features = imputer.get_feature_names_out(feature_cols)
importances = pd.Series(clf.feature_importances_, index=kept_features)
print("=== Top 15 most important features ===")
print(importances.sort_values(ascending=False).head(15))