import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ChevronLeft,
  Clock3,
  Gauge,
  Thermometer,
  Droplets,
  Fuel,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { mockEngines, telemetryByEngineId, type EngineTelemetry } from "../lib/mockData";
import { getFaultProbabilityStatus, useAlertThresholds, type AlertThresholds } from "../lib/alertThresholds";

type Tab = "overview" | "telemetry" | "history";


type ChartPoint = { t: string; value: number };

type MiniLineChartProps = {
  data: ChartPoint[];
  stroke?: string;
  showLabels?: boolean;
  label?: string;
  unit?: string;
};

function MiniLineChart({
  data,
  stroke = "#39FF88",
  showLabels = false,
  label = "Telemetry",
  unit = "",
}: MiniLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const pointsData = data.filter((point) => Number.isFinite(Number(point.value)));
  const values = pointsData.map((point) => Number(point.value));
  const safeValues =
    values.length > 1
      ? values
      : values.length === 1
        ? [values[0], values[0]]
        : [0, 0];

  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || Math.max(Math.abs(max) * 0.08, 1);
  const width = 100;
  const chartTop = 8;
  const chartBottom = showLabels ? 80 : 92;

  const getY = (value: number) =>
    chartBottom - ((value - min) / range) * (chartBottom - chartTop);

  const points = safeValues
    .map((value, index) => {
      const x = (index / (safeValues.length - 1)) * width;
      return `${x.toFixed(2)},${getY(value).toFixed(2)}`;
    })
    .join(" ");

  const areaPoints = `0,${chartBottom} ${points} 100,${chartBottom}`;
  const gradientId = `chart-fill-${label.replace(/[^a-zA-Z0-9]/g, "")}-${unit.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hoveredPoint =
    hoveredIndex !== null && pointsData[hoveredIndex]
      ? pointsData[hoveredIndex]
      : null;
  const hoveredX =
    hoveredIndex !== null && safeValues.length > 1
      ? (hoveredIndex / (safeValues.length - 1)) * 100
      : 100;

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pointsData.length) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const index = Math.min(
      pointsData.length - 1,
      Math.max(0, Math.round(relativeX * (pointsData.length - 1))),
    );
    setHoveredIndex(index);
  };

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        role="img"
        aria-label={`${label} telemetry trend chart`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.20" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="0" y1="25" x2="100" y2="25" stroke="#cfd5d1" strokeWidth="0.45" strokeDasharray="2 2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#cfd5d1" strokeWidth="0.45" strokeDasharray="2 2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#cfd5d1" strokeWidth="0.45" strokeDasharray="2 2" />

        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hoveredPoint && (
          <>
            <line
              x1={hoveredX}
              y1={chartTop}
              x2={hoveredX}
              y2={chartBottom}
              stroke={stroke}
              strokeWidth="0.8"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              opacity="0.65"
            />
            <circle
              cx={hoveredX}
              cy={getY(Number(hoveredPoint.value))}
              r="3.6"
              fill="#f4f3ef"
              stroke={stroke}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={hoveredX}
              cy={getY(Number(hoveredPoint.value))}
              r="1.8"
              fill={stroke}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {!hoveredPoint && safeValues.length > 0 && (
          <circle
            cx="100"
            cy={getY(safeValues[safeValues.length - 1])}
            r="2"
            fill={stroke}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {showLabels && pointsData.length > 0 && (
          <>
            <text x="0" y="97" fill="#68716c" fontSize="3" fontFamily="JetBrains Mono">{pointsData[0].t}</text>
            <text x="100" y="97" textAnchor="end" fill="#68716c" fontSize="3" fontFamily="JetBrains Mono">{pointsData[pointsData.length - 1].t}</text>
          </>
        )}
      </svg>

      {hoveredPoint && (
        <div
          className="pointer-events-none absolute top-1 z-20 min-w-[92px] -translate-x-1/2 border border-[#2FAE68] bg-[#142019] px-2.5 py-1.5 shadow-lg"
          style={{
            left: `${Math.max(9, Math.min(91, hoveredX))}%`,
            transform: `translateX(-50%) ${getY(Number(hoveredPoint.value)) < 35 ? "translateY(0)" : "translateY(125%)"}`,
          }}
        >
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#9db0a4]">
            {hoveredPoint.t}
          </div>
          <div className="mt-0.5 font-mono text-[11px] font-bold" style={{ color: stroke }}>
            {formatValue(label.toLowerCase().replace(/[^a-z0-9]/g, ""), Number(hoveredPoint.value))}
            {unit ? ` ${unit}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

type TelemetryKey = keyof EngineTelemetry;

type SensorDefinition = {
  id: TelemetryKey;
  label: string;
  unit: string;
  target: string;
  category: "CHT" | "EGT" | "OIL" | "RPM" | "FUEL";
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
};

const SENSOR_DEFINITIONS: SensorDefinition[] = [
  {
    id: "cht1",
    label: "CHT 1",
    unit: "°C",
    target: "Cylinder Head 1",
    category: "CHT",
    x: 55,
    y: 19,
    anchorX: 205,
    anchorY: 82,
  },
  {
    id: "cht2",
    label: "CHT 2",
    unit: "°C",
    target: "Cylinder Head 2",
    category: "CHT",
    x: 68,
    y: 19,
    anchorX: 290,
    anchorY: 82,
  },
  {
    id: "cht3",
    label: "CHT 3",
    unit: "°C",
    target: "Cylinder Head 3",
    category: "CHT",
    x: 32,
    y: 19,
    anchorX: 110,
    anchorY: 82,
  },
  {
    id: "cht4",
    label: "CHT 4",
    unit: "°C",
    target: "Cylinder Head 4",
    category: "CHT",
    x: 45,
    y: 19,
    anchorX: 155,
    anchorY: 82,
  },
  {
    id: "egt1",
    label: "EGT 1",
    unit: "°C",
    target: "Exhaust Port 1",
    category: "EGT",
    x: 19,
    y: 53,
    anchorX: 105,
    anchorY: 137,
  },
  {
    id: "egt2",
    label: "EGT 2",
    unit: "°C",
    target: "Exhaust Port 2",
    category: "EGT",
    x: 19,
    y: 63,
    anchorX: 145,
    anchorY: 137,
  },
  {
    id: "egt3",
    label: "EGT 3",
    unit: "°C",
    target: "Exhaust Port 3",
    category: "EGT",
    x: 81,
    y: 53,
    anchorX: 295,
    anchorY: 137,
  },
  {
    id: "egt4",
    label: "EGT 4",
    unit: "°C",
    target: "Exhaust Port 4",
    category: "EGT",
    x: 81,
    y: 63,
    anchorX: 255,
    anchorY: 137,
  },
  {
    id: "oilPressure",
    label: "Oil Pressure",
    unit: "PSI",
    target: "Oil Gallery",
    category: "OIL",
    x: 23,
    y: 84,
    anchorX: 175,
    anchorY: 220,
  },
  {
    id: "oilTemperature",
    label: "Oil Temperature",
    unit: "°C",
    target: "Oil Sump",
    category: "OIL",
    x: 77,
    y: 84,
    anchorX: 225,
    anchorY: 220,
  },
  {
    id: "rpm",
    label: "RPM",
    unit: "RPM",
    target: "Crankshaft",
    category: "RPM",
    x: 50,
    y: 91,
    anchorX: 200,
    anchorY: 174,
  },
  {
    id: "fuelFlow",
    label: "Fuel Flow",
    unit: "L/h",
    target: "Fuel Injection",
    category: "FUEL",
    x: 89,
    y: 34,
    anchorX: 305,
    anchorY: 112,
  },
];

const TELEMETRY_GROUPS = [
  {
    title: "Cylinder Head Temperature",
    keys: ["cht1", "cht2", "cht3", "cht4"],
  },
  {
    title: "Exhaust Gas Temperature",
    keys: ["egt1", "egt2", "egt3", "egt4"],
  },
  {
    title: "Lubrication / Engine",
    keys: ["oilPressure", "oilTemperature", "rpm"],
  },
  {
    title: "Fuel System",
    keys: ["fuelFlow"],
  },
];

const statusClasses = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized === "critical") {
    return {
      text: "text-accent-red",
      border: "border-accent-red/50",
      bg: "bg-accent-red/10",
      fill: "bg-accent-red",
    };
  }

  if (normalized === "advisory") {
    return {
      text: "text-accent-amber",
      border: "border-accent-amber/50",
      bg: "bg-accent-amber/10",
      fill: "bg-accent-amber",
    };
  }

  return {
    text: "text-accent-green",
    border: "border-accent-green/50",
    bg: "bg-accent-green/10",
    fill: "bg-accent-green",
  };
};

