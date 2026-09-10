import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { mockAlerts } from "../lib/mockData";

export default function AlertsPage() {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "advisory">("all");

  const alerts = useMemo(() => {
    const filtered = mockAlerts.filter(
      (alert) => severityFilter === "all" || alert.severity === severityFilter,
    );

    return [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [severityFilter]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border-hairline bg-surface/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Threat Board
            </div>
            <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-[0.2em] text-text-primary">
              Alert Log
            </h1>
          </div>

          <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            Severity
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as "all" | "critical" | "advisory")}
              className="border border-border-hairline bg-surface-raised px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-green"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="advisory">Advisory</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-3">
          {alerts.map((alert) => {
            const relativeMinutes = Math.max(
              1,
              Math.round((Date.now() - new Date(alert.timestamp).getTime()) / 60000),
            );
            const relativeTime =
              relativeMinutes < 60
                ? `${relativeMinutes}m ago`
                : `${Math.floor(relativeMinutes / 60)}h ${relativeMinutes % 60}m ago`;

            const route = alert.partId
              ? `/engine/${alert.engineId}/part/${alert.partId}`
              : `/engine/${alert.engineId}`;

            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => navigate(route)}
                className="flex w-full items-start gap-4 border border-border-hairline bg-surface p-4 text-left transition-colors hover:border-accent-green/80 hover:bg-surface-raised"
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center border ${
                    alert.severity === "critical"
                      ? "border-accent-red bg-accent-red/10 text-accent-red"
                      : "border-accent-amber bg-accent-amber/10 text-accent-amber"
                  }`}
                >
                  <ShieldAlert size={16} />
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-text-primary">
                        {alert.engineId}
                      </span>
                      {alert.partId && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                          {alert.partId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                          alert.severity === "critical" ? "text-accent-red" : "text-accent-amber"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                        {relativeTime}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-text-primary">{alert.message}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
