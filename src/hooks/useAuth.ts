import { useCallback, useState } from 'react';
import { login as loginRequest } from '../api/auth';
import { clearAuthToken, getStoredAuthToken, storeAuthToken } from '../auth/session';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await loginRequest({ email, password });
      storeAuthToken(response.token);
      setToken(response.token);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Failed to sign in');
      throw loginError;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setToken(null);
  }, []);

  return {
    error,
    loading,
    login,
    logout,
    token,
  };
}
