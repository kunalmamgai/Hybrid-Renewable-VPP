/**
 * Client-side forecast engine — a faithful TypeScript mirror of the backend
 * ForecastEngine + simulator curves (backend/services/forecast_engine.py,
 * backend/simulator/{solar_curve,wind_curve,demand_curve}.py).
 *
 * The backend computes forecasts internally but does not expose them via
 * REST or broadcast them on the WebSocket, so we replicate the exact math
 * here, seeded from live Digital Twin values. No mock data is invented.
 */
import type { BuildingTwin } from '../types';

// ─── Solar curve (mirrors solar_curve.py) ──────────────────────────────────

const DEG = Math.PI / 180;
const LAT = 26.9124; // Jaipur, Rajasthan — matches ForecastEngine defaults

function solarDeclination(dayOfYear: number): number {
  return 23.45 * DEG * Math.sin(((360 * (284 + dayOfYear)) / 365) * DEG);
}

function zenithCos(dt: Date): number {
  const start = new Date(dt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((dt.getTime() - start.getTime()) / 86400000);
  const decl = solarDeclination(dayOfYear);
  const hourAngle = 15 * (dt.getHours() + dt.getMinutes() / 60 - 12) * DEG;
  const latRad = LAT * DEG;
  return (
    Math.sin(latRad) * Math.sin(decl) +
    Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle)
  );
}

/** Plane-of-array irradiance W/m² (0 at night) — mirrors SolarCurve.irradiance. */
export function irradiance(dt: Date, cloudCover = 0): number {
  const cosTheta = zenithCos(dt);
  if (cosTheta <= 0) return 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  if (theta > 90 * DEG) return 0;

  const gSc = 1000;
  const airMass = 1 / Math.max(0.01, cosTheta);
  const gClear = gSc * cosTheta * Math.pow(0.85, Math.sqrt(airMass));
  const cloudFactor = 1 - cloudCover * 0.8;
  const gActual = gClear * cloudFactor;
  const variability = 0.05 * Math.sin(dt.getHours() * 0.5);
  return Math.max(0, gActual * (1 + variability));
}

// ─── Wind power curve (mirrors wind_curve.py defaults) ─────────────────────

const CUT_IN = 3.5;
const RATED_SPEED = 12.0;
const CUT_OUT = 25.0;

export function windPowerFraction(speed: number): number {
  if (speed < CUT_IN || speed >= CUT_OUT) return 0;
  if (speed >= RATED_SPEED) return 1;
  const num = speed ** 3 - CUT_IN ** 3;
  const den = RATED_SPEED ** 3 - CUT_IN ** 3;
  return den === 0 ? 0 : Math.max(0, Math.min(1, num / den));
}

// ─── Demand profiles (mirror demand_curve.py + ForecastEngine occupancy) ───

interface DemandProfile {
  peakHour: number;
  offPeak: number;
  base: number;
}
const PROFILES: Record<string, DemandProfile> = {
  academic: { peakHour: 13, offPeak: 0.15, base: 0.3 },
  hostel: { peakHour: 20, offPeak: 0.25, base: 0.35 },
  lab: { peakHour: 11, offPeak: 0.5, base: 0.6 },
  admin: { peakHour: 11, offPeak: 0.02, base: 0.05 },
  sports: { peakHour: 16, offPeak: 0.05, base: 0.1 },
};
const DEFAULT_PROFILE: DemandProfile = { peakHour: 12, offPeak: 0.15, base: 0.3 };

function buildingType(bid: string): string {
  return bid.includes('_') ? bid.split('_')[0] : 'academic';
}

function demandKw(dt: Date, profile: DemandProfile, peak: number, occupancy: number): number {
  const hour = dt.getHours() + dt.getMinutes() / 60;
  const tOffset = (((hour - profile.peakHour + 12) % 24) + 24) % 24 - 12;
  const cosFactor = (1 + Math.cos((Math.PI * tOffset) / 12)) / 2;
  let factor = profile.offPeak + (1 - profile.offPeak) * cosFactor;
  factor = Math.max(profile.base, factor);
  if (dt.getDay() === 0 || dt.getDay() === 6) factor *= 0.6;
  return peak * factor * occupancy;
}

