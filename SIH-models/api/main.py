from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import torch
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path
import os

from model import FlightCNN


# ============================================================
# APP + PATHS
# ============================================================

app = FastAPI(
    title="UAV Engine Fault Detection API",
    version="1.0"
)

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# ============================================================
# ENVIRONMENT
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL not found in .env")

if not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_KEY not found in .env")


# ============================================================
# SUPABASE
# ============================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)


# ============================================================
# CNN CONFIGURATION
# ============================================================

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

N_SENSORS = 10
N_TIMESTEPS = 6
N_CLASSES = 4


CLASS_NAMES = {
    0: "Normal",
    1: "Fault Category 1",
    2: "Fault Category 2",
    3: "Fault Category 3"
}


# ============================================================
# MODEL LOADING
# ============================================================

MODEL_PATH = BASE_DIR / "synthetic_fault_cnn.pt"
STATS_PATH = BASE_DIR / "synthetic_norm_stats.npz"


if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Model file not found: {MODEL_PATH}"
    )

if not STATS_PATH.exists():
    raise RuntimeError(
        f"Normalization stats not found: {STATS_PATH}"
    )


device = torch.device("cpu")


model = FlightCNN(
    n_channels=N_SENSORS,
    n_classes=N_CLASSES
)

model.load_state_dict(
    torch.load(
        MODEL_PATH,
        map_location=device,
        weights_only=True
    )
)

model.to(device)
model.eval()


# ============================================================
# NORMALIZATION STATS
# ============================================================

stats = np.load(STATS_PATH)

mean = stats["mean"].astype(
    np.float32
).reshape(N_SENSORS, 1)

std = stats["std"].astype(
    np.float32
).reshape(N_SENSORS, 1)

# Prevent division by zero
std = np.where(
    std == 0,
    1.0,
    std
)


# ============================================================
# REQUEST MODEL
# ============================================================

class PredictionRequest(BaseModel):
    data: list[list[float]]


# ============================================================
# CNN PREDICTION FUNCTION
# ============================================================

def run_cnn_prediction(data: np.ndarray):

    # --------------------------------------------------------
    # Validate shape
    # --------------------------------------------------------

    expected_shape = (
        N_SENSORS,
        N_TIMESTEPS
    )

    if data.shape != expected_shape:
        raise ValueError(
            f"Expected input shape {expected_shape}, "
            f"got {data.shape}"
        )


    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    normalized = (
        data - mean
    ) / std


    # --------------------------------------------------------
    # Convert to PyTorch tensor
    # Shape:
    # (10, 6)
    #      ↓ unsqueeze
    # (1, 10, 6)
    # --------------------------------------------------------

    tensor = torch.tensor(
        normalized,
        dtype=torch.float32
    ).unsqueeze(0).to(device)


    # --------------------------------------------------------
    # CNN inference
    # --------------------------------------------------------

    with torch.no_grad():

        logits = model(tensor)

        probabilities = torch.softmax(
            logits,
            dim=1
        )

        prediction = int(
            torch.argmax(
                probabilities,
                dim=1
            ).item()
        )

        confidence = float(
            probabilities[0, prediction].item()
        )


    # --------------------------------------------------------
    # Class probabilities
    # --------------------------------------------------------

    probability_dict = {
        CLASS_NAMES[i]: float(
            probabilities[0, i].item()
        )
        for i in range(N_CLASSES)
    }


    # --------------------------------------------------------
    # Fault probability
    #
    # Class 0 = Normal
    # Everything else = Fault
    # --------------------------------------------------------

    normal_probability = probability_dict["Normal"]

    fault_probability = (
        1.0 - normal_probability
    )


    # --------------------------------------------------------
    # Health score
    #
    # Health is based on probability of being Normal.
    #
    # 100 = completely normal
    # 0   = extremely likely to be faulty
    # --------------------------------------------------------

    health_score = max(
        0.0,
        min(
            100.0,
            normal_probability * 100.0
        )
    )


    # --------------------------------------------------------
    # Risk level
    # --------------------------------------------------------

    if health_score >= 80:
        risk_level = "LOW"

    elif health_score >= 50:
        risk_level = "MEDIUM"

    else:
        risk_level = "HIGH"


    # --------------------------------------------------------
    # Fault status
    # --------------------------------------------------------

    is_fault = prediction != 0


    return {
        "prediction": prediction,

        "fault_class": CLASS_NAMES[prediction],

        "confidence": confidence,

        "confidence_percent": confidence * 100,

        "is_fault": is_fault,

        "fault_probability": fault_probability,

        "fault_probability_percent": fault_probability * 100,

        "health_score": health_score,

        "risk_level": risk_level,

        "probabilities": probability_dict
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "UAV Engine Fault Detection API is running",

        "model": "Project CNN",

        "input_shape": [
            N_SENSORS,
            N_TIMESTEPS
        ],

        "classes": CLASS_NAMES
    }


