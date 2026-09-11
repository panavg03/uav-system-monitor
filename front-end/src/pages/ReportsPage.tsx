import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarRange, ShieldAlert } from "lucide-react";
import { mockReports } from "../lib/mockData";

const statusClasses = (status: string) => {
  if (status === "critical") return "border-accent-red/50 bg-accent-red/10 text-accent-red";
  if (status === "advisory") return "border-accent-amber/50 bg-accent-amber/10 text-accent-amber";
  return "border-accent-green/50 bg-accent-green/10 text-accent-green";
};

export default function ReportsPage() {
  const [engineFilter, setEngineFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const engineOptions = useMemo(
    () => ["all", ...Array.from(new Set(mockReports.map((report) => report.engineId)))],
    [],
  );

  const filteredReports = useMemo(() => {
    return mockReports.filter((report) => {
      const matchesEngine = engineFilter === "all" || report.engineId === engineFilter;
      const matchesRisk = riskFilter === "all" || report.healthRiskStatus === riskFilter;
      return matchesEngine && matchesRisk;
    });
  }, [engineFilter, riskFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border-hairline bg-surface/90 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Mission Intelligence
            </div>
            <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-[0.2em] text-text-primary">
              Operational Reports
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-text-secondary">
              Diagnostic reports generated from the six active engine profiles and their current model assessments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              Engine
              <select
                value={engineFilter}
                onChange={(event) => setEngineFilter(event.target.value)}
                className="min-w-32 border border-border-hairline bg-surface-raised px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-green"
              >
                {engineOptions.map((engine) => (
                  <option key={engine} value={engine}>
                    {engine === "all" ? "All Engines" : engine}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              Risk Status
              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="min-w-32 border border-border-hairline bg-surface-raised px-3 py-2 text-xs uppercase text-text-primary outline-none focus:border-accent-green"
              >
                <option value="all">All Statuses</option>
                <option value="nominal">Nominal</option>
                <option value="advisory">Advisory</option>
                <option value="critical">Critical</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Total Reports", mockReports.length],
            ["Advisory", mockReports.filter((report) => report.healthRiskStatus === "advisory").length],
            ["Critical", mockReports.filter((report) => report.healthRiskStatus === "critical").length],
          ].map(([label, value]) => (
            <div key={String(label)} className="border border-border-hairline bg-surface p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">{label}</div>
              <div className="mt-2 font-mono text-2xl font-bold text-text-primary">{value}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden border border-border-hairline bg-surface">
          <div className="hidden grid-cols-[1.15fr_0.8fr_0.8fr_1.05fr_1.8fr_0.65fr] border-b border-border-hairline bg-surface-raised text-[9px] font-mono uppercase tracking-[0.2em] text-text-secondary md:grid">
            <div className="px-4 py-3">Report</div>
            <div className="px-4 py-3">Engine</div>
            <div className="px-4 py-3">Date</div>
            <div className="px-4 py-3">Fault Probability</div>
            <div className="px-4 py-3">Assessment</div>
            <div className="px-4 py-3 text-right">View</div>
          </div>

          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="grid gap-4 border-b border-border-hairline p-4 last:border-b-0 md:grid-cols-[1.15fr_0.8fr_0.8fr_1.05fr_1.8fr_0.65fr] md:items-center md:gap-0 md:p-0"
            >
              <div className="md:px-4 md:py-4">
                <div className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text-primary">
                  {report.id}
                </div>
                <div className="mt-1 text-xs text-text-secondary">{report.title}</div>
              </div>

              <div className="md:px-4 md:py-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted md:hidden">Engine</div>
                <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-accent-green md:mt-0">{report.engineId}</div>
              </div>

              <div className="md:px-4 md:py-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted md:hidden">Date</div>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs text-text-secondary md:mt-0">
                  <CalendarRange size={12} />
                  {new Date(report.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              </div>

              <div className="md:px-4 md:py-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted md:hidden">Fault Probability</div>
                <div className={`mt-1 font-mono text-sm font-bold md:mt-0 ${statusClasses(report.healthRiskStatus).split(" ").find((item) => item.startsWith("text-"))}`}>
                  {report.faultProbability.toFixed(1)}%
                </div>
              </div>

              <div className="md:px-4 md:py-4">
                <div className="flex items-center gap-2">
                  <span className={`border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] ${statusClasses(report.healthRiskStatus)}`}>
                    {report.healthRiskStatus}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">{report.faultClass}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{report.summary}</p>
              </div>

              <div className="md:flex md:items-center md:justify-end md:px-4 md:py-4">
                <Link
                  to={`/engine/${report.engineId}`}
                  className="inline-flex items-center gap-2 border border-border-hairline bg-surface-raised px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
                >
                  View Engine
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="mt-6 border border-dashed border-border-hairline bg-surface/50 p-10 text-center">
            <ShieldAlert className="mx-auto text-text-muted" size={20} />
            <div className="mt-3 font-mono text-xs uppercase tracking-[0.26em] text-text-muted">No matching mission reports</div>
          </div>
        )}
      </div>
    </div>
  );
}