function occupancyFor(type: string, hour: number): number {
  if (type === 'admin') return hour >= 9 && hour < 18 ? 1.0 : 0.1;
  if (type === 'lab') return hour >= 8 && hour < 20 ? 1.0 : 0.3;
  if (type === 'hostel') return (hour >= 7 && hour < 10) || (hour >= 17 && hour < 23) ? 1.0 : 0.5;
  return hour >= 18 || hour < 7 ? 0.3 : 1.0;
}

// ─── Capacity estimation (mirrors _get_solar_capacity etc.) ────────────────

function solarCapacityKw(b: BuildingTwin): number {
  const gen = b.solar_generation_kwh ?? 0;
  return gen > 0 ? (gen * 12.0) / 0.85 : 100.0;
}

function windCapacityKw(b: BuildingTwin): number {
  const gen = b.wind_generation_kwh ?? 0;
  return gen > 0 ? gen * 12.0 : 50.0;
}

function estimatePeakDemandKw(b: BuildingTwin): number {
  const currentKw = (b.consumption_kwh ?? 0) * 12.0;
  const type = buildingType(b.building_id);
  const ratios: Record<string, number> = { academic: 2.5, hostel: 2.0, lab: 1.5, admin: 3.0, sports: 2.0 };
  const ratio = ratios[type] ?? 2.0;
  const estimated = currentKw > 0 ? currentKw * ratio : solarCapacityKw(b) * 0.8;
  const maxD: Record<string, number> = { academic: 150, hostel: 80, lab: 120, admin: 50, sports: 60 };
  const minD: Record<string, number> = { academic: 60, hostel: 40, lab: 30, admin: 10, sports: 20 };
  return Math.max(minD[type] ?? 20, Math.min(maxD[type] ?? 100, estimated));
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface ForecastPoint {
  /** ISO timestamp */
  t: string;
  /** Hour offset from forecast start (fractional) */
  h: number;
  solarKw: number;
  windKw: number;
  demandKw: number;
  gridEmission: number;
  /** ±band width for renewable confidence */
  bandLow: number;
  bandHigh: number;
}

export interface CampusForecast {
  points: ForecastPoint[];
  generatedAt: string;
  solarPeak: { time: string; kw: number } | null;
  windPeak: { time: string; kw: number } | null;
  demandPeak: { time: string; kw: number } | null;
  /** Hours where generation exceeds demand — battery charge priority window */
  surplusWindows: Array<{ start: string; end: string; avgSurplusKw: number }>;
  /** Hours where demand outstrips renewables — discharge/import window */
  deficitWindows: Array<{ start: string; end: string; avgDeficitKw: number }>;
  totalSolarKwh: number;
  totalWindKwh: number;
  totalDemandKwh: number;
}

const STEP_MIN = 15;

/**
 * Generate a 24h campus-aggregated forecast from live building twins using
 * the same models as the backend. Recompute at most every few minutes.
 */
export function generateCampusForecast(
  buildings: BuildingTwin[],
  opts?: { cloudCover?: number; windSpeed?: number; demandScale?: number }
): CampusForecast {
  const start = new Date(Date.now() + 5 * 60_000);
  start.setSeconds(0, 0);
  const totalSteps = (24 * 60) / STEP_MIN;
  const cloudBase = opts?.cloudCover ?? 0.2;
  const windStart = opts?.windSpeed ?? 5.5;
  const demandScale = opts?.demandScale ?? 1.0;

  // Per-building capacity/peak estimates (mirrors ForecastEngine)
  const perBuilding = buildings.map(b => ({
    type: buildingType(b.building_id),
    solarCap: solarCapacityKw(b),
    windCap: windCapacityKw(b),
    peakDemand: estimatePeakDemandKw(b),
  }));
  const solarCapTotal = perBuilding.reduce((s, b) => s + b.solarCap, 0);
  const windCapTotal = perBuilding.reduce((s, b) => s + b.windCap, 0);
  const emissionFactor = 0.74; // GRID_EMISSION_FACTOR_KG_PER_KWH default (Rajasthan)

  const points: ForecastPoint[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const t = new Date(start.getTime() + i * STEP_MIN * 60_000);
    const hour = t.getHours() + t.getMinutes() / 60;

    // Solar — cloud cover clears toward scenario base over ~250 min (as backend)
    const cloud = cloudBase + 0.15 * Math.exp(-i / ((250 / STEP_MIN)));
    const irr = irradiance(t, cloud);
    const solarKw = solarCapTotal * (irr / 1000) * 0.85;

    // Wind — persistence with night boost + gust, mean-reverting to 5.5 m/s
    const nightBoost = hour >= 22 || hour < 6 ? 1.2 : 0.9;
    const gust = 0.3 * Math.sin(i / 7);
    let windSpeed = Math.max(0, windStart * nightBoost + gust);
    windSpeed = 0.95 * windSpeed + 0.05 * 5.5;
    const windKw = windCapTotal * windPowerFraction(windSpeed);

    // Demand — sum of per-building profiles with occupancy schedules
    let demandKwTotal = 0;
    for (const b of perBuilding) {
      const profile = PROFILES[b.type] ?? DEFAULT_PROFILE;
      demandKwTotal += demandKw(t, profile, b.peakDemand, occupancyFor(b.type, t.getHours()));
    }
    demandKwTotal *= demandScale;

    // Confidence band grows with horizon (±6% at start → ±18% at 24h)
    const horizonFactor = 1 + (i / totalSteps) * 2;
    const band = (solarKw + windKw) * 0.06 * horizonFactor;

    points.push({
      t: t.toISOString(),
      h: i * (STEP_MIN / 60),
      solarKw: round2(solarKw),
      windKw: round2(windKw),
      demandKw: round2(demandKwTotal),
      gridEmission: emissionFactor,
      bandLow: round2(solarKw + windKw - band),
      bandHigh: round2(solarKw + windKw + band),
    });
  }

  const peakOf = (sel: (p: ForecastPoint) => number) => {
    let best: ForecastPoint | null = null;
    for (const p of points) if (!best || sel(p) > sel(best)) best = p;
    return best ? { time: formatHM(new Date(best.t)), kw: sel(best) } : null;
  };

  // Surplus / deficit windows (generation vs demand)
  const surplusWindows: CampusForecast['surplusWindows'] = [];
  const deficitWindows: CampusForecast['deficitWindows'] = [];
  let cur: { surplus: boolean; start: Date; vals: number[] } | null = null;
  for (const p of points) {
    const net = p.solarKw + p.windKw - p.demandKw;
    const isSurplus = net > 0;
    if (!cur || cur.surplus !== isSurplus) {
      flushWindow();
      cur = { surplus: isSurplus, start: new Date(p.t), vals: [net] };
    } else {
      cur.vals.push(net);
    }
  }
  flushWindow();

  function flushWindow() {
    if (!cur || cur.vals.length === 0) return;
    const end = new Date(cur.start.getTime() + cur.vals.length * STEP_MIN * 60_000);
    const avg = cur.vals.reduce((a, v) => a + v, 0) / cur.vals.length;
    if (cur.surplus && avg > 5) {
      surplusWindows.push({ start: formatHM(cur.start), end: formatHM(end), avgSurplusKw: round2(avg) });
    } else if (!cur.surplus && avg < -5) {
      deficitWindows.push({ start: formatHM(cur.start), end: formatHM(end), avgDeficitKw: round2(-avg) });
    }
    cur = null;
  }

  const stepHours = STEP_MIN / 60;
  return {
    points,
    generatedAt: new Date().toISOString(),
    solarPeak: peakOf(p => p.solarKw),
    windPeak: peakOf(p => p.windKw),
    demandPeak: peakOf(p => p.demandKw),
    surplusWindows,
    deficitWindows: deficitWindows.map(d => ({ start: d.start, end: d.end, avgDeficitKw: d.avgDeficitKw })),
    totalSolarKwh: round1(points.reduce((s, p) => s + p.solarKw, 0) * stepHours),
    totalWindKwh: round1(points.reduce((s, p) => s + p.windKw, 0) * stepHours),
    totalDemandKwh: round1(points.reduce((s, p) => s + p.demandKw, 0) * stepHours),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
function formatHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
