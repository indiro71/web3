import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPairs, UnauthorizedError } from '../api/pairs';
import type { Pair } from '../types/pair';

type PollingStatus = 'refreshing' | 'active' | 'error';

const pollingIntervalMs = 5000;

interface UsePairsOptions {
  onUnauthorized: () => void;
  token: string;
}

export function usePairs({ onUnauthorized, token }: UsePairsOptions) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>('refreshing');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestInFlight = useRef(false);

  const refreshPairs = useCallback(async (showLoading: boolean) => {
    if (requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;

    if (showLoading) {
      setLoading(true);
    }

    setPollingStatus('refreshing');
    setError('');

    try {
      const nextPairs = await fetchPairs(token);
      setPairs(nextPairs);
      setLastUpdated(new Date());
      setPollingStatus('active');
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }

      setError(requestError instanceof Error ? requestError.message : 'Failed to load pairs');
      setPollingStatus('error');
    } finally {
      requestInFlight.current = false;

      if (showLoading) {
        setLoading(false);
      }
    }
  }, [onUnauthorized, token]);

  const loadPairs = useCallback(() => refreshPairs(true), [refreshPairs]);

  useEffect(() => {
    void refreshPairs(true);
    const intervalId = window.setInterval(() => {
      void refreshPairs(false);
    }, pollingIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshPairs]);

  return {
    pairs,
    loading,
    error,
    reload: loadPairs,
    pollingStatus,
    lastUpdated,
  };
}