# ============================================================
# DIRECT CNN PREDICTION
# ============================================================

@app.post("/predict")
def predict(request: PredictionRequest):

    try:

        data = np.array(
            request.data,
            dtype=np.float32
        )

        result = run_cnn_prediction(data)

        return {
            "prediction": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ============================================================
# PREDICT ONE FLIGHT
# ============================================================

@app.post("/predict-flight/{flight_id}")
def predict_flight(flight_id: int):

    # --------------------------------------------------------
    # Fetch telemetry
    # --------------------------------------------------------

    response = (
        supabase
        .table("flight_telemetry")
        .select("flight_id, sensor_data")
        .eq("flight_id", flight_id)
        .limit(1)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=404,
            detail=f"No telemetry found for flight {flight_id}"
        )


    row = response.data[0]

    sensor_data = row["sensor_data"]


    # --------------------------------------------------------
    # Convert telemetry → CNN matrix
    # --------------------------------------------------------

    try:

        data = np.array(
            [
                [
                    float(sensor_data[sensor][i])
                    for i in range(N_TIMESTEPS)
                ]
                for sensor in SENSOR_COLS
            ],
            dtype=np.float32
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Invalid telemetry data: {str(e)}"
        )


    # --------------------------------------------------------
    # CNN
    # --------------------------------------------------------

    try:

        result = run_cnn_prediction(data)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"CNN prediction failed: {str(e)}"
        )


    # --------------------------------------------------------
    # Save prediction
    # --------------------------------------------------------

    prediction_row = {

        "flight_id": flight_id,

        "model_name": "Project CNN",

        "model_version": "1.0",

        "is_fault": result["is_fault"],

        "fault_probability": result["fault_probability"],

        "fault_class": result["prediction"],

        "fault_class_probability": result["confidence"],

        "health_score": result["health_score"],

        "risk_level": result["risk_level"],

        "prediction_metadata": {

            "input_shape": list(data.shape),

            "sensor_columns": SENSOR_COLS,

            "fault_class_name": result["fault_class"],

            "fault_probability_percent":
                result["fault_probability_percent"]

        }
    }


    try:

        insert_response = (
            supabase
            .table("predictions")
            .insert(prediction_row)
            .execute()
        )

        saved = bool(
            insert_response.data
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save prediction: {str(e)}"
        )


    return {

        "flight_id": flight_id,

        "prediction": result,

        "database": {
            "saved": saved
        }
    }


# ============================================================
# PREDICT ALL AVAILABLE TELEMETRY
# ============================================================

@app.post("/predict-all")
def predict_all():

    # --------------------------------------------------------
    # Fetch all telemetry
    # --------------------------------------------------------

    response = (
        supabase
        .table("flight_telemetry")
        .select("flight_id, sensor_data")
        .order("flight_id")
        .execute()
    )


    rows = response.data or []


    if not rows:

        raise HTTPException(
            status_code=404,
            detail="No telemetry data found"
        )


    results = []


    # --------------------------------------------------------
    # Process every flight
    # --------------------------------------------------------

    for row in rows:

        flight_id = row["flight_id"]

        try:

            sensor_data = row["sensor_data"]


            # ----------------------------------------------
            # Telemetry → CNN matrix
            # ----------------------------------------------

            data = np.array(
                [
                    [
                        float(
                            sensor_data[sensor][i]
                        )
                        for i in range(N_TIMESTEPS)
                    ]
                    for sensor in SENSOR_COLS
                ],
                dtype=np.float32
            )


            # ----------------------------------------------
            # CNN
            # ----------------------------------------------

            result = run_cnn_prediction(
                data
            )


            # ----------------------------------------------
            # Database row
            # ----------------------------------------------

            prediction_row = {

                "flight_id": flight_id,

                "model_name": "Project CNN",

                "model_version": "1.0",

                "is_fault": result["is_fault"],

                "fault_probability":
                    result["fault_probability"],

                "fault_class":
                    result["prediction"],

                "fault_class_probability":
                    result["confidence"],

                "health_score":
                    result["health_score"],

                "risk_level":
                    result["risk_level"],

                "prediction_metadata": {

                    "input_shape":
                        list(data.shape),

                    "sensor_columns":
                        SENSOR_COLS,

                    "fault_class_name":
                        result["fault_class"],

                    "fault_probability_percent":
                        result["fault_probability_percent"]
                }
            }


            # ----------------------------------------------
            # Save
            # ----------------------------------------------

            supabase \
                .table("predictions") \
                .insert(prediction_row) \
                .execute()


            results.append({

                "flight_id": flight_id,

                "success": True,

                "prediction":
                    result["prediction"],

                "fault_class":
                    result["fault_class"],

                "confidence":
                    result["confidence"],

                "health_score":
                    result["health_score"],

                "risk_level":
                    result["risk_level"]
            })


        except Exception as e:

            results.append({

                "flight_id": flight_id,

                "success": False,

                "error": str(e)
            })


    successful = sum(
        1
        for r in results
        if r["success"]
    )


    return {

        "total_telemetry_flights":
            len(rows),

        "successful":
            successful,

        "failed":
            len(rows) - successful,

        "results":
            results
    }


