// src/lib/mockData.ts

export type EngineStatus = "nominal" | "advisory" | "critical";

export interface ModelOutput {
  faultProbability: number;
  faultClass: string;
  healthRiskStatus: EngineStatus;
}

export interface EngineTelemetry {
  cht1: number;
  cht2: number;
  cht3: number;
  cht4: number;

  egt1: number;
  egt2: number;
  egt3: number;
  egt4: number;

  oilPressure: number;
  oilTemperature: number;

  rpm: number;
  fuelFlow: number;
}

export interface TelemetryPoint {
  t: string;
  value: number;
}

export type TelemetryHistory = Record<
  keyof EngineTelemetry,
  TelemetryPoint[]
>;

export interface Engine {
  id: string;
  tailNumber: string;
  base: string;
  engineType: string;
  telemetry: EngineTelemetry;
  modelOutput: ModelOutput;
  lastSync: string;

  // Compatibility with older pages/components.
  status: EngineStatus;
}

export interface EnginePart {
  id: string;
  index: number;
  name: string;
  status: EngineStatus;
  healthScore: number;
  x: number;
  y: number;
  subParts?: EnginePart[];
}

/*
 * ---------------------------------------------------------
 * SIX ACTIVE ENGINES
 * ---------------------------------------------------------
 */

export const mockEngines: Engine[] = [
  {
    id: "EX-104",
    tailNumber: "UAV-104",
    base: "Base Alpha",
    engineType: "Rotax 914 (Mod)",
    lastSync: "2026-09-11T14:02:45Z",

    telemetry: {
      cht1: 172,
      cht2: 170,
      cht3: 174,
      cht4: 171,

      egt1: 617,
      egt2: 620,
      egt3: 615,
      egt4: 617,

      oilPressure: 58,
      oilTemperature: 91,

      rpm: 5243,
      fuelFlow: 18.4,
    },

    modelOutput: {
      faultProbability: 4.2,
      faultClass: "NONE",
      healthRiskStatus: "nominal",
    },

    status: "nominal",
  },

  {
    id: "EX-107",
    tailNumber: "UAV-107",
    base: "Base Alpha",
    engineType: "Rotax 914 (Mod)",
    lastSync: "2026-09-11T14:02:38Z",

    telemetry: {
      cht1: 205,
      cht2: 211,
      cht3: 208,
      cht4: 213,

      egt1: 675,
      egt2: 684,
      egt3: 691,
      egt4: 680,

      oilPressure: 44,
      oilTemperature: 112,

      rpm: 4980,
      fuelFlow: 20.1,
    },

    modelOutput: {
      faultProbability: 38.7,
      faultClass: "OIL TEMPERATURE ELEVATION",
      healthRiskStatus: "advisory",
    },

    status: "advisory",
  },

  {
    id: "EX-112",
    tailNumber: "UAV-112",
    base: "Base Bravo",
    engineType: "Rotax 914 (Mod)",
    lastSync: "2026-09-11T14:02:31Z",

    telemetry: {
      cht1: 231,
      cht2: 225,
      cht3: 235,
      cht4: 228,

      egt1: 705,
      egt2: 710,
      egt3: 720,
      egt4: 700,

      oilPressure: 31,
      oilTemperature: 121,

      rpm: 4870,
      fuelFlow: 17.6,
    },

    modelOutput: {
      faultProbability: 82.4,
      faultClass: "EXHAUST TEMPERATURE ANOMALY",
      healthRiskStatus: "critical",
    },

    status: "critical",
  },

  {
    id: "EX-115",
    tailNumber: "UAV-115",
    base: "Base Bravo",
    engineType: "Rotax 914 (Mod)",
    lastSync: "2026-09-11T14:02:27Z",

    telemetry: {
      cht1: 181,
      cht2: 179,
      cht3: 184,
      cht4: 180,

      egt1: 632,
      egt2: 638,
      egt3: 629,
      egt4: 635,

      oilPressure: 56,
      oilTemperature: 94,

      rpm: 5310,
      fuelFlow: 19.2,
    },

    modelOutput: {
      faultProbability: 7.8,
      faultClass: "NONE",
      healthRiskStatus: "nominal",
    },

    status: "nominal",
  },

  {
    id: "EX-118",
    tailNumber: "UAV-118",
    base: "Base Charlie",
    engineType: "Rotax 914 (Mod)",
    lastSync: "2026-09-11T14:02:20Z",

    telemetry: {
      cht1: 214,
      cht2: 218,
      cht3: 216,
      cht4: 220,

      egt1: 681,
      egt2: 688,
      egt3: 695,
      egt4: 687,

      oilPressure: 42,
      oilTemperature: 108,

      rpm: 5065,
      fuelFlow: 21.3,
    },

    modelOutput: {
      faultProbability: 46.3,
      faultClass: "CYLINDER TEMPERATURE VARIATION",
      healthRiskStatus: "advisory",
    },

    status: "advisory",
  },

  {
    id: "EX-121",
    tailNumber: "UAV-121",
    base: "Base Charlie",
    engineType: "Rotax 914 (Mod)",
    lastSync: "2026-09-11T14:02:14Z",

    telemetry: {
      cht1: 188,
      cht2: 191,
      cht3: 186,
      cht4: 189,

      egt1: 648,
      egt2: 652,
      egt3: 645,
      egt4: 650,

      oilPressure: 52,
      oilTemperature: 99,

      rpm: 5185,
      fuelFlow: 18.9,
    },

    modelOutput: {
      faultProbability: 12.6,
      faultClass: "VIBRATION SIGNATURE",
      healthRiskStatus: "nominal",
    },

    status: "nominal",
  },
];

