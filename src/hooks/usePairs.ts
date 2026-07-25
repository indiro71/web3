import { useCallback, useEffect, useState } from 'react';
import io from 'socket.io-client';
import {
  fetchPairs,
  mergePairUpdates,
  PAIRS_SOCKET_URL,
  PAIRS_UPDATED_EVENT,
  SOCKET_IO_PATH,
  UnauthorizedError,
} from '../api/pairs';
import type { Pair } from '../types/pair';

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UsePairsOptions {
  onUnauthorized: () => void;
  token: string;
}

export function usePairs({ onUnauthorized, token }: UsePairsOptions) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadPairs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextPairs = await fetchPairs(token);
      setPairs(nextPairs);
      setLastUpdated(new Date());
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }

      setError(requestError instanceof Error ? requestError.message : 'Failed to load pairs');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, token]);

  useEffect(() => {
    loadPairs();
  }, [loadPairs]);

  useEffect(() => {
    const socket = io(PAIRS_SOCKET_URL, {
      path: SOCKET_IO_PATH,
      query: {
        token,
      },
      reconnection: true,
      transports: ['websocket'],
    });

    const handleConnect = () => setSocketStatus('connected');
    const handleDisconnect = () => setSocketStatus('disconnected');
    const handleConnectError = () => setSocketStatus('error');
    const handleAuthError = () => onUnauthorized();
    const handlePairsUpdate = (updatedPairs: Pair[]) => {
      setPairs((currentPairs) => mergePairUpdates(currentPairs, updatedPairs));
      setLastUpdated(new Date());
      setError('');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('auth:error', handleAuthError);
    socket.on(PAIRS_UPDATED_EVENT, handlePairsUpdate);

    return () => {
      socket.removeListener('connect', handleConnect);
      socket.removeListener('disconnect', handleDisconnect);
      socket.removeListener('connect_error', handleConnectError);
      socket.removeListener('auth:error', handleAuthError);
      socket.removeListener(PAIRS_UPDATED_EVENT, handlePairsUpdate);
      socket.close();
    };
  }, [onUnauthorized, token]);

  return {
    pairs,
    loading,
    error,
    reload: loadPairs,
    socketStatus,
    lastUpdated,
  };
}
