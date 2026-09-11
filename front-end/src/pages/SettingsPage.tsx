import React from "react";
import { DEFAULT_ALERT_THRESHOLDS, setAlertThresholds, useAlertThresholds } from "../lib/alertThresholds";

export default function SettingsPage() {
  const thresholds = useAlertThresholds();

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
              {(Object.keys(thresholds) as Array<keyof typeof thresholds>).map((key) => {
                const value = thresholds[key];
                const labels = { nominal: "Nominal ceiling", advisory: "Advisory threshold", critical: "Critical threshold" };
                return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                    <span>{labels[key]}</span>
                    <span className="text-text-primary">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={key === "nominal" ? 0 : key === "advisory" ? thresholds.nominal + 1 : thresholds.advisory}
                    max={key === "nominal" ? thresholds.advisory - 1 : key === "advisory" ? thresholds.critical : 100}
                    value={value}
                    onChange={(event) =>
                      setAlertThresholds({ [key]: Number(event.target.value) })
                    }
                    className="h-1 w-full accent-accent-green"
                  />
                </div>
                );
              })}
            </div>
          </section>

          <section className="border border-border-hairline bg-surface p-5 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
                  Threshold Logic
                </div>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-text-muted">
                  Changes apply immediately across the dashboard and persist in this browser. Fault probability below the nominal threshold is nominal; values at or above the critical threshold are critical; the advisory threshold is retained as the operator-defined warning level.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertThresholds(DEFAULT_ALERT_THRESHOLDS)}
                className="border border-border-hairline px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-text-secondary hover:border-accent-green hover:text-accent-green"
              >
                Reset Defaults
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