/*
 * ---------------------------------------------------------
 * TELEMETRY HISTORY
 * ---------------------------------------------------------
 */

const makeSeries = (
  values: number[],
  startHour = 8,
): TelemetryPoint[] => {
  return values.map((value, index) => ({
    t: `${String(startHour + Math.floor(index / 2)).padStart(2, "0")}:${
      index % 2 === 0 ? "00" : "30"
    }`,
    value,
  }));
};

const buildHistory = (
  telemetry: EngineTelemetry,
  profile: "nominal" | "advisory" | "critical",
): TelemetryHistory => {
  const drift =
    profile === "critical"
      ? 1.8
      : profile === "advisory"
        ? 0.8
        : 0.25;

  const vary = (base: number, amount: number) => [
    base - amount * 1.2,
    base - amount,
    base - amount * 0.5,
    base,
    base + amount * 0.4,
    base + amount * drift,
    base + amount * 0.8,
    base + amount * drift * 1.2,
  ];

  return {
    cht1: makeSeries(vary(telemetry.cht1, 7)),
    cht2: makeSeries(vary(telemetry.cht2, 6)),
    cht3: makeSeries(vary(telemetry.cht3, 7)),
    cht4: makeSeries(vary(telemetry.cht4, 6)),

    egt1: makeSeries(vary(telemetry.egt1, 12)),
    egt2: makeSeries(vary(telemetry.egt2, 11)),
    egt3: makeSeries(vary(telemetry.egt3, 13)),
    egt4: makeSeries(vary(telemetry.egt4, 10)),

    oilPressure: makeSeries(vary(telemetry.oilPressure, 3)),
    oilTemperature: makeSeries(
      vary(telemetry.oilTemperature, 4),
    ),

    rpm: makeSeries(vary(telemetry.rpm, 120)),
    fuelFlow: makeSeries(vary(telemetry.fuelFlow, 1.1)),
  };
};

export const telemetryByEngineId: Record<
  string,
  TelemetryHistory
> = Object.fromEntries(
  mockEngines.map((engine) => [
    engine.id,
    buildHistory(
      engine.telemetry,
      engine.modelOutput.healthRiskStatus,
    ),
  ]),
) as Record<string, TelemetryHistory>;

/*
 * ---------------------------------------------------------
 * MODEL HISTORY
 * ---------------------------------------------------------
 */

export interface ModelHistoryPoint {
  t: string;
  faultProbability: number;
  faultClass: string;
  healthRiskStatus: EngineStatus;
}

export const modelHistoryByEngineId: Record<
  string,
  ModelHistoryPoint[]
> = Object.fromEntries(
  mockEngines.map((engine) => {
    const current = engine.modelOutput.faultProbability;

    const probabilities = [
      Math.max(2, current * 0.12),
      Math.max(3, current * 0.25),
      Math.max(4, current * 0.42),
      Math.max(5, current * 0.61),
      Math.max(6, current * 0.78),
      current,
    ];

    return [
      engine.id,
      probabilities.map((probability, index) => {
        const status: EngineStatus =
          probability >= 70
            ? "critical"
            : probability >= 30
              ? "advisory"
              : "nominal";

        return {
          t: `${String(9 + index).padStart(2, "0")}:${
            index % 2 === 0 ? "00" : "30"
          }`,
          faultProbability: Number(probability.toFixed(1)),
          faultClass:
            status === "nominal"
              ? "NONE"
              : status === "advisory"
                ? "EARLY ANOMALY"
                : engine.modelOutput.faultClass,
          healthRiskStatus: status,
        };
      }),
    ];
  }),
);

