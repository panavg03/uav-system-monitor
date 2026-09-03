// lib/mockData.ts
// Sample data standing in for live telemetry / API responses.
// Wire these into the Fleet Dashboard, Engine Blueprint, and Param Graph components.

export type EngineStatus = "nominal" | "advisory" | "critical"

export interface Engine {
  id: string
  tailNumber: string
  base: string
  engineType: string
  healthScore: number // 0-100
  status: EngineStatus
  rpm: number
  cht: number // Cylinder Head Temp, °C
  egt: number // Exhaust Gas Temp, °C
  oilPressure: number // psi
  oilTemp: number // °C
  fuelFlow: number // L/hr
  lastSync: string // ISO timestamp
}

export const mockEngines: Engine[] = [
  {
    id: "EX-104",
    tailNumber: "UAV-104",
    base: "Base Alpha",
    engineType: "Rotax 914 (Mod)",
    healthScore: 94,
    status: "nominal",
    rpm: 5250,
    cht: 172,
    egt: 618,
    oilPressure: 58,
    oilTemp: 91,
    fuelFlow: 18.4,
    lastSync: "2026-09-03T14:32:00Z",
  },
  {
    id: "EX-107",
    tailNumber: "UAV-107",
    base: "Base Alpha",
    engineType: "Rotax 914 (Mod)",
    healthScore: 71,
    status: "advisory",
    rpm: 5180,
    cht: 196,
    egt: 662,
    oilPressure: 49,
    oilTemp: 104,
    fuelFlow: 19.1,
    lastSync: "2026-09-03T14:31:40Z",
  },
  {
    id: "EX-112",
    tailNumber: "UAV-112",
    base: "Base Bravo",
    engineType: "Rotax 914 (Mod)",
    healthScore: 38,
    status: "critical",
    rpm: 4870,
    cht: 231,
    egt: 705,
    oilPressure: 31,
    oilTemp: 121,
    fuelFlow: 17.6,
    lastSync: "2026-09-03T14:30:12Z",
  },
  {
    id: "EX-118",
    tailNumber: "UAV-118",
    base: "Base Bravo",
    engineType: "Rotax 914 (Mod)",
    healthScore: 88,
    status: "nominal",
    rpm: 5300,
    cht: 168,
    egt: 601,
    oilPressure: 61,
    oilTemp: 88,
    fuelFlow: 18.2,
    lastSync: "2026-09-03T14:32:05Z",
  },
  {
    id: "EX-121",
    tailNumber: "UAV-121",
    base: "Base Charlie",
    engineType: "Rotax 914 (Mod)",
    healthScore: 64,
    status: "advisory",
    rpm: 5090,
    cht: 203,
    egt: 671,
    oilPressure: 46,
    oilTemp: 109,
    fuelFlow: 19.8,
    lastSync: "2026-09-03T14:29:55Z",
  },
  {
    id: "EX-129",
    tailNumber: "UAV-129",
    base: "Base Charlie",
    engineType: "Rotax 914 (Mod)",
    healthScore: 97,
    status: "nominal",
    rpm: 5260,
    cht: 165,
    egt: 595,
    oilPressure: 60,
    oilTemp: 86,
    fuelFlow: 18.0,
    lastSync: "2026-09-03T14:32:11Z",
  },
]

// ---------------------------------------------------------------------
// Engine Blueprint: major parts + sub-parts, keyed by engineId
// ---------------------------------------------------------------------

export interface EnginePart {
  id: string
  index: number // pin number shown on blueprint
  name: string
  healthScore: number
  status: EngineStatus
  x: number // % position on blueprint SVG, 0-100
  y: number
  subParts?: EnginePart[]
}

const cylinderHeadSubParts: EnginePart[] = [
  {
    id: "valve-assembly",
    index: 1,
    name: "Valve Assembly",
    healthScore: 82,
    status: "nominal",
    x: 0,
    y: 0,
  },
  {
    id: "spark-plug",
    index: 2,
    name: "Spark Plug",
    healthScore: 55,
    status: "advisory",
    x: 0,
    y: 0,
  },
  {
    id: "head-gasket",
    index: 3,
    name: "Head Gasket",
    healthScore: 90,
    status: "nominal",
    x: 0,
    y: 0,
  },
  {
    id: "coolant-jacket",
    index: 4,
    name: "Coolant Jacket",
    healthScore: 76,
    status: "advisory",
    x: 0,
    y: 0,
  },
]

const fuelInjectionSubParts: EnginePart[] = [
  {
    id: "injector-1",
    index: 1,
    name: "Injector — Cyl 1",
    healthScore: 88,
    status: "nominal",
    x: 0,
    y: 0,
  },
  {
    id: "injector-2",
    index: 2,
    name: "Injector — Cyl 2",
    healthScore: 41,
    status: "critical",
    x: 0,
    y: 0,
  },
  {
    id: "fuel-pump",
    index: 3,
    name: "Fuel Pump",
    healthScore: 79,
    status: "advisory",
    x: 0,
    y: 0,
  },
]

