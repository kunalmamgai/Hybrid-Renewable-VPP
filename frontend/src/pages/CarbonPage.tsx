import { useMemo } from 'react';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Leaf, Globe, Recycle } from 'lucide-react';
import { MetricTile } from '../components/viz/MetricTile';
import { useCampusMetrics } from '../context/MetricsContext';
import { useCampusForecast } from '../hooks/useCampusForecast';
import { useApiStats } from '../hooks/useApiStats';
import { formatTime, formatCO2, formatKwh } from '../lib/format';

export const GRID_EMISSION_FACTOR_KG_PER_KWH = 0.74;

interface EmissionsRow {
  label: string;
  avoidedKg: number;
  emittedKg: number;
  cumAvoidedKg: number;
}

function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string; payload?: unknown }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as EmissionsRow | undefined;
  return (
    <div
      style={{
        background: '#191511',
        border: '1px solid rgba(224,197,160,0.2)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 11,
      }}
    >
      {row && <div className="num text-white/60 mb-1">{row.label}</div>}
      <div className="space-y-0.5">
        {payload.map(p => (
          <div key={String(p.dataKey)} className="flex items-center gap-3">
            <span className="text-white/50">
              {p.dataKey === 'avoidedKg' ? 'Avoided' : p.dataKey === 'emittedKg' ? 'Emitted' : 'Cumulative avoided'}
            </span>
            <span className="num text-white/85 ml-auto">{Number(p.value).toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <section aria-label="Loading KPIs" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="ops-panel h-[92px] rounded-xl animate-pulse bg-white/[0.03]" />
        ))}
      </section>
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <span className="tech-label tech-label-cyan">EMISSIONS PROFILE · NEXT 24 H</span>
        </div>
        <div className="p-4">
          <div className="h-64 sm:h-72 rounded-lg bg-white/[0.03] animate-pulse" />
        </div>
      </section>
    </div>
  );
}

