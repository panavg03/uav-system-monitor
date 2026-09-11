import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { enginePartsByEngineId, mockEngines } from "../lib/mockData";

export default function PartDetailPage() {
  const { engineId, partId } = useParams();
  const navigate = useNavigate();

  const engine = mockEngines.find((item) => item.id === engineId);
  const part = (engineId ? enginePartsByEngineId[engineId] ?? [] : []).find((item) => item.id === partId);

  if (!engine || !part) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md border border-border bg-surface p-8 shadow-sm">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">Part Not Found</div>
          <h2 className="mt-3 font-mono text-xl uppercase tracking-wider text-text">
            {engineId ?? "Unknown Engine"}
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/engine/${engineId}`)}
            className="mt-6 border border-border bg-surface-raised px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-text hover:border-primary hover:text-primary transition-colors"
          >
            Return to Engine
          </button>
        </div>
      </div>
    );
  }

  const statusColor =
    part.status === "critical"
      ? "text-status-critical border-status-critical/40 bg-status-critical/10"
      : part.status === "advisory"
        ? "text-status-warning border-status-warning/40 bg-status-warning/10"
        : "text-status-normal border-status-normal/40 bg-status-normal/10";

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border bg-surface p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/engine/${engineId}`)}
            className="flex h-10 w-10 items-center justify-center border border-border bg-surface-raised text-muted transition-colors hover:text-text"
          >
            <ChevronLeft size={16} />
          </button>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {engineId} // Part Detail
            </div>
            <h1 className="mt-2 font-mono text-xl font-bold uppercase tracking-wider text-text">
              {part.name}
            </h1>
          </div>

          <div className={`ml-auto rounded-none border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${statusColor}`}>
            {part.status}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-surface-raised text-status-normal">
                <ShieldAlert size={16} />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Health Score
                </div>
                <div className="mt-1 font-mono text-3xl font-bold text-text">{part.healthScore}%</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="border border-border bg-surface-raised p-3">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted">Status</div>
                <div className="mt-2 font-mono text-sm uppercase text-text">{part.status}</div>
              </div>
              <div className="border border-border bg-surface-raised p-3">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted">Engine</div>
                <div className="mt-2 font-mono text-sm text-text">{engine.id}</div>
              </div>
              <div className="border border-border bg-surface-raised p-3">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted">Last Sync</div>
                <div className="mt-2 font-mono text-sm text-text">{engine.lastSync.slice(11, 16)}Z</div>
              </div>
            </div>
          </section>

          <aside className="border border-border bg-surface p-5 shadow-sm">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Recommended Action
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              {part.status === "critical"
                ? "Perform immediate inspection and remove the component from active rotation before the next mission window."
                : part.status === "advisory"
                  ? "Schedule maintenance within the next operational cycle and monitor telemetry for further degradation."
                  : "Maintain current surveillance parameters; the component remains within nominal tolerance."}
            </p>
          </aside>
        </div>

        {part.subParts && part.subParts.length > 0 && (
          <section className="mt-8 border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted">
              Sub-Components
            </div>

            <div className="space-y-3">
              {part.subParts.map((subPart) => (
                <div
                  key={subPart.id}
                  className="flex items-center justify-between border border-border bg-surface-raised p-3"
                >
                  <div>
                    <div className="font-mono text-xs uppercase tracking-wider text-text">
                      {subPart.name}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {subPart.status}
                    </div>
                  </div>

                  <div className="font-mono text-sm font-bold text-text">{subPart.healthScore}%</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}