# ============================================================
# GET ALL 15 ENGINES
# ============================================================

@app.get("/engines")
def get_engines():

    # --------------------------------------------------------
    # Fetch engines
    # --------------------------------------------------------

    engines_response = (
        supabase
        .table("engines")
        .select("*")
        .order("id")
        .execute()
    )

    engines = (
        engines_response.data or []
    )


    # --------------------------------------------------------
    # Fetch flights
    # --------------------------------------------------------

    flights_response = (
        supabase
        .table("flights")
        .select(
            "id, engine_id, flight_date"
        )
        .order("id")
        .execute()
    )

    flights = (
        flights_response.data or []
    )


    # --------------------------------------------------------
    # Fetch predictions
    # --------------------------------------------------------

    predictions_response = (
        supabase
        .table("predictions")
        .select(
            "flight_id, "
            "fault_class, "
            "is_fault, "
            "fault_probability, "
            "fault_class_probability, "
            "health_score, "
            "risk_level, "
            "created_at"
        )
        .order(
            "created_at",
            desc=True
        )
        .execute()
    )

    predictions = (
        predictions_response.data or []
    )


    # --------------------------------------------------------
    # Flight → Engine mapping
    # --------------------------------------------------------

    flight_engine_map = {

        flight["id"]:
            flight["engine_id"]

        for flight in flights
    }


    # --------------------------------------------------------
    # Keep latest prediction per flight
    # --------------------------------------------------------

    latest_predictions = {}


    for prediction in predictions:

        flight_id = prediction["flight_id"]

        if flight_id not in latest_predictions:

            latest_predictions[
                flight_id
            ] = prediction


    # --------------------------------------------------------
    # Group predictions by engine
    # --------------------------------------------------------

    engine_predictions = {}


    for flight_id, prediction in (
        latest_predictions.items()
    ):

        engine_id = flight_engine_map.get(
            flight_id
        )


        if engine_id is not None:

            engine_predictions \
                .setdefault(
                    engine_id,
                    []
                ) \
                .append(
                    prediction
                )


    # --------------------------------------------------------
    # Build engine response
    # --------------------------------------------------------

    results = []


    for engine in engines:

        engine_id = engine["id"]

        preds = engine_predictions.get(
            engine_id,
            []
        )


        # ----------------------------------------------------
        # Engine has prediction data
        # ----------------------------------------------------

        if preds:

            latest = preds[0]


            # Average health
            avg_health = (
                sum(
                    float(
                        p["health_score"]
                    )
                    for p in preds
                )
                /
                len(preds)
            )


            # Worst risk takes priority
            if any(
                p["risk_level"] == "HIGH"
                for p in preds
            ):

                risk_level = "HIGH"

            elif any(
                p["risk_level"] == "MEDIUM"
                for p in preds
            ):

                risk_level = "MEDIUM"

            else:

                risk_level = "LOW"


            results.append({

                "engine_id":
                    engine_id,

                "engine_name":
                    engine.get("engine_id"),

                "model":
                    engine.get("model"),

                "aircraft_id":
                    engine.get("aircraft_id"),

                "health_score":
                    round(
                        avg_health,
                        2
                    ),

                "risk_level":
                    risk_level,

                "latest_prediction":
                    latest["fault_class"],

                "fault_probability":
                    latest[
                        "fault_probability"
                    ],

                "prediction_confidence":
                    latest[
                        "fault_class_probability"
                    ],

                "flights_with_predictions":
                    len(preds)
            })


        # ----------------------------------------------------
        # No prediction data
        # ----------------------------------------------------

        else:

            results.append({

                "engine_id":
                    engine_id,

                "engine_name":
                    engine.get("engine_id"),

                "model":
                    engine.get("model"),

                "aircraft_id":
                    engine.get("aircraft_id"),

                "health_score":
                    None,

                "risk_level":
                    "NO DATA",

                "latest_prediction":
                    None,

                "fault_probability":
                    None,

                "prediction_confidence":
                    None,

                "flights_with_predictions":
                    0
            })


    return {

        "total_engines":
            len(results),

        "engines":
            results
    }