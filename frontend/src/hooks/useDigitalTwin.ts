/**
 * Digital Twin data hook — fetches aggregated stats from the API.
 */
import { useEffect, useState } from 'react';
import {
  getDecisionStats,
  getExportStats,
} from '../services/apiClient';
import type {
  DecisionStats,
  ExportStats,
} from '../types';

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
