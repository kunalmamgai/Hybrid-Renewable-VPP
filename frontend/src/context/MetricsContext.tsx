/**
 * Derived campus metrics — aggregates the four building twins into campus-wide
 * operational figures (kW conversions mirror the backend's kWh→kW factor of 12),
 * and maintains a rolling history ring-buffer for sparklines.
 *
 * All values are derived exclusively from the live WebSocket stream — no mock data.
 */
import {
  createContext, useContext, useMemo, useRef, type ReactNode,
} from 'react';
import { useVppData } from './VppDataContext';
import type { BuildingTwin } from '../types';

/** Backend stores per-5-min energy in kWh; ×12 converts to average kW. */
const KWH_TO_KW = 12;

export const CAMPUS_BATTERY_CAPACITY_KWH = 700; // site_config: 300+150+100+150

export interface MetricSample {
  t: number;
  solarKw: number;
  windKw: number;
  demandKw: number;
  gridImportKw: number;
  gridExportKw: number;
  socPct: number;
}

export interface CampusMetrics {
  solarKw: number;
  windKw: number;
  demandKw: number;
  gridImportKw: number;
  gridExportKw: number;
  /** Weighted-average battery state of charge (%) */
  avgSocPct: number;
  /** Estimated battery power: >0 discharging, <0 charging (kW) */
  batteryKw: number | null;
  renewableKw: number;
  /** Renewable supply as % of demand (can exceed 100 pre-export) */
  renewablePct: number;
  /** Grid dependency as % of demand */
  gridDependencyPct: number;
  hasData: boolean;
  history: MetricSample[];
  buildings: BuildingTwin[];
}

const HISTORY_LIMIT = 48;

function computeSample(buildings: BuildingTwin[]): Omit<MetricSample, 't'> {
  let solar = 0, wind = 0, demand = 0, imp = 0, exp = 0, socSum = 0;
  for (const b of buildings) {
    solar += b.solar_generation_kwh ?? 0;
    wind += b.wind_generation_kwh ?? 0;
    demand += b.consumption_kwh ?? 0;
    imp += b.grid_import_kwh ?? 0;
    exp += b.grid_export_kwh ?? 0;
    socSum += b.battery_soc_pct ?? 0;
  }
  return {
    solarKw: solar * KWH_TO_KW,
    windKw: wind * KWH_TO_KW,
    demandKw: demand * KWH_TO_KW,
    gridImportKw: imp * KWH_TO_KW,
    gridExportKw: exp * KWH_TO_KW,
    socPct: buildings.length ? socSum / buildings.length : 0,
  };
}

const MetricsContext = createContext<CampusMetrics | undefined>(undefined);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const { buildings } = useVppData();
  const historyRef = useRef<MetricSample[]>([]);

  return (
    <MetricsContext.Provider value={useMemo(() => {
      if (!buildings || buildings.length === 0) {
        return {
          solarKw: 0, windKw: 0, demandKw: 0, gridImportKw: 0, gridExportKw: 0,
          avgSocPct: 0, batteryKw: null, renewableKw: 0, renewablePct: 0,
          gridDependencyPct: 0, hasData: false, history: [], buildings: [],
        };
      }

      const s = computeSample(buildings);
      const now = Date.now();

      // Record sample only when values actually changed (cycle cadence ~5 min)
      const hist = historyRef.current;
      const last = hist[hist.length - 1];
      if (!last ||
        last.solarKw !== s.solarKw || last.demandKw !== s.demandKw ||
        last.gridImportKw !== s.gridImportKw || last.windKw !== s.windKw) {
        hist.push({ ...s, t: now });
        if (hist.length > HISTORY_LIMIT) hist.splice(0, hist.length - HISTORY_LIMIT);
      }

      // Battery power from SoC slope between distinct readings
      let batteryKw: number | null = null;
      if (last && last.socPct !== s.socPct) {
        const dtHours = Math.max(1 / 60, (now - last.t) / 3_600_000);
        const dSoc = s.socPct - last.socPct; // percentage points
        batteryKw = ((dSoc / 100) * CAMPUS_BATTERY_CAPACITY_KWH) / dtHours;
      }

      const renewableKw = s.solarKw + s.windKw;
      const renewablePct = s.demandKw > 0 ? Math.min(999, (renewableKw / s.demandKw) * 100) : 0;
      const gridDependencyPct = s.demandKw > 0 ? Math.min(100, (s.gridImportKw / s.demandKw) * 100) : 0;

      return {
        ...s,
        avgSocPct: s.socPct,
        batteryKw,
        renewableKw,
        renewablePct,
        gridDependencyPct,
        hasData: true,
        history: [...hist],
        buildings,
      };
    }, [buildings])}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useCampusMetrics(): CampusMetrics {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error('useCampusMetrics must be used within MetricsProvider');
  return ctx;
}
