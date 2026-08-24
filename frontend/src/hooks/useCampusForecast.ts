/**
 * Campus forecast hook — generates the client-side 24h forecast from live
 * building twins using the mirrored ForecastEngine math, refreshed at most
 * every 5 minutes (matching the scheduler cadence).
 */
import { useEffect, useRef, useState } from 'react';
import { useCampusMetrics } from '../context/MetricsContext';
import { generateCampusForecast, type CampusForecast } from '../lib/forecast';

export interface ForecastOverrides {
  cloudCover?: number;
  windSpeed?: number;
  demandScale?: number;
}

const REFRESH_MS = 5 * 60_000;

export function useCampusForecast(overrides?: ForecastOverrides) {
  const m = useCampusMetrics();
  const [forecast, setForecast] = useState<CampusForecast | null>(null);
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;

  useEffect(() => {
    if (!m.hasData || m.buildings.length === 0) return;
    const gen = () => setForecast(generateCampusForecast(m.buildings, overridesRef.current));
    gen();
    const id = window.setInterval(gen, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [m.hasData, m.buildings]);

  return forecast;
}
