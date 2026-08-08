/**
 * Mission Control — the home screen.
 * Shows: today's savings, solar/wind/battery/grid mix, carbon saved, top recommendation,
 * live scenario indicator, and quick controls.
 * Glass-morphism style matching the landing page aesthetic.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Sun,
  Wind,
  Battery,
  Zap,
  TrendingUp,
  Leaf,
  IndianRupee,
  BarChart3,
  Activity,
  Cloud,
  Shield,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { EnergyMeter } from '../common/EnergyMeter';
import { DecisionCard } from '../common/DecisionCard';
import { useVppData } from '../../context/VppDataContext';
import { useDecisionStats, useExportStats } from '../../hooks/useDigitalTwin';
import { getScenarios, switchScenario, forceCycle } from '../../services/apiClient';
import { inrCompact, inrFull, grouped, carbonShort, carbonFull } from '../../lib/format';
import type { BuildingTwin } from '../../types';

const scenarioBadges: Record<string, { icon: React.ReactNode; label: string; activeColor: string }> = {
  mvp_day: { icon: <Sun size={14} />, label: 'Normal Day', activeColor: 'bg-vpp-amber/20 text-vpp-amber border-vpp-amber/30' },
  cloudy_still_afternoon: { icon: <Cloud size={14} />, label: 'Cloudy Afternoon', activeColor: 'bg-white/10 text-white/70 border-white/20' },
  wind_fills_solar_gap: { icon: <Wind size={14} />, label: 'Wind Fills Gap', activeColor: 'bg-saffron-300/15 text-saffron-300 border-saffron-300/30' },
  shortfall_protects_hostel: { icon: <Shield size={14} />, label: 'Shortfall — Hostel Protected', activeColor: 'bg-vpp-blue/20 text-vpp-blue border-vpp-blue/30' },
};

export function MissionControl() {
  const { buildings, latestDecisions, connected, cycleCount, reliability } = useVppData();
  const { stats: decisionStats } = useDecisionStats();
  const { stats: exportStats } = useExportStats();

  const [currentScenario, setCurrentScenario] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load scenario info on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await getScenarios();
        setCurrentScenario(resp.current_scenario);
        const s = resp.scenarios.find((x) => x.id === resp.current_scenario);
        setScenarioName(s?.name || '');
      } catch {
      console.warn('Failed to load scenario info');
    }
    })();
  }, []);

  // Aggregate campus totals
  const campusTotals = useMemo(() => {
    if (!buildings.length) return null;
    return buildings.reduce(
      (acc, b: BuildingTwin) => ({
        solar: acc.solar + b.solar_generation_kwh,
        wind: acc.wind + b.wind_generation_kwh,
        demand: acc.demand + b.consumption_kwh,
        gridImport: acc.gridImport + b.grid_import_kwh,
        gridExport: acc.gridExport + b.grid_export_kwh,
        batterySoc: acc.batterySoc + b.battery_soc_pct,
      }),
      { solar: 0, wind: 0, demand: 0, gridImport: 0, gridExport: 0, batterySoc: 0 }
    );
  }, [buildings]);

  const handleSwitchScenario = async (scenarioId: string) => {
    setActionLoading(`scenario_${scenarioId}`);
    try {
      await switchScenario(scenarioId);
      setCurrentScenario(scenarioId);
      const resp = await getScenarios();
      const s = resp.scenarios.find((x) => x.id === scenarioId);
      setScenarioName(s?.name || '');
    } catch {
      console.warn('Failed to switch scenario');
    }
    setActionLoading(null);
  };

  const handleForceCycle = async () => {
    setActionLoading('force_cycle');
    try {
      await forceCycle();
    } catch {
      console.warn('Failed to force decision cycle');
    }
    setActionLoading(null);
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md font-display">Mission Control</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-sm text-white/60">
                {connected ? 'Connected' : 'Connecting...'} | Cycle #{cycleCount}
              </span>
              {currentScenario && (
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider border ${
                  scenarioBadges[currentScenario]?.activeColor || 'bg-white/10 text-white/60 border-white/15'
                }`}>
                  {scenarioBadges[currentScenario]?.icon} {scenarioName || currentScenario}
                </span>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleForceCycle}
              disabled={actionLoading === 'force_cycle'}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50
                         bg-gradient-to-b from-saffron-400 to-amber-600 text-white hover:from-saffron-300 hover:to-amber-500 shadow-saffron-glow hover:shadow-saffron-glow-lg disabled:shadow-none"
            >
              {actionLoading === 'force_cycle' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Force Cycle
            </button>
          </div>
        </div>

        {/* Scenario Quick Switch */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['mvp_day', 'cloudy_still_afternoon', 'wind_fills_solar_gap', 'shortfall_protects_hostel'] as const).map(
            (id) => (
              <button
                key={id}
                onClick={() => handleSwitchScenario(id)}
                disabled={actionLoading === `scenario_${id}`}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                  currentScenario === id
                    ? 'bg-saffron-400/15 text-white backdrop-blur-sm border border-saffron-400/35 shadow-sm'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                } disabled:opacity-50`}
              >
                {actionLoading === `scenario_${id}` ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  scenarioBadges[id]?.icon
                )}
                {scenarioBadges[id]?.label || id}
              </button>
            )
          )}
        </div>

        {/* Emergency Alert */}
        {reliability?.emergency_mode && (
          <div className="glass-card-dark border-red-400/40 rounded-2xl p-4 mb-6 animate-pulse">
            <p className="font-bold text-red-300 flex items-center gap-2">
              <Shield size={18} />
              EMERGENCY MODE — Critical Load Protection Activated
            </p>
            <p className="text-sm text-white/70 mt-1.5">
              {reliability.shortfall_predicted_kwh.toFixed(0)} kWh shortfall predicted.
              Non-critical loads will be shed first. Reserve floor: {reliability.reserve_floor_pct}%
            </p>
          </div>
        )}

        {/* Top Recommendation */}
        {latestDecisions.length > 0 && !reliability?.emergency_mode && (
          <div className="glass-card-emerald rounded-2xl p-4 mb-6">
            <p className="font-bold text-amber-700 flex items-center gap-2 text-sm font-display">
              <Activity size={16} /> Top Recommendation
            </p>
            <p className="text-sm text-amber-950/80 mt-1.5 font-medium">{latestDecisions[0].action}</p>
            <p className="text-xs text-amber-950/50 mt-2">
              Confidence: {latestDecisions[0].confidence_pct}% |
              Savings: INR{latestDecisions[0].expected_savings_inr.toFixed(1)} |
              Carbon: {latestDecisions[0].expected_carbon_reduction_kg.toFixed(2)} kg CO₂
            </p>
          </div>
        )}

        {/* Energy Mix Meters */}
        {campusTotals && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
            <EnergyMeter
              type="solar"
              value={campusTotals.solar * 12}
              label="SOLAR"
              unit="kW"
              icon={<Sun className="text-amber-600" size={20} />}
              trend={campusTotals.solar > 0 ? 'up' : 'neutral'}
            />
            <EnergyMeter
              type="wind"
              value={campusTotals.wind * 12}
              label="WIND"
              unit="kW"
              icon={<Wind className="text-amber-700" size={20} />}
              trend={campusTotals.wind > 0 ? 'up' : 'neutral'}
            />
            <EnergyMeter
              type="demand"
              value={campusTotals.demand * 12}
              label="DEMAND"
              unit="kW"
              icon={<Zap className="text-amber-600" size={20} />}
            />
            <EnergyMeter
              type="grid_import"
              value={campusTotals.gridImport * 12}
              label="GRID IMPORT"
              unit="kW"
              icon={<Zap className="text-amber-700" size={20} />}
              trend={campusTotals.gridImport > 0 ? 'down' : 'neutral'}
            />
            <EnergyMeter
              type="grid_export"
              value={campusTotals.gridExport * 12}
              label="GRID EXPORT"
              unit="kW"
              icon={<TrendingUp className="text-amber-700" size={20} />}
              trend={campusTotals.gridExport > 0 ? 'up' : 'neutral'}
            />
            <EnergyMeter
              type="battery"
              value={campusTotals.batterySoc / (buildings.length || 1)}
              label="AVG SOC"
              unit="%"
              icon={<Battery className="text-amber-800" size={20} />}
            />
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div
            className="stat-card p-5"
            style={{ ['--glow' as string]: 'rgba(244, 163, 0, 0.22)', ['--chip' as string]: 'rgba(244, 163, 0, 0.16)', ['--chip-border' as string]: 'rgba(244, 163, 0, 0.4)' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5">
              <span className="stat-icon-chip text-amber-700">
                <IndianRupee size={18} />
              </span>
              <span className="font-bold text-sm text-amber-950/85">Cost Savings</span>
            </div>
            <p className="text-3xl font-bold text-amber-950 font-display mt-3 tabular-nums tracking-tight">
              {inrCompact(decisionStats?.total_savings_inr || 0)}
            </p>
            <p className="text-[10px] text-amber-950/50 mt-2 uppercase tracking-wider">
              {inrFull(decisionStats?.total_savings_inr || 0)} lifetime
            </p>
          </div>
          <div
            className="stat-card p-5"
            style={{ ['--glow' as string]: 'rgba(255, 182, 46, 0.2)', ['--chip' as string]: 'rgba(255, 182, 46, 0.14)', ['--chip-border' as string]: 'rgba(255, 182, 46, 0.36)' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5">
              <span className="stat-icon-chip text-amber-700">
                <Leaf size={18} />
              </span>
              <span className="font-bold text-sm text-amber-950/85">Carbon Saved</span>
            </div>
            <p className="text-3xl font-bold text-amber-950 font-display mt-3 tabular-nums tracking-tight">
              {carbonShort(decisionStats?.total_carbon_reduction_kg || 0)}
            </p>
            <p className="text-[10px] text-amber-950/50 mt-2 uppercase tracking-wider">
              {carbonFull(decisionStats?.total_carbon_reduction_kg || 0)} CO₂ saved
            </p>
          </div>
          <div
            className="stat-card p-5"
            style={{ ['--glow' as string]: 'rgba(255, 214, 140, 0.2)', ['--chip' as string]: 'rgba(255, 214, 140, 0.13)', ['--chip-border' as string]: 'rgba(255, 214, 140, 0.34)' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5">
              <span className="stat-icon-chip text-amber-700">
                <Activity size={18} />
              </span>
              <span className="font-bold text-sm text-amber-950/85">Decisions</span>
            </div>
            <p className="text-3xl font-bold text-amber-950 font-display mt-3 tabular-nums tracking-tight">
              {grouped(decisionStats?.total_decisions || 0)}
            </p>
            <p className="text-[10px] text-amber-950/50 mt-2 uppercase tracking-wider">AI decisions logged</p>
          </div>
          <div
            className="stat-card p-5"
            style={{ ['--glow' as string]: 'rgba(217, 119, 6, 0.24)', ['--chip' as string]: 'rgba(217, 119, 6, 0.16)', ['--chip-border' as string]: 'rgba(217, 119, 6, 0.36)' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5">
              <span className="stat-icon-chip text-amber-600">
                <BarChart3 size={18} />
              </span>
              <span className="font-bold text-sm text-amber-950/85">Self-Consumption</span>
            </div>
            <p className="text-3xl font-bold text-amber-950 font-display mt-3 tabular-nums tracking-tight">
              {(exportStats?.renewable_self_consumption_pct || 0).toFixed(1)}%
            </p>
            <p className="text-[10px] text-amber-950/50 mt-2 uppercase tracking-wider">Of renewable energy used on-site</p>
          </div>
        </div>

        {/* Recent Decisions */}
        <div className="mb-6">            <h2 className="text-lg font-bold text-white mb-4 drop-shadow-sm font-display">Recent AI Decisions</h2>
          {latestDecisions.length === 0 ? (
            <div className="vpp-card p-8 text-center">
              <BarChart3 className="mx-auto text-amber-950/20" size={48} />
              <p className="text-amber-950/60 mt-2 font-medium">Waiting for first decision...</p>
              <p className="text-xs text-amber-950/40 mt-1">
                The AI decision loop runs every 10 seconds. Click "Force Cycle" to trigger one now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestDecisions.map((d) => (
                <DecisionCard key={d.decision_id} decision={d} />
              ))}
            </div>
          )}
        </div>
        {buildings.length > 0 && (
          <div className="vpp-card p-5">
            <h2 className="text-lg font-bold text-amber-950 mb-3 font-display">Building Criticality</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {buildings.map((b: BuildingTwin) => (
                <div
                  key={b.building_id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    b.criticality_tier === 'critical'
                      ? 'border-vpp-blue/30 bg-vpp-blue/10'
                      : 'border-amber-950/15 bg-amber-950/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-amber-950">{b.building_id.replace('_', ' ')}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${
                        b.criticality_tier === 'critical'
                          ? 'bg-vpp-blue/15 text-vpp-blue'
                          : 'bg-amber-950/8 text-amber-950/60'
                      }`}
                    >
                      {b.criticality_tier === 'critical' ? 'CRITICAL' : 'NON-CRITICAL'}
                    </span>
                  </div>
                  <div className="text-xs text-amber-950/60 mt-1.5">SoC: {b.battery_soc_pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
