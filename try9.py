"""
09: Fault injection simulator.

Takes REAL healthy flight sequences (hclass == 0) from the cached
resampled tensor, and synthetically injects the fault signatures
required by the problem statement but NOT present as labels in
NGAFID: misfire, injector abnormality, coking degradation,
lubrication issue, sensor drift, combustion instability, overheating
trend, abnormal vibration.

Real physics/noise as the baseline, synthetic fault signal on top.
Produces a new labeled dataset ready to train a classifier on the
problem statement's own fault taxonomy, and reusable at demo time to
generate a single "live" flight for real-time inference.
"""

import pandas as pd
import numpy as np
import os

DATA_DIR = r"C:\Users\dhruv\Desktop\2days\2days"
TARGET_LEN = 1000

header_path = os.path.join(DATA_DIR, "flight_header.csv")
stats_path = os.path.join(DATA_DIR, "stats.csv")
cache_path = os.path.join(DATA_DIR, f"seq_cache_{TARGET_LEN}.npz")

# ---------------------------------------------------------------
# Load real healthy baseline flights
# ---------------------------------------------------------------

stats = pd.read_csv(stats_path)
metadata_cols = {"Unnamed: 0", "timestep", "cluster"}
SENSOR_COLS = [c for c in stats.columns if c not in metadata_cols]
IDX = {name: i for i, name in enumerate(SENSOR_COLS)}  # e.g. IDX["E1 RPM"]

cache = np.load(cache_path)
X_all = cache["X"]
master_indices = cache["master_indices"]

flight_header = pd.read_csv(header_path).set_index("Master Index")
hclass = flight_header.loc[master_indices, "hclass"].to_numpy()

healthy_mask = hclass == 0
X_healthy = X_all[healthy_mask]
print("Healthy baseline flights available:", X_healthy.shape[0])

rng = np.random.default_rng(42)

# ---------------------------------------------------------------
# Fault injection functions
# Each takes ONE flight's array, shape (n_sensors, TARGET_LEN),
# and returns a MODIFIED COPY with a synthetic fault signature.
# ---------------------------------------------------------------

def inject_misfire(arr):
    out = arr.copy()
    rpm = out[IDX["E1 RPM"]]
    egt = out[IDX["E1 EGT1"]]
    n_events = rng.integers(15, 40)
    for _ in range(n_events):
        t = rng.integers(0, TARGET_LEN - 5)
        rpm[t:t+3] -= rpm[t] * rng.uniform(0.08, 0.2)   # brief RPM dip
        egt[t:t+3] += egt[t] * rng.uniform(0.05, 0.15)  # brief EGT spike
    return out


def inject_injector_abnormality(arr):
    out = arr.copy()
    fflow = out[IDX["E1 FFlow"]]
    egts = [out[IDX[c]] for c in ["E1 EGT1", "E1 EGT2", "E1 EGT3", "E1 EGT4"]]
    noise = rng.normal(0, fflow.std() * 0.3, size=TARGET_LEN)
    fflow += noise  # irregular fuel flow
    # uneven spread across cylinders (one runs hot, one runs cold)
    egts[0] += egts[0].std() * 0.4
    egts[2] -= egts[2].std() * 0.3
    return out


def inject_coking_degradation(arr):
    out = arr.copy()
    ramp = np.linspace(0, 1, TARGET_LEN)
    for c in ["E1 EGT1", "E1 EGT2", "E1 EGT3", "E1 EGT4", "E1 CHT1"]:
        out[IDX[c]] += ramp * out[IDX[c]].std() * rng.uniform(0.5, 1.0)
    return out


def inject_lubrication_issue(arr):
    out = arr.copy()
    ramp = np.linspace(0, 1, TARGET_LEN)
    out[IDX["E1 OilP"]] -= ramp * abs(out[IDX["E1 OilP"]].mean()) * rng.uniform(0.2, 0.4)
    out[IDX["E1 OilT"]] += ramp * out[IDX["E1 OilT"]].std() * rng.uniform(0.5, 1.0)
    return out


def inject_sensor_drift(arr):
    out = arr.copy()
    channel = rng.choice(["E1 RPM", "E1 CHT2", "OAT"])
    ramp = np.linspace(0, 1, TARGET_LEN)
    bias = out[IDX[channel]].std() * rng.uniform(1.0, 2.5)
    out[IDX[channel]] += ramp * bias
    return out


def inject_combustion_instability(arr):
    out = arr.copy()
    for c in ["E1 EGT1", "E1 EGT2", "E1 RPM"]:
        extra_noise = rng.normal(0, out[IDX[c]].std() * 0.5, size=TARGET_LEN)
        out[IDX[c]] += extra_noise
    return out


def inject_overheating_trend(arr):
    out = arr.copy()
    ramp = np.linspace(0, 1, TARGET_LEN) ** 1.5  # accelerating rise
    for c in ["E1 CHT1", "E1 CHT2", "E1 CHT3", "E1 CHT4", "E1 OilT"]:
        out[IDX[c]] += ramp * out[IDX[c]].std() * rng.uniform(0.8, 1.5)
    return out


def inject_abnormal_vibration(arr):
    out = arr.copy()
    vib = out[IDX["NormAc"]]
    extra = rng.normal(0, vib.std() * rng.uniform(1.5, 3.0), size=TARGET_LEN)
    vib += extra
    return out


FAULT_INJECTORS = {
    "misfire": inject_misfire,
    "injector_abnormality": inject_injector_abnormality,
    "coking_degradation": inject_coking_degradation,
    "lubrication_issue": inject_lubrication_issue,
    "sensor_drift": inject_sensor_drift,
    "combustion_instability": inject_combustion_instability,
    "overheating_trend": inject_overheating_trend,
    "abnormal_vibration": inject_abnormal_vibration,
}

# ---------------------------------------------------------------
# Build the synthetic labeled dataset
# ---------------------------------------------------------------

SAMPLES_PER_FAULT = 500  # tune based on how much data you want

X_synth = []
y_synth = []  # string label
class_names = ["normal"] + list(FAULT_INJECTORS.keys())

# include real healthy flights, labeled "normal"
n_normal = min(SAMPLES_PER_FAULT, X_healthy.shape[0])
normal_idx = rng.choice(X_healthy.shape[0], size=n_normal, replace=False)
for i in normal_idx:
    X_synth.append(X_healthy[i])
    y_synth.append("normal")

# generate faulted versions from random healthy flights
for fault_name, fn in FAULT_INJECTORS.items():
    src_idx = rng.choice(X_healthy.shape[0], size=SAMPLES_PER_FAULT, replace=True)
    for i in src_idx:
        X_synth.append(fn(X_healthy[i]))
        y_synth.append(fault_name)
    print(f"Generated {SAMPLES_PER_FAULT} samples for: {fault_name}")

X_synth = np.stack(X_synth).astype(np.float32)
label_to_idx = {name: i for i, name in enumerate(class_names)}
y_synth_idx = np.array([label_to_idx[l] for l in y_synth], dtype=np.int64)

print()
print("Synthetic dataset shape:", X_synth.shape)
print("Class distribution:", {c: int((np.array(y_synth) == c).sum()) for c in class_names})

out_path = os.path.join(DATA_DIR, "synthetic_fault_dataset.npz")
np.savez_compressed(
    out_path,
    X=X_synth,
    y=y_synth_idx,
    class_names=np.array(class_names),
)
print(f"Saved synthetic fault dataset to {out_path}")