const getTelemetryStatus = (id: string, value: number) => {
  switch (id) {
    case "oilPressure":
      if (value < 35) return "critical";
      if (value < 45) return "advisory";
      return "nominal";

    case "oilTemperature":
      if (value > 125) return "critical";
      if (value > 110) return "advisory";
      return "nominal";

    case "rpm":
      if (value < 2500 || value > 6500) return "critical";
      if (value < 3000 || value > 6000) return "advisory";
      return "nominal";

    case "fuelFlow":
      if (value < 8 || value > 30) return "advisory";
      return "nominal";

    default:
      if (id.startsWith("cht")) {
        if (value > 235) return "critical";
        if (value > 215) return "advisory";
      }

      if (id.startsWith("egt")) {
        if (value > 720) return "critical";
        if (value > 690) return "advisory";
      }

      return "nominal";
  }
};

const formatValue = (id: string, value: number) => {
  if (id === "rpm") return Math.round(value).toLocaleString();
  if (id === "fuelFlow") return value.toFixed(1);
  return value.toFixed(1);
};

const getSensorIcon = (category: SensorDefinition["category"]) => {
  if (category === "CHT" || category === "EGT") return Thermometer;
  if (category === "OIL") return Droplets;
  if (category === "RPM") return Gauge;
  return Fuel;
};

