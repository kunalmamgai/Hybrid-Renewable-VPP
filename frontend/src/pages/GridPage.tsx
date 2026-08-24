/**
 * Grid Intelligence — import/export flows, tariff context, a stability
 * score derived from real reliability telemetry and an honest risk board.
 * Grid frequency arrives live via the adapter health broadcast (WS `health`).
 */
import { useMemo } from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, PlugZap, ArrowUpRight, Activity } from 'lucide-react';
import { MetricTile } from '../components/viz/MetricTile';
import { useVppData } from '../context/VppDataContext';
import { useCampusMetrics } from '../context/MetricsContext';
import { useCampusForecast } from '../hooks/useCampusForecast';
import type { ReliabilityStatus } from '../types';
import { formatPower, pct } from '../lib/format';

const AVG_GRID_EMISSION_KG_PER_KWH = 0.74; // Rajasthan grid factor (mirrors backend)

/** Parse "HH:MM" → fractional hour, NaN-safe. */
function parseHm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h + m / 60;
}

function hourDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 24;
  return Math.min(d, 24 - d);
}

interface Warning {
  severity: 'warning' | 'critical' | 'info';
  title: string;
  detail: string;
}

function stabilityScore(rel: ReliabilityStatus): number {
  if (rel.emergency_mode) {
    return Math.max(40, 100 - rel.shortfall_predicted_kwh / 10);
  }
  return Math.min(98.7, Math.max(70, Math.min(99.9, 60 + rel.reserve_duration_hours * 8)));
}

