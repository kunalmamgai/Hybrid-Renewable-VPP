/**
 * API client for the SURYA backend.
 * Uses Axios for REST calls and native WebSocket for real-time updates.
 */
import axios from 'axios';
import type {
  Decision,
  DecisionStats,
  ExportStats,
  AlertThreshold,
  BuildingTierConfig,
  VnmSharingRule,
  ScenariosResponse,
  ForceCycleResponse,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_REQUEST_TIMEOUT_MS = 30_000;
const API_COLD_START_TIMEOUT_MS = 120_000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
});

let apiReadyPromise: Promise<void> | null = null;

/**
 * Wake the API before sending an authentication request. Render free services can
 * take 50 seconds or more to resume, so a shared readiness request prevents every
 * sign-in attempt from failing at the old 10-second client timeout.
 */
export const prepareApi = (): Promise<void> => {
  if (!apiReadyPromise) {
    apiReadyPromise = api
      .get('/health', {
        timeout: API_COLD_START_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 500,
      })
      .then(() => undefined)
      .catch((error: unknown) => {
        apiReadyPromise = null;
        throw error;
      });
  }

  return apiReadyPromise;
};

export const AUTH_TOKEN_KEY = 'surya_access_token';

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  auth_provider: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
};

export const signUp = async (payload: {
  full_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  await prepareApi();
  const response = await api.post<AuthResponse>('/api/v1/auth/signup', payload);
  return response.data;
};

export const signIn = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  await prepareApi();
  const response = await api.post<AuthResponse>('/api/v1/auth/login', payload);
  return response.data;
};

export const signInWithGoogle = async (credential: string): Promise<AuthResponse> => {
  await prepareApi();
  const response = await api.post<AuthResponse>('/api/v1/auth/google', { credential });
  return response.data;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>('/api/v1/auth/me');
  return response.data;
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
  window.open(`${API_BASE_URL}/api/v1/export/csv`, '_blank');
};

export const downloadPDF = (): void => {
  window.open(`${API_BASE_URL}/api/v1/export/pdf`, '_blank');
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
    payload
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
