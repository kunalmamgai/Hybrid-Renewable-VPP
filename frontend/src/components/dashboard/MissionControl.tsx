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
import { useVppWebSocket } from '../../hooks/useVppWebSocket';
import { useDecisionStats, useExportStats } from '../../hooks/useDigitalTwin';
import { getScenarios, switchScenario, forceCycle } from '../../services/apiClient';
import type { BuildingTwin } from '../../types';

const scenarioBadges: Record<string, { icon: React.ReactNode; label: string; activeColor: string }> = {
  mvp_day: { icon: <Sun size={14} />, label: 'Normal Day', activeColor: 'bg-vpp-amber/20 text-vpp-amber border-vpp-amber/30' },
  cloudy_still_afternoon: { icon: <Cloud size={14} />, label: 'Cloudy Afternoon', activeColor: 'bg-vpp-navy-muted/20 text-vpp-navy-muted border-vpp-navy-muted/30' },
  wind_fills_solar_gap: { icon: <Wind size={14} />, label: 'Wind Fills Gap', activeColor: 'bg-vpp-teal/20 text-vpp-teal border-vpp-teal/30' },
  shortfall_protects_hostel: { icon: <Shield size={14} />, label: 'Shortfall — Hostel Protected', activeColor: 'bg-vpp-blue/20 text-vpp-blue border-vpp-blue/30' },
};

export function MissionControl() {
  const { buildings, latestDecisions, latestCycle, connected, cycleCount, reliability } = useVppWebSocket();
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
      } catch {}
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
    } catch {}
    setActionLoading(null);
  };

  const handleForceCycle = async () => {
    setActionLoading('force_cycle');
    try {
      await forceCycle();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md">Mission Control</h1>
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
                         bg-vpp-emerald text-white hover:bg-vpp-emerald-light shadow-emerald-glow hover:shadow-emerald-glow-lg disabled:shadow-none"
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
                    ? 'bg-white/15 text-white backdrop-blur-sm border border-white/20 shadow-sm'
                    : 'glass-card text-white/70 hover:text-white hover:bg-white/20'
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
            <p className="font-bold text-vpp-emerald flex items-center gap-2 text-sm">
              <Activity size={16} /> Top Recommendation
            </p>
            <p className="text-sm text-white/80 mt-1.5 font-medium">{latestDecisions[0].action}</p>
            <p className="text-xs text-white/50 mt-2">
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
              icon={<Sun className="text-vpp-amber" size={20} />}
              trend={campusTotals.solar > 0 ? 'up' : 'neutral'}
            />
            <EnergyMeter
              type="wind"
              value={campusTotals.wind * 12}
              label="WIND"
              unit="kW"
              icon={<Wind className="text-vpp-teal" size={20} />}
              trend={campusTotals.wind > 0 ? 'up' : 'neutral'}
            />
            <EnergyMeter
              type="demand"
              value={campusTotals.demand * 12}
              label="DEMAND"
              unit="kW"
              icon={<Zap className="text-vpp-navy-muted" size={20} />}
            />
            <EnergyMeter
              type="grid_import"
              value={campusTotals.gridImport * 12}
              label="GRID IMPORT"
              unit="kW"
              icon={<Zap className="text-vpp-amber" size={20} />}
              trend={campusTotals.gridImport > 0 ? 'down' : 'neutral'}
            />
            <EnergyMeter
              type="grid_export"
              value={campusTotals.gridExport * 12}
              label="GRID EXPORT"
              unit="kW"
              icon={<TrendingUp className="text-vpp-emerald" size={20} />}
              trend={campusTotals.gridExport > 0 ? 'up' : 'neutral'}
            />
            <EnergyMeter
              type="battery"
              value={campusTotals.batterySoc / (buildings.length || 1)}
              label="AVG SOC"
              unit="%"
              icon={<Battery className="text-vpp-blue" size={20} />}
            />
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-vpp-emerald">
              <IndianRupee size={18} />
              <span className="font-bold text-sm">Cost Savings</span>
            </div>
            <p className="text-2xl font-bold text-vpp-navy mt-2">
              INR{(decisionStats?.total_savings_inr || 0).toFixed(1)}
            </p>
            <p className="text-[10px] text-vpp-navy-muted mt-1.5 uppercase tracking-wider">Lifetime savings logged</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-vpp-teal">
              <Leaf size={18} />
              <span className="font-bold text-sm">Carbon Saved</span>
            </div>
            <p className="text-2xl font-bold text-vpp-navy mt-2">
              {(decisionStats?.total_carbon_reduction_kg || 0).toFixed(1)} kg CO₂
            </p>
            <p className="text-[10px] text-vpp-navy-muted mt-1.5 uppercase tracking-wider">Emission factor: 0.74 kg/kWh</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-vpp-blue">
              <Activity size={18} />
              <span className="font-bold text-sm">Decisions</span>
            </div>
            <p className="text-2xl font-bold text-vpp-navy mt-2">{decisionStats?.total_decisions || 0}</p>
            <p className="text-[10px] text-vpp-navy-muted mt-1.5 uppercase tracking-wider">AI decisions logged</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-vpp-amber">
              <BarChart3 size={18} />
              <span className="font-bold text-sm">Self-Consumption</span>
            </div>
            <p className="text-2xl font-bold text-vpp-navy mt-2">
              {(exportStats?.renewable_self_consumption_pct || 0).toFixed(1)}%
            </p>
            <p className="text-[10px] text-vpp-navy-muted mt-1.5 uppercase tracking-wider">Of renewable energy used on-site</p>
          </div>
        </div>

        {/* Recent Decisions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4 drop-shadow-sm">Recent AI Decisions</h2>
          {latestDecisions.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <BarChart3 className="mx-auto text-white/20" size={48} />
              <p className="text-white/60 mt-2 font-medium">Waiting for first decision...</p>
              <p className="text-xs text-white/40 mt-1">
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

        {/* Building Criticality Tiers */}
        {buildings.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-vpp-navy mb-3">Building Criticality</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {buildings.map((b: BuildingTwin) => (
                <div
                  key={b.building_id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    b.criticality_tier === 'critical'
                      ? 'border-vpp-blue/30 bg-vpp-blue/10'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-vpp-navy">{b.building_id.replace('_', ' ')}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${
                        b.criticality_tier === 'critical'
                          ? 'bg-vpp-blue/15 text-vpp-blue'
                          : 'bg-vpp-navy-muted/10 text-vpp-navy-muted'
                      }`}
                    >
                      {b.criticality_tier === 'critical' ? 'CRITICAL' : 'NON-CRITICAL'}
                    </span>
                  </div>
                  <div className="text-xs text-vpp-navy-muted mt-1.5">SoC: {b.battery_soc_pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
