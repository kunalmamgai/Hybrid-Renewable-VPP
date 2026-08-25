/**
 * Battery Intelligence — campus storage state of charge, power flow,
 * estimated health/cycle life, live charge/discharge strategy timeline
 * and per-building battery inventory. All figures derive from the live
 * digital-twin stream; lifetime estimates are clearly labelled EST.
 */
import { useMemo } from 'react';
import { ArrowDown, ArrowUp, BatteryMedium, Minus } from 'lucide-react';
import { MetricTile } from '../components/viz/MetricTile';
import { useVppData } from '../context/VppDataContext';
import { useCampusMetrics, CAMPUS_BATTERY_CAPACITY_KWH } from '../context/MetricsContext';
import { formatPower, formatKwh, pct } from '../lib/format';

/** Nominal full-cycle life assumed for LFP packs (mirrors site docs). */
const NOMINAL_CYCLES = 6000;
/** Typical optimizer cycles per day used for remaining-life estimation. */
const CYCLES_PER_DAY = 2;

function socTone(soc: number): string {
  if (soc > 50) return '#34d399';
  if (soc >= 20) return '#fbbf24';
  return '#f87171';
}

// ─── Animated battery visual ────────────────────────────────────────────────

function BatteryVisual({ soc, charging }: { soc: number; charging: boolean }) {
  const color = socTone(soc);
  const ix = 32, iy = 20, iw = 86, ih = 190;
  const clamped = Math.max(0, Math.min(100, soc));
  const fillH = (ih * clamped) / 100;

  return (
    <svg viewBox="0 0 150 236" className="mx-auto h-auto w-full max-w-[190px]" role="img"
      aria-label={`Campus battery state of charge ${clamped.toFixed(0)} percent, ${charging ? 'charging' : 'idle or discharging'}`}>
      {/* terminal nub */}
      <rect x={ix + iw / 2 - 14} y={6} width={28} height={11} rx={3}
        fill="rgba(224,197,160,0.35)" stroke="rgba(224,197,160,0.45)" strokeWidth="1.5" />
      {/* outline */}
      <rect x={ix} y={iy} width={iw} height={ih} rx={14}
        fill="rgba(20,16,12,0.65)" stroke="rgba(224,197,160,0.45)" strokeWidth="2.5" />
      {/* fill */}
      <rect
        x={ix + 6} y={iy + ih - 6 - fillH} width={iw - 12} height={fillH} rx={9}
        fill={color} opacity={0.82}
        className={charging ? 'animate-pulse' : undefined}
        style={{ transition: 'y 900ms ease, height 900ms ease' }}
      />
      {/* percentage overlay */}
      <text x={ix + iw / 2} y={iy + ih / 2} textAnchor="middle"
        fill="#ffffff" fontSize="26" fontWeight="800" fontFamily="JetBrains Mono, monospace">
        {clamped.toFixed(0)}%
      </text>
      <text x={ix + iw / 2} y={iy + ih / 2 + 18} textAnchor="middle"
        fill="rgba(243,237,228,0.55)" fontSize="9" letterSpacing="2" fontFamily="JetBrains Mono, monospace">
        SOC
      </text>
      {/* tick marks */}
      {[25, 50, 75].map(t => (
        <line key={t} x1={ix + iw - 16} y1={iy + ih - (ih * t) / 100}
          x2={ix + iw - 6} y2={iy + ih - (ih * t) / 100}
          stroke="rgba(224,197,160,0.35)" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ─── Strategy classification ────────────────────────────────────────────────

type StratKind = 'CHARGING' | 'DISCHARGING' | 'IDLE';

const STRAT_STYLE: Record<StratKind, { bg: string; chip: string }> = {
  CHARGING: { bg: 'rgba(52,211,153,0.75)', chip: 'ops-chip ops-chip-green' },
  DISCHARGING: { bg: 'rgba(251,191,36,0.75)', chip: 'ops-chip ops-chip-amber' },
  IDLE: { bg: 'rgba(147,166,189,0.35)', chip: 'ops-chip' },
};

export default function BatteryPage() {
  const m = useCampusMetrics();
  const { latestDecisions } = useVppData();

  const bankHealth = useMemo(() => {
    if (m.buildings.length === 0) return 0;
    return m.buildings.reduce((s, b) => s + (b.battery_health_pct ?? 0), 0) / m.buildings.length;
  }, [m.buildings]);

  const charging = m.batteryKw !== null && m.batteryKw < -1;
  const discharging = m.batteryKw !== null && m.batteryKw > 1;

  // Lifetime estimates derived from real battery_health_pct values
  const estCycles = Math.round(((100 - bankHealth) / 100) * NOMINAL_CYCLES);
  const degradation = Math.max(0, 100 - bankHealth);
  const rulYearsRaw = (((bankHealth - 80) / 100) * NOMINAL_CYCLES) / CYCLES_PER_DAY / 365;
  const rulYears = Math.max(0, rulYearsRaw);

  // Charge/discharge strategy segments across the observed window
  const strategySegments = useMemo(() => {
    const h = m.history;
    if (h.length < 2) return [];
    const segs: Array<{ kind: StratKind; weight: number }> = [];
    for (let i = 1; i < h.length; i++) {
      const dSoc = h[i].socPct - h[i - 1].socPct;
      const kind: StratKind = dSoc > 0.05 ? 'CHARGING' : dSoc < -0.05 ? 'DISCHARGING' : 'IDLE';
      const weight = Math.max(1, h[i].t - h[i - 1].t);
      const prev = segs[segs.length - 1];
      if (prev && prev.kind === kind) prev.weight += weight;
      else segs.push({ kind, weight });
    }
    return segs;
  }, [m.history]);

  if (!m.hasData) {
    return (
      <div className="space-y-5">
        <div>
          <div className="tech-label mb-1.5">STORAGE</div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Battery Intelligence</h1>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            State of charge, power flow and pack health across the campus battery bank.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" aria-busy="true" aria-label="Loading battery metrics">
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
        <div className="tech-label mb-1.5">STORAGE</div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Battery Intelligence</h1>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
          State of charge, power flow and pack health across the {(CAMPUS_BATTERY_CAPACITY_KWH / 1000).toFixed(1)} MWh campus battery bank.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="xl:col-span-2 space-y-5">
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-header">
              <span className="tech-label tech-label-cyan">CAMPUS BANK STATE</span>
              <span className="tech-label">{formatKwh(CAMPUS_BATTERY_CAPACITY_KWH)} INSTALLED</span>
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0 relative">
                <BatteryVisual soc={m.avgSocPct} charging={charging} />
                <div className="mt-3 flex justify-center">
                  {charging ? (
                    <span className="ops-chip ops-chip-green num">
                      <ArrowDown size={11} aria-hidden="true" /> CHARGING
                    </span>
                  ) : discharging ? (
                    <span className="ops-chip ops-chip-amber num">
                      <ArrowUp size={11} aria-hidden="true" /> DISCHARGING
                    </span>
                  ) : (
                    <span className="ops-chip num"><Minus size={11} aria-hidden="true" /> IDLE</span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MetricTile
                  label="State of Charge"
                  value={m.avgSocPct}
                  format={v => v.toFixed(1)}
                  unit="%"
                  sublabel="campus weighted average"
                  sparkValues={m.history.map(h => h.socPct)}
                  tone={m.avgSocPct > 50 ? 'green' : m.avgSocPct >= 20 ? 'amber' : 'red'}
                  icon={<BatteryMedium size={13} />}
                />
                <MetricTile
                  label="Charge / Discharge Power"
                  value={m.batteryKw === null ? 0 : Math.abs(m.batteryKw)}
                  format={() => (m.batteryKw === null ? '—' : formatPower(Math.abs(m.batteryKw)))}
                  sublabel={
                    m.batteryKw === null ? 'insufficient SOC slope data'
                      : charging ? 'drawing from renewables/grid'
                        : discharging ? 'supplying campus load'
                          : 'holding steady'
                  }
                  tone={m.batteryKw === null ? 'neutral' : charging ? 'green' : discharging ? 'amber' : 'neutral'}
                  icon={<BatteryMedium size={13} />}
                />
                <MetricTile
                  label="Available Capacity"
                  value={(CAMPUS_BATTERY_CAPACITY_KWH * m.avgSocPct) / 100}
                  format={formatKwh}
                  sublabel={`of ${formatKwh(CAMPUS_BATTERY_CAPACITY_KWH)} installed`}
                  tone="cyan"
                  icon={<BatteryMedium size={13} />}
                />
                <MetricTile
                  label="Bank Health"
                  value={bankHealth}
                  format={v => v.toFixed(1)}
                  unit="%"
                  sublabel={`${m.buildings.length} building packs averaged`}
                  tone={bankHealth > 90 ? 'green' : bankHealth > 80 ? 'amber' : 'red'}
                  icon={<BatteryMedium size={13} />}
                />

                {/* Derived estimates — labelled EST. */}
                <div
                  className="ops-panel !rounded-xl p-3.5 flex flex-col gap-2 min-w-0 border-dashed"
                  title={`Estimate: consumed cycles = ((100 − average bank health) / 100) × ${NOMINAL_CYCLES.toLocaleString('en-IN')} nominal LFP cycle life. Health currently ${bankHealth.toFixed(1)}%.`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="tech-label truncate">CYCLE COUNT <span className="text-amber-300/80">EST.</span></span>
                  </div>
                  <div className="num text-[22px] leading-none font-bold text-white/80">{estCycles.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-white/35">of ≈{NOMINAL_CYCLES.toLocaleString('en-IN')} rated cycles</div>
                </div>
                <div
                  className="ops-panel !rounded-xl p-3.5 flex flex-col gap-2 min-w-0 border-dashed"
                  title={`Estimate: degradation = 100 − average bank health (${bankHealth.toFixed(1)}%). Capacity fade relative to factory-new packs.`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="tech-label truncate">DEGRADATION <span className="text-amber-300/80">EST.</span></span>
                  </div>
                  <div className="num text-[22px] leading-none font-bold text-white/80">{degradation.toFixed(1)}%</div>
                  <div className="text-[10px] text-white/35">capacity fade from new</div>
                </div>
                <div
                  className="ops-panel !rounded-xl p-3.5 flex flex-col gap-2 min-w-0 border-dashed sm:col-span-2"
                  title={`Estimate: remaining useful life = ((health − 80%) / 100 × ${NOMINAL_CYCLES.toLocaleString('en-IN')} cycles) ÷ ${CYCLES_PER_DAY} cycles/day ÷ 365 days/year. Assumes replacement at 80% health.`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="tech-label truncate">REMAINING USEFUL LIFE <span className="text-amber-300/80">EST.</span></span>
                  </div>
                  <div className="num text-[22px] leading-none font-bold text-white/80">
                    {rulYearsRaw <= 0 ? 'At EOL threshold' : `${rulYears.toFixed(1)} yr`}
                  </div>
                  <div className="text-[10px] text-white/35">≈{CYCLES_PER_DAY} optimizer cycles/day assumed · to 80% health floor</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Strategy */}
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-header">
              <span className="tech-label tech-label-cyan">BATTERY STRATEGY</span>
              <span className="tech-label">LIVE WINDOW</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="tech-label mb-1">ACTIVE POLICY</div>
                <p className="text-[13px] font-semibold text-emerald-300">Peak Shaving + Renewable Arbitrage</p>
                <p className="text-[11px] text-white/40 mt-1">
                  Charges during renewable surplus, discharges into demand peaks to cut grid imports.
                </p>
              </div>

              <div>
                <div className="tech-label mb-1.5">OBSERVED DISPATCH TIMELINE</div>
                {strategySegments.length === 0 ? (
                  <p className="text-[12px] text-white/40 py-3">
                    Collecting samples… strategy timeline appears after two or more telemetry readings.
                  </p>
                ) : (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden gap-px" role="img"
                      aria-label="Observed battery charge and discharge timeline">
                      {strategySegments.map((s, i) => (
                        <div key={i} style={{ flexGrow: s.weight, background: STRAT_STYLE[s.kind].bg }}
                          title={s.kind} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
                      {(Object.keys(STRAT_STYLE) as StratKind[]).map(k => {
                        const count = strategySegments.filter(s => s.kind === k).length;
                        return (
                          <span key={k} className={`${STRAT_STYLE[k].chip} !py-0.5 !text-[10px]`}>
                            {k} · {count}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Per-building batteries */}
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-header">
              <span className="tech-label tech-label-green">PER-BUILDING PACKS</span>
            </div>
            <div className="ops-divide">
              {m.buildings.map(b => {
                const soc = b.battery_soc_pct ?? 0;
                const health = b.battery_health_pct ?? 0;
                return (
                  <div key={b.building_id} className="p-3.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-white/85 capitalize truncate">
                        {b.name ?? b.building_id.replace(/_/g, ' ')}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden w-28 shrink-0"
                          role="progressbar" aria-valuenow={Math.round(soc)} aria-valuemin={0} aria-valuemax={100}
                          aria-label={`${b.building_id} state of charge`}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.max(0, soc))}%`, background: socTone(soc) }} />
                        </div>
                        <span className="num text-[10px] text-white/50">{pct(soc, 0)}</span>
                        <span className="num text-[10px] text-white/35">health {health.toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className={`ops-chip ${b.criticality_tier === 'critical' ? 'ops-chip-amber' : ''}`}>
                      {b.criticality_tier === 'critical' ? 'CRITICAL' : 'FLEX'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Latest battery-related AI action for context */}
          {latestDecisions.length > 0 && latestDecisions.some(d => d.decision_type === 'battery') && (
            <section className="ops-panel overflow-hidden">
              <div className="ops-panel-header">
                <span className="tech-label tech-label-amber">LATEST BATTERY DECISION</span>
              </div>
              <div className="p-4">
                {latestDecisions.filter(d => d.decision_type === 'battery').slice(0, 1).map(d => (
                  <div key={d.decision_id}>
                    <p className="text-[13px] font-medium text-white/90">{d.action}</p>
                    <p className="text-[11px] text-white/45 mt-1">{d.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