export default function CarbonPage() {
  const m = useCampusMetrics();
  const forecast = useCampusForecast();
  const stats = useApiStats();

  const series = useMemo<EmissionsRow[]>(() => {
    if (!forecast) return [];
    let cum = 0;
    return forecast.points.map(p => {
      const avoidedKg = (p.solarKw + p.windKw) * GRID_EMISSION_FACTOR_KG_PER_KWH * 0.25;
      const emittedKg = Math.max(0, p.demandKw - p.solarKw - p.windKw) * GRID_EMISSION_FACTOR_KG_PER_KWH * 0.25;
      cum += avoidedKg;
      return { label: formatTime(p.t), avoidedKg, emittedKg, cumAvoidedKg: cum };
    });
  }, [forecast]);

  if (!m.hasData) {
    return (
      <div className="space-y-5">
        <div>
          <div className="tech-label mb-1.5">SUSTAINABILITY ANALYTICS</div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Carbon Intelligence</h2>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            Avoided and incurred emissions across the campus microgrid.
          </p>
        </div>
        <Skeleton />
      </div>
    );
  }

  const lifetimeKg = stats.decisionStats?.total_carbon_reduction_kg ?? null;
  const periodKg = stats.exportStats?.total_carbon_reduction_kg ?? null;
  const displacedKwh = lifetimeKg !== null ? lifetimeKg / GRID_EMISSION_FACTOR_KG_PER_KWH : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="tech-label mb-1.5">SUSTAINABILITY ANALYTICS</div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Carbon Intelligence</h2>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
          Avoided and incurred emissions across the campus microgrid.
        </p>
      </div>

      <section aria-label="Carbon key metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricTile
          label="CARBON AVOIDED LIFETIME"
          value={stats.decisionStats?.total_carbon_reduction_kg ?? 0}
          format={v => (v >= 1000 ? (v / 1000).toFixed(2) : v.toFixed(1))}
          unit={stats.decisionStats && stats.decisionStats.total_carbon_reduction_kg >= 1000 ? 'tCO₂' : 'kg CO₂'}
          sublabel={`${stats.decisionStats?.total_decisions ?? 0} decisions`}
          tone="green"
          icon={<Leaf size={13} />}
        />
        <MetricTile
          label="CARBON AVOIDED PERIOD"
          value={stats.exportStats?.total_carbon_reduction_kg ?? 0}
          format={v => (v >= 1000 ? (v / 1000).toFixed(2) : v.toFixed(1))}
          unit={periodKg !== null && periodKg >= 1000 ? 'tCO₂' : 'kg CO₂'}
          sublabel={stats.exportStats?.period}
          tone="green"
          icon={<Recycle size={13} />}
        />
        <MetricTile
          label="RENEWABLE SELF-CONSUMPTION"
          value={stats.exportStats?.renewable_self_consumption_pct ?? 0}
          format={v => v.toFixed(1)}
          unit="%"
          sublabel="generation consumed on-site"
          tone="cyan"
        />
        <MetricTile
          label="GRID CARBON INTENSITY"
          value={GRID_EMISSION_FACTOR_KG_PER_KWH}
          format={v => v.toFixed(2)}
          unit="kg CO₂/kWh"
          sublabel="Rajasthan grid average"
          tone="red"
          icon={<Globe size={13} />}
        />
        <MetricTile
          label="LIVE RENEWABLE SHARE"
          value={m.renewablePct}
          format={v => v.toFixed(1)}
          unit="%"
          sublabel={`${formatCO2(m.renewableKw > 0 ? m.renewableKw * GRID_EMISSION_FACTOR_KG_PER_KWH * (1 / 12) : 0)} avoided this interval`}
          tone="green"
          icon={<Recycle size={13} />}
        />
      </section>

      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header flex-wrap gap-2">
          <span className="tech-label tech-label-cyan">EMISSIONS PROFILE · NEXT 24 H</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="ops-chip ops-chip-green">AVOIDED</span>
            <span className="ops-chip ops-chip-red">INCURRED</span>
            <span className="ops-chip ops-chip-cyan">CUMULATIVE AVOIDED</span>
          </div>
        </div>
        <div className="grid-texture p-4">
          {series.length === 0 ? (
            <div className="h-64 sm:h-72 grid place-items-center text-white/40 text-[12px]">
              Waiting for forecast engine…
            </div>
          ) : (
            <div className="chart-scroll">
              <div className="h-64 sm:h-72 min-w-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="rgba(224,197,160,0.07)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="rgba(243,237,228,0.15)"
                      tick={{ fill: 'rgba(243,237,228,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false}
                      interval={Math.max(0, Math.floor(series.length / 8))}
                    />
                    <YAxis
                      width={40}
                      stroke="rgba(243,237,228,0.15)"
                      tick={{ fill: 'rgba(243,237,228,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="avoidedKg" stroke="#34d399" strokeWidth={1.5} fill="#34d399" fillOpacity={0.18} dot={false} activeDot={{ r: 3 }} />
                    <Area type="monotone" dataKey="emittedKg" stroke="#f87171" strokeWidth={1.5} fill="#f87171" fillOpacity={0.12} dot={false} activeDot={{ r: 3 }} />
                    <Line type="monotone" dataKey="cumAvoidedKg" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="ops-panel-flat px-4 py-3 flex items-start gap-2">
        <Leaf size={13} className="text-emerald-300 mt-0.5 shrink-0" />
        <p className="text-[12px] text-white/60 leading-relaxed">
          Lifetime avoided{' '}
          <b className="num text-emerald-300">{formatCO2(lifetimeKg ?? 0)}</b>{' '}
          ≈{' '}
          <b className="num text-emerald-300">{displacedKwh !== null ? formatKwh(displacedKwh) : '—'}</b>{' '}
          of grid electricity displaced at the 0.74 kg/kWh Rajasthan average factor.
        </p>
      </div>
    </div>
  );
}