/*
 * ---------------------------------------------------------
 * LEGACY PART COMPATIBILITY
 *
 * These exports are retained so older routes/components
 * do not break. They are NOT used as the telemetry model.
 * ---------------------------------------------------------
 */

const compatibilityParts = [
  {
    id: "cylinder-head",
    index: 1,
    name: "Cylinder Head",
    status: "nominal" as EngineStatus,
    healthScore: 94,
    x: 34,
    y: 22,
  },
  {
    id: "exhaust-path",
    index: 2,
    name: "Exhaust Gas Path",
    status: "nominal" as EngineStatus,
    healthScore: 92,
    x: 66,
    y: 28,
  },
  {
    id: "oil-system",
    index: 3,
    name: "Oil System",
    status: "nominal" as EngineStatus,
    healthScore: 91,
    x: 28,
    y: 62,
  },
  {
    id: "fuel-injection",
    index: 4,
    name: "Fuel Injection",
    status: "nominal" as EngineStatus,
    healthScore: 93,
    x: 70,
    y: 62,
  },
];

export const enginePartsByEngineId: Record<
  string,
  EnginePart[]
> = Object.fromEntries(
  mockEngines.map((engine) => {
    const engineStatus = engine.modelOutput.healthRiskStatus;

    return [
      engine.id,
      compatibilityParts.map((part) => ({
        ...part,
        status:
          engineStatus === "critical" && part.index !== 3
            ? "critical"
            : engineStatus === "advisory" &&
                part.index === 3
              ? "advisory"
              : part.status,
        healthScore:
          engineStatus === "critical"
            ? Math.max(35, part.healthScore - 45)
            : engineStatus === "advisory"
              ? Math.max(55, part.healthScore - 25)
              : part.healthScore,
      })),
    ];
  }),
);

/*
 * ---------------------------------------------------------
 * ALERTS
 * ---------------------------------------------------------
 */

export interface MockAlert {
  id: string;
  engineId: string;
  severity: "critical" | "advisory";
  message: string;
  timestamp: string;
  partId?: string;
}

export const mockAlerts: MockAlert[] = [
  {
    id: "ALT-001",
    engineId: "EX-112",
    severity: "critical",
    message:
      "Exhaust temperature anomaly detected. Model fault probability exceeds critical threshold.",
    timestamp: "2026-09-11T13:36:00Z",
  },
  {
    id: "ALT-002",
    engineId: "EX-112",
    severity: "critical",
    message:
      "Oil pressure below nominal operating range.",
    timestamp: "2026-09-11T13:45:00Z",
  },
  {
    id: "ALT-003",
    engineId: "EX-107",
    severity: "advisory",
    message:
      "Oil temperature trending above nominal operating range.",
    timestamp: "2026-09-11T13:47:00Z",
  },
  {
    id: "ALT-004",
    engineId: "EX-118",
    severity: "advisory",
    message:
      "Cylinder head temperature variation detected across the four cylinders.",
    timestamp: "2026-09-11T13:52:00Z",
  },
];

/*
 * ---------------------------------------------------------
 * REPORTS
 * ---------------------------------------------------------
 */

export interface MockReport {
  id: string;
  engineId: string;
  date: string;
  title: string;
  faultProbability: number;
  faultClass: string;
  healthRiskStatus: EngineStatus;
  summary: string;
}

export const mockReports: MockReport[] = mockEngines.map(
  (engine, index) => ({
    id: `RPT-${String(index + 1).padStart(3, "0")}`,
    engineId: engine.id,
    date: "2026-09-11",
    title: `${engine.id} Engine Diagnostic Report`,
    faultProbability:
      engine.modelOutput.faultProbability,
    faultClass: engine.modelOutput.faultClass,
    healthRiskStatus:
      engine.modelOutput.healthRiskStatus,
    summary:
      engine.modelOutput.healthRiskStatus === "critical"
        ? "Critical anomaly detected. Immediate inspection recommended."
        : engine.modelOutput.healthRiskStatus === "advisory"
          ? "Anomaly indicators detected. Continue monitoring and schedule maintenance."
          : "Engine telemetry remains within nominal operating envelope.",
  }),
);

export const mockMaintenanceAdvisories = [
  {
    id: "MA-001",
    engineId: "EX-112",
    title: "Oil / Fuel System Inspection",
    description: "Inspect fuel injection and oil system before next flight cycle.",
    due: "Within 5 flight hours",
    severity: "critical" as EngineStatus,
  },
  {
    id: "MA-002",
    engineId: "EX-107",
    title: "Engine Temperature Inspection",
    description: "Inspect engine cooling and temperature sensors at next scheduled maintenance.",
    due: "Next scheduled maintenance",
    severity: "advisory" as EngineStatus,
  },
];