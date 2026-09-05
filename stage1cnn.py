"""
try5: 1D-CNN over raw downsampled sensor sequences (GPU).

Same target as try4 (is_fault: normal vs any-fault) and same fold-based
split, so this result is directly comparable to the 0.63 ROC-AUC
statistical-feature baseline. Goal: see whether a model that can see
the SHAPE of the sensor traces (not just flat summary stats) does
meaningfully better.
"""

import pandas as pd
import numpy as np
import os
import warnings
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

warnings.filterwarnings("ignore", category=RuntimeWarning)

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
TARGET_LEN = 1000  # every flight gets resampled to this many points

header_path = os.path.join(DATA_DIR, "flight_header.csv")
stats_path = os.path.join(DATA_DIR, "stats.csv")
pkl_path = os.path.join(DATA_DIR, "flight_data.pkl")
cache_path = os.path.join(DATA_DIR, f"seq_cache_{TARGET_LEN}.npz")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# ---------------------------------------------------------------
# Step A — build or load the cached, cleaned, resampled sequence tensor
# ---------------------------------------------------------------

def clean_and_resample(arr: np.ndarray, target_len: int) -> np.ndarray:
    """
    arr: shape (n_seconds, n_sensors)
    Returns: shape (n_sensors, target_len) -- channel-first for Conv1d
    """
    arr = arr.astype(float)
    arr[np.isinf(arr)] = np.nan

    n_seconds, n_sensors = arr.shape
    out = np.zeros((n_sensors, target_len), dtype=np.float32)

    orig_x = np.linspace(0, 1, n_seconds)
    target_x = np.linspace(0, 1, target_len)

    for c in range(n_sensors):
        col = arr[:, c]
        if np.all(np.isnan(col)):
            out[c, :] = 0.0
            continue

        # fill internal/edge NaNs via linear interpolation over time
        s = pd.Series(col).interpolate(limit_direction="both").to_numpy()

        # resample to the fixed target length
        out[c, :] = np.interp(target_x, orig_x, s)

    return out


if os.path.exists(cache_path):
    print("Loading cached sequence tensor...")
    cache = np.load(cache_path)
    X = cache["X"]
    master_indices = cache["master_indices"]
    print("Loaded cache. X shape:", X.shape)
else:
    print("No cache found — building sequence tensor (this will take a while)...")

    flight_header = pd.read_csv(header_path)
    stats = pd.read_csv(stats_path)
    flight_data = pd.read_pickle(pkl_path)

    metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
    sensor_cols = [c for c in stats.columns if c not in metadata_cols]
    n_sensors = len(sensor_cols)

    keys = list(flight_data.keys())
    total = len(keys)

    X = np.zeros((total, n_sensors, TARGET_LEN), dtype=np.float32)
    master_indices = np.zeros(total, dtype=np.int64)

    for i, key in enumerate(keys):
        arr = flight_data[key]
        if arr.shape[1] != n_sensors:
            continue
        X[i] = clean_and_resample(arr, TARGET_LEN)
        master_indices[i] = key

        if (i + 1) % 1000 == 0:
            print(f"Processed {i + 1}/{total} flights")

    np.savez_compressed(cache_path, X=X, master_indices=master_indices)
    print("Cached sequence tensor to", cache_path)

# ---------------------------------------------------------------
# Step B — build labels and the fold-based split, aligned to X's order
# ---------------------------------------------------------------

flight_header = pd.read_csv(header_path)
flight_header = flight_header.set_index("Master Index")

y = flight_header.loc[master_indices, "hclass"].to_numpy()
y = (y != 0).astype(np.float32)  # is_fault binary target

fold = flight_header.loc[master_indices, "fold"].to_numpy()

test_fold = 0
train_mask = fold != test_fold
test_mask = fold == test_fold

X_train, X_test = X[train_mask], X[test_mask]
y_train, y_test = y[train_mask], y[test_mask]

print(f"Train: {X_train.shape}, Test: {X_test.shape}")
print(f"Train fault rate: {y_train.mean():.3f}, Test fault rate: {y_test.mean():.3f}")

# ---------------------------------------------------------------
# Step C — normalize (fit on train only, apply to both)
# ---------------------------------------------------------------

train_mean = X_train.mean(axis=(0, 2), keepdims=True)
train_std = X_train.std(axis=(0, 2), keepdims=True) + 1e-6

X_train = (X_train - train_mean) / train_std
X_test = (X_test - train_mean) / train_std

# ---------------------------------------------------------------
# Step D — PyTorch Dataset / DataLoader
# ---------------------------------------------------------------

class FlightSeqDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


train_ds = FlightSeqDataset(X_train, y_train)
test_ds = FlightSeqDataset(X_test, y_test)

train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
test_loader = DataLoader(test_ds, batch_size=64, shuffle=False)

# ---------------------------------------------------------------
# Step E — model
# ---------------------------------------------------------------

class FlightCNN(nn.Module):
    def __init__(self, n_channels):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(n_channels, 32, kernel_size=7, padding=3),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),

            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),

            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.fc = nn.Linear(128, 1)

    def forward(self, x):
        x = self.net(x)
        x = x.squeeze(-1)
        return self.fc(x).squeeze(-1)


n_channels = X_train.shape[1]
model = FlightCNN(n_channels).to(device)

# handle class imbalance via pos_weight in the loss
n_pos = y_train.sum()
n_neg = len(y_train) - n_pos
pos_weight = torch.tensor([n_neg / max(n_pos, 1)], dtype=torch.float32).to(device)

criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)

# ---------------------------------------------------------------
# Step F — training loop
# ---------------------------------------------------------------

EPOCHS = 15

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0.0
    for xb, yb in train_loader:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()
        logits = model(xb)
        loss = criterion(logits, yb)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * xb.size(0)

    avg_loss = total_loss / len(train_ds)
    print(f"Epoch {epoch + 1}/{EPOCHS} - train loss: {avg_loss:.4f}")

# Save the trained model so later scripts (threshold sweep, further
# eval) can reuse it without retraining from scratch
model_path = os.path.join(DATA_DIR, "flight_cnn.pt")
torch.save(model.state_dict(), model_path)
print(f"Saved trained model to {model_path}")

# ---------------------------------------------------------------
# Step G — evaluation
# ---------------------------------------------------------------

model.eval()
all_probs = []
all_labels = []

with torch.no_grad():
    for xb, yb in test_loader:
        xb = xb.to(device)
        logits = model(xb)
        probs = torch.sigmoid(logits).cpu().numpy()
        all_probs.extend(probs)
        all_labels.extend(yb.numpy())

all_probs = np.array(all_probs)
all_labels = np.array(all_labels)
preds = (all_probs >= 0.5).astype(int)

print()
print("=== Classification report (CNN, binary is_fault) ===")
print(classification_report(all_labels, preds, zero_division=0))
print()
print("=== Confusion matrix ===")
print(confusion_matrix(all_labels, preds))
print()
print(f"ROC-AUC: {roc_auc_score(all_labels, all_probs):.4f}")