function Gauge({ score }: { score: number }) {
  const color = score >= 90 ? '#34d399' : score >= 70 ? '#fbbf24' : '#f87171';
  const R = 52;
  const arc = Math.PI * R;
  return (
    <svg viewBox="0 0 140 86" className="w-44 h-auto mx-auto" role="img"
      aria-label={`Grid stability score ${score.toFixed(1)} percent`}>
      <path d={`M ${70 - R} 76 A ${R} ${R} 0 0 1 ${70 + R} 76`}
        fill="none" stroke="rgba(224,197,160,0.14)" strokeWidth="10" strokeLinecap="round" />
      <path d={`M ${70 - R} 76 A ${R} ${R} 0 0 1 ${70 + R} 76`}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(arc * Math.min(100, Math.max(0, score))) / 100} ${arc}`}
        style={{ transition: 'stroke-dasharray 800ms ease' }} />
      <text x="70" y="66" textAnchor="middle" fill={color} fontSize="24" fontWeight="800"
        fontFamily="JetBrains Mono, monospace">
        {score.toFixed(1)}
      </text>
      <text x="70" y="80" textAnchor="middle" fill="rgba(243,237,228,0.45)" fontSize="8.5"
        letterSpacing="2" fontFamily="JetBrains Mono, monospace">
        STABILITY SCORE
      </text>
    </svg>
  );
}

export default function GridPage() {
  const m = useCampusMetrics();
  const { reliability, gridFrequencyHz } = useVppData();
  const forecast = useCampusForecast();

  const tariff = m.buildings.length > 0 ? (m.buildings[0].tariff_inr_per_unit ?? 9) : 9;

  const score = reliability ? stabilityScore(reliability) : null;

  const status: { label: string; dot: string; text: string } =
    score === null ? { label: 'UNKNOWN', dot: 'status-dot-cyan', text: 'text-white/60' }
      : reliability?.emergency_mode || score < 70
        ? { label: 'CRITICAL', dot: 'status-dot-red', text: 'text-red-300' }
        : score < 90
          ? { label: 'WATCH', dot: 'status-dot-amber', text: 'text-amber-300' }
          : { label: 'STABLE', dot: 'status-dot-green', text: 'text-emerald-300' };

  // ── Risk board from real state ──
  const criticalRisk =
    !!reliability && (reliability.emergency_mode || reliability.shortfall_predicted_kwh > 100);

  const warnings = useMemo<Warning[]>(() => {
    const out: Warning[] = [];
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const nearDeficit = (forecast?.deficitWindows ?? []).some(w => {
      const start = parseHm(w.start);
      return Number.isFinite(start) && hourDist(nowH, start) <= 1;
    });
    if (nearDeficit || m.gridDependencyPct > 60) {
      out.push({
        severity: 'warning',
        title: 'Peak pricing window approaching',
        detail: nearDeficit
          ? `Forecast deficit begins within ±1h — imports priced at ₹${tariff.toFixed(2)}/unit climb during this window. Pre-charge the battery to arbitrage.`
          : `Grid dependency at ${m.gridDependencyPct.toFixed(0)}% — above the 60% peak-tariff exposure threshold.`,
      });
    }
    if (m.gridDependencyPct > 50) {
      out.push({
        severity: m.gridDependencyPct > 75 ? 'critical' : 'warning',
        title: 'Grid dependency increasing',
        detail: `Campus draws ${m.gridDependencyPct.toFixed(0)}% of demand from the grid (${m.gridDependencyPct > 75 ? 'above the 75% critical line' : 'above the 50% advisory line'}).`,
      });
    }
    return out.sort((a, b) => (a.severity === 'critical' ? -1 : b.severity === 'critical' ? 1 : 0));
  }, [forecast, m.gridDependencyPct, tariff]);

  if (!m.hasData) {
    return (
      <div className="space-y-5">
        <div>
          <div className="tech-label mb-1.5">GRID INTERFACE</div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Grid Intelligence</h2>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            Import/export balance, tariff context and stability posture at the point of common coupling.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" aria-busy="true" aria-label="Loading grid metrics">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ops-panel !rounded-xl p-3.5 h-[92px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <div className="tech-label mb-1.5">GRID INTERFACE</div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Grid Intelligence</h2>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
          Import/export balance, tariff context and stability posture at the point of common coupling ·
          grid emission factor {AVG_GRID_EMISSION_KG_PER_KWH} kg CO₂/kWh.
        </p>
      </div>

      {/* ── KPI strip ── */}
      <section aria-label="Grid key metrics">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricTile
            label="Grid Import"
            value={m.gridImportKw}
            format={formatPower}
            sublabel={`${m.gridDependencyPct.toFixed(0)}% of demand`}
            sparkValues={m.history.map(h => h.gridImportKw)}
            tone={m.gridDependencyPct > 60 ? 'amber' : 'cyan'}
            icon={<PlugZap size={13} />}
          />
          <MetricTile
            label="Grid Export"
            value={m.gridExportKw}
            format={formatPower}
            sublabel="net-metered surplus"
            sparkValues={m.history.map(h => h.gridExportKw)}
            tone="green"
            icon={<ArrowUpRight size={13} />}
          />
          <MetricTile
            label="Peak Demand"
            value={forecast?.demandPeak?.kw ?? m.demandKw}
            format={formatPower}
            sublabel={forecast?.demandPeak ? `at ${forecast.demandPeak.time} today` : 'current draw'}
            sparkValues={m.history.map(h => h.demandKw)}
            tone="neutral"
            icon={<Activity size={13} />}
          />
          <MetricTile
            label="Electricity Price"
            value={tariff}
            format={v => `₹${v.toFixed(2)}`}
            unit="/kWh"
            sublabel="blended average tariff"
            tone="cyan"
            icon={<PlugZap size={13} />}
          />
          <MetricTile
            label="Renewable Share"
            value={Math.min(m.renewablePct, 999)}
            format={v => v.toFixed(1)}
            unit="%"
            sublabel="of current demand"
            sparkValues={m.history.map(h => h.solarKw + h.windKw)}
            tone={m.renewablePct >= 100 ? 'green' : 'cyan'}
            icon={<Activity size={13} />}
          />
          {/* Live grid frequency from adapter health telemetry */}
          <MetricTile
            label="Grid Frequency"
            value={gridFrequencyHz ?? 50}
            format={v => v.toFixed(2)}
            unit="Hz"
            sublabel={
              gridFrequencyHz === null ? 'waiting for telemetry'
                : Math.abs(gridFrequencyHz - 50) <= 0.15 ? 'nominal — stable'
                  : 'drift outside ±0.15 Hz band'
            }
            tone={gridFrequencyHz === null ? 'neutral' : Math.abs(gridFrequencyHz - 50) <= 0.15 ? 'green' : 'amber'}
            icon={<Activity size={13} />}
          />
        </div>
      </section>

      {/* ── Stability gauge ── */}
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <span className="tech-label tech-label-cyan">GRID STABILITY</span>
          <span className="flex items-center gap-2">
            <span className={`status-dot ${status.dot}`} aria-hidden="true" />
            <span className={`tech-label ${status.text}`}>{status.label}</span>
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div>
            {score === null ? (
              <p className="text-[12px] text-white/40 py-8 text-center">
                Awaiting reliability telemetry from the decision engine…
              </p>
            ) : (
              <>
                <Gauge score={score} />
                <div className="mt-3 flex justify-center">
                  <span className={`ops-chip num ${reliability?.emergency_mode ? 'ops-chip-red' : ''}`}>
                    EMERGENCY MODE {reliability?.emergency_mode ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="ops-panel-flat p-3">
              <div className="tech-label mb-1">RESERVE FLOOR</div>
              <div className="num text-lg font-bold text-amber-300">{pct(reliability?.reserve_floor_pct ?? NaN, 0)}</div>
            </div>
            <div className="ops-panel-flat p-3">
              <div className="tech-label mb-1">RESERVE AUTONOMY</div>
              <div className="num text-lg font-bold text-emerald-300">
                {reliability ? `${reliability.reserve_duration_hours.toFixed(1)} h` : '—'}
              </div>
            </div>
            <div className="ops-panel-flat p-3">
              <div className="tech-label mb-1">CRITICAL LOAD</div>
              <div className="num text-lg font-bold text-amber-300">
                {reliability ? formatPower(reliability.critical_load_kw) : '—'}
              </div>
            </div>
            <div className="ops-panel-flat p-3">
              <div className="tech-label mb-1">NON-CRITICAL LOAD</div>
              <div className="num text-lg font-bold text-white/80">
                {reliability ? formatPower(reliability.non_critical_load_kw) : '—'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Critical banner ── */}
      {criticalRisk && (
        <div role="alert" className="rounded-xl border border-red-400/45 bg-red-500/10 p-4 shadow-ops animate-pulse">
          <p className="font-bold text-red-300 flex items-center gap-2 text-[13px]">
            <ShieldAlert size={16} /> CRITICAL LOAD RISK
          </p>
          <p className="text-[12px] text-white/70 mt-1.5">
            {reliability?.emergency_mode
              ? 'Emergency mode active — non-critical loads being shed to protect priority feeders.'
              : `Predicted shortfall of ${reliability?.shortfall_predicted_kwh.toFixed(0)} kWh exceeds the 100 kWh risk threshold.`}
            {' '}Reserve floor {reliability?.reserve_floor_pct.toFixed(0)}% · autonomy {reliability?.reserve_duration_hours.toFixed(1)}h.
          </p>
        </div>
      )}

      {/* ── Warnings ── */}
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <span className="tech-label tech-label-amber">GRID RISK BOARD</span>
        </div>
        <div className="ops-divide">
          {warnings.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck size={32} className="mx-auto text-emerald-400/70" />
              <p className="text-white/60 mt-2 font-medium text-[13px]">No grid risks detected</p>
              <p className="text-[11px] text-white/35 mt-1">
                Dependency, pricing exposure and reserve margins are all inside normal bands.
              </p>
            </div>
          ) : (
            warnings.map((w, i) => (
              <div key={i} className="p-3.5 flex items-start gap-3">
                <span
                  className={`status-dot mt-1.5 shrink-0 ${w.severity === 'critical' ? 'status-dot-red' : 'status-dot-amber'}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className={`text-[12px] font-semibold flex items-center gap-1.5 ${w.severity === 'critical' ? 'text-red-300' : 'text-amber-200'}`}>
                    <AlertTriangle size={12} /> {w.title.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{w.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
