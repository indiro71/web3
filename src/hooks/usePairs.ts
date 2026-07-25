import { useCallback, useEffect, useState } from 'react';
import io from 'socket.io-client';
import {
  API_BASE_URL,
  fetchPairs,
  mergePairUpdates,
  PAIRS_SOCKET_NAMESPACE,
  PAIRS_UPDATED_EVENT,
} from '../api/pairs';
import type { Pair } from '../types/pair';

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function usePairs() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadPairs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextPairs = await fetchPairs();
      setPairs(nextPairs);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load pairs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPairs();
  }, [loadPairs]);

  useEffect(() => {
    const socket = io(`${API_BASE_URL}${PAIRS_SOCKET_NAMESPACE}`, {
      reconnection: true,
      transports: ['websocket', 'polling'],
    });

    const handleConnect = () => setSocketStatus('connected');
    const handleDisconnect = () => setSocketStatus('disconnected');
    const handleConnectError = () => setSocketStatus('error');
    const handlePairsUpdate = (updatedPairs: Pair[]) => {
      setPairs((currentPairs) => mergePairUpdates(currentPairs, updatedPairs));
      setLastUpdated(new Date());
      setError('');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(PAIRS_UPDATED_EVENT, handlePairsUpdate);

    return () => {
      socket.removeListener('connect', handleConnect);
      socket.removeListener('disconnect', handleDisconnect);
      socket.removeListener('connect_error', handleConnectError);
      socket.removeListener(PAIRS_UPDATED_EVENT, handlePairsUpdate);
      socket.close();
    };
  }, []);

  return {
    pairs,
    loading,
    error,
    reload: loadPairs,
    socketStatus,
    lastUpdated,
  };
}
