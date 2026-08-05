/**
 * API client for the Hybrid Renewable VPP Platform backend.
 * Uses Axios for REST calls and native WebSocket for real-time updates.
 */
import axios from 'axios';
import type {
  BuildingTwin,
  TurbineTwin,
  BatteryTwin,
  CampusState,
  Decision,
  DecisionStats,
  ExportStats,
  HealthStatus,
  LiveSnapshot,
  SchedulerHealth,
  AlertThreshold,
  BuildingTierConfig,
  VnmSharingRule,
  ScenariosResponse,
  ForceCycleResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

// ============================================================
// Health & Status
// ============================================================

export const getHealth = async (): Promise<HealthStatus> => {
  const resp = await api.get<HealthStatus>('/health');
  return resp.data;
};

export const getSchedulerHealth = async (): Promise<SchedulerHealth> => {
  const resp = await api.get<SchedulerHealth>('/health/scheduler');
  return resp.data;
};

// ============================================================
// Digital Twin
// ============================================================

export const getBuildings = async (): Promise<BuildingTwin[]> => {
  const resp = await api.get<BuildingTwin[]>('/api/v1/digital-twin/buildings');
  return resp.data;
};

export const getBuilding = async (id: string): Promise<BuildingTwin> => {
  const resp = await api.get<BuildingTwin>(`/api/v1/digital-twin/buildings/${id}`);
  return resp.data;
};

export const getTurbines = async (): Promise<TurbineTwin[]> => {
  const resp = await api.get<TurbineTwin[]>('/api/v1/digital-twin/turbines');
  return resp.data;
};

export const getBatteries = async (): Promise<BatteryTwin[]> => {
  const resp = await api.get<BatteryTwin[]>('/api/v1/digital-twin/batteries');
  return resp.data;
};

export const getCampusState = async (): Promise<CampusState> => {
  const resp = await api.get<CampusState>('/api/v1/digital-twin/campus');
  return resp.data;
};

export const getLiveSnapshot = async (): Promise<LiveSnapshot> => {
  const resp = await api.get<LiveSnapshot>('/api/v1/digital-twin/live');
  return resp.data;
};

// ============================================================
// Decisions
// ============================================================

export const getDecisions = async (
  limit: number = 50,
  buildingId?: string,
): Promise<Decision[]> => {
  const params = buildingId ? { building_id: buildingId, limit } : { limit };
  const resp = await api.get<Decision[]>('/api/v1/decisions', { params });
  return resp.data;
};

export const getLatestDecision = async (): Promise<Decision | null> => {
  const resp = await api.get<Decision | null>('/api/v1/decisions/latest');
  return resp.data;
};

export const getDecisionStats = async (): Promise<DecisionStats> => {
  const resp = await api.get<DecisionStats>('/api/v1/decisions/stats');
  return resp.data;
};

// ============================================================
// Export
// ============================================================

export const getExportStats = async (): Promise<ExportStats> => {
  const resp = await api.get<ExportStats>('/api/v1/export/stats');
  return resp.data;
};

export const downloadCSV = (): void => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  window.open(`${baseUrl}/api/v1/export/csv`, '_blank');
};

export const downloadPDF = (): void => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  window.open(`${baseUrl}/api/v1/export/pdf`, '_blank');
};

// ============================================================
// Settings — Alert Thresholds
// ============================================================

export const getAlertThresholds = async (): Promise<AlertThreshold[]> => {
  const resp = await api.get<AlertThreshold[]>('/api/v1/settings/alert-thresholds');
  return resp.data;
};

export const updateAlertThreshold = async (
  id: string,
  payload: { threshold_value: number; active: boolean }
): Promise<AlertThreshold> => {
  const resp = await api.put<AlertThreshold>(`/api/v1/settings/alert-thresholds/${id}`, payload);
  return resp.data;
};

// ============================================================
// Settings — Building Tiers
// ============================================================

export const getBuildingTiers = async (): Promise<BuildingTierConfig[]> => {
  const resp = await api.get<BuildingTierConfig[]>('/api/v1/settings/building-tiers');
  return resp.data;
};

export const updateBuildingTier = async (
  building_id: string,
  payload: { tier: string; description?: string }
): Promise<BuildingTierConfig> => {
  const resp = await api.put<BuildingTierConfig>(
    `/api/v1/settings/building-tiers/${building_id}`,
    payload
  );
  return resp.data;
};

// ============================================================
// Settings — VNM Sharing Rules
// ============================================================

export const getVnmSharingRules = async (): Promise<VnmSharingRule[]> => {
  const resp = await api.get<VnmSharingRule[]>('/api/v1/settings/vnm-sharing-rules');
  return resp.data;
};

export const updateVnmSharingRule = async (
  building_id: string,
  payload: { sharing_ratio: number }
): Promise<VnmSharingRule> => {
  const resp = await api.put<VnmSharingRule>(
    `/api/v1/settings/vnm-sharing-rules/${building_id}`,
    { ...payload, building_id }
  );
  return resp.data;
};

// ============================================================
// Scenario Control
// ============================================================

export const getScenarios = async (): Promise<ScenariosResponse> => {
  const resp = await api.get<ScenariosResponse>('/api/v1/settings/scenarios');
  return resp.data;
};

export const switchScenario = async (scenario_id: string): Promise<{ scenario: string; message: string }> => {
  const resp = await api.post(`/api/v1/settings/scenarios/${scenario_id}`);
  return resp.data;
};

// ============================================================
// Force Cycle (manual trigger)
// ============================================================

export const forceCycle = async (): Promise<ForceCycleResponse> => {
  const resp = await api.post<ForceCycleResponse>('/api/v1/settings/force-cycle');
  return resp.data;
};
