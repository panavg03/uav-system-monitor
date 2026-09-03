import React from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search, Grid, List } from "lucide-react";
import { cn } from "../lib/utils";
import { mockEngines } from "../lib/mockData";

export default function FleetDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9IiMzOUZGODgiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] z-0"></div>
      
      <div className="p-6 border-b border-border-hairline bg-surface/50 backdrop-blur z-10 flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-xl font-mono text-text-primary tracking-wider uppercase font-bold flex items-center gap-3">
              Fleet Overview
              <span className="bg-surface-raised px-2 py-0.5 text-xs text-text-muted border border-border-hairline">{mockEngines.length} ACTIVE</span>
            </h1>
            <div className="text-xs font-mono text-text-secondary">LAST SYNC: 14:02:45Z</div>
         </div>
         <div className="flex gap-2">
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
               <input 
                 type="text" 
                 placeholder="Search tail or ID..." 
                 className="bg-surface-raised border border-border-hairline py-1.5 pl-8 pr-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent-green placeholder:text-text-muted w-48"
               />
            </div>
            <button className="p-1.5 border border-border-hairline bg-surface-raised text-text-secondary hover:text-text-primary">
               <Filter size={16} />
            </button>
            <div className="flex border border-border-hairline bg-surface-raised ml-2">
               <button className="p-1.5 text-accent-green bg-accent-green/10">
                 <Grid size={16} />
               </button>
               <button className="p-1.5 text-text-muted hover:text-text-primary">
                 <List size={16} />
               </button>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-6 z-10">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockEngines.map(engine => {
               const isCritical = engine.status === 'critical';
               const isAdvisory = engine.status === 'advisory';
               const colorClass = isCritical ? 'text-accent-red' : isAdvisory ? 'text-accent-amber' : 'text-accent-green';
               const bgClass = isCritical ? 'bg-accent-red/10 border-accent-red/30' : isAdvisory ? 'bg-accent-amber/10 border-accent-amber/30' : 'bg-accent-green/10 border-accent-green/30';
               const glowClass = isCritical ? 'drop-shadow-[0_0_8px_rgba(255,59,59,0.3)]' : isAdvisory ? 'drop-shadow-[0_0_8px_rgba(255,177,59,0.3)]' : 'drop-shadow-[0_0_8px_rgba(57,255,136,0.3)]';

               return (
                 <div
                   key={engine.id}
                   onClick={() => navigate(`/engine/${engine.id}`)}
                   className={cn(
                     "border border-border-hairline bg-surface flex flex-col cursor-pointer transition-all hover:border-text-muted relative group overflow-hidden"
                   )}
                 >
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-text-muted/50 group-hover:border-text-primary transition-colors"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-text-muted/50 group-hover:border-text-primary transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-text-muted/50 group-hover:border-text-primary transition-colors"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-text-muted/50 group-hover:border-text-primary transition-colors"></div>

                    <div className="p-4 flex justify-between items-start border-b border-border-hairline/50">
                       <div className="flex flex-col gap-1">
                          <div className="text-sm font-mono text-text-primary font-bold">{engine.id}</div>
                          <div className="text-[10px] font-sans uppercase text-text-secondary">{engine.tailNumber} · {engine.base}</div>
                       </div>
                       <div className={cn("px-2 py-0.5 text-[10px] font-mono border uppercase tracking-wider", bgClass, colorClass)}>
                          {engine.status}
                       </div>
                    </div>

                    <div className="p-4 flex gap-4 items-center">
                       <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                             <circle cx="28" cy="28" r="24" fill="none" className="stroke-surface-raised" strokeWidth="4" />
                             <circle
                               cx="28" cy="28" r="24" fill="none"
                               className={cn("transition-all duration-1000", glowClass)}
                               stroke={isCritical ? 'var(--color-accent-red)' : isAdvisory ? 'var(--color-accent-amber)' : 'var(--color-accent-green)'}
                               strokeWidth="4"
                               strokeDasharray="150"
                               strokeDashoffset={150 - (150 * engine.healthScore) / 100}
                             />
                          </svg>
                          <div className="flex flex-col items-center">
                             <span className={cn("text-sm font-mono font-bold leading-none", colorClass)}>{engine.healthScore}</span>
                             <span className="text-[8px] font-mono text-text-muted mt-0.5">%</span>
                          </div>
                       </div>
                       <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-2">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-mono text-text-muted">RPM</span>
                             <span className="text-xs font-mono text-text-primary">{engine.rpm.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] font-mono text-text-muted">CHT</span>
                             <span className="text-xs font-mono text-text-primary">{engine.cht}°C</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] font-mono text-text-muted">EGT</span>
                             <span className={cn("text-xs font-mono", isCritical ? 'text-accent-red font-bold' : 'text-text-primary')}>{engine.egt}°C</span>
                          </div>
                       </div>
                    </div>
                 </div>
               )
            })}
         </div>
      </div>
    </div>
  );
}
