import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPairs, UnauthorizedError } from '../api/pairs';
import type { Pair } from '../types/pair';

type PollingStatus = 'refreshing' | 'active' | 'error' | 'offline';

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
    if (!navigator.onLine) {
      setPollingStatus('offline');
      setError('Нет сети. Данные могут быть устаревшими');
      setLoading(false);
      return;
    }
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
    const resume = () => {
      if (!document.hidden) void refreshPairs(false);
    };
    const offline = () => {
      setPollingStatus('offline');
      setError('Нет сети. Данные могут быть устаревшими');
    };
    const intervalId = window.setInterval(() => {
      if (!document.hidden) void refreshPairs(false);
    }, pollingIntervalMs);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', offline);
    window.addEventListener('pageshow', resume);
    navigator.serviceWorker?.addEventListener('message', resume);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', offline);
      window.removeEventListener('pageshow', resume);
      navigator.serviceWorker?.removeEventListener('message', resume);
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
