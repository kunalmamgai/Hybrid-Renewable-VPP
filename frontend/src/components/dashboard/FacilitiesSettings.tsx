/**
 * Facilities Settings — alert thresholds, criticality tier editor,
 * VNM sharing rules, demo scenario controls, and statutory export.
 * Fully wired to backend API with controlled React state.
 * Glass-morphism style matching the landing page aesthetic.
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
  updateVnmSharingRule,
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
    } catch {
      console.error('Failed to load settings');
    }
  }, []);

  // Load all settings on mount
  useEffect(() => {
    void loadAll();
  }, [loadAll]);

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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? null)
          : null;
      showNotification('error', detail || 'Failed to switch scenario');
    } finally {
      setSaving(prev => ({ ...prev, [`scenario_${scenarioId}`]: false }));
    }
  };

  const handleForceCycle = async () => {
    setSaving(prev => ({ ...prev, force_cycle: true }));
    try {
      await forceCycle();
      showNotification('success', 'Decision cycle triggered successfully');
    } catch {
      showNotification('error', 'Failed to trigger decision cycle');
    } finally {
      setSaving(prev => ({ ...prev, force_cycle: false }));
    }
  };

  return (
    <div className="page-bg min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
              <Settings size={24} className="text-vpp-emerald" />
              Facilities Settings
            </h1>
            <p className="text-sm text-white/50 mt-1.5">
              Configure alerts, building priorities, and demo scenarios
            </p>
          </div>
          <button
            onClick={handleForceCycle}
            disabled={saving.force_cycle}
            className="px-4 py-2 bg-vpp-emerald text-white rounded-xl hover:bg-vpp-emerald-light flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition-all duration-200 shadow-emerald-glow"
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
            className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all ${
              notification.type === 'success'
                ? 'glass-card-emerald text-white border-vpp-emerald/30'
                : 'glass-card-dark border-red-400/30 text-red-300'
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
        <div className="flex gap-1 mb-6 glass-card p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-vpp-emerald text-white shadow-emerald-glow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-card rounded-2xl p-6">
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
      <div className="text-center py-8 text-white/40">
        <AlertTriangle size={32} className="mx-auto mb-2" />
        <p className="font-medium">No alert thresholds configured. Backend may be unreachable.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-vpp-navy mb-2 flex items-center gap-2">
        <AlertTriangle size={18} className="text-vpp-amber" />
        Alert Thresholds
      </h2>
      <p className="text-sm text-vpp-navy-muted mb-6">
        Set the thresholds that trigger alerts. The system will warn when battery SoC drops below the warning level,
        and enter emergency mode when it falls below the critical level.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {thresholds.map((t) => {
          const isSaving = saving[t.id];
          return (
            <div
              key={t.id}
              className={`border rounded-xl p-4 transition-all ${
                t.severity === 'critical'
                  ? 'border-red-200/50 bg-red-50/20'
                  : 'border-white/20 bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-vpp-navy">{t.name}</span>
                  {t.description && (
                    <p className="text-xs text-vpp-navy-muted mt-0.5">{t.description}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider ${
                    t.severity === 'critical'
                      ? 'bg-red-100/50 text-red-600'
                      : 'bg-amber-100/50 text-amber-600'
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
                  className="glass-input w-24 px-3 py-1.5 rounded-xl text-sm text-vpp-navy focus:outline-none"
                  step={0.5}
                />
                <span className="text-sm text-vpp-navy-muted">{t.unit}</span>
                <label className="flex items-center gap-1.5 text-sm text-vpp-navy-muted ml-auto">
                  <input
                    type="checkbox"
                    defaultChecked={t.active}
                    className="rounded border-white/30 text-vpp-emerald focus:ring-vpp-emerald"
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
                  className="px-3 py-1.5 bg-vpp-emerald text-white rounded-xl text-sm font-semibold hover:bg-vpp-emerald-light disabled:opacity-50 flex items-center gap-1 transition-all"
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
  if (tiers.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <BarChart3 size={32} className="mx-auto mb-2" />
        <p className="font-medium">No building tiers configured.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-vpp-navy mb-2 flex items-center gap-2">
        <BarChart3 size={18} className="text-vpp-blue" />
        Building Criticality Tiers
      </h2>
      <p className="text-sm text-vpp-navy-muted mb-6">
        During a power shortfall, the system sheds non-critical loads first and protects critical buildings
        (labs, hostels) using the battery reserve floor.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left py-3 px-2 text-[10px] font-bold text-vpp-navy-muted uppercase tracking-wider">Building</th>
              <th className="text-left py-3 px-2 text-[10px] font-bold text-vpp-navy-muted uppercase tracking-wider">Current Tier</th>
              <th className="text-left py-3 px-2 text-[10px] font-bold text-vpp-navy-muted uppercase tracking-wider">New Tier</th>
              <th className="text-right py-3 px-2 text-[10px] font-bold text-vpp-navy-muted uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => {
              const isSaving = saving[`tier_${tier.building_id}`];
              return (
                <tr key={tier.building_id} className="border-b border-white/10">
                  <td className="py-3 px-2">
                    <span className="font-semibold text-vpp-navy">{tier.building_id.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${
                      tier.tier === 'critical'
                        ? 'bg-vpp-blue/15 text-vpp-blue'
                        : 'bg-vpp-navy-muted/10 text-vpp-navy-muted'
                    }`}>
                      {tier.tier === 'critical' ? 'CRITICAL' : 'NON-CRITICAL'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <select
                      defaultValue={tier.tier}
                      id={`tier-select-${tier.building_id}`}
                      className="glass-input px-3 py-1.5 rounded-xl text-xs text-vpp-navy focus:outline-none"
                    >
                      <option value="critical">Critical</option>
                      <option value="non_critical">Non-Critical</option>
                    </select>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => {
                        const el = document.getElementById(`tier-select-${tier.building_id}`) as HTMLSelectElement;
                        onSave(tier.building_id, el?.value || tier.tier);
                      }}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-vpp-emerald text-white rounded-xl text-xs font-semibold hover:bg-vpp-emerald-light disabled:opacity-50 flex items-center gap-1 ml-auto transition-all"
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

      {/* Tier Legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-vpp-blue/40"></div>
          <div>
            <span className="text-xs font-bold text-vpp-navy">Critical</span>
            <p className="text-[10px] text-vpp-navy-muted">Never shed — labs, hostels protected by reserve floor</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-vpp-navy-muted/30"></div>
          <div>
            <span className="text-xs font-bold text-vpp-navy">Non-Critical</span>
            <p className="text-[10px] text-vpp-navy-muted">Sheddable during shortfalls to protect critical loads</p>
          </div>
        </div>
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
      <div className="text-center py-8 text-white/40">
        <Zap size={32} className="mx-auto mb-2" />
        <p className="font-medium">No VNM sharing rules configured.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-vpp-navy mb-2 flex items-center gap-2">
        <Zap size={18} className="text-vpp-emerald" />
        VNM/GNM Sharing Rules
      </h2>
      <p className="text-sm text-vpp-navy-muted mb-6">
        Per RERC Third Amendment Regulations, 2025 — Virtual Net Metering credits are allocated
        proportionally to participating buildings. Adjust the sharing ratio per building.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => {
          const isSaving = saving[`vnm_${r.building_id}`];
          return (
            <div key={r.building_id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-vpp-navy">{r.building_id.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-vpp-navy-muted font-medium tracking-wider">
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
                  className="flex-1 accent-vpp-emerald"
                />
                <span
                  className="text-sm font-bold text-vpp-emerald font-mono w-12 text-right"
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
                  className="px-3 py-1.5 bg-vpp-emerald text-white rounded-xl text-sm font-semibold hover:bg-vpp-emerald-light disabled:opacity-50 flex items-center gap-1 transition-all"
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

function SunIcon({ size }: { size: number }) {
  return <Zap size={size} className="text-vpp-amber" />;
}

function CloudIcon({ size }: { size: number }) {
  return <AlertTriangle size={size} className="text-white/30" />;
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
      <div className="text-center py-8 text-white/40">
        <Play size={32} className="mx-auto mb-2" />
        <p className="font-medium">No scenarios available. Backend may be unreachable.</p>
      </div>
    );
  }

  const scenarioDescriptions: Record<string, { icon: React.ReactNode; color: string; activeColor: string }> = {
    mvp_day: { icon: <SunIcon size={24} />, color: 'border-amber-300/40 bg-amber-50/10', activeColor: 'border-vpp-emerald bg-vpp-emerald/10' },
    cloudy_still_afternoon: { icon: <CloudIcon size={24} />, color: 'border-white/20 bg-white/5', activeColor: 'border-vpp-emerald bg-vpp-emerald/10' },
    wind_fills_solar_gap: { icon: <WindIcon size={24} />, color: 'border-vpp-teal/30 bg-teal-50/10', activeColor: 'border-vpp-emerald bg-vpp-emerald/10' },
    shortfall_protects_hostel: { icon: <ShieldIcon size={24} />, color: 'border-vpp-blue/30 bg-blue-50/10', activeColor: 'border-vpp-emerald bg-vpp-emerald/10' },
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-vpp-navy mb-2 flex items-center gap-2">
        <Play size={18} className="text-vpp-emerald" />
        Demo Scenarios
      </h2>
      <p className="text-sm text-vpp-navy-muted mb-6">
        Switch between pre-configured weather and demand scenarios to demonstrate the system's
        decision-making under different conditions. Each scenario changes cloud cover, wind speed, and demand.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((s) => {
          const isActive = currentScenario === s.id;
          const isSaving = saving[`scenario_${s.id}`];
          const desc = scenarioDescriptions[s.id] || { icon: <Zap size={24} />, color: 'border-white/20', activeColor: 'border-vpp-emerald bg-vpp-emerald/10' };

          return (
            <div
              key={s.id}
              className={`border-2 rounded-2xl p-5 transition-all duration-200 ${
                isActive
                  ? desc.activeColor + ' shadow-emerald-glow-sm'
                  : desc.color
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
                    {desc.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-vpp-navy">{s.name}</h3>
                    <p className="text-[11px] text-vpp-navy-muted mt-0.5 max-w-[200px] leading-relaxed">{s.description}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="px-2.5 py-0.5 bg-vpp-emerald text-white rounded-full text-[10px] font-bold flex items-center gap-1 tracking-wider">
                    <CheckCircle2 size={12} /> ACTIVE
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-vpp-navy-muted mb-3">
                <div>
                  <span className="block font-bold">Cloud Cover</span>
                  <span className="font-mono">{(s.cloud_cover_base * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="block font-bold">Wind Base</span>
                  <span className="font-mono">{s.wind_base.toFixed(1)} m/s</span>
                </div>
                <div>
                  <span className="block font-bold">Peak Demand</span>
                  <span className="font-mono">{s.demand_peak_kw} kW</span>
                </div>
              </div>
              <button
                onClick={() => onSwitch(s.id)}
                disabled={isSaving || isActive}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-white/10 text-vpp-navy-muted cursor-default'
                    : 'bg-vpp-emerald text-white hover:bg-vpp-emerald-light shadow-emerald-glow-sm'
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
      <h2 className="text-lg font-bold text-vpp-navy mb-2 flex items-center gap-2">
        <Download size={18} className="text-vpp-emerald" />
        Statutory Export
      </h2>
      <p className="text-sm text-vpp-navy-muted mb-6">
        Generate and download cost savings and carbon reduction reports in CSV or PDF format
        for statutory reporting requirements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={downloadCSV}
          className="glass-card rounded-2xl p-6 flex items-center gap-4 hover:border-vpp-emerald/40 transition-all duration-200 group text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-vpp-emerald/15 flex items-center justify-center group-hover:bg-vpp-emerald/25 transition-colors">
            <FileSpreadsheet size={28} className="text-vpp-emerald" />
          </div>
          <div>
            <h3 className="font-bold text-vpp-navy">Export as CSV</h3>
            <p className="text-sm text-vpp-navy-muted mt-1">
              Building snapshots + decision logs in spreadsheet format
            </p>
          </div>
        </button>

        <button
          onClick={downloadPDF}
          className="glass-card rounded-2xl p-6 flex items-center gap-4 hover:border-vpp-blue/40 transition-all duration-200 group text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-vpp-blue/15 flex items-center justify-center group-hover:bg-vpp-blue/25 transition-colors">
            <FileText size={28} className="text-vpp-blue" />
          </div>
          <div>
            <h3 className="font-bold text-vpp-navy">Export as PDF</h3>
            <p className="text-sm text-vpp-navy-muted mt-1">
              Formatted statutory report with executive summary
            </p>
          </div>
        </button>
      </div>

      <div className="mt-8 glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-vpp-navy mb-2">Report Contents</h3>
        <ul className="text-xs text-vpp-navy-muted space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-vpp-emerald mt-0.5">•</span>
            <span>Building snapshot: solar gen, wind gen, consumption, grid import/export, battery SoC</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-vpp-emerald mt-0.5">•</span>
            <span>Decision log: action, confidence %, expected savings (INR), carbon reduction (kg CO₂)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-vpp-emerald mt-0.5">•</span>
            <span>Executive summary: total savings, total carbon reduction, renewable self-consumption %</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-vpp-emerald mt-0.5">•</span>
            <span>Grounds: RERC Third Amendment Regulations, 2025</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-vpp-emerald mt-0.5">•</span>
            <span>Emission factor: 0.74 kg CO₂/kWh (Rajasthan central grid average)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
