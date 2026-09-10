import React, { useState } from "react";

const initialThresholds = {
  nominal: 90,
  advisory: 72,
  critical: 45,
};

const users = [
  { name: "LT. M. Ortiz", role: "Ops Lead", status: "Online" },
  { name: "Sgt. R. Patel", role: "Maintenance", status: "Standby" },
  { name: "A1C. D. Kim", role: "Telemetry", status: "Online" },
];

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState(initialThresholds);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border-hairline bg-surface/80 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
          Mission Control
        </div>
        <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-[0.2em] text-text-primary">
          System Settings
        </h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="border border-border-hairline bg-surface p-5">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
              Unit Profile
            </div>

            <div className="space-y-4 text-sm text-text-secondary">
              <div className="flex items-center justify-between border-b border-border-hairline py-2">
                <span className="font-mono uppercase tracking-[0.2em] text-text-muted">Unit</span>
                <span className="text-text-primary">SQDN-7</span>
              </div>
              <div className="flex items-center justify-between border-b border-border-hairline py-2">
                <span className="font-mono uppercase tracking-[0.2em] text-text-muted">Base</span>
                <span className="text-text-primary">Base Alpha</span>
              </div>
              <div className="flex items-center justify-between border-b border-border-hairline py-2">
                <span className="font-mono uppercase tracking-[0.2em] text-text-muted">Mission</span>
                <span className="text-text-primary">Recon / ISR</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-mono uppercase tracking-[0.2em] text-text-muted">Access</span>
                <span className="text-accent-green">Restricted</span>
              </div>
            </div>
          </section>

          <section className="border border-border-hairline bg-surface p-5">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
              Alert Thresholds
            </div>

            <div className="space-y-5">
              {Object.entries(thresholds).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                    <span>{key}</span>
                    <span className="text-text-primary">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(event) =>
                      setThresholds((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                    className="h-1 w-full accent-accent-green"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-border-hairline bg-surface p-5 xl:col-span-2">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
              User Access
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {users.map((user) => (
                <div key={user.name} className="border border-border-hairline bg-surface-raised p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-primary">
                    {user.name}
                  </div>
                  <div className="mt-2 text-sm text-text-secondary">{user.role}</div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-accent-green">
                    <span className="h-2 w-2 rounded-full bg-accent-green" />
                    {user.status}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
