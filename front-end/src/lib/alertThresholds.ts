import { useSyncExternalStore } from "react";

export type AlertThresholds = {
  nominal: number;
  advisory: number;
  critical: number;
};

const STORAGE_KEY = "uav-dt-alert-thresholds";
const CHANGE_EVENT = "uav-dt-alert-thresholds-change";

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  nominal: 30,
  advisory: 45,
  critical: 72,
};

let thresholds = readThresholds();
const listeners = new Set<() => void>();

function readThresholds(): AlertThresholds {
  if (typeof window === "undefined") return DEFAULT_ALERT_THRESHOLDS;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return DEFAULT_ALERT_THRESHOLDS;

    return {
      nominal: clamp(Number(stored.nominal), 0, 100, DEFAULT_ALERT_THRESHOLDS.nominal),
      advisory: clamp(Number(stored.advisory), 1, 100, DEFAULT_ALERT_THRESHOLDS.advisory),
      critical: clamp(Number(stored.critical), 1, 100, DEFAULT_ALERT_THRESHOLDS.critical),
    };
  } catch {
    return DEFAULT_ALERT_THRESHOLDS;
  }
}

function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function normalize(next: AlertThresholds): AlertThresholds {
  let nominal = clamp(next.nominal, 0, 98, thresholds.nominal);
  let advisory = clamp(next.advisory, 1, 99, thresholds.advisory);
  let critical = clamp(next.critical, 2, 100, thresholds.critical);

  if (nominal >= advisory) advisory = Math.min(99, nominal + 1);
  if (advisory >= critical) critical = Math.min(100, advisory + 1);
  if (advisory >= critical) advisory = Math.max(1, critical - 1);
  if (nominal >= advisory) nominal = Math.max(0, advisory - 1);

  return { nominal, advisory, critical };
}

export function getAlertThresholds() {
  return thresholds;
}

export function setAlertThresholds(next: Partial<AlertThresholds>) {
  thresholds = normalize({ ...thresholds, ...next });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  listeners.forEach((listener) => listener());
}

export function subscribeAlertThresholds(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    thresholds = readThresholds();
    listener();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    window.addEventListener(CHANGE_EVENT, listener);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CHANGE_EVENT, listener);
    }
  };
}

export function useAlertThresholds() {
  return useSyncExternalStore(
    subscribeAlertThresholds,
    getAlertThresholds,
    () => DEFAULT_ALERT_THRESHOLDS,
  );
}

export function getFaultProbabilityStatus(probability: number, config = thresholds) {
  if (probability >= config.critical) return "critical" as const;
  if (probability >= config.nominal) return "advisory" as const;
  return "nominal" as const;
}
