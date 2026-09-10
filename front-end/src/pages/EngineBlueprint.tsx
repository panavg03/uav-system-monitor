import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Maximize2, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "../lib/utils";
import { mockEngines, enginePartsByEngineId, telemetryByEngineId } from "../lib/mockData";

export default function EngineBlueprint() {
  const { engineId } = useParams();
  const navigate = useNavigate();
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const engine = mockEngines.find(e => e.id === engineId);
  const parts = enginePartsByEngineId[engineId ?? ""] ?? [];
  const telemetry = telemetryByEngineId[engineId ?? ""] ?? {};

  const isCritical = engine?.status === 'critical';
  const isAdvisory = engine?.status === 'advisory';
  const statusColor = isCritical ? 'text-accent-red' : isAdvisory ? 'text-accent-amber' : 'text-accent-green';
  const statusBg = isCritical ? 'border-accent-red/30 bg-accent-red/10' : isAdvisory ? 'border-accent-amber/30 bg-accent-amber/10' : 'border-accent-green/30 bg-accent-green/10';

  const chartMetrics: { key: string; label: string; unit: string; refLine?: number }[] = [
    { key: 'egt', label: 'EGT', unit: '°C', refLine: 690 },
    { key: 'rpm', label: 'RPM', unit: '' },
    { key: 'oilPressure', label: 'Oil Press', unit: 'PSI' },
  ];

  return (
    <div className="flex flex-col h-full bg-background relative">
       <div className="p-4 border-b border-border-hairline bg-surface/80 flex items-center gap-4 shrink-0 z-10">
          <button
            onClick={() => navigate('/fleet')}
            className="p-2 border border-border-hairline bg-surface-raised hover:bg-border-hairline text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col">
             <div className="flex items-center gap-3">
               <h1 className="text-xl font-mono text-text-primary font-bold tracking-widest">{engineId}</h1>
               {engine && (
                 <div className={cn("px-2 py-0.5 text-[10px] font-mono border uppercase tracking-wider", statusBg, statusColor)}>
                   {engine.status}
                 </div>
               )}
             </div>
             <div className="text-xs font-sans text-text-secondary">
               {engine ? `${engine.engineType} · ${engine.tailNumber} · ${engine.base}` : 'Engine not found'}
             </div>
          </div>
          
          <div className="ml-auto flex gap-1 bg-surface-raised p-1 border border-border-hairline">
             {['overview', 'telemetry', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1 text-xs font-mono uppercase tracking-wider transition-colors",
                    activeTab === tab ? "bg-surface border border-border-hairline text-text-primary" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                   {tab}
                </button>
             ))}
          </div>
       </div>

       <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Main View Area */}
          <div className="flex-1 flex flex-col min-w-0 p-6 relative">
             <div className="absolute top-6 left-6 text-xs font-mono text-text-muted uppercase tracking-widest z-20 flex items-center gap-2">
                <Maximize2 size={12} /> Blueprint Overlay
             </div>
             
             {/* Blueprint Canvas */}
             <div className="flex-1 border border-border-hairline bg-surface-raised/30 relative flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdjQwIiBzdHJva2U9IiMyNDI4MzIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-50"></div>
                
                {/* Mock Engine Illustration (Wireframe representation) */}
                <svg viewBox="0 0 400 300" className="w-[80%] h-[80%] max-w-2xl opacity-40">
                   <path d="M100 100 h200 v100 h-200 z" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" />
                   <path d="M150 100 v-40 h100 v40" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" />
                   <circle cx="200" cy="150" r="30" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" />
                   <line x1="50" y1="150" x2="100" y2="150" stroke="var(--color-text-muted)" strokeWidth="2" />
                   <line x1="300" y1="150" x2="350" y2="150" stroke="var(--color-text-muted)" strokeWidth="2" />
                </svg>

                {/* Pins */}
                {parts.map(part => {
                   const isHovered = hoveredPart === part.id;
                   const partCritical = part.status === 'critical';
                   const partAdvisory = part.status === 'advisory';

                   return (
                     <div
                        key={part.id}
                        className="absolute flex flex-col items-center group/pin"
                        style={{ left: `${part.x}%`, top: `${part.y}%` }}
                        onMouseEnter={() => setHoveredPart(part.id)}
                        onMouseLeave={() => setHoveredPart(null)}
                        onClick={() => navigate(`/engine/${engineId}/part/${part.id}`)}
                     >
                        <div className={cn(
                           "w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold border bg-surface cursor-pointer transition-all z-10",
                           partCritical ? "border-accent-red text-accent-red shadow-[0_0_10px_rgba(255,59,59,0.5)]" :
                           partAdvisory ? "border-accent-amber text-accent-amber" :
                           "border-accent-green text-accent-green",
                           isHovered && "scale-125 bg-surface-raised"
                        )}>
                           {part.index}
                        </div>
                        {/* Tooltip */}
                        <div className={cn(
                           "absolute top-8 w-max px-2 py-1 bg-surface border border-border-hairline text-xs font-mono transition-opacity pointer-events-none z-20",
                           isHovered ? "opacity-100" : "opacity-0"
                        )}>
                           <span className="text-text-primary">{part.name}</span>
                           <span className={cn("ml-2 font-bold", partCritical ? "text-accent-red" : partAdvisory ? "text-accent-amber" : "text-accent-green")}>
                              {part.healthScore}%
                           </span>
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Telemetry charts row */}
             <div className="h-48 mt-4 grid grid-cols-3 gap-4 shrink-0">
                {chartMetrics.map((metric) => {
                  const series = (telemetry[metric.key] ?? []).map(p => ({ t: p.t, value: p.value }));
                  const latest = series.at(-1)?.value;
                  const isEgt = metric.key === 'egt';
                  const lineColor = isEgt ? "var(--color-accent-red)" : "var(--color-accent-green)";
                  return (
                    <div key={metric.key} className="border border-border-hairline bg-surface flex flex-col relative">
                       <div className="p-2 border-b border-border-hairline/50 flex justify-between items-center text-[10px] font-mono text-text-secondary tracking-widest">
                          {metric.label}{metric.unit ? ` (${metric.unit})` : ''}
                          <Activity size={10} className="text-text-muted" />
                       </div>
                       <div className="flex-1 p-2">
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={series}>
                                <CartesianGrid strokeDasharray="2 2" stroke="var(--color-border-hairline)" vertical={false} />
                                <XAxis dataKey="t" hide />
                                <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
                                {metric.refLine && <ReferenceLine y={metric.refLine} stroke="var(--color-accent-red)" strokeDasharray="3 3" opacity={0.5} />}
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={lineColor}
                                  strokeWidth={2}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                       {latest != null && (
                         <div className={cn("absolute bottom-2 left-2 text-xl font-mono font-bold", isEgt ? "text-accent-red" : "text-accent-green")}>
                           {metric.key === 'rpm' ? latest.toLocaleString() : latest}
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Parts Legend Rail */}
          <div className="w-72 border-l border-border-hairline bg-surface/50 flex flex-col shrink-0">
             <div className="p-4 border-b border-border-hairline text-xs font-mono text-text-secondary tracking-widest uppercase">
                Component Index
             </div>
             <div className="flex-1 overflow-y-auto">
                {parts.map(part => {
                   const partCritical = part.status === 'critical';
                   const partAdvisory = part.status === 'advisory';

                   return (
                     <div
                        key={part.id}
                        onMouseEnter={() => setHoveredPart(part.id)}
                        onMouseLeave={() => setHoveredPart(null)}
                        onClick={() => navigate(`/engine/${engineId}/part/${part.id}`)}
                        className={cn(
                           "flex items-center gap-3 p-3 border-b border-border-hairline/30 cursor-pointer transition-colors",
                           hoveredPart === part.id ? "bg-surface-raised border-l-2 border-l-text-primary pl-2" : "hover:bg-surface border-l-2 border-l-transparent"
                        )}
                     >
                        <div className={cn(
                           "w-5 h-5 flex items-center justify-center font-mono text-[9px] font-bold border shrink-0",
                           partCritical ? "border-accent-red text-accent-red bg-accent-red/10" :
                           partAdvisory ? "border-accent-amber text-accent-amber bg-accent-amber/10" :
                           "border-accent-green text-accent-green bg-accent-green/10"
                        )}>
                           {part.index}
                        </div>
                        <div className="flex flex-col flex-1">
                           <span className="text-xs font-sans text-text-primary">{part.name}</span>
                           <span className="text-[10px] font-mono text-text-muted uppercase">{part.status}</span>
                        </div>
                        <div className={cn("text-xs font-mono font-bold", partCritical ? "text-accent-red" : partAdvisory ? "text-accent-amber" : "text-accent-green")}>
                           {part.healthScore}%
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
       </div>
    </div>
  );
}
