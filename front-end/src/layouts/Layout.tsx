import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  Activity, 
  Settings, 
  Bell, 
  ShieldAlert, 
  Plane, 
  Search,
  ChevronDown,
  Menu,
  Plus
} from "lucide-react";
import { cn } from "../lib/utils";
import { mockEngines, mockAlerts, mockMaintenanceAdvisories } from "../lib/mockData";

const Navigation = () => {
  const items = [
    { label: "FLEET", path: "/fleet", icon: Plane },
    { label: "REPORTS", path: "/reports", icon: Activity },
    { label: "ALERTS", path: "/alerts", icon: Bell },
    { label: "SETTINGS", path: "/settings", icon: Settings },
  ];

  return (
    <nav className="flex flex-col gap-2 mt-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2 text-sm tracking-widest font-mono uppercase border border-transparent transition-colors",
                isActive 
                  ? "text-accent-green bg-accent-green/10 border-accent-green/20" 
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              )
            }
          >
            <Icon size={16} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
};

export const Layout = () => {
  const nominalCount = mockEngines.filter(e => e.status === 'nominal').length;
  const advisoryCount = mockEngines.filter(e => e.status === 'advisory').length;
  const criticalCount = mockEngines.filter(e => e.status === 'critical').length;
  const totalCount = mockEngines.length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b border-border-hairline bg-surface flex items-center justify-between px-6 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-red/80 z-10"></div>
        <div className="flex items-center gap-4">
          <div className="font-mono font-bold text-accent-green tracking-widest text-lg flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-green/20 border border-accent-green flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-accent-green"></div>
            </div>
            UAV_DT_SYS
          </div>
          <div className="h-4 w-px bg-border-hairline"></div>
          <div className="text-xs font-mono text-accent-red tracking-widest bg-accent-red/10 px-2 py-0.5 border border-accent-red/30">
            FLEET OPS // RESTRICTED ACCESS
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-mono">
            <span>SQDN-7</span>
            <ChevronDown size={14} />
          </div>
          <div className="w-8 h-8 rounded bg-surface-raised border border-border-hairline flex items-center justify-center text-text-primary">
            <Menu size={16} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Rail */}
        <aside className="w-64 border-r border-border-hairline bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border-hairline">
            <button className="w-full flex items-center justify-center gap-2 bg-accent-green/10 text-accent-green border border-accent-green/50 py-2 hover:bg-accent-green hover:text-background transition-all font-mono text-sm font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(57,255,136,0.1)]">
              <Plus size={16} />
              Add Engine
            </button>
          </div>
          
          <div className="p-6 border-b border-border-hairline flex flex-col gap-4">
            <div className="text-xs font-mono text-text-secondary tracking-widest uppercase mb-2">Fleet Status</div>
            
            <div className="flex gap-4 items-end">
              <div className="relative w-16 h-16 rounded-full border-4 border-surface-raised flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" className="stroke-surface-raised" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" className="stroke-accent-green" strokeWidth="4" strokeDasharray="175" strokeDashoffset={175 * (1 - nominalCount / totalCount)} />
                  <circle cx="32" cy="32" r="28" fill="none" className="stroke-accent-amber" strokeWidth="4" strokeDasharray="175" strokeDashoffset={175 * (1 - (nominalCount + advisoryCount) / totalCount)} />
                </svg>
                <div className="text-sm font-mono text-text-primary font-bold">{totalCount}</div>
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-accent-green">
                  <div className="w-2 h-2 bg-accent-green shadow-[0_0_5px_rgba(57,255,136,0.5)]"></div> {nominalCount} Nominal
                </div>
                <div className="flex items-center gap-2 text-accent-amber">
                  <div className="w-2 h-2 bg-accent-amber shadow-[0_0_5px_rgba(255,177,59,0.5)]"></div> {advisoryCount} Advisory
                </div>
                <div className="flex items-center gap-2 text-accent-red">
                  <div className="w-2 h-2 bg-accent-red shadow-[0_0_5px_rgba(255,59,59,0.5)]"></div> {criticalCount} Critical
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            <Navigation />
          </div>
          
          <div className="p-4 border-t border-border-hairline flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
             <span className="text-xs font-mono text-text-secondary">SYSTEM ONLINE</span>
          </div>
        </aside>

        {/* Center Content */}
        <main className="flex-1 flex flex-col relative min-w-0">
          <Outlet />
        </main>

        {/* Right Rail */}
        <aside className="w-80 border-l border-border-hairline bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border-hairline flex items-center justify-between">
             <div className="text-xs font-mono text-text-secondary tracking-widest uppercase">Active Alerts</div>
             <div className="bg-accent-red/20 text-accent-red px-1.5 py-0.5 text-[10px] font-mono border border-accent-red/50">{mockAlerts.length}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
             {mockAlerts.map(alert => {
               const relMin = Math.round((Date.now() - new Date(alert.timestamp).getTime()) / 60000);
               const relTime = relMin < 60 ? `${relMin}m ago` : `${Math.floor(relMin / 60)}h ${relMin % 60}m ago`;
               return (
                 <div key={alert.id} className="p-3 border border-border-hairline bg-surface-raised cursor-pointer hover:border-text-muted transition-colors group relative">
                   <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-text-muted opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-text-muted opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex items-start gap-3">
                      <ShieldAlert size={16} className={cn("mt-0.5 shrink-0", alert.severity === 'critical' ? 'text-accent-red drop-shadow-[0_0_4px_rgba(255,59,59,0.5)]' : 'text-accent-amber')} />
                      <div className="flex flex-col gap-1 flex-1">
                         <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-text-primary font-bold">{alert.engineId}</span>
                            <span className="text-text-muted">{relTime}</span>
                         </div>
                         <div className="text-sm font-sans text-text-secondary">{alert.message}</div>
                         {alert.partId && (
                           <div className="text-[10px] font-mono text-accent-amber mt-1 uppercase tracking-wider">{alert.partId}</div>
                         )}
                      </div>
                   </div>
                 </div>
               );
             })}

             <div className="mt-4 pt-4 border-t border-border-hairline">
                <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-3">Maintenance Advisory</div>
                <div className="flex flex-col gap-2">
                   {mockMaintenanceAdvisories.map(adv => (
                     <div key={adv.id} className="text-xs font-sans text-text-secondary flex flex-col gap-0.5">
                       <span className="font-mono text-text-primary">{adv.engineId} — {adv.part}</span>
                       <span className="text-text-muted">{adv.recommendation}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
