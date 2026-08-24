/**
 * Overview — the VPP Command Center.
 * Answers within 5 seconds: generation, consumption, battery action, grid
 * dependency, AI recommendation, savings/carbon and system safety.
 *
 * Preserves every MissionControl capability: scenario quick-switch, force
 * cycle, emergency banner, top recommendation, energy meters, KPI stats,
 * recent decisions and building criticality.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, Cloud, Wind, Shield, RefreshCw, Loader2, Activity, Zap,
  BatteryMedium, PlugZap, Leaf, IndianRupee, ChevronRight,
} from 'lucide-react';
import { DecisionCard } from '../components/common/DecisionCard';
import { EnergyFlowDiagram } from '../components/viz/EnergyFlowDiagram';
import { MetricTile } from '../components/viz/MetricTile';
import { useVppData } from '../context/VppDataContext';
import { useCampusMetrics } from '../context/MetricsContext';
import { useApiStats } from '../hooks/useApiStats';
import { getScenarios, switchScenario, forceCycle } from '../services/apiClient';
import { formatPower, formatINR, formatCO2 } from '../lib/format';

const SCENARIOS = [
  { id: 'mvp_day', icon: Sun, label: 'Normal Day' },
  { id: 'cloudy_still_afternoon', icon: Cloud, label: 'Cloudy Afternoon' },
  { id: 'wind_fills_solar_gap', icon: Wind, label: 'Wind Fills Gap' },
  { id: 'shortfall_protects_hostel', icon: Shield, label: 'Shortfall — Hostel Protected' },
] as const;

/** % change of the latest sample vs ~3 samples ago. */
function trendOf(series: number[]): number | undefined {
  if (series.length < 4) return undefined;
  const recent = series[series.length - 1];
  const prev = series[series.length - 4];
  if (!prev) return undefined;
  return ((recent - prev) / Math.abs(prev)) * 100;
}

