import { useEffect, useState } from 'react';
import { getDecisions } from '../services/apiClient';
import type { Decision } from '../types';

export function useDecisions(limit: number = 50) {
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await getDecisions(limit);
      setDecisions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);
  return { decisions, loading, error, refetch };
}
