import { useMemo, useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Sun, Wind, Zap, TrendingUp } from 'lucide-react';
import { useCampusMetrics } from '../context/MetricsContext';
import { useCampusForecast } from '../hooks/useCampusForecast';
import { formatTime, formatPower, formatKwh, pct } from '../lib/format';

interface ForecastRow {
  label: string;
  solarKw: number;
  windKw: number;
  demandKw: number;
  bandHigh: number;
}

const SERIES_META = {
  solarKw: { label: 'SOLAR', color: '#fbbf24' },
  windKw: { label: 'WIND', color: '#2dd4bf' },
  demandKw: { label: 'DEMAND', color: '#f3ede4', dashed: true },
} as const;

type SeriesKey = keyof typeof SERIES_META;

function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string; payload?: unknown }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as ForecastRow | undefined;
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
      {payload.map(p => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="text-white/50 capitalize">{String(p.dataKey).replace('Kw', '')}</span>
          <span className="num text-white/85 ml-auto">{formatPower(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCell({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="ops-panel-flat p-3.5 min-w-0">
      <div className={`tech-label ${tone}`}>{label}</div>
      <div className="num text-xl font-bold text-white mt-1 truncate">{value}</div>
      <div className="text-[10px] text-white/35 mt-0.5 truncate num">{sub}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="ops-panel-flat p-3.5 h-[86px] animate-pulse bg-white/[0.03]" />
        ))}
      </div>
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <span className="tech-label tech-label-cyan">24-HOUR ENERGY FORECAST</span>
        </div>
        <div className="p-4">
          <div className="h-64 sm:h-72 rounded-lg bg-white/[0.03] animate-pulse" />
        </div>
      </section>
    </div>
  );
}

export default function ForecastPage() {
  const m = useCampusMetrics();
  const forecast = useCampusForecast();

  const [visible, setVisible] = useState<Record<string, boolean>>({
    solarKw: true, windKw: true, demandKw: true,
  });

  const series = useMemo<ForecastRow[]>(() => {
    if (!forecast) return [];
    return forecast.points.map(p => ({
      label: formatTime(p.t),
      solarKw: p.solarKw,
      windKw: p.windKw,
      demandKw: p.demandKw,
      bandHigh: p.bandHigh,
    }));
  }, [forecast]);

  const ready = m.hasData && !!forecast && series.length > 0;

  if (!ready) {
    return (
      <div className="space-y-5">
        <div>
          <div className="tech-label mb-1.5">FORECAST ENGINE · 24H HORIZON</div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Energy Forecast</h2>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            Solar, wind and demand outlook derived live from the digital twin.
          </p>
        </div>
        <Skeleton />
      </div>
    );
  }

  const f = forecast!;
  const firstSurplus = f.surplusWindows[0];
  const firstDeficit = f.deficitWindows[0];
  const windShare = (f.totalWindKwh + f.totalSolarKwh) > 0
    ? (f.totalWindKwh / (f.totalWindKwh + f.totalSolarKwh)) * 100
    : 0;

  const toggle = (k: SeriesKey) =>
    setVisible(v => ({ ...v, [k]: !v[k] }));

  return (
    <div className="space-y-5">
      <div>
        <div className="tech-label mb-1.5">FORECAST ENGINE · 24H HORIZON</div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Energy Forecast</h2>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
          Solar, wind and demand outlook derived live from the digital twin · generated {formatTime(f.generatedAt)}.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCell label="SOLAR TODAY" value={formatKwh(f.totalSolarKwh)} sub="forecast energy" tone="tech-label-amber" />
        <KpiCell label="WIND TODAY" value={formatKwh(f.totalWindKwh)} sub="forecast energy" tone="tech-label-cyan" />
        <KpiCell label="DEMAND TODAY" value={formatKwh(f.totalDemandKwh)} sub="forecast energy" tone="" />
        <KpiCell
          label="SOLAR PEAK AT"
          value={f.solarPeak ? `${f.solarPeak.time}` : '—'}
          sub={f.solarPeak ? formatPower(f.solarPeak.kw) : 'no peak detected'}
          tone="tech-label-amber"
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 ops-panel overflow-hidden">
          <div className="ops-panel-header flex-wrap gap-2">
            <span className="tech-label tech-label-cyan">24-HOUR ENERGY FORECAST</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="ops-chip opacity-80">CONFIDENCE ENVELOPE</span>
              {(Object.keys(SERIES_META) as SeriesKey[]).map(k => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={visible[k]}
                  onClick={() => toggle(k)}
                  className={`ops-chip transition-opacity ${visible[k] ? '' : 'opacity-35'}`}
                  style={{ borderColor: `${SERIES_META[k].color}55` }}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: SERIES_META[k].color }}
                  />
                  {SERIES_META[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-texture p-4">
            <div className="chart-scroll">
              <div className="h-64 sm:h-72 min-w-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                    <Area
                      type="monotone"
                      dataKey="bandHigh"
                      stroke="none"
                      fill="#f59e0b"
                      fillOpacity={0.06}
                      name="confidence envelope"
                    />
                    <Line
                      type="monotone"
                      dataKey="solarKw"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      strokeDasharray={undefined}
                      dot={false}
                      activeDot={{ r: 3 }}
                      hide={!visible.solarKw}
                    />
                    <Line
                      type="monotone"
                      dataKey="windKw"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                      hide={!visible.windKw}
                    />
                    <Line
                      type="monotone"
                      dataKey="demandKw"
                      stroke="#f3ede4"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={{ r: 3 }}
                      hide={!visible.demandKw}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="ops-panel overflow-hidden self-start">
          <div className="ops-panel-header">
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-amber-300" />
              <span className="tech-label tech-label-amber">FORECAST INSIGHT</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="rounded-lg border border-amber-300/20 bg-amber-400/[0.05] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sun size={12} className="text-amber-300" />
                <span className="tech-label">SOLAR PEAK</span>
              </div>
              {f.solarPeak ? (
                <p className="text-[12px] text-white/75 leading-relaxed">
                  Solar output peaks at <b className="num text-amber-300">{f.solarPeak.time}</b> delivering{' '}
                  <b className="num text-amber-300">{formatPower(f.solarPeak.kw)}</b>.
                </p>
              ) : (
                <p className="text-[12px] text-white/55">No distinct solar peak in this horizon.</p>
              )}
            </div>

            <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.05] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-emerald-300" />
                <span className="tech-label">CHARGING WINDOW</span>
              </div>
              {firstSurplus ? (
                <p className="text-[12px] text-white/75 leading-relaxed">
                  Battery charging should be prioritised between{' '}
                  <b className="num text-emerald-300">{firstSurplus.start}–{firstSurplus.end}</b>{' '}
                  (avg surplus <b className="num text-emerald-300">{formatPower(firstSurplus.avgSurplusKw)}</b>).
                </p>
              ) : (
                <p className="text-[12px] text-white/55">Surplus balanced across the horizon — no dedicated charging window.</p>
              )}
            </div>

            <div className="rounded-lg border border-red-300/20 bg-red-400/[0.05] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-red-300" />
                <span className="tech-label">DEFICIT RISK</span>
              </div>
              {firstDeficit ? (
                <p className="text-[12px] text-white/75 leading-relaxed">
                  Expect a deficit window between{' '}
                  <b className="num text-red-300">{firstDeficit.start}–{firstDeficit.end}</b>{' '}
                  averaging <b className="num text-red-300">{formatPower(firstDeficit.avgDeficitKw)}</b> — plan battery discharge or grid import.
                </p>
              ) : (
                <p className="text-[12px] text-white/55">Deficit balanced across the horizon — renewables cover demand.</p>
              )}
            </div>

            <div className="rounded-lg border border-amber-300/20 bg-amber-400/[0.05] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wind size={12} className="text-amber-300" />
                <span className="tech-label">WIND CONTRIBUTION</span>
              </div>
              <p className="text-[12px] text-white/75 leading-relaxed">
                Wind supplies <b className="num text-amber-300">{pct(windShare)}</b> of forecast renewable energy
                ({formatKwh(f.totalWindKwh)}) over the next 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
