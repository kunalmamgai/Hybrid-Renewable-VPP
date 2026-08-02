/**
 * Mission Control — the home screen.
 * Shows: today's savings, solar/wind/battery/grid mix, carbon saved, top recommendation,
 * live scenario indicator, and quick controls.
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
  Play,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { EnergyMeter } from '../common/EnergyMeter';
import { DecisionCard } from '../common/DecisionCard';
import { useVppWebSocket } from '../../hooks/useVppWebSocket';
import { useDecisionStats, useExportStats } from '../../hooks/useDigitalTwin';
import { getScenarios, switchScenario, forceCycle } from '../../services/apiClient';
import type { BuildingTwin } from '../../types';

const scenarioBadges: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  mvp_day: { icon: <Sun size={14} />, label: 'Normal Day', color: 'bg-amber-100 text-amber-700' },
  cloudy_still_afternoon: { icon: <Cloud size={14} />, label: 'Cloudy Afternoon', color: 'bg-gray-100 text-gray-600' },
  wind_fills_solar_gap: { icon: <Wind size={14} />, label: 'Wind Fills Gap', color: 'bg-teal-100 text-teal-700' },
  shortfall_protects_hostel: { icon: <Shield size={14} />, label: 'Shortfall — Hostel Protected', color: 'bg-blue-100 text-blue-700' },
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
    <div className="min-h-screen bg-grid-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mission Control</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Connecting...'} | Cycle #{cycleCount}
              </span>
              {currentScenario && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  scenarioBadges[currentScenario]?.color || 'bg-gray-100 text-gray-600'
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
              className="px-3 py-1.5 bg-vpp-green text-white rounded-lg text-sm font-medium hover:bg-vpp-green/90 disabled:opacity-50 flex items-center gap-1.5 transition-all"
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  currentScenario === id
                    ? 'bg-vpp-blue text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-vpp-blue/30'
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-pulse">
            <p className="font-semibold text-red-700 flex items-center gap-2">
              <Shield size={18} />
              EMERGENCY MODE — Critical Load Protection Activated
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {reliability.shortfall_predicted_kwh.toFixed(0)} kWh shortfall predicted.
              Non-critical loads will be shed first. Reserve floor: {reliability.reserve_floor_pct}%
            </p>
          </div>
        )}

        {/* Top Recommendation */}
        {latestDecisions.length > 0 && !reliability?.emergency_mode && (
          <div className="bg-vpp-green/10 border border-vpp-green/30 rounded-xl p-4 mb-6">
            <p className="font-semibold text-vpp-green flex items-center gap-2">
              <Activity size={16} /> Top Recommendation
            </p>
            <p className="text-sm text-gray-700 mt-1">{latestDecisions[0].action}</p>
            <p className="text-xs text-gray-600 mt-2">
              Confidence: {latestDecisions[0].confidence_pct}% |
              Savings: INR{latestDecisions[0].expected_savings_inr.toFixed(1)} |
              Carbon: {latestDecisions[0].expected_carbon_reduction_kg.toFixed(2)} kg CO₂
            </p>
          </div>
        )}

        {/* Energy Mix Meters */}
        {campusTotals && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <EnergyMeter
              type="solar"
              value={campusTotals.solar * 12}
              label="SOLAR"
              unit="kW"
              icon={<Sun className="text-amber-400" size={20} />}
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
              icon={<Zap className="text-gray-500" size={20} />}
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
              icon={<TrendingUp className="text-vpp-green" size={20} />}
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
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 text-vpp-green">
              <IndianRupee size={18} />
              <span className="font-semibold">Cost Savings</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              INR{(decisionStats?.total_savings_inr || 0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Lifetime savings logged</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 text-vpp-teal">
              <Leaf size={18} />
              <span className="font-semibold">Carbon Saved</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {(decisionStats?.total_carbon_reduction_kg || 0).toFixed(1)} kg CO₂
            </p>
            <p className="text-xs text-gray-500 mt-1">Emission factor: 0.74 kg/kWh</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 text-vpp-blue">
              <Activity size={18} />
              <span className="font-semibold">Decisions</span>
            </div>
            <p className="text-2xl font-bold mt-2">{decisionStats?.total_decisions || 0}</p>
            <p className="text-xs text-gray-500 mt-1">AI decisions logged</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 text-vpp-amber">
              <BarChart3 size={18} />
              <span className="font-semibold">Self-Consumption</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {(exportStats?.renewable_self_consumption_pct || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Of renewable energy used on-site</p>
          </div>
        </div>

        {/* Recent Decisions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent AI Decisions</h2>
          {latestDecisions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow">
              <BarChart3 className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-500 mt-2">Waiting for first decision...</p>
              <p className="text-xs text-gray-400 mt-1">
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
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Building Criticality</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {buildings.map((b: BuildingTwin) => (
                <div
                  key={b.building_id}
                  className={`p-3 rounded-lg border ${
                    b.criticality_tier === 'critical'
                      ? 'border-vpp-blue bg-vpp-blue/5'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{b.building_id.replace('_', ' ')}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        b.criticality_tier === 'critical'
                          ? 'bg-vpp-blue/10 text-vpp-blue'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.criticality_tier === 'critical' ? 'CRITICAL' : 'NON-CRITICAL'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">SoC: {b.battery_soc_pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
