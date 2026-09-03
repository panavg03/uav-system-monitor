import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarRange, Filter } from "lucide-react";
import { mockReports } from "../lib/mockData";

export default function ReportsPage() {
  const [engineFilter, setEngineFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const engineOptions = useMemo(
    () => ["all", ...Array.from(new Set(mockReports.map((report) => report.engineId)))],
    [],
  );

  const filteredReports = useMemo(() => {
    return mockReports.filter((report) => {
      const matchesEngine = engineFilter === "all" || report.engineId === engineFilter;
      const matchesStart = !startDate || new Date(report.date) >= new Date(startDate);
      const matchesEnd = !endDate || new Date(report.date) <= new Date(endDate);
      return matchesEngine && matchesStart && matchesEnd;
    });
  }, [engineFilter, startDate, endDate]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border-hairline bg-surface/80 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Mission Intelligence
            </div>
            <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-[0.2em] text-text-primary">
              Operational Reports
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              Engine
              <select
                value={engineFilter}
                onChange={(event) => setEngineFilter(event.target.value)}
                className="border border-border-hairline bg-surface-raised px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-green"
              >
                {engineOptions.map((engine) => (
                  <option key={engine} value={engine}>
                    {engine === "all" ? "All Engines" : engine}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              From
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="border border-border-hairline bg-surface-raised px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-green"
              />
            </label>

            <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              To
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="border border-border-hairline bg-surface-raised px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-green"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="overflow-hidden border border-border-hairline bg-surface">
          <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.9fr_1.5fr_0.7fr] gap-0 border-b border-border-hairline bg-surface-raised text-[10px] font-mono uppercase tracking-[0.22em] text-text-secondary">
            <div className="px-4 py-3">Mission</div>
            <div className="px-4 py-3">Engine</div>
            <div className="px-4 py-3">Duration</div>
            <div className="px-4 py-3">Delta</div>
            <div className="px-4 py-3">Summary</div>
            <div className="px-4 py-3 text-right">View</div>
          </div>

          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.9fr_1.5fr_0.7fr] gap-0 border-b border-border-hairline last:border-b-0 text-sm text-text-primary"
            >
              <div className="px-4 py-4">
                <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-text-primary">
                  {report.id}
                </div>
                <div className="mt-1 flex items-center gap-2 font-sans text-xs text-text-secondary">
                  <CalendarRange size={12} />
                  {new Date(report.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="px-4 py-4 font-mono text-xs uppercase tracking-[0.16em] text-accent-green">
                {report.engineId}
              </div>

              <div className="px-4 py-4 font-mono text-xs text-text-secondary">
                {report.durationMinutes} min
              </div>

              <div
                className={`px-4 py-4 font-mono text-xs font-bold ${
                  report.healthDelta > 0 ? "text-accent-green" : "text-accent-red"
                }`}
              >
                {report.healthDelta > 0 ? "+" : ""}
                {report.healthDelta.toFixed(1)}
              </div>

              <div className="px-4 py-4 text-xs text-text-secondary">
                {report.summary}
              </div>

              <div className="flex items-center justify-end px-4 py-4">
                <Link
                  to={`/engine/${report.engineId}`}
                  className="inline-flex items-center gap-2 border border-border-hairline bg-surface-raised px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
                >
                  View
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="mt-6 border border-dashed border-border-hairline bg-surface/50 p-8 text-center font-mono text-xs uppercase tracking-[0.26em] text-text-muted">
            No matching mission reports
          </div>
        )}
      </div>
    </div>
  );
}
