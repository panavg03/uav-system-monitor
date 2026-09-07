import express from "express";

import {
  fetchEngines,
  fetchEngineById,
  fetchEngineTelemetry,
  fetchEngineHealth
} from "../controllers/engineController.js";

const router = express.Router();

router.get("/", fetchEngines);
router.get("/:id/telemetry", fetchEngineTelemetry);
router.get("/:id", fetchEngineById);
router.get("/:id/health", fetchEngineHealth);

export default router;