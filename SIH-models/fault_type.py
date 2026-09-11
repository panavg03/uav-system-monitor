"""
try7: Stage 2 -- fault-TYPE classification (hclass 1-4), restricted to
flights that actually have a fault. This is the second stage of the
pipeline: stage 1 (try5/try6) answers "is something wrong?", this one
answers "which broad category?" -- only meant to run on flights stage 1
already flagged.

Reuses the cached sequence tensor from try5. Same fold-based split.
"""

import pandas as pd
import numpy as np
import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import classification_report, confusion_matrix

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
TARGET_LEN = 1000

header_path = os.path.join(DATA_DIR, "flight_header.csv")
cache_path = os.path.join(DATA_DIR, f"seq_cache_{TARGET_LEN}.npz")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# ---------------------------------------------------------------
# Load cached sequences, restrict to fault flights only
# ---------------------------------------------------------------

cache = np.load(cache_path)
X_all = cache["X"]
master_indices = cache["master_indices"]

flight_header = pd.read_csv(header_path).set_index("Master Index")
hclass_all = flight_header.loc[master_indices, "hclass"].to_numpy()
fold_all = flight_header.loc[master_indices, "fold"].to_numpy()

fault_mask = hclass_all != 0
X = X_all[fault_mask]
hclass = hclass_all[fault_mask]
fold = fold_all[fault_mask]

# remap hclass values (1,2,3,4) to 0-indexed labels for the model
classes = sorted(np.unique(hclass))
class_to_idx = {c: i for i, c in enumerate(classes)}
y = np.array([class_to_idx[c] for c in hclass])
n_classes = len(classes)

print("Fault-only flights:", X.shape[0])
print("Classes (original hclass values):", classes)
print("Class counts:", {c: int((hclass == c).sum()) for c in classes})

test_fold = 0
train_mask = fold != test_fold
test_mask = fold == test_fold

X_train, X_test = X[train_mask], X[test_mask]
y_train, y_test = y[train_mask], y[test_mask]

print(f"Train: {X_train.shape}, Test: {X_test.shape}")

# normalize (fit on train only)
train_mean = X_train.mean(axis=(0, 2), keepdims=True)
train_std = X_train.std(axis=(0, 2), keepdims=True) + 1e-6
X_train = (X_train - train_mean) / train_std
X_test = (X_test - train_mean) / train_std

# ---------------------------------------------------------------
# Dataset / model (same CNN backbone, multi-class head)
# ---------------------------------------------------------------

class FlightSeqDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.long)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


train_loader = DataLoader(FlightSeqDataset(X_train, y_train), batch_size=32, shuffle=True)
test_loader = DataLoader(FlightSeqDataset(X_test, y_test), batch_size=64, shuffle=False)


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


model = FlightCNN(X_train.shape[1], n_classes).to(device)

# class weighting for the multi-class imbalance among fault types
class_counts = np.array([(y_train == i).sum() for i in range(n_classes)])
class_weights = torch.tensor(
    class_counts.sum() / (class_counts + 1e-6), dtype=torch.float32
).to(device)
class_weights = class_weights / class_weights.sum() * n_classes  # normalize

criterion = nn.CrossEntropyLoss(weight=class_weights)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)

# ---------------------------------------------------------------
# Train
# ---------------------------------------------------------------

EPOCHS = 20

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
    print(f"Epoch {epoch + 1}/{EPOCHS} - train loss: {total_loss / len(train_loader.dataset):.4f}")

model_path = os.path.join(DATA_DIR, "flight_fault_type_cnn.pt")
torch.save(model.state_dict(), model_path)
print(f"Saved model to {model_path}")

# ---------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------

model.eval()
all_preds, all_labels = [], []
with torch.no_grad():
    for xb, yb in test_loader:
        xb = xb.to(device)
        logits = model(xb)
        preds = logits.argmax(dim=1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(yb.numpy())

print()
print("=== Classification report (fault-type, hclass) ===")
print("Class index -> original hclass:", class_to_idx)
print(classification_report(all_labels, all_preds, zero_division=0))
print()
print("=== Confusion matrix ===")
print(confusion_matrix(all_labels, all_preds))