import os
import json
import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split

# ============================================================
# CONFIG
# ============================================================

DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "flight_telemetry_rows.csv"
)

MODEL_PATH = "synthetic_fault_cnn.pt"
NORM_PATH = "synthetic_norm_stats.npz"

SENSOR_COLS = [
    "oat",
    "rpm",
    "cht1",
    "cht2",
    "egt1",
    "egt2",
    "altitude",
    "oil_temp",
    "fuel_flow",
    "oil_pressure"
]

NUM_CLASSES = 4
AUGMENTATIONS = 100

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Using device:", device)
print("Loading:", DATA_PATH)


# ============================================================
# LOAD TELEMETRY
# ============================================================

df = pd.read_csv(DATA_PATH)

X = []
y = []

for _, row in df.iterrows():

    sensor_data = json.loads(row["sensor_data"])

    sequence = np.array(
        [sensor_data[col] for col in SENSOR_COLS],
        dtype=np.float32
    )

    X.append(sequence)

    # Temporary labels from our existing project database:
    #
    # flight_id 1,3,4,5 etc. correspond to hclass values in
    # the Supabase flights table.
    #
    # The CSV doesn't contain hclass, so use the mapping from
    # the current project data.

    flight_id = int(row["flight_id"])

    hclass_map = {
        1: 0,
        3: 1,
        4: 3,
        5: 2,
        9: 0,
        10: 2,
        11: 1,
        12: 3,
        13: 0,
        14: 2,
        15: 0,
        16: 3,
        17: 2,
        18: 3
    }

    if flight_id not in hclass_map:
        raise ValueError(f"No hclass mapping for flight {flight_id}")

    y.append(hclass_map[flight_id])

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int64)

print("Original dataset:", X.shape)
print("Labels:", y)


# ============================================================
# DATA AUGMENTATION
# ============================================================

rng = np.random.default_rng(42)

X_aug = []
y_aug = []

for sample, label in zip(X, y):

    for _ in range(AUGMENTATIONS):

        augmented = sample.copy()

        # Small sensor noise
        noise_scale = np.maximum(
            np.abs(augmented) * 0.01,
            0.01
        )

        augmented += rng.normal(
            0,
            noise_scale,
            size=augmented.shape
        ).astype(np.float32)

        # Small time scaling
        scale = rng.uniform(0.97, 1.03)

        augmented *= scale

        X_aug.append(augmented)
        y_aug.append(label)

X = np.array(X_aug, dtype=np.float32)
y = np.array(y_aug, dtype=np.int64)

print("Augmented dataset:", X.shape)

print(
    "Class distribution:",
    {
        int(c): int(np.sum(y == c))
        for c in np.unique(y)
    }
)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# ============================================================
# NORMALIZATION
# ============================================================

train_mean = X_train.mean(
    axis=(0, 2),
    keepdims=True
)

train_std = X_train.std(
    axis=(0, 2),
    keepdims=True
) + 1e-6

X_train = (
    X_train - train_mean
) / train_std

X_test = (
    X_test - train_mean
) / train_std


# ============================================================
# CNN
# ============================================================

class FlightCNN(nn.Module):

    def __init__(self, n_channels, n_classes):

        super().__init__()

        self.features = nn.Sequential(

            nn.Conv1d(
                n_channels,
                32,
                kernel_size=3,
                padding=1
            ),

            nn.BatchNorm1d(32),
            nn.ReLU(),

            nn.Conv1d(
                32,
                64,
                kernel_size=3,
                padding=1
            ),

            nn.BatchNorm1d(64),
            nn.ReLU(),

            nn.Conv1d(
                64,
                128,
                kernel_size=3,
                padding=1
            ),

            nn.BatchNorm1d(128),
            nn.ReLU(),

            nn.AdaptiveAvgPool1d(1)
        )

        self.classifier = nn.Linear(
            128,
            n_classes
        )

    def forward(self, x):

        x = self.features(x)

        x = x.squeeze(-1)

        return self.classifier(x)


model = FlightCNN(
    n_channels=len(SENSOR_COLS),
    n_classes=NUM_CLASSES
).to(device)


# ============================================================
# TRAINING
# ============================================================

train_dataset = TensorDataset(
    torch.tensor(X_train, dtype=torch.float32),
    torch.tensor(y_train, dtype=torch.long)
)

train_loader = DataLoader(
    train_dataset,
    batch_size=32,
    shuffle=True
)

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.001
)

EPOCHS = 50

print("\nStarting training...\n")

for epoch in range(EPOCHS):

    model.train()

    total_loss = 0

    for xb, yb in train_loader:

        xb = xb.to(device)
        yb = yb.to(device)

        optimizer.zero_grad()

        outputs = model(xb)

        loss = criterion(
            outputs,
            yb
        )

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    if (epoch + 1) % 5 == 0:

        print(
            f"Epoch {epoch+1:02d}/{EPOCHS} "
            f"Loss: {total_loss / len(train_loader):.4f}"
        )


# ============================================================
# TEST
# ============================================================

model.eval()

with torch.no_grad():

    test_tensor = torch.tensor(
        X_test,
        dtype=torch.float32
    ).to(device)

    outputs = model(test_tensor)

    predictions = torch.argmax(
        outputs,
        dim=1
    ).cpu().numpy()

accuracy = np.mean(
    predictions == y_test
)

print("\nTest accuracy:", accuracy)


# ============================================================
# SAVE MODEL
# ============================================================

torch.save(
    model.state_dict(),
    MODEL_PATH
)

np.savez(
    NORM_PATH,
    mean=train_mean,
    std=train_std,
    sensor_cols=np.array(SENSOR_COLS)
)

print("\n================================")
print("MODEL TRAINING COMPLETE")
print("================================")
print("Model:", MODEL_PATH)
print("Normalization:", NORM_PATH)
print("Input shape:", X.shape[1:])
print("Classes:", NUM_CLASSES)
