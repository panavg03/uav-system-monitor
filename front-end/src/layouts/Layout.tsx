import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, FileText, Gauge, Plus, Settings } from "lucide-react";
import { cn } from "../lib/utils";
import { mockAlerts, mockEngines } from "../lib/mockData";
import { getFaultProbabilityStatus, useAlertThresholds } from "../lib/alertThresholds";

const navItems = [
  { label: "Fleet", path: "/fleet", icon: Gauge },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Settings", path: "/settings", icon: Settings },
];

const relativeTime = (timestamp: string) => {
  const diff = Math.round((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diff <= 0) return "LIVE";
  if (diff < 60) return `-${diff}m`;
  return `-${Math.floor(diff / 60)}h`;
};

export function Layout() {
  const navigate = useNavigate();
  const thresholds = useAlertThresholds();
  const activeAlerts = mockAlerts
    .map((alert) => {
      const engine = mockEngines.find((item) => item.id === alert.engineId);
      const severity = engine
        ? getFaultProbabilityStatus(engine.modelOutput.faultProbability, thresholds)
        : alert.severity;
      return { ...alert, severity };
    })
    .filter((alert) => alert.severity !== "nominal");

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background text-text-primary">
      <header className="flex h-16 shrink-0 items-center border-b border-border-hairline bg-surface px-5 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="font-mono text-base font-bold tracking-[0.18em] text-text-primary">UAV_DT_SYS</div>
          <div className="hidden h-5 w-px bg-border-hairline sm:block" />
          <div className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-text-muted sm:block">Defence Technology Division</div>
        </div>
        <div className="ml-6 border border-accent-red/30 bg-accent-red/5 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-accent-red">
          Classified // Authorized Personnel Only
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-[#26332c] bg-[#142019] md:flex">
          <div className="p-5">
            <div className="font-mono text-sm font-bold tracking-[0.18em] text-[#f0f4f1]">UAV_DT_SYS</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[#728078]">Defence Technology Division</div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/fleet")}
            className="mx-4 flex items-center justify-center gap-2 border border-[#456050] bg-[#314b3b] px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#d8e6dc] hover:bg-[#3b5946]"
          >
            <Plus size={14} /> Add Engine
          </button>

          <nav className="mt-6 flex-1 space-y-1 px-3">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={label}
                to={path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                  isActive
                    ? "border-[#59d38b] bg-[#243d30] text-[#7ee6a5]"
                    : "border-transparent text-[#839188] hover:bg-[#1d2c24] hover:text-[#edf3ee]",
                )}
              >
                <Icon size={15} />
                <span>{label}</span>
                {label === "Alerts" && <span className="ml-auto bg-accent-red px-1.5 py-0.5 text-[8px] font-bold text-white">{activeAlerts.length}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-[#26332c] p-5">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#72df9a]">
              <span className="h-2 w-2 rounded-full bg-[#59d38b]" /> System Online
            </div>
            <div className="mt-3 font-mono text-[8px] uppercase tracking-[0.15em] text-[#65736b]">VERSION 4.2.0-STABLE</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-[#65736b]">SECURE LINK: ACTIVE</div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </main>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border-hairline bg-surface/70 xl:block">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-hairline bg-surface px-4 py-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary">Active Alerts</div>
            <span className="bg-accent-red px-2 py-1 font-mono text-[10px] font-bold text-white">{activeAlerts.length}</span>
          </div>

          <div className="space-y-3 p-4">
            {activeAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => navigate(`/engine/${alert.engineId}`)}
                className="w-full border border-border-hairline bg-surface p-3 text-left transition-colors hover:border-accent-green/60 hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary">{alert.engineId}</span>
                  <span className="font-mono text-[8px] text-text-muted">{relativeTime(alert.timestamp)} ago</span>
                </div>
                <div className={cn("mt-2 font-mono text-[8px] uppercase tracking-[0.16em]", alert.severity === "critical" ? "text-accent-red" : "text-accent-amber")}>
                  {alert.severity}
                </div>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{alert.message}</p>
              </button>
            ))}


          </div>
        </aside>
      </div>
    </div>
  );
}
