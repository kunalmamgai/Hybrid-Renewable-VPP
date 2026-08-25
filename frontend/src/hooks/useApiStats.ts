/**
 * Shared REST stats — decision stats and export stats with manual refresh.
 * One-shot fetches on mount (matching the existing app pattern).
 */
import { useCallback, useEffect, useState } from 'react';
import { getDecisionStats, getExportStats } from '../services/apiClient';
import type { DecisionStats, ExportStats } from '../types';

export function useApiStats() {
  const [decisionStats, setDecisionStats] = useState<DecisionStats | null>(null);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, e] = await Promise.allSettled([getDecisionStats(), getExportStats()]);
      if (d.status === 'fulfilled') setDecisionStats(d.value);
      if (e.status === 'fulfilled') setExportStats(e.value);
      if (d.status === 'rejected' && e.status === 'rejected') {
        setError('Unable to reach the SURYA backend.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { decisionStats, exportStats, loading, error, refresh };
}
