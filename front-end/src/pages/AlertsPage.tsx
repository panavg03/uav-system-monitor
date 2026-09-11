import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { mockAlerts, mockEngines } from "../lib/mockData";
import { getFaultProbabilityStatus, useAlertThresholds } from "../lib/alertThresholds";

const statusStyle = (severity: "critical" | "advisory") =>
  severity === "critical"
    ? "border-accent-red/50 bg-accent-red/10 text-accent-red"
    : "border-accent-amber/50 bg-accent-amber/10 text-accent-amber";

const relativeTime = (timestamp: string) => {
  const diffMinutes = Math.round((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffMinutes <= 0) return "LIVE";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m ago`;
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const thresholds = useAlertThresholds();
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "advisory">("all");

  const alerts = useMemo(
    () =>
      [...mockAlerts]
        .map((alert) => {
          const engine = mockEngines.find((item) => item.id === alert.engineId);
          const severity = engine
            ? getFaultProbabilityStatus(engine.modelOutput.faultProbability, thresholds)
            : alert.severity;
          return { ...alert, severity };
        })
        .filter((alert) => alert.severity !== "nominal")
        .filter((alert) => severityFilter === "all" || alert.severity === severityFilter)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [severityFilter, thresholds],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border-hairline bg-surface/90 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">Threat Board</div>
            <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-[0.2em] text-text-primary">Alert Log</h1>
            <p className="mt-2 text-xs text-text-secondary">Active engine anomalies requiring operator attention.</p>
          </div>

          <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            Severity
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as "all" | "critical" | "advisory")}
              className="border border-border-hairline bg-surface-raised px-3 py-2 text-xs uppercase text-text-primary outline-none focus:border-accent-green"
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical</option>
              <option value="advisory">Advisory</option>
            </select>
          </label>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="border border-border-hairline bg-surface p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">Active Alerts</div>
            <div className="mt-2 font-mono text-2xl font-bold text-accent-red">{alerts.length}</div>
          </div>
          <div className="border border-border-hairline bg-surface p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">Critical</div>
            <div className="mt-2 font-mono text-2xl font-bold text-accent-red">{alerts.filter((a) => a.severity === "critical").length}</div>
          </div>
          <div className="border border-border-hairline bg-surface p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">Advisory</div>
            <div className="mt-2 font-mono text-2xl font-bold text-accent-amber">{alerts.filter((a) => a.severity === "advisory").length}</div>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => {
            const engine = mockEngines.find((item) => item.id === alert.engineId);
            const route = alert.partId
              ? `/engine/${alert.engineId}/part/${alert.partId}`
              : `/engine/${alert.engineId}`;

            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => navigate(route)}
                className="group flex w-full items-start gap-4 border border-border-hairline bg-surface p-4 text-left transition-colors hover:border-accent-green/70 hover:bg-surface-raised"
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${statusStyle(alert.severity)}`}>
                  {alert.severity === "critical" ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text-primary">{alert.engineId}</span>
                      {engine && <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">{engine.base}</span>}
                      <span className={`border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] ${statusStyle(alert.severity)}`}>{alert.severity}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">{relativeTime(alert.timestamp)}</span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-text-secondary">{alert.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                    <span>Model fault probability: {engine?.modelOutput.faultProbability.toFixed(1) ?? "—"}%</span>
                    <span>Fault class: {engine?.modelOutput.faultClass ?? "—"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {alerts.length === 0 && (
          <div className="border border-dashed border-border-hairline p-10 text-center font-mono text-xs uppercase tracking-[0.25em] text-text-muted">No alerts match the selected severity.</div>
        )}
      </div>
    </div>
  );
}
