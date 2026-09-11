import React from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search, Grid, List } from "lucide-react";
import { cn } from "../lib/utils";
import { mockEngines } from "../lib/mockData";

export default function FleetDashboard() {
  const navigate = useNavigate();
  const totalCount = mockEngines.length;
  const nominalCount = mockEngines.filter(e => e.modelOutput.healthRiskStatus === 'nominal').length;
  const advisoryCount = mockEngines.filter(e => e.modelOutput.healthRiskStatus === 'advisory').length;
  const criticalCount = mockEngines.filter(e => e.modelOutput.healthRiskStatus === 'critical').length;
  const readiness = totalCount > 0 ? Math.round((nominalCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-background relative">
      <header className="p-6 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-mono text-text font-bold tracking-wider uppercase flex items-center gap-3">
            Fleet Overview
            <span className="bg-surface-raised px-2 py-0.5 text-xs text-muted border border-border">{totalCount} ACTIVE</span>
          </h1>
          <div className="text-xs font-mono text-muted">REAL-TIME STATUS & OPERATIONAL HEALTH // LAST SYNC: 14:02:45Z</div>
        </div>
        <div className="flex gap-2">
          {/* Search and View Mode removed per requirements */}
        </div>
      </header>

      {/* KPI Summary Cards */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4 bg-surface border-b border-border">
        <div className="border border-border bg-surface-raised p-4 shadow-sm">
          <div className="text-2xl font-mono font-bold text-text">{totalCount}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted">Total UAVs</div>
        </div>
        <div className="border border-border bg-surface-raised p-4 shadow-sm">
          <div className="text-2xl font-mono font-bold text-status-nominal">{nominalCount}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-status-nominal">Nominal</div>
        </div>
        <div className="border border-border bg-surface-raised p-4 shadow-sm">
          <div className="text-2xl font-mono font-bold text-status-warning">{advisoryCount}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-status-warning">Advisory</div>
        </div>
        <div className="border border-border bg-surface-raised p-4 shadow-sm">
          <div className="text-2xl font-mono font-bold text-status-critical">{criticalCount}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-status-critical">Critical</div>
        </div>
        <div className="border border-border bg-surface-raised p-4 shadow-sm col-span-2 md:col-span-1">
          <div className="text-2xl font-mono font-bold text-status-nominal">{readiness}%</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted">Fleet Readiness</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockEngines.map(engine => {
            const isCritical = engine.modelOutput.healthRiskStatus === 'critical';
            const isAdvisory = engine.modelOutput.healthRiskStatus === 'advisory';
            const statusColor = isCritical ? 'text-status-critical' : isAdvisory ? 'text-status-warning' : 'text-status-normal';
            const statusBg = isCritical ? 'bg-status-critical/10 border-status-critical' : isAdvisory ? 'bg-status-warning/10 border-status-warning' : 'bg-status-normal/10 border-status-normal';

            return (
              <div
                key={engine.id}
                onClick={() => navigate(`/engine/${engine.id}`)}
                className="border border-border bg-surface p-4 flex flex-col cursor-pointer transition-all hover:border-primary shadow-sm group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-mono font-bold text-text">{engine.id}</div>
                    <div className="text-[10px] font-sans uppercase text-muted">{engine.tailNumber} · {engine.base}</div>
                  </div>
                  <div className={cn("px-2 py-0.5 text-[10px] font-mono border uppercase tracking-wider", statusBg, statusColor)}>
                    {engine.modelOutput.healthRiskStatus}
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" className="stroke-surface-raised" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        className={statusColor}
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="125"
                        strokeDashoffset={125 - (125 * (100 - engine.modelOutput.faultProbability)) / 100}
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className={cn("text-xs font-mono font-bold leading-none", statusColor)}>{Math.round(100 - engine.modelOutput.faultProbability)}</span>
                      <span className="text-[8px] font-mono text-muted mt-0.5">%</span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 gap-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-muted uppercase">RPM</span>
                      <span className="text-xs font-mono text-text">{engine.telemetry.rpm.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-muted uppercase">CHT 1</span>
                      <span className="text-xs font-mono text-text">{engine.telemetry.cht1}°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-muted uppercase">EGT 1</span>
                      <span className={cn("text-xs font-mono", isCritical ? 'text-status-critical font-bold' : 'text-text')}>{engine.telemetry.egt1}°C</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}