export default function OverviewPage() {
  const { latestDecisions, reliability, cycleCount } = useVppData();
  const m = useCampusMetrics();
  const stats = useApiStats();

  const [currentScenario, setCurrentScenario] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getScenarios()
      .then(r => { if (!cancelled) setCurrentScenario(r.current_scenario); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSwitchScenario = async (id: string) => {
    setActionLoading(`scenario_${id}`);
    try {
      await switchScenario(id);
      setCurrentScenario(id);
    } catch { /* non-fatal */ }
    setActionLoading(null);
  };

  const handleForceCycle = async () => {
    setActionLoading('force_cycle');
    try {
      await forceCycle();
    } catch { /* non-fatal */ }
    setActionLoading(null);
  };

  // Sparkline series from live history
  const spark = useMemo(() => ({
    renewable: m.history.map(h => h.solarKw + h.windKw),
    demand: m.history.map(h => h.demandKw),
    soc: m.history.map(h => h.socPct),
    gridImport: m.history.map(h => h.gridImportKw),
  }), [m.history]);

  const renewableTrend = trendOf(spark.renewable);
  const demandTrend = trendOf(spark.demand);

  const batteryStateLabel =
    m.batteryKw === null ? 'standby'
      : m.batteryKw < -1 ? `charging ${formatPower(Math.abs(m.batteryKw))}`
        : m.batteryKw > 1 ? `discharging ${formatPower(m.batteryKw)}`
          : 'idle';

  const topDecision = latestDecisions[0];

  return (
    <div className="space-y-5">
      {/* ── Command center header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="tech-label mb-1.5">VPP COMMAND CENTER</div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            HYBRID RENEWABLE VPP
          </h2>
          <p className="text-[12px] text-white/45 mt-1 max-w-xl">
            AI-powered orchestration of renewable generation, storage, grid demand and carbon.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="ops-chip num">CYCLE #{cycleCount}</span>
          <button
            type="button"
            onClick={handleForceCycle}
            disabled={actionLoading === 'force_cycle'}
            className="ops-btn"
          >
            {actionLoading === 'force_cycle'
              ? <Loader2 size={13} className="animate-spin" />
              : <RefreshCw size={13} />}
            FORCE CYCLE
          </button>
        </div>
      </div>

      {/* ── Scenario quick switch ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 ops-scroll">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSwitchScenario(s.id)}
            disabled={actionLoading === `scenario_${s.id}`}
            aria-pressed={currentScenario === s.id}
            className={`ops-chip !px-3 !py-1.5 transition-colors disabled:opacity-50 ${
              currentScenario === s.id ? 'ops-chip-cyan' : ''
            }`}
          >
            {actionLoading === `scenario_${s.id}`
              ? <Loader2 size={11} className="animate-spin" />
              : <s.icon size={11} />}
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Emergency banner ── */}
      {reliability?.emergency_mode && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/45 bg-red-500/10 p-4 shadow-ops animate-pulse"
        >
          <p className="font-bold text-red-300 flex items-center gap-2 text-[13px]">
            <Shield size={16} />
            EMERGENCY MODE — CRITICAL LOAD PROTECTION ACTIVATED
          </p>
          <p className="text-[12px] text-white/70 mt-1.5">
            {reliability.shortfall_predicted_kwh.toFixed(0)} kWh shortfall predicted. Non-critical loads shed first. Reserve floor {reliability.reserve_floor_pct}% · autonomy {reliability.reserve_duration_hours.toFixed(1)}h.
          </p>
        </div>
      )}

      {/* ── Live energy flow centerpiece ── */}
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <div className="flex items-center gap-2">
            <span className="status-dot-cyan" aria-hidden="true" />
            <span className="tech-label tech-label-cyan">LIVE ENERGY FLOW</span>
          </div>
          <span className="tech-label">SOLAR → OPTIMIZER → BATTERY / LOAD / GRID</span>
        </div>
        <div className="grid-texture p-2 sm:p-4">
          <div className="chart-scroll">
            <div className="min-w-[640px]">
              {m.hasData ? (
                <EnergyFlowDiagram
                  data={{
                    solarKw: m.solarKw,
                    windKw: m.windKw,
                    demandKw: m.demandKw,
                    gridImportKw: m.gridImportKw,
                    gridExportKw: m.gridExportKw,
                    avgSocPct: m.avgSocPct,
                    batteryKw: m.batteryKw,
                  }}
                />
              ) : (
                <div className="h-56 grid place-items-center text-white/40 text-[12px]">
                  Connecting to the digital twin…
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI strip ── */}
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricTile
            label="Renewable Generation"
            value={m.renewableKw}
            format={formatPower}
            sublabel={`${m.renewablePct.toFixed(0)}% of demand`}
            sparkValues={spark.renewable}
            trendPct={renewableTrend}
            tone="green"
            icon={<Sun size={13} />}
          />
          <MetricTile
            label="Current Load"
            value={m.demandKw}
            format={formatPower}
            sublabel="campus demand"
            sparkValues={spark.demand}
            trendPct={demandTrend}
            tone="cyan"
            icon={<Zap size={13} />}
          />
          <MetricTile
            label="Battery"
            value={m.avgSocPct}
            format={v => `${v.toFixed(0)}`}
            unit="%"
            sublabel={batteryStateLabel}
            sparkValues={spark.soc}
            tone="green"
            icon={<BatteryMedium size={13} />}
          />
          <MetricTile
            label="Grid Import"
            value={m.gridImportKw}
            format={formatPower}
            sublabel={`${m.gridDependencyPct.toFixed(0)}% dependency`}
            sparkValues={spark.gridImport}
            tone={m.gridDependencyPct > 60 ? 'amber' : 'neutral'}
            icon={<PlugZap size={13} />}
          />
          <MetricTile
            label="Carbon Avoided"
            value={stats.decisionStats?.total_carbon_reduction_kg ?? 0}
            format={v => formatCO2(v).replace(' CO₂', '')}
            unit=""
            sublabel="lifetime reduction"
            tone="green"
            icon={<Leaf size={13} />}
          />
          <MetricTile
            label="AI Savings"
            value={stats.decisionStats?.total_savings_inr ?? 0}
            format={v => formatINR(v, true)}
            sublabel={`${stats.decisionStats?.total_decisions ?? 0} decisions`}
            tone="cyan"
            icon={<IndianRupee size={13} />}
          />
        </div>
      </section>

      {/* ── Recommendation + decisions ── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="tech-label tech-label-cyan">RECENT AI DECISIONS</h3>
            <Link to="/app/optimizer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300/90 hover:text-amber-200 transition-colors">
              Open AI Optimizer <ChevronRight size={12} />
            </Link>
          </div>
          {topDecision && (
            <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/[0.07] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-emerald-300" />
                <span className="tech-label tech-label-green">TOP RECOMMENDATION</span>
              </div>
              <p className="text-[13px] font-medium text-white/90">{topDecision.action}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[11px] text-white/50">
                <span>Confidence <b className="text-emerald-300 num">{topDecision.confidence_pct.toFixed(0)}%</b></span>
                <span>Savings <b className="text-emerald-300 num">{formatINR(topDecision.expected_savings_inr)}</b></span>
                <span>Carbon <b className="text-emerald-300 num">−{topDecision.expected_carbon_reduction_kg.toFixed(1)} kg</b></span>
              </div>
            </div>
          )}
          {latestDecisions.length === 0 ? (
            <div className="ops-panel-flat p-8 text-center">
              <Activity className="mx-auto text-white/15" size={36} />
              <p className="text-white/55 mt-2 font-medium text-[13px]">Waiting for first decision…</p>
              <p className="text-[11px] text-white/35 mt-1">
                The decision loop runs each scheduler cycle. Trigger one now with Force Cycle.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {latestDecisions.slice(0, 3).map(d => (
                <DecisionCard key={d.decision_id} decision={d} />
              ))}
            </div>
          )}
        </div>

        {/* Building criticality */}
        <div className="space-y-3">
          <h3 className="tech-label">BUILDING CRITICALITY</h3>
          <div className="ops-panel p-3 space-y-2">
            {m.buildings.map(b => (
              <div key={b.building_id} className="flex items-center gap-3 rounded-lg border border-ops-line bg-ops-raised/40 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-white/85 truncate capitalize">
                    {b.building_id.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    SOC {b.battery_soc_pct.toFixed(0)}% · {formatPower((b.consumption_kwh ?? 0) * 12)}
                  </div>
                </div>
                <span className={`ops-chip ${b.criticality_tier === 'critical' ? 'ops-chip-amber' : ''}`}>
                  {b.criticality_tier === 'critical' ? 'CRITICAL' : 'FLEXIBLE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
