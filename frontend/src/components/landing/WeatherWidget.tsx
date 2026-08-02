/**
 * WeatherWidget — small live weather card for the hero section.
 * Fetches weather from Open-Meteo (free, no API key needed) for Jaipur, Rajasthan.
 * Falls back to mock data if fetch fails.
 */
import { useState, useEffect } from 'react';
import { Cloud, Sun, Wind, Droplets, Thermometer } from 'lucide-react';

interface WeatherData {
  temperature: number;
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  isDay: boolean;
}

const WEATHER_CODES: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: 'Clear', icon: <Sun size={14} className="text-amber-400" /> },
  1: { label: 'Mainly Clear', icon: <Sun size={14} className="text-amber-300" /> },
  2: { label: 'Partly Cloudy', icon: <Cloud size={14} className="text-blue-300" /> },
  3: { label: 'Overcast', icon: <Cloud size={14} className="text-gray-300" /> },
  45: { label: 'Foggy', icon: <Cloud size={14} className="text-gray-400" /> },
  51: { label: 'Light Drizzle', icon: <Droplets size={14} className="text-blue-400" /> },
  61: { label: 'Light Rain', icon: <Droplets size={14} className="text-blue-400" /> },
  71: { label: 'Light Snow', icon: <Cloud size={14} className="text-white/60" /> },
  95: { label: 'Thunderstorm', icon: <Cloud size={14} className="text-yellow-300" /> },
};

// Mock fallback data (Jaipur average conditions)
const MOCK_DATA: WeatherData = {
  temperature: 32,
  cloudCover: 25,
  windSpeed: 4.2,
  humidity: 45,
  weatherCode: 1,
  isDay: true,
};

function formatWindSpeed(ms: number): string {
  return `${(ms * 3.6).toFixed(0)} km/h`;
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData>(MOCK_DATA);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchWeather() {
    try {
      // Open-Meteo free API — Jaipur coordinates (26.92°N, 75.78°E)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=26.92&longitude=75.78&current=temperature_2m,cloud_cover,wind_speed_10m,relative_humidity_2m,is_day&timezone=Asia/Kolkata`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Weather API error');
      const json = await resp.json();
      const current = json.current;
      if (current) {
        setData({
          temperature: Math.round(current.temperature_2m),
          cloudCover: Math.round(current.cloud_cover),
          windSpeed: current.wind_speed_10m,
          humidity: Math.round(current.relative_humidity_2m),
          weatherCode: current.weather_code ?? 0,
          isDay: current.is_day === 1,
        });
        setLastUpdated(new Date());
      }
    } catch {
      // Silently fall back to mock data
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }

  const weather = WEATHER_CODES[data.weatherCode] || {
    label: data.isDay ? 'Sunny' : 'Clear Night',
    icon: <Sun size={14} className="text-amber-400" />,
  };

  return (
    <div
      className="relative z-30 w-56 md:w-64 rounded-2xl border overflow-hidden transition-all duration-500"
      style={{
        background: 'rgba(15, 26, 21, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-[0.15em]">
            Jaipur Live
          </span>
        </div>
        <span className="text-[9px] text-white/30 tracking-wide">
          {loading ? 'Loading...' : lastUpdated ? 'Just now' : 'Mock'}
        </span>
      </div>

      {/* Main weather */}
      <div className="px-4 pb-3 flex items-center gap-3">
        {/* Weather icon + temp */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {weather.icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-none">{data.temperature}°</div>
            <div className="text-[10px] text-white/50 mt-0.5">{weather.label}</div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 border-t border-white/[0.06]"
           style={{ background: 'rgba(255,255,255,0.03)' }}>
        {/* Cloud cover */}
        <div className="px-3 py-2.5 text-center border-r border-white/[0.06]">
          <Cloud size={12} className="mx-auto text-blue-300/60 mb-1" />
          <div className="text-sm font-bold text-white/90">{data.cloudCover}%</div>
          <div className="text-[8px] text-white/35 uppercase tracking-wider">Clouds</div>
        </div>
        {/* Wind */}
        <div className="px-3 py-2.5 text-center border-r border-white/[0.06]">
          <Wind size={12} className="mx-auto text-teal-300/60 mb-1" />
          <div className="text-sm font-bold text-white/90">{formatWindSpeed(data.windSpeed)}</div>
          <div className="text-[8px] text-white/35 uppercase tracking-wider">Wind</div>
        </div>
        {/* Humidity */}
        <div className="px-3 py-2.5 text-center">
          <Droplets size={12} className="mx-auto text-cyan-300/60 mb-1" />
          <div className="text-sm font-bold text-white/90">{data.humidity}%</div>
          <div className="text-[8px] text-white/35 uppercase tracking-wider">Humidity</div>
        </div>
      </div>

      {/* AI insight bar */}
      <div className="px-4 py-2 flex items-center gap-2"
           style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
        <Thermometer size={10} className="text-emerald-400/60 shrink-0" />
        <span className="text-[9px] text-emerald-400/70 leading-snug">
          {data.cloudCover > 50
            ? 'AI: Solar deficit expected — pre-charging battery'
            : data.windSpeed > 15
            ? 'AI: Strong wind — wind turbine at peak output'
            : 'AI: Optimal conditions — all systems nominal'}
        </span>
      </div>
    </div>
  );
}
