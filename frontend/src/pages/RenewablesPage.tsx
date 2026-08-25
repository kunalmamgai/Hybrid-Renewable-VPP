import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Sun, Wind } from 'lucide-react';
import { useCampusMetrics } from '../context/MetricsContext';
import { useCampusForecast } from '../hooks/useCampusForecast';
import { useApiStats } from '../hooks/useApiStats';
import { formatTime, formatPower, formatKwh, pct } from '../lib/format';

// Mirrored from backend/adapters/site_config.py
const SOLAR_CAPACITY_KW = 330;
const WIND_CAPACITY_KW = 135;

interface MiniRow { t: string; solarKw: number; windKw: number }
interface Row { label: string; solarKw: number; windKw: number; demandKw: number }

function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string; payload?: unknown }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as Row | undefined;
  const names: Record<string, string> = { solarKw: 'Solar', windKw: 'Wind', demandKw: 'Demand' };
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
        <div key={String(p.dataKey)} className="flex items-center gap-3">
          <span className="text-white/50">{names[String(p.dataKey)] ?? String(p.dataKey)}</span>
          <span className="num text-white/85 ml-auto">{formatPower(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function SourceCard({
  kind,
  icon,
  currentKw,
  capacityKw,
  todayKwh,
  todayLoading,
  forecastPoints,
}: {
  kind: 'SOLAR' | 'WIND';
  icon: React.ReactNode;
  currentKw: number;
  capacityKw: number;
  todayKwh: number | null;
  todayLoading: boolean;
  forecastPoints: MiniRow[];
}) {
  const accent = kind === 'SOLAR'
    ? { text: '#fbbf24', chip: 'tech-label-amber', border: 'border-amber-300/25', glow: 'bg-amber-400/[0.06]', stroke: '#fbbf24' }
    : { text: '#2dd4bf', chip: 'tech-label-cyan', border: 'border-teal-300/25', glow: 'bg-amber-400/[0.06]', stroke: '#f59e0b' };
  const available = currentKw > 0;
  const capacityFactorPct = capacityKw > 0 ? (currentKw / capacityKw) * 100 : 0;

  return (
    <div className={`ops-panel overflow-hidden ${accent.border}`}>
      <div className="ops-panel-header">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`tech-label ${accent.chip}`}>{kind}</span>
        </div>
        <span className={`ops-chip ${available ? 'ops-chip-green' : ''} inline-flex items-center gap-1.5`}>
          <span className={`status-dot-${available ? 'green' : 'amber'}`} aria-hidden="true" />
          {available ? 'AVAILABLE' : 'STANDBY'}
        </span>
      </div>
      <div className={`grid-texture ${accent.glow} p-4 space-y-3`}>
        <div>
          <div className="tech-label mb-1">CURRENT GENERATION</div>
          <div className="num text-2xl sm:text-3xl font-bold text-white leading-none">{formatPower(currentKw)}</div>
          <div className="text-[10px] text-white/35 mt-1.5 num">
            capacity factor {pct(capacityFactorPct)} of {capacityKw} kW installed
          </div>
        </div>
        <div className="ops-divide pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="tech-label">TODAY</span>
            {todayLoading ? (
              <span className="h-4 w-20 rounded bg-white/10 animate-pulse" aria-label="loading" />
            ) : (
              <span className="num text-[13px] font-semibold text-white/85">{todayKwh !== null ? formatKwh(todayKwh) : '—'}</span>
            )}
          </div>
        </div>
        <div className="h-20 -mx-1">
          {forecastPoints.length === 0 ? (
            <div className="h-full grid place-items-center text-[11px] text-white/30">no forecast data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastPoints} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`${kind.toLowerCase()}-grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent.stroke} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={accent.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey={kind === 'SOLAR' ? 'solarKw' : 'windKw'} stroke={accent.stroke} strokeWidth={1.5} fill={`url(#${kind.toLowerCase()}-grad)`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RenewablesPage() {
  const m = useCampusMetrics();
  const forecast = useCampusForecast();
  const stats = useApiStats();

  const miniSeries = useMemo<MiniRow[]>(
    () => (forecast ? forecast.points.map(p => ({ t: formatTime(p.t), solarKw: p.solarKw, windKw: p.windKw })) : []),
    [forecast],
  );

  const series = useMemo<Row[]>(
    () =>
      forecast
        ? forecast.points.map(p => ({
            label: formatTime(p.t),
            solarKw: p.solarKw,
            windKw: p.windKw,
            demandKw: p.demandKw,
          }))
        : [],
    [forecast],
  );

  if (!m.hasData) {
    return (
      <div className="space-y-5">
        <div>
          <div className="tech-label mb-1.5">GENERATION ASSETS</div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Renewable Generation</h2>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">Live solar and wind output across the campus microgrid.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1].map(i => (
            <div key={i} className="ops-panel h-[280px] rounded-xl animate-pulse bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  const solarShareOfRenewable = m.renewableKw > 0 ? (m.solarKw / m.renewableKw) * 100 : 0;
  const windShareOfRenewable = m.renewableKw > 0 ? (m.windKw / m.renewableKw) * 100 : 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="tech-label mb-1.5">GENERATION ASSETS</div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Renewable Generation</h2>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">Live solar and wind output across the campus microgrid.</p>
      </div>

      <section aria-label="Generation sources" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SourceCard
          kind="SOLAR"
          icon={<Sun size={13} className="text-amber-300" />}
          currentKw={m.solarKw}
          capacityKw={SOLAR_CAPACITY_KW}
          todayKwh={stats.exportStats ? stats.exportStats.total_solar_generation_kwh : null}
          todayLoading={stats.loading}
          forecastPoints={miniSeries}
        />
        <SourceCard
          kind="WIND"
          icon={<Wind size={13} className="text-amber-300" />}
          currentKw={m.windKw}
          capacityKw={WIND_CAPACITY_KW}
          todayKwh={stats.exportStats ? stats.exportStats.total_wind_generation_kwh : null}
          todayLoading={stats.loading}
          forecastPoints={miniSeries}
        />
      </section>

      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header flex-wrap gap-2">
          <span className="tech-label tech-label-green">RENEWABLE MIX · LIVE</span>
          <span className="ops-chip ops-chip-cyan num">{formatPower(m.renewableKw)} COMBINED</span>
        </div>
        <div className="grid-texture p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-white/60">
                <Sun size={11} className="text-amber-300" /> SOLAR{' '}
                <b className="num text-white/80">{pct(solarShareOfRenewable)}</b>
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/60">
                WIND <b className="num text-white/80">{pct(windShareOfRenewable)}</b>{' '}
                <Wind size={11} className="text-amber-300" />
              </span>
            </div>
            <div
              className="h-4 w-full rounded-full overflow-hidden bg-ops-raised border border-ops-line flex"
              role="img"
              aria-label={`Solar ${solarShareOfRenewable.toFixed(0)} percent, wind ${windShareOfRenewable.toFixed(0)} percent of renewable mix`}
            >
              <div
                className="h-full bg-gradient-to-r from-amber-500/70 to-amber-300/90 transition-all duration-700"
                style={{ width: `${solarShareOfRenewable}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-amber-400/70 to-amber-300/90 transition-all duration-700"
                style={{ width: `${windShareOfRenewable}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ops-panel-flat p-3">
              <div className="tech-label mb-1">RENEWABLE SHARE OF DEMAND</div>
              <div className="num text-xl font-bold text-emerald-300">{pct(m.renewablePct)}</div>
            </div>
            <div className="ops-panel-flat p-3">
              <div className="tech-label mb-1">COMBINED OUTPUT</div>
              <div className="num text-xl font-bold text-white">{formatPower(m.renewableKw)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header flex-wrap gap-2">
          <span className="tech-label tech-label-cyan">GENERATION VS DEMAND · NEXT 24 H</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="ops-chip" style={{ borderColor: '#fbbf2455' }}>SOLAR</span>
            <span className="ops-chip" style={{ borderColor: '#2dd4bf55' }}>WIND</span>
            <span className="ops-chip">DEMAND</span>
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
                    <defs>
                      <linearGradient id="ren-solar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ren-wind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="solarKw" stroke="#fbbf24" strokeWidth={2} fill="url(#ren-solar)" dot={false} activeDot={{ r: 3 }} />
                    <Area type="monotone" dataKey="windKw" stroke="#2dd4bf" strokeWidth={2} fill="url(#ren-wind)" dot={false} activeDot={{ r: 3 }} />
                    <Area type="monotone" dataKey="demandKw" stroke="#f3ede4" strokeWidth={2} strokeDasharray="5 4" fill="none" dot={false} activeDot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
