/**
 * Alerts engine — derives operational alerts from live system state and the
 * configurable thresholds managed via /api/v1/settings/alert-thresholds.
 * Categorised as Critical / Warning / Information / Optimization.
 *
 * Alert state (acknowledge/resolve/snooze) is persisted to localStorage so the
 * operator's triage survives reloads. No synthetic/mock data is introduced.
 */
import {
  createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type { AlertThreshold } from '../types';
import { getAlertThresholds } from '../services/apiClient';
import { useCampusMetrics } from './MetricsContext';
import { useVppData } from './VppDataContext';

export type AlertCategory = 'critical' | 'warning' | 'info' | 'optimization';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';

export interface OpsAlert {
  /** Stable id derived from the condition signature */
  id: string;
  category: AlertCategory;
  title: string;
  detail: string;
  metricLabel?: string;
  value?: number;
  threshold?: number;
  unit?: string;
  createdAt: number;
}

export interface OpsAlertWithState extends OpsAlert {
  status: AlertStatus;
  snoozedUntil?: number;
}

const STORAGE_KEY = 'surya.alert-state.v1';

interface StoredState {
  [alertId: string]: { status: AlertStatus; snoozedUntil?: number };
}

function loadStored(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : {};
  } catch {
    return {};
  }
}

function saveStored(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

const CATEGORY_RANK: Record<AlertCategory, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  optimization: 3,
};

const AlertsContext = createContext<{
  alerts: OpsAlertWithState[];
  activeCount: number;
  counts: Record<AlertCategory, number>;
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
  snooze: (id: string, minutes: number) => void;
  reopen: (id: string) => void;
} | undefined>(undefined);

function thresholdMatch(t: AlertThreshold, namePart: string): boolean {
  return t.name.toLowerCase().includes(namePart);
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const m = useCampusMetrics();
  const { connected } = useVppData();
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [stored, setStored] = useState<StoredState>(() => loadStored());
  const nowRef = useRef(Date.now());

  // Fetch operator-configured thresholds once
  useEffect(() => {
    let cancelled = false;
    getAlertThresholds()
      .then(list => {
        if (cancelled) return;
        setThresholds(Array.isArray(list) ? list.filter(t => t.active) : []);
      })
      .catch(() => setThresholds([]));
    return () => { cancelled = true; };
  }, []);

  const derived = useMemo<OpsAlert[]>(() => {
    nowRef.current = Date.now();
    const out: OpsAlert[] = [];

    const batteryLow = thresholds.find(t => thresholdMatch(t, 'battery_low') && !thresholdMatch(t, 'critical'));
    const batteryCritical = thresholds.find(t => thresholdMatch(t, 'battery_critical'));
    const gridHigh = thresholds.find(t => thresholdMatch(t, 'grid_import'));

    if (m.hasData) {
      const soc = m.avgSocPct;

      if (!batteryCritical || soc < (batteryCritical?.threshold_value ?? 15)) {
        if (soc < (batteryCritical?.threshold_value ?? 15)) {
          out.push({
            id: 'battery-critical',
            category: 'critical',
            title: 'Battery reserve below critical-load protection threshold',
            detail: `Campus battery bank at ${soc.toFixed(1)}% SOC — below the ${(batteryCritical?.threshold_value ?? 15)}% reserve floor protecting critical loads.`,
            metricLabel: 'Battery SOC', value: soc, threshold: batteryCritical?.threshold_value ?? 15, unit: '%',
            createdAt: nowRef.current,
          });
        }
      }

      if (soc < (batteryLow?.threshold_value ?? 20)) {
        out.push({
          id: 'battery-low',
          category: 'warning',
          title: 'Battery SOC below low threshold',
          detail: `Battery bank at ${soc.toFixed(1)}% — approaching the ${(batteryLow?.threshold_value ?? 20)}% low mark. Grid support may be required this evening.`,
          metricLabel: 'Battery SOC', value: soc, threshold: batteryLow?.threshold_value ?? 20, unit: '%',
          createdAt: nowRef.current,
        });
      }

      if (m.gridImportKw > (gridHigh ? gridHigh.threshold_value : 40)) {
        out.push({
          id: 'grid-import-high',
          category: 'warning',
          title: 'Grid dependency above configured limit',
          detail: `Importing ${m.gridImportKw.toFixed(1)} kW from the grid (limit ${gridHigh ? `${gridHigh.threshold_value}${gridHigh.unit}` : '40 kW'}). Consider load-shifting flexible demand.`,
          metricLabel: 'Grid import', value: m.gridImportKw, threshold: gridHigh?.threshold_value ?? 40, unit: 'kW',
          createdAt: nowRef.current,
        });
      }

      if (m.renewablePct >= 110) {
        out.push({
          id: 'renewable-surplus',
          category: 'optimization',
          title: 'High renewable generation detected',
          detail: `Renewables are covering ${m.renewablePct.toFixed(0)}% of campus demand (${m.renewableKw.toFixed(1)} kW). Recommended: charge batteries or export surplus.`,
          metricLabel: 'Renewable share', value: m.renewablePct, unit: '%',
          createdAt: nowRef.current,
        });
      }

      if (m.gridExportKw > 10) {
        out.push({
          id: 'grid-export-active',
          category: 'info',
          title: 'Exporting surplus energy to grid',
          detail: `Net metering active — exporting ${m.gridExportKw.toFixed(1)} kW under VNM sharing rules.`,
          metricLabel: 'Grid export', value: m.gridExportKw, unit: 'kW',
          createdAt: nowRef.current,
        });
      }
    }

    if (!connected) {
      out.push({
        id: 'ws-disconnected',
        category: 'critical',
        title: 'Telemetry link offline',
        detail: 'The WebSocket telemetry channel is disconnected. Values shown may be stale — check the backend scheduler.',
        createdAt: nowRef.current,
      });
    }

    return out.sort((a, b) => CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]);
  }, [m.hasData, m.avgSocPct, m.renewablePct, m.renewableKw, m.gridImportKw, m.gridExportKw, connected, thresholds]);

  const merged = useMemo<OpsAlertWithState[]>(
    () =>
      derived.map(a => {
        const st = stored[a.id];
        if (!st) return { ...a, status: 'active' as AlertStatus };
        if (st.status === 'snoozed' && st.snoozedUntil && st.snoozedUntil > Date.now()) {
          return { ...a, status: 'snoozed' as AlertStatus, snoozedUntil: st.snoozedUntil };
        }
        return { ...a, status: st.status === 'snoozed' ? ('active' as AlertStatus) : st.status };
      }),
    [derived, stored]
  );

  const update = (id: string, patch: { status: AlertStatus; snoozedUntil?: number }) => {
    setStored(prev => {
      const next = { ...prev, [id]: patch };
      saveStored(next);
      return next;
    });
  };

  const value = useMemo(() => {
    const visible = merged.filter(a => a.status !== 'resolved');
    const counts: Record<AlertCategory, number> = { critical: 0, warning: 0, info: 0, optimization: 0 };
    for (const a of visible) if (a.status === 'active') counts[a.category] += 1;
    return {
      alerts: visible,
      activeCount: counts.critical + counts.warning + counts.info + counts.optimization,
      counts,
      acknowledge: (id: string) => update(id, { status: 'acknowledged' }),
      resolve: (id: string) => update(id, { status: 'resolved' }),
      snooze: (id: string, minutes: number) =>
        update(id, { status: 'snoozed', snoozedUntil: Date.now() + minutes * 60_000 }),
      reopen: (id: string) => update(id, { status: 'active' }),
    };
  }, [merged]);

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
  return ctx;
}
