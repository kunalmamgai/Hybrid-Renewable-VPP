/**
 * Digital Twin data hook — fetches building, turbine, and battery data from the API.
 */
import { useEffect, useState } from 'react';
import {
  getBuildings,
  getTurbines,
  getBatteries,
  getCampusState,
  getLatestDecision,
  getDecisionStats,
  getExportStats,
} from '../services/apiClient';
import type {
  BuildingTwin,
  TurbineTwin,
  BatteryTwin,
  CampusState,
  Decision,
  DecisionStats,
  ExportStats,
  ScenariosResponse,
} from '../types';
import { getScenarios } from '../services/apiClient';

export function useBuildings() {
  const [buildings, setBuildings] = useState<BuildingTwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await getBuildings();
      setBuildings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);
  return { buildings, loading, error, refetch };
}

export function useCampusState() {
  const [state, setState] = useState<CampusState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampusState().then(setState).finally(() => setLoading(false));
  }, []);

  return { campus: state, loading };
}

export function useLatestDecision() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await getLatestDecision();
      setDecision(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);
  return { decision, loading, refetch };
}

export function useDecisionStats() {
  const [stats, setStats] = useState<DecisionStats | null>(null);
  useEffect(() => { getDecisionStats().then(setStats); }, []);
  return { stats };
}

export function useExportStats() {
  const [stats, setStats] = useState<ExportStats | null>(null);
  useEffect(() => { getExportStats().then(setStats); }, []);
  return { stats };
}

export function useScenarios() {
  const [data, setData] = useState<ScenariosResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      setLoading(true);
      const result = await getScenarios();
      setData(result);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);
  return { scenarios: data?.scenarios || [], currentScenario: data?.current_scenario || '', loading, refetch };
}
