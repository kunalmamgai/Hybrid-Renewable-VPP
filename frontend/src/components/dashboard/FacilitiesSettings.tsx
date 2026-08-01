/**
 * Facilities Settings — alert thresholds, criticality tier editor,
 * VNM sharing rules, demo scenario controls, and statutory export.
 * Fully wired to backend API with controlled React state.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  AlertTriangle,
  BarChart3,
  Save,
  Download,
  FileText,
  FileSpreadsheet,
  Play,
  RefreshCw,
  Zap,
  Cloud,
  Wind,
  Shield,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  getAlertThresholds,
  updateAlertThreshold,
  getBuildingTiers,
  updateBuildingTier,
  getVnmSharingRules,
  getScenarios,
  switchScenario,
  forceCycle,
  downloadCSV,
  downloadPDF,
} from '../../services/apiClient';
import type {
  AlertThreshold,
  BuildingTierConfig,
  VnmSharingRule,
  Scenario,
  ScenariosResponse,
} from '../../types';

type TabId = 'thresholds' | 'tiers' | 'vnm' | 'scenarios' | 'export';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'thresholds', label: 'Alert Thresholds', icon: <AlertTriangle size={15} /> },
  { id: 'tiers', label: 'Building Tiers', icon: <BarChart3 size={15} /> },
  { id: 'vnm', label: 'VNM Rules', icon: <Zap size={15} /> },
  { id: 'scenarios', label: 'Demo Scenarios', icon: <Play size={15} /> },
  { id: 'export', label: 'Statutory Export', icon: <Download size={15} /> },
];

export function FacilitiesSettings() {
  const [activeTab, setActiveTab] = useState<TabId>('thresholds');
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [tiers, setTiers] = useState<BuildingTierConfig[]>([]);
  const [vnmRules, setVnmRules] = useState<VnmSharingRule[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState('');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load all settings on mount
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [thresholdsData, tiersData, vnmData, scenarioData] = await Promise.all([
        getAlertThresholds().catch(() => []),
        getBuildingTiers().catch(() => []),
        getVnmSharingRules().catch(() => []),
        getScenarios().catch(() => null),
      ]);
      setThresholds(thresholdsData as AlertThreshold[]);
      setTiers(tiersData as BuildingTierConfig[]);
      setVnmRules(vnmData as VnmSharingRule[]);
      if (scenarioData) {
        setScenarios((scenarioData as ScenariosResponse).scenarios);
        setCurrentScenario((scenarioData as ScenariosResponse).current_scenario);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveThreshold = async (id: string, value: number, active: boolean) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      await updateAlertThreshold(id, { threshold_value: value, active });
      await loadAll();
      showNotification('success', `Threshold "${id}" updated to ${value}`);
    } catch (err) {
      showNotification('error', `Failed to update threshold "${id}"`);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveTier = async (building_id: string, tier: string) => {
    setSaving(prev => ({ ...prev, [`tier_${building_id}`]: true }));
    try {
      await updateBuildingTier(building_id, { tier });
      await loadAll();
      showNotification('success', `${building_id.replace('_', ' ')} set to ${tier}`);
    } catch (err) {
      showNotification('error', `Failed to update tier for ${building_id}`);
    } finally {
      setSaving(prev => ({ ...prev, [`tier_${building_id}`]: false }));
    }
  };

  const handleSaveVnm = async (building_id: string, ratio: number) => {
    setSaving(prev => ({ ...prev, [`vnm_${building_id}`]: true }));
    try {
      await updateVnmSharingRule(building_id, { sharing_ratio: ratio });
      await loadAll();
      showNotification('success', `VNM ratio for ${building_id.replace('_', ' ')} set to ${(ratio * 100).toFixed(0)}%`);
    } catch (err) {
      showNotification('error', `Failed to update VNM ratio for ${building_id}`);
    } finally {
      setSaving(prev => ({ ...prev, [`vnm_${building_id}`]: false }));
    }
  };

  const handleSwitchScenario = async (scenarioId: string) => {
    setSaving(prev => ({ ...prev, [`scenario_${scenarioId}`]: true }));
    try {
      const result = await switchScenario(scenarioId);
      setCurrentScenario(result.scenario);
      showNotification('success', result.message);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.detail || 'Failed to switch scenario');
    } finally {
      setSaving(prev => ({ ...prev, [`scenario_${scenarioId}`]: false }));
    }
  };

  const handleForceCycle = async () => {
    setSaving(prev => ({ ...prev, force_cycle: true }));
    try {
      await forceCycle();
      showNotification('success', 'Decision cycle triggered successfully');
    } catch (err) {
      showNotification('error', 'Failed to trigger decision cycle');
    } finally {
      setSaving(prev => ({ ...prev, force_cycle: false }));
    }
  };

  return (
    <div className="min-h-screen bg-grid-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={24} className="text-vpp-blue" />
              Facilities Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure alerts, building priorities, and demo scenarios
            </p>
          </div>
          <button
            onClick={handleForceCycle}
            disabled={saving.force_cycle}
            className="px-4 py-2 bg-vpp-green text-white rounded-lg hover:bg-vpp-green/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 transition-all"
          >
            {saving.force_cycle ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Force Decision Cycle
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in ${
              notification.type === 'success'
                ? 'bg-vpp-green/10 text-vpp-green border border-vpp-green/20'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            {notification.message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-vpp-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow p-6">
          {activeTab === 'thresholds' && (
            <ThresholdTab
              thresholds={thresholds}
              saving={saving}
              onSave={handleSaveThreshold}
            />
          )}
          {activeTab === 'tiers' && (
            <TiersTab
              tiers={tiers}
              saving={saving}
              onSave={handleSaveTier}
            />
          )}
          {activeTab === 'vnm' && (
            <VnmTab
              rules={vnmRules}
              saving={saving}
              onSave={handleSaveVnm}
            />
          )}
          {activeTab === 'scenarios' && (
            <ScenariosTab
              scenarios={scenarios}
              currentScenario={currentScenario}
              saving={saving}
              onSwitch={handleSwitchScenario}
            />
          )}
          {activeTab === 'export' && (
            <ExportTab />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Threshold Tab ───────────────────────────────────────────────

function ThresholdTab({
  thresholds,
  saving,
  onSave,
}: {
  thresholds: AlertThreshold[];
  saving: Record<string, boolean>;
  onSave: (id: string, value: number, active: boolean) => void;
}) {
  if (thresholds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertTriangle size={32} className="mx-auto mb-2" />
        <p>No alert thresholds configured. Backend may be unreachable.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle size={18} className="text-vpp-amber" />
        Alert Thresholds
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Set the thresholds that trigger alerts. The system will warn when battery SoC drops below the warning level,
        and enter emergency mode when it falls below the critical level.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {thresholds.map((t) => {
          const isSaving = saving[t.id];
          return (
            <div
              key={t.id}
              className={`border rounded-lg p-4 ${
                t.severity === 'critical'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{t.name}</span>
                  {t.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    t.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {t.severity}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="number"
                  defaultValue={t.threshold_value}
                  id={`threshold-${t.id}`}
                  className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-vpp-blue/30 focus:border-vpp-blue outline-none"
                  step={0.5}
                />
                <span className="text-sm text-gray-500">{t.unit}</span>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 ml-auto">
                  <input
                    type="checkbox"
                    defaultChecked={t.active}
                    className="rounded border-gray-300 text-vpp-green focus:ring-vpp-blue"
                  />
                  Active
                </label>
                <button
                  onClick={() => {
                    const el = document.getElementById(`threshold-${t.id}`) as HTMLInputElement;
                    const activeEl = el?.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement;
                    onSave(t.id, parseFloat(el?.value || String(t.threshold_value)), activeEl?.checked ?? true);
                  }}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-vpp-green text-white rounded-lg text-sm hover:bg-vpp-green/90 disabled:opacity-50 flex items-center gap-1 transition-all"
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tiers Tab ───────────────────────────────────────────────────

function TiersTab({
  tiers,
  saving,
  onSave,
}: {
  tiers: BuildingTierConfig[];
  saving: Record<string, boolean>;
  onSave: (building_id: string, tier: string) => void;
}) {
  const allTiers = [
    { value: 'critical', label: 'Critical', color: 'bg-vpp-blue/10 text-vpp-blue', desc: 'Never shed — labs, hostels' },
    { value: 'non_critical', label: 'Non-Critical', color: 'bg-gray-100 text-gray-600', desc: 'Sheddable during shortfalls' },
  ];

  if (tiers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BarChart3 size={32} className="mx-auto mb-2" />
        <p>No building tiers configured.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-vpp-blue" />
        Building Criticality Tiers
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        During a power shortfall, the system sheds non-critical loads first and protects critical buildings
        (labs, hostels) using the battery reserve floor.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Building</th>
              <th className="text-left py-3 font-medium text-gray-700">Current Tier</th>
              <th className="text-left py-3 font-medium text-gray-700">Change Tier</th>
              <th className="text-left py-3 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => {
              const isSaving = saving[`tier_${t.building_id}`];
              const currentTier = allTiers.find((at) => at.value === t.tier);
              return (
                <tr key={t.building_id} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-900">
                    {t.building_id.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${currentTier?.color || 'bg-gray-100 text-gray-600'}`}>
                      {currentTier?.label || t.tier}
                    </span>
                  </td>
                  <td className="py-3">
                    <select
                      defaultValue={t.tier}
                      id={`tier-select-${t.building_id}`}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-vpp-blue/30 outline-none"
                    >
                      {allTiers.map((at) => (
                        <option key={at.value} value={at.value}>
                          {at.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {allTiers.find((at) => at.value === t.tier)?.desc}
                    </p>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById(`tier-select-${t.building_id}`) as HTMLSelectElement;
                        onSave(t.building_id, el?.value || t.tier);
                      }}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-vpp-green text-white rounded-lg text-sm hover:bg-vpp-green/90 disabled:opacity-50 flex items-center gap-1 transition-all"
                    >
                      {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── VNM Tab ─────────────────────────────────────────────────────

function VnmTab({
  rules,
  saving,
  onSave,
}: {
  rules: VnmSharingRule[];
  saving: Record<string, boolean>;
  onSave: (building_id: string, ratio: number) => void;
}) {
  if (rules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Zap size={32} className="mx-auto mb-2" />
        <p>No VNM sharing rules configured.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Zap size={18} className="text-vpp-amber" />
        VNM Sharing Rules
      </h2>
      <p className="text-sm text-gray-500 mb-2">
        Per the <strong>RERC Third Amendment Regulations, 2025</strong>, these ratios determine how
        exported renewable energy credits are allocated across building connections.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        A higher ratio means the building receives a larger share of net-metering credits.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => {
          const isSaving = saving[`vnm_${r.building_id}`];
          return (
            <div key={r.building_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{r.building_id.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-400">
                  {r.rerc_rule_reference || 'RERC 2025'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue={r.sharing_ratio}
                  id={`vnm-input-${r.building_id}`}
                  className="flex-1 accent-vpp-blue"
                />
                <span
                  className="text-sm font-mono font-semibold text-vpp-blue w-12 text-right"
                  id={`vnm-label-${r.building_id}`}
                >
                  {(r.sharing_ratio * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() => {
                    const el = document.getElementById(`vnm-input-${r.building_id}`) as HTMLInputElement;
                    onSave(r.building_id, parseFloat(el?.value || String(r.sharing_ratio)));
                  }}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-vpp-green text-white rounded-lg text-sm hover:bg-vpp-green/90 disabled:opacity-50 flex items-center gap-1 transition-all"
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scenarios Tab ───────────────────────────────────────────────

const scenarioIcons: Record<string, React.ReactNode> = {
  mvp_day: <SunIcon size={20} />,
  cloudy_still_afternoon: <CloudIcon size={20} />,
  wind_fills_solar_gap: <WindIcon size={20} />,
  shortfall_protects_hostel: <ShieldIcon size={20} />,
};

function SunIcon({ size }: { size: number }) {
  return <Zap size={size} className="text-amber-500" />;
}

function CloudIcon({ size }: { size: number }) {
  return <AlertTriangle size={size} className="text-gray-400" />;
}

function ShieldIcon({ size }: { size: number }) {
  return <Shield size={size} className="text-vpp-blue" />;
}

function WindIcon({ size }: { size: number }) {
  return <Wind size={size} className="text-vpp-teal" />;
}

function ScenariosTab({
  scenarios,
  currentScenario,
  saving,
  onSwitch,
}: {
  scenarios: Scenario[];
  currentScenario: string;
  saving: Record<string, boolean>;
  onSwitch: (id: string) => void;
}) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Play size={32} className="mx-auto mb-2" />
        <p>No scenarios available. Backend may be unreachable.</p>
      </div>
    );
  }

  const scenarioDescriptions: Record<string, { icon: React.ReactNode; color: string }> = {
    mvp_day: { icon: <Zap size={24} className="text-amber-500" />, color: 'border-amber-300 bg-amber-50/50' },
    cloudy_still_afternoon: { icon: <CloudSvg size={24} className="text-gray-400" />, color: 'border-gray-300 bg-gray-50' },
    wind_fills_solar_gap: { icon: <WindSvg size={24} className="text-vpp-teal" />, color: 'border-vpp-teal/50 bg-teal-50/50' },
    shortfall_protects_hostel: { icon: <ShieldSvg size={24} className="text-vpp-blue" />, color: 'border-vpp-blue/50 bg-blue-50/50' },
  };

  function CloudSvg({ size, className }: { size: number; className: string }) {
    return <span className={`inline-flex ${className}`}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg></span>;
  }
  function WindSvg({ size, className }: { size: number; className: string }) {
    return <span className={`inline-flex ${className}`}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg></span>;
  }
  function ShieldSvg({ size, className }: { size: number; className: string }) {
    return <span className={`inline-flex ${className}`}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Play size={18} className="text-vpp-green" />
        Demo Scenarios
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Switch between pre-configured weather and demand scenarios to demonstrate the system's
        decision-making under different conditions. Each scenario changes cloud cover, wind speed, and demand.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((s) => {
          const isActive = currentScenario === s.id;
          const isSaving = saving[`scenario_${s.id}`];
          const desc = scenarioDescriptions[s.id] || { icon: <Zap size={24} />, color: 'border-gray-200' };

          return (
            <div
              key={s.id}
              className={`border-2 rounded-xl p-5 transition-all ${
                isActive
                  ? 'border-vpp-green bg-vpp-green/5 shadow-md'
                  : desc.color
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    {desc.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-[200px]">{s.description}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="px-2 py-0.5 bg-vpp-green text-white rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                <div>
                  <span className="block font-medium">Cloud Cover</span>
                  <span>{(s.cloud_cover_base * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="block font-medium">Wind Base</span>
                  <span>{s.wind_base.toFixed(1)} m/s</span>
                </div>
                <div>
                  <span className="block font-medium">Peak Demand</span>
                  <span>{s.demand_peak_kw} kW</span>
                </div>
              </div>
              <button
                onClick={() => onSwitch(s.id)}
                disabled={isSaving || isActive}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-vpp-green text-white hover:bg-vpp-green/90'
                }`}
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isActive ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Play size={14} />
                )}
                {isActive ? 'Currently Active' : 'Switch to This Scenario'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Export Tab ──────────────────────────────────────────────────

function ExportTab() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Download size={18} className="text-vpp-green" />
        Statutory Export
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Generate and download cost savings and carbon reduction reports in CSV or PDF format
        for statutory reporting requirements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={downloadCSV}
          className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-vpp-green/50 hover:bg-vpp-green/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-xl bg-vpp-green/10 flex items-center justify-center group-hover:bg-vpp-green/20 transition-colors">
            <FileSpreadsheet size={28} className="text-vpp-green" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Export as CSV</h3>
            <p className="text-sm text-gray-500 mt-1">
              Building snapshots + decision logs in spreadsheet format
            </p>
          </div>
        </button>

        <button
          onClick={downloadPDF}
          className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-vpp-blue/50 hover:bg-vpp-blue/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-xl bg-vpp-blue/10 flex items-center justify-center group-hover:bg-vpp-blue/20 transition-colors">
            <FileText size={28} className="text-vpp-blue" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Export as PDF</h3>
            <p className="text-sm text-gray-500 mt-1">
              Formatted statutory report with executive summary
            </p>
          </div>
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Report Contents</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Building snapshot: solar gen, wind gen, consumption, grid import/export, battery SoC</li>
          <li>• Decision log: action, confidence %, expected savings (INR), carbon reduction (kg CO₂)</li>
          <li>• Executive summary: total savings, total carbon reduction, renewable self-consumption %</li>
          <li>• Grounds: RERC Third Amendment Regulations, 2025</li>
          <li>• Emission factor: 0.74 kg CO₂/kWh (Rajasthan central grid average)</li>
        </ul>
      </div>
    </div>
  );
}
