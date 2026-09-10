import {
  getAllEngines,
  getEngineById,
  getEngineTelemetry,
  getEngineHealth
} from "../services/engineService.js";

export async function fetchEngines(req, res) {
  try {
    const engines = await getAllEngines();

    res.json(engines);
  } catch (error) {
    console.error("Error fetching engines:", error);

    res.status(500).json({
      error: "Failed to fetch engines"
    });
  }
}

export async function fetchEngineById(req, res) {
  try {
    const engine = await getEngineById(req.params.id);

    res.json(engine);
  } catch (error) {
    console.error("Error fetching engine:", error);

    res.status(500).json({
      error: "Failed to fetch engine"
    });
  }
}

export async function fetchEngineTelemetry(req, res) {
  try {
    const telemetry = await getEngineTelemetry(req.params.id);

    res.json(telemetry);
  } catch (error) {
    console.error("Error fetching telemetry:", error);

    res.status(500).json({
      error: "Failed to fetch telemetry"
    });
  }
}


export async function fetchEngineHealth(req, res) {
  try {
    const health = await getEngineHealth(req.params.id);

    res.json(health);
  } catch (error) {
    console.error("Error fetching engine health:", error);

    res.status(500).json({
      error: "Failed to fetch engine health"
    });
  }
}