export const enginePartsByEngineId: Record<string, EnginePart[]> = {
  "EX-104": [
    {
      id: "cylinder-head",
      index: 1,
      name: "Cylinder Head",
      healthScore: 87,
      status: "nominal",
      x: 32,
      y: 18,
      subParts: cylinderHeadSubParts,
    },
    {
      id: "exhaust-path",
      index: 2,
      name: "Exhaust Gas Path",
      healthScore: 91,
      status: "nominal",
      x: 68,
      y: 22,
    },
    {
      id: "oil-system",
      index: 3,
      name: "Oil System",
      healthScore: 93,
      status: "nominal",
      x: 25,
      y: 55,
    },
    {
      id: "fuel-injection",
      index: 4,
      name: "Fuel Injection System",
      healthScore: 89,
      status: "nominal",
      x: 55,
      y: 60,
      subParts: fuelInjectionSubParts,
    },
    {
      id: "cooling-system",
      index: 5,
      name: "Cooling System",
      healthScore: 95,
      status: "nominal",
      x: 78,
      y: 50,
    },
    {
      id: "vibration-bearing",
      index: 6,
      name: "Vibration / Bearing Assembly",
      healthScore: 90,
      status: "nominal",
      x: 45,
      y: 80,
    },
    {
      id: "battery-alternator",
      index: 7,
      name: "Battery / Alternator",
      healthScore: 84,
      status: "nominal",
      x: 15,
      y: 30,
    },
    {
      id: "ignition-timing",
      index: 8,
      name: "Ignition / Timing System",
      healthScore: 92,
      status: "nominal",
      x: 60,
      y: 35,
    },
  ],
  "EX-112": [
    {
      id: "cylinder-head",
      index: 1,
      name: "Cylinder Head",
      healthScore: 33,
      status: "critical",
      x: 32,
      y: 18,
      subParts: cylinderHeadSubParts,
    },
    {
      id: "exhaust-path",
      index: 2,
      name: "Exhaust Gas Path",
      healthScore: 40,
      status: "critical",
      x: 68,
      y: 22,
    },
    {
      id: "oil-system",
      index: 3,
      name: "Oil System",
      healthScore: 52,
      status: "advisory",
      x: 25,
      y: 55,
    },
    {
      id: "fuel-injection",
      index: 4,
      name: "Fuel Injection System",
      healthScore: 45,
      status: "critical",
      x: 55,
      y: 60,
      subParts: fuelInjectionSubParts,
    },
    {
      id: "cooling-system",
      index: 5,
      name: "Cooling System",
      healthScore: 61,
      status: "advisory",
      x: 78,
      y: 50,
    },
    {
      id: "vibration-bearing",
      index: 6,
      name: "Vibration / Bearing Assembly",
      healthScore: 58,
      status: "advisory",
      x: 45,
      y: 80,
    },
    {
      id: "battery-alternator",
      index: 7,
      name: "Battery / Alternator",
      healthScore: 70,
      status: "advisory",
      x: 15,
      y: 30,
    },
    {
      id: "ignition-timing",
      index: 8,
      name: "Ignition / Timing System",
      healthScore: 49,
      status: "critical",
      x: 60,
      y: 35,
    },
  ],
}

// ---------------------------------------------------------------------
// Time-series telemetry for ParamGraph components (last 24 points ~ hourly)
// ---------------------------------------------------------------------

export interface TelemetryPoint {
  t: string // ISO timestamp
  value: number
}

function genSeries(
  base: number,
  jitter: number,
  points = 24,
  drift = 0,
): TelemetryPoint[] {
  const now = new Date("2026-09-03T14:30:00Z").getTime()
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - 1 - i) * 60 * 60 * 1000).toISOString()
    const value =
      Math.round(
        (base + drift * (i / points) + (Math.random() - 0.5) * jitter) * 10,
      ) / 10
    return { t, value }
  })
}

export const telemetryByEngineId: Record<string, Record<string, TelemetryPoint[]>> =
  {
    "EX-104": {
      rpm: genSeries(5250, 60),
      cht: genSeries(172, 4),
      egt: genSeries(618, 10),
      oilPressure: genSeries(58, 2),
      oilTemp: genSeries(91, 3),
      fuelFlow: genSeries(18.4, 0.6),
    },
    "EX-112": {
      rpm: genSeries(4950, 90, 24, -140),
      cht: genSeries(205, 6, 24, 26),
      egt: genSeries(660, 15, 24, 45),
      oilPressure: genSeries(45, 4, 24, -14),
      oilTemp: genSeries(102, 5, 24, 19),
      fuelFlow: genSeries(18.0, 0.8, 24, -0.8),
    },
  }

// ---------------------------------------------------------------------
// Alerts / notifications for right rail
// ---------------------------------------------------------------------

export interface Alert {
  id: string
  engineId: string
  partId?: string
  severity: "critical" | "advisory"
  message: string
  timestamp: string
}

export const mockAlerts: Alert[] = [
  {
    id: "a1",
    engineId: "EX-112",
    partId: "cylinder-head",
    severity: "critical",
    message: "EGT drift detected — Cyl 3",
    timestamp: "2026-09-03T14:25:00Z",
  },
  {
    id: "a2",
    engineId: "EX-112",
    partId: "fuel-injection",
    severity: "critical",
    message: "Injector abnormality — Cyl 2",
    timestamp: "2026-09-03T14:10:00Z",
  },
  {
    id: "a3",
    engineId: "EX-107",
    partId: undefined,
    severity: "advisory",
    message: "Oil temperature trending high",
    timestamp: "2026-09-03T13:55:00Z",
  },
  {
    id: "a4",
    engineId: "EX-121",
    partId: undefined,
    severity: "advisory",
    message: "Vibration signature outside nominal band",
    timestamp: "2026-09-03T13:40:00Z",
  },
]

export const mockMaintenanceAdvisories = [
  {
    id: "m1",
    engineId: "EX-112",
    part: "Injector — Cyl 2",
    recommendation: "Replace within 5 flight hours",
  },
  {
    id: "m2",
    engineId: "EX-107",
    part: "Spark Plug (Cyl Head)",
    recommendation: "Inspect at next scheduled maintenance",
  },
]
