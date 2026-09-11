"""
try6: Threshold sweep for the trained CNN.

Reuses the cached sequence tensor and the saved model weights from
try5 -- no retraining. Just tries several probability cutoffs and
shows precision/recall/F1 at each, so you can pick an operating point
deliberately instead of defaulting to 0.5.
"""

import pandas as pd
import numpy as np
import os
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
TARGET_LEN = 1000

header_path = os.path.join(DATA_DIR, "flight_header.csv")
cache_path = os.path.join(DATA_DIR, f"seq_cache_{TARGET_LEN}.npz")
model_path = os.path.join(DATA_DIR, "flight_cnn.pt")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------------------------------------------------------
# Load cached sequences + labels (same logic as try5)
# ---------------------------------------------------------------

cache = np.load(cache_path)
X = cache["X"]
master_indices = cache["master_indices"]

flight_header = pd.read_csv(header_path).set_index("Master Index")
y = flight_header.loc[master_indices, "hclass"].to_numpy()
y = (y != 0).astype(np.float32)
fold = flight_header.loc[master_indices, "fold"].to_numpy()

test_fold = 0
train_mask = fold != test_fold
test_mask = fold == test_fold

X_train, X_test = X[train_mask], X[test_mask]
y_test = y[test_mask]

# same normalization as training -- fit stats must match, so recompute
# from train split (not saved separately here, keep in sync with try5)
train_mean = X_train.mean(axis=(0, 2), keepdims=True)
train_std = X_train.std(axis=(0, 2), keepdims=True) + 1e-6
X_test = (X_test - train_mean) / train_std

# ---------------------------------------------------------------
# Rebuild model architecture and load saved weights
# ---------------------------------------------------------------

class FlightCNN(nn.Module):
    def __init__(self, n_channels):
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
        self.fc = nn.Linear(128, 1)

    def forward(self, x):
        x = self.net(x)
        x = x.squeeze(-1)
        return self.fc(x).squeeze(-1)


n_channels = X_test.shape[1]
model = FlightCNN(n_channels).to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

# ---------------------------------------------------------------
# Get probabilities once
# ---------------------------------------------------------------

X_test_t = torch.tensor(X_test, dtype=torch.float32).to(device)
with torch.no_grad():
    logits = model(X_test_t)
    probs = torch.sigmoid(logits).cpu().numpy()

# ---------------------------------------------------------------
# Sweep thresholds
# ---------------------------------------------------------------

thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]

for t in thresholds:
    preds = (probs >= t).astype(int)
    print(f"\n=== Threshold {t} ===")
    print(classification_report(y_test, preds, zero_division=0, digits=2))
    print(confusion_matrix(y_test, preds))