export default function EngineBlueprint() {
  const { engineId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedSensor, setSelectedSensor] = useState<string>("egt1");
  const [historyMetric, setHistoryMetric] = useState<TelemetryKey>("egt1");
  const [blueprintZoom, setBlueprintZoom] = useState(1);
  const [blueprintPan, setBlueprintPan] = useState({ x: 0, y: 0 });
  const thresholds: AlertThresholds = useAlertThresholds();

  const blueprintDrag = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const engine = mockEngines.find((item) => item.id === engineId);
  const telemetryHistory = telemetryByEngineId[engineId ?? ""] ?? ({} as typeof telemetryByEngineId[string]);

  const modelOutput = engine?.modelOutput;
  const healthRiskStatus = modelOutput
    ? getFaultProbabilityStatus(Number(modelOutput.faultProbability) || 0, thresholds)
    : "nominal";
  const status = statusClasses(healthRiskStatus);

  const sensors = useMemo(() => {
    return SENSOR_DEFINITIONS.map((sensor) => ({
      ...sensor,
      value:
        Number(
          engine.telemetry[
            sensor.id as keyof typeof engine.telemetry
          ],
        ) || 0,
      history: telemetryHistory[sensor.id] ?? [],
    }));
  }, [engine, telemetryHistory]);

  const selectedSensorData =
    sensors.find((sensor) => sensor.id === selectedSensor) ?? sensors[0];

  const historySeries = telemetryHistory[historyMetric] ?? [];

  const historicalAssessments = useMemo(() => {
    const baseProbability = Number(modelOutput.faultProbability) || 0;

    return Array.from({ length: 6 }, (_, index) => {
      const progress = index / 5;
      const variation =
        Math.sin(index * 1.7) * 8 + (index === 5 ? 0 : -12);

      const probability = Math.max(
        2,
        Math.min(
          99,
          baseProbability * progress + variation + 12,
        ),
      );

      const rowStatus = getFaultProbabilityStatus(
        probability,
        thresholds,
      ).toUpperCase();

      const time = `${String(7 + index).padStart(2, "0")}:${
        index % 2 === 0 ? "00" : "30"
      }`;

      return {
        time,
        probability,
        faultClass:
          probability >= thresholds.critical
            ? modelOutput.faultClass
            : probability >= thresholds.nominal
              ? "EARLY ANOMALY"
              : "NONE",
        status: rowStatus,
      };
    });
  }, [modelOutput, thresholds]);

  if (!engine || !modelOutput) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <div className="border border-border-hairline bg-surface p-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
            System Error
          </div>
          <h2 className="mt-3 font-mono text-xl uppercase tracking-[0.2em] text-text-primary">
            ENGINE NOT FOUND
          </h2>
          <button
            type="button"
            onClick={() => navigate("/fleet")}
            className="mt-6 border border-border-hairline bg-surface-raised px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-primary hover:border-accent-green hover:text-accent-green"
          >
            Return To Fleet
          </button>
        </div>
      </div>
    );
  }

  const overviewCharts: Array<{ id: TelemetryKey; label: string; unit: string }> = [
    {
      id: "egt1",
      label: "EGT 1",
      unit: "°C",
    },
    {
      id: "rpm",
      label: "RPM",
      unit: "RPM",
    },
    {
      id: "oilPressure",
      label: "Oil Pressure",
      unit: "PSI",
    },
  ];

  const clampPan = (value: number) => Math.max(-220, Math.min(220, value));

  const updateBlueprintZoom = (nextZoom: number) => {
    const zoom = Math.max(1, Math.min(2.5, Number(nextZoom.toFixed(2))));
    setBlueprintZoom(zoom);
    if (zoom === 1) setBlueprintPan({ x: 0, y: 0 });
  };

  const handleBlueprintWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateBlueprintZoom(blueprintZoom + (event.deltaY < 0 ? 0.15 : -0.15));
  };

  const handleBlueprintPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (blueprintZoom <= 1) return;
    blueprintDrag.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: blueprintPan.x,
      originY: blueprintPan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBlueprintPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!blueprintDrag.current.active) return;
    const dx = event.clientX - blueprintDrag.current.startX;
    const dy = event.clientY - blueprintDrag.current.startY;
    setBlueprintPan({
      x: clampPan(blueprintDrag.current.originX + dx),
      y: clampPan(blueprintDrag.current.originY + dy),
    });
  };

  const handleBlueprintPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    blueprintDrag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resetBlueprintView = () => {
    setBlueprintZoom(1);
    setBlueprintPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* HEADER */}
      <header className="flex shrink-0 items-center gap-4 border-b border-border-hairline bg-surface/90 px-4 py-4">
        <button
          type="button"
          onClick={() => navigate("/fleet")}
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-border-hairline bg-surface-raised text-text-secondary transition-colors hover:border-accent-green hover:text-accent-green"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-bold tracking-[0.18em] text-text-primary">
              {engine.id}
            </h1>

            <span
              className={cn(
                "border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em]",
                status.border,
                status.bg,
                status.text,
              )}
            >
              {healthRiskStatus}
            </span>
          </div>

          <div className="mt-1 truncate text-xs text-text-secondary">
            {engine.engineType} · {engine.tailNumber} · {engine.base}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 border border-border-hairline bg-surface-raised p-1">
          {(["overview", "telemetry", "history"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                activeTab === tab
                  ? "border border-border-hairline bg-surface text-text-primary"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex min-w-0 flex-1 flex-col p-5">
            <div className="relative min-h-[380px] flex-1 overflow-hidden border border-border-hairline bg-[#f4f3ef]">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(70,80,75,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(70,80,75,0.07) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="absolute left-4 top-3 z-20 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#66716c]">
                <Activity size={12} />
                UAV PISTON ENGINE // TECHNICAL BLUEPRINT
              </div>

              <div className="absolute right-4 top-3 z-40 flex items-center gap-2">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#87908b]">
                  4-CYL / AIR-COOLED / IN-LINE
                </div>
                <div className="flex items-center border border-[#a1a7a2] bg-[#f4f3ef]/95 font-mono">
                  <button
                    type="button"
                    aria-label="Zoom out blueprint"
                    onClick={() => updateBlueprintZoom(blueprintZoom - 0.15)}
                    disabled={blueprintZoom <= 1}
                    className="h-7 w-7 border-r border-[#c3c8c4] text-sm text-[#414944] transition-colors hover:bg-[#e5e6e1] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-[8px] font-bold tracking-[0.08em] text-[#4f5954]">
                    {Math.round(blueprintZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    aria-label="Zoom in blueprint"
                    onClick={() => updateBlueprintZoom(blueprintZoom + 0.15)}
                    disabled={blueprintZoom >= 2.5}
                    className="h-7 w-7 border-l border-[#c3c8c4] text-sm text-[#414944] transition-colors hover:bg-[#e5e6e1] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={resetBlueprintView}
                    className="h-7 border-l border-[#c3c8c4] px-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#68716c] transition-colors hover:bg-[#e5e6e1] hover:text-[#414944]"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 z-30 border border-[#c3c8c4] bg-[#f4f3ef]/90 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-[#68716c]">
                Wheel: Zoom · Drag: Pan
              </div>

              <div
                className={cn(
                  "absolute inset-0 touch-none",
                  blueprintZoom > 1 ? "cursor-grab" : "cursor-default",
                  blueprintDrag.current.active && "cursor-grabbing",
                )}
                onWheel={handleBlueprintWheel}
                onPointerDown={handleBlueprintPointerDown}
                onPointerMove={handleBlueprintPointerMove}
                onPointerUp={handleBlueprintPointerUp}
                onPointerCancel={handleBlueprintPointerUp}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${blueprintPan.x}px, ${blueprintPan.y}px) scale(${blueprintZoom})`,
                    transformOrigin: "center center",
                    transition: blueprintDrag.current.active ? "none" : "transform 160ms ease-out",
                  }}
                >

              <svg
                viewBox="0 0 400 280"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Construction lines */}
                <g
                  fill="none"
                  stroke="#a7ada8"
                  strokeWidth="0.6"
                  strokeDasharray="4 4"
                >
                  <line x1="35" y1="160" x2="365" y2="160" />
                  <line x1="200" y1="30" x2="200" y2="255" />
                  <line x1="75" y1="95" x2="325" y2="95" />
                  <line x1="75" y1="210" x2="325" y2="210" />
                </g>

                {/* Propeller / output shaft */}
                <g fill="none" stroke="#727a75" strokeWidth="2">
                  <line x1="25" y1="153" x2="90" y2="153" />
                  <ellipse cx="23" cy="153" rx="7" ry="38" />
                  <path d="M17 117 Q5 132 10 153 Q5 174 17 189" />
                  <path d="M29 117 Q41 132 36 153 Q41 174 29 189" />
                </g>

                {/* Front reduction / output housing */}
                <g fill="none" stroke="#737b76" strokeWidth="1.5">
                  <circle cx="91" cy="153" r="29" />
                  <circle cx="91" cy="153" r="21" />
                  <circle cx="91" cy="153" r="8" />
                  <line x1="70" y1="153" x2="112" y2="153" />
                  <line x1="91" y1="132" x2="91" y2="174" />
                </g>

                {/* Main crankcase */}
                <path
                  d="M105 124 L118 105 L282 105 L295 124 L295 190 L280 207 L120 207 L105 190 Z"
                  fill="#e8e7e2"
                  stroke="#6d7670"
                  strokeWidth="2"
                />

                {/* Crankcase seams */}
                <g fill="none" stroke="#929993" strokeWidth="0.9">
                  <line x1="105" y1="141" x2="295" y2="141" />
                  <line x1="105" y1="178" x2="295" y2="178" />
                  <line x1="145" y1="124" x2="145" y2="205" />
                  <line x1="200" y1="124" x2="200" y2="205" />
                  <line x1="255" y1="124" x2="255" y2="205" />
                </g>

                {/* Crankshaft */}
                <g fill="none" stroke="#59625d" strokeWidth="2">
                  <line x1="100" y1="163" x2="300" y2="163" />
                  <circle cx="140" cy="163" r="12" />
                  <circle cx="180" cy="163" r="12" />
                  <circle cx="220" cy="163" r="12" />
                  <circle cx="260" cy="163" r="12" />
                </g>

                {/* Connecting rods */}
                <g fill="none" stroke="#747c77" strokeWidth="1.5">
                  <line x1="140" y1="151" x2="140" y2="119" />
                  <line x1="180" y1="151" x2="180" y2="119" />
                  <line x1="220" y1="151" x2="220" y2="119" />
                  <line x1="260" y1="151" x2="260" y2="119" />
                </g>

                {/* Four cylinders */}
                {[120, 160, 200, 240].map((x, index) => (
                  <g key={`cylinder-${index}`}>
                    <path
                      d={`M${x} 52 L${x + 28} 52 L${x + 31} 68 L${x + 28} 118 L${x} 118 L${x - 3} 68 Z`}
                      fill="#e2e2dd"
                      stroke="#68716c"
                      strokeWidth="1.8"
                    />

                    {/* Cooling fins */}
                    {[58, 63, 68, 73, 78, 83, 88].map((y) => (
                      <line
                        key={`${index}-${y}`}
                        x1={x - 1}
                        y1={y}
                        x2={x + 29}
                        y2={y}
                        stroke="#858d88"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Cylinder head */}
                    <path
                      d={`M${x - 7} 46 L${x + 34} 46 L${x + 30} 57 L${x - 3} 57 Z`}
                      fill="#deded9"
                      stroke="#69726d"
                      strokeWidth="1.5"
                    />

                    {/* Spark plug */}
                    <circle
                      cx={x + 14}
                      cy={43}
                      r="3"
                      fill="#f4f3ef"
                      stroke="#68716c"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Intake manifold */}
                <g fill="none" stroke="#68716c" strokeWidth="1.7">
                  <path d="M128 102 Q200 90 272 102" />
                  <path d="M132 107 Q200 96 268 107" />
                  <line x1="150" y1="98" x2="150" y2="83" />
                  <line x1="180" y1="94" x2="180" y2="80" />
                  <line x1="220" y1="94" x2="220" y2="80" />
                  <line x1="250" y1="98" x2="250" y2="83" />
                </g>

                {/* Fuel injection rail */}
                <g fill="none" stroke="#777f7a" strokeWidth="1.4">
                  <line x1="125" y1="77" x2="275" y2="77" />
                  <line x1="145" y1="77" x2="145" y2="88" />
                  <line x1="180" y1="77" x2="180" y2="88" />
                  <line x1="220" y1="77" x2="220" y2="88" />
                  <line x1="255" y1="77" x2="255" y2="88" />
                </g>

                {/* Exhaust manifold */}
                <g fill="none" stroke="#626b66" strokeWidth="1.8">
                  <path d="M120 125 Q105 125 92 137" />
                  <path d="M160 125 Q145 125 132 137" />
                  <path d="M240 125 Q255 125 268 137" />
                  <path d="M280 125 Q295 125 308 137" />
                  <path d="M92 137 L68 137" />
                  <path d="M132 137 L108 137" />
                  <path d="M268 137 L292 137" />
                  <path d="M308 137 L332 137" />
                </g>

                {/* Exhaust outlet flanges */}
                <g fill="#e0dfda" stroke="#69716c" strokeWidth="1">
                  <rect x="61" y="131" width="9" height="12" />
                  <rect x="101" y="131" width="9" height="12" />
                  <rect x="290" y="131" width="9" height="12" />
                  <rect x="330" y="131" width="9" height="12" />
                </g>

                {/* Oil sump */}
                <path
                  d="M118 207 L282 207 L270 235 L130 235 Z"
                  fill="#deded9"
                  stroke="#69716c"
                  strokeWidth="1.8"
                />

                <g fill="none" stroke="#8a928d" strokeWidth="1">
                  <line x1="135" y1="215" x2="265" y2="215" />
                  <line x1="138" y1="221" x2="262" y2="221" />
                  <line x1="141" y1="227" x2="259" y2="227" />
                </g>

                {/* Oil circuit */}
                <g fill="none" stroke="#747c77" strokeWidth="1.3">
                  <path d="M145 218 Q135 190 145 170" />
                  <path d="M255 218 Q265 190 255 170" />
                  <circle cx="145" cy="170" r="4" />
                  <circle cx="255" cy="170" r="4" />
                </g>

                {/* Mounting brackets */}
                <g fill="none" stroke="#69716c" strokeWidth="1.5">
                  <path d="M110 190 L90 205 L90 218 L112 218" />
                  <path d="M290 190 L310 205 L310 218 L288 218" />
                  <circle cx="98" cy="213" r="4" />
                  <circle cx="302" cy="213" r="4" />
                </g>

                {/* Technical labels */}
                <g
                  fill="#737b76"
                  fontFamily="monospace"
                  fontSize="7"
                  letterSpacing="1"
                >
                  <text x="145" y="28">CYLINDER HEADS / COOLING FIN ARRAY</text>
                  <text x="143" y="249">OIL SUMP / LUBRICATION RESERVOIR</text>
                  <text x="18" y="203">PROP OUTPUT</text>
                  <text x="304" y="102">FUEL RAIL</text>
                  <text x="310" y="154">EXHAUST</text>
                </g>

                {/* Dimension line */}
                <g
                  fill="none"
                  stroke="#9ba19d"
                  strokeWidth="0.7"
                >
                  <line x1="120" y1="258" x2="280" y2="258" />
                  <line x1="120" y1="254" x2="120" y2="262" />
                  <line x1="280" y1="254" x2="280" y2="262" />
                </g>

                {/* SENSOR LEADER LINES */}
                {sensors.map((sensor) => {
                  const active = selectedSensor === sensor.id;

                  return (
                    <g
                      key={`leader-${sensor.id}`}
                      onClick={() => setSelectedSensor(sensor.id)}
                      className="cursor-pointer"
                    >
                      <line
                        x1={sensor.anchorX}
                        y1={sensor.anchorY}
                        x2={
                          sensor.x < 50
                            ? sensor.anchorX - 35
                            : sensor.anchorX + 35
                        }
                        y2={
                          sensor.y < 30
                            ? sensor.anchorY - 28
                            : sensor.anchorY
                        }
                        stroke={
                          active
                            ? "#2FAE68"
                            : "#89918c"
                        }
                        strokeWidth={active ? 1.5 : 0.8}
                        strokeDasharray={active ? "0" : "3 3"}
                      />

                      <circle
                        cx={sensor.anchorX}
                        cy={sensor.anchorY}
                        r={active ? 5 : 3}
                        fill="#f4f3ef"
                        stroke={
                          active
                            ? "#2FAE68"
                            : "#747d77"
                        }
                        strokeWidth={active ? 2 : 1}
                      />
                      {active && (
                        <circle
                          cx={sensor.anchorX}
                          cy={sensor.anchorY}
                          r="1.8"
                          fill="#2FAE68"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* SENSOR LABELS */}
              {sensors.map((sensor) => {
                const Icon = getSensorIcon(sensor.category);
                const sensorStatus = getTelemetryStatus(
                  sensor.id,
                  sensor.value,
                );
                const sensorStyle = statusClasses(sensorStatus);
                const active = selectedSensor === sensor.id;

                return (
                  <button
                    key={sensor.id}
                    type="button"
                    onClick={() => {
                      setSelectedSensor(sensor.id);
                      if (activeTab === "overview") {
                        setActiveTab("telemetry");
                      }
                    }}
                    className={cn(
                      "absolute z-30 -translate-x-1/2 -translate-y-1/2 border bg-[#f4f3ef]/95 px-2 py-1 text-left font-mono transition-all",
                      active
                        ? "border-accent-green shadow-[0_0_12px_rgba(57,255,136,0.25)]"
                        : "border-[#9ca39e] hover:border-[#68716c]",
                    )}
                    style={{
                      left: `${sensor.x}%`,
                      top: `${sensor.y}%`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon
                        size={9}
                        className={
                          active
                            ? "text-accent-green"
                            : "text-[#69716c]"
                        }
                      />
                      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#4f5954]">
                        {sensor.label}
                      </span>
                    </div>

                    <div className="mt-0.5 text-[9px] text-[#737b76]">
                      {formatValue(sensor.id, sensor.value)}
                      {sensor.unit}
                    </div>
                  </button>
                );
              })}
                </div>
              </div>

              {/* Selected sensor information */}
              <div className="absolute bottom-3 left-3 z-30 border border-[#a1a7a2] bg-[#f4f3ef]/95 px-3 py-2 font-mono">
                <div className="text-[8px] uppercase tracking-[0.18em] text-[#7a827d]">
                  Selected Sensor
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase text-[#414944]">
                  {selectedSensorData.label}
                </div>
                <div className="mt-0.5 text-[9px] text-[#68716c]">
                  {selectedSensorData.target}
                </div>
              </div>
            </div>

            {/* Overview charts */}
            <div className="mt-4 grid shrink-0 grid-cols-1 gap-3 md:grid-cols-3">
              {overviewCharts.map((metric) => {
                const series = telemetryHistory[metric.id] ?? [];
                const latest =
                  series.length > 0
                    ? series[series.length - 1].value
                    : Number(
                        engine.telemetry[
                          metric.id as keyof typeof engine.telemetry
                        ],
                      ) || 0;

                const metricStatus = getTelemetryStatus(metric.id, latest);

                return (
                  <div
                    key={metric.id}
                    className="h-40 border border-border-hairline bg-surface"
                  >
                    <div className="flex items-center justify-between border-b border-border-hairline px-3 py-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-secondary">
                        {metric.label} ({metric.unit})
                      </span>
                      <Activity
                        size={11}
                        className="text-text-muted"
                      />
                    </div>

                    <div className="relative h-[106px] p-2">
                      <MiniLineChart
                        data={series}
                        label={metric.label}
                        unit={metric.unit}
                        stroke={metricStatus === "critical" ? "#E53935" : metricStatus === "advisory" ? "#C98A16" : "#2FAE68"}
                      />

                      <div className="absolute bottom-1 left-3 font-mono text-lg font-bold text-text-primary">
                        {metric.id === "rpm"
                          ? Math.round(latest).toLocaleString()
                          : latest.toFixed(1)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* MODEL PANEL */}
          <aside className="w-[310px] shrink-0 overflow-y-auto border-l border-border-hairline bg-surface/60">
            <div className="border-b border-border-hairline bg-surface px-4 py-3">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-primary">
                Model Assessment
              </div>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
                  Fault Probability
                </div>

                <div
                  className={cn(
                    "mt-2 font-mono text-4xl font-bold",
                    status.text,
                  )}
                >
                  {Number(modelOutput.faultProbability).toFixed(1)}%
                </div>

                <div className="mt-3 h-2 overflow-hidden border border-border-hairline bg-surface-raised">
                  <div
                    className={cn("h-full", status.fill)}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, Number(modelOutput.faultProbability)),
                      )}%`,
                    }}
                  />
                </div>
              </section>

              <section className="border-t border-border-hairline pt-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
                  Fault Class
                </div>

                <div className="mt-2 font-mono text-sm font-bold uppercase leading-6 text-text-primary">
                  {modelOutput.faultClass}
                </div>
              </section>

              <section className="border-t border-border-hairline pt-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
                  Health / Risk Status
                </div>

                <div
                  className={cn(
                    "mt-2 font-mono text-xl font-bold uppercase",
                    status.text,
                  )}
                >
                  {healthRiskStatus}
                </div>
              </section>

              <section className="border-t border-border-hairline pt-5">
                <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
                  Live Telemetry
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {sensors.map((sensor) => {
                    const sensorStatus = getTelemetryStatus(
                      sensor.id,
                      sensor.value,
                    );
                    const sensorStyle = statusClasses(sensorStatus);

                    return (
                      <button
                        key={sensor.id}
                        type="button"
                        onClick={() => {
                          setSelectedSensor(sensor.id);
                          setActiveTab("telemetry");
                        }}
                        className="border-b border-border-hairline/60 pb-2 text-left"
                      >
                        <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
                          {sensor.label}
                        </div>

                        <div className="mt-1 flex items-baseline justify-between gap-1">
                          <span className="font-mono text-xs font-bold text-text-primary">
                            {formatValue(sensor.id, sensor.value)}
                          </span>

                          <span
                            className={cn(
                              "text-[7px] font-mono uppercase",
                              sensorStyle.text,
                            )}
                          >
                            {sensorStatus}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className="flex w-full items-center justify-center gap-2 border border-border-hairline bg-surface-raised px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-text-primary hover:border-accent-green hover:text-accent-green"
              >
                <Activity size={12} />
                Open Full Telemetry
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* TELEMETRY */}
      {activeTab === "telemetry" && (
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">
                Live Sensor Acquisition
              </div>
              <h2 className="mt-2 font-mono text-xl font-bold uppercase tracking-[0.15em] text-text-primary">
                Engine Telemetry
              </h2>
            </div>

            <div className="flex items-center gap-2 border border-border-hairline bg-surface px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-text-secondary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent-green" />
              LIVE // {engine.id}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {sensors.map((sensor) => {
              const sensorStatus = getTelemetryStatus(
                sensor.id,
                sensor.value,
              );
              const sensorStyle = statusClasses(sensorStatus);
              const Icon = getSensorIcon(sensor.category);
              const series = sensor.history;

              return (
                <button
                  key={sensor.id}
                  type="button"
                  onClick={() => setSelectedSensor(sensor.id)}
                  className={cn(
                    "group min-h-[190px] border bg-surface p-4 text-left transition-all",
                    selectedSensor === sensor.id
                      ? "border-accent-green shadow-[0_0_18px_rgba(57,255,136,0.08)]"
                      : "border-border-hairline hover:border-text-muted",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center border",
                          sensorStyle.border,
                          sensorStyle.bg,
                        )}
                      >
                        <Icon size={14} className={sensorStyle.text} />
                      </div>

                      <div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-primary">
                          {sensor.label}
                        </div>
                        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
                          {sensor.target}
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "border px-2 py-1 font-mono text-[8px] uppercase",
                        sensorStyle.border,
                        sensorStyle.bg,
                        sensorStyle.text,
                      )}
                    >
                      {sensorStatus}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-mono text-3xl font-bold text-text-primary">
                      {formatValue(sensor.id, sensor.value)}
                    </span>
                    <span className="mb-1 font-mono text-[10px] text-text-muted">
                      {sensor.unit}
                    </span>
                  </div>

                  <div className="mt-4 h-20 w-full">
                    <MiniLineChart
                        data={series}
                        label={sensor.label}
                        unit={sensor.unit}
                        stroke={sensorStatus === "critical" ? "#E53935" : sensorStatus === "advisory" ? "#C98A16" : "#2FAE68"}
                      />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border border-border-hairline bg-surface">
            <div className="border-b border-border-hairline px-4 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
                Selected Parameter
              </div>

              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-sm font-bold uppercase text-text-primary">
                  {selectedSensorData.label}
                </span>
                <span className="font-mono text-xs text-text-secondary">
                  {selectedSensorData.target}
                </span>
              </div>
            </div>

            <div className="h-72 p-4">
              <MiniLineChart
                data={selectedSensorData.history}
                label={selectedSensorData.label}
                unit={selectedSensorData.unit}
                showLabels
                stroke={getTelemetryStatus(selectedSensorData.id, selectedSensorData.value) === "critical" ? "#E53935" : getTelemetryStatus(selectedSensorData.id, selectedSensorData.value) === "advisory" ? "#C98A16" : "#2FAE68"}
              />
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {activeTab === "history" && (
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="mb-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">
              Historical Engine Analysis
            </div>

            <h2 className="mt-2 font-mono text-xl font-bold uppercase tracking-[0.15em] text-text-primary">
              {engine.id} // History
            </h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
            <section className="border border-border-hairline bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-hairline px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-secondary">
                  Telemetry History
                </div>

                <select
                  value={historyMetric}
                  onChange={(event) =>
                    setHistoryMetric(event.target.value as TelemetryKey)
                  }
                  className="border border-border-hairline bg-surface-raised px-3 py-2 font-mono text-[9px] uppercase text-text-primary outline-none focus:border-accent-green"
                >
                  {SENSOR_DEFINITIONS.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-80 p-4">
                <MiniLineChart
                  data={historySeries}
                  label={SENSOR_DEFINITIONS.find((sensor) => sensor.id === historyMetric)?.label ?? historyMetric}
                  unit={SENSOR_DEFINITIONS.find((sensor) => sensor.id === historyMetric)?.unit ?? ""}
                  showLabels
                  stroke={getTelemetryStatus(historyMetric, Number(engine.telemetry[historyMetric])) === "critical" ? "#E53935" : getTelemetryStatus(historyMetric, Number(engine.telemetry[historyMetric])) === "advisory" ? "#C98A16" : "#2FAE68"}
                />
              </div>
            </section>

            <section className="border border-border-hairline bg-surface">
              <div className="border-b border-border-hairline px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-secondary">
                  Current Model Result
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
                    Fault Probability
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-mono text-3xl font-bold",
                      status.text,
                    )}
                  >
                    {Number(modelOutput.faultProbability).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
                    Fault Class
                  </div>
                  <div className="mt-1 font-mono text-xs font-bold uppercase leading-5 text-text-primary">
                    {modelOutput.faultClass}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
                    Health / Risk
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-mono text-lg font-bold uppercase",
                      status.text,
                    )}
                  >
                    {healthRiskStatus}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-5 border border-border-hairline bg-surface">
            <div className="border-b border-border-hairline px-4 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-secondary">
                Historical Model Assessments
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border-hairline bg-surface-raised text-left text-[9px] uppercase tracking-[0.18em] text-text-muted">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Fault Probability</th>
                    <th className="px-4 py-3">Fault Class</th>
                    <th className="px-4 py-3">Health / Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {historicalAssessments.map((row) => {
                    const rowStyle = statusClasses(
                      row.status.toLowerCase(),
                    );

                    return (
                      <tr
                        key={row.time}
                        className="border-b border-border-hairline/60 last:border-0 hover:bg-surface-raised"
                      >
                        <td className="px-4 py-3 text-text-secondary">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={11} />
                            {row.time}
                          </span>
                        </td>

                        <td
                          className={cn(
                            "px-4 py-3 font-bold",
                            rowStyle.text,
                          )}
                        >
                          {row.probability.toFixed(1)}%
                        </td>

                        <td className="px-4 py-3 uppercase text-text-primary">
                          {row.faultClass}
                        </td>

                        <td
                          className={cn(
                            "px-4 py-3 font-bold uppercase",
                            rowStyle.text,
                          )}
                        >
                          {row.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Peak Fault Probability",
                value: `${Math.max(
                  ...historicalAssessments.map(
                    (row) => row.probability,
                  ),
                ).toFixed(1)}%`,
                icon: AlertTriangle,
              },
              {
                label: "Current RPM",
                value: `${Math.round(
                  Number(engine.telemetry.rpm) || 0,
                ).toLocaleString()}`,
                icon: Gauge,
              },
              {
                label: "Current Oil Pressure",
                value: `${Number(
                  engine.telemetry.oilPressure,
                ).toFixed(1)} PSI`,
                icon: Droplets,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="border border-border-hairline bg-surface p-4"
                >
                  <div className="flex items-center gap-2 text-text-muted">
                    <Icon size={13} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em]">
                      {item.label}
                    </span>
                  </div>

                  <div className="mt-3 font-mono text-xl font-bold text-text-primary">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}