const AUTH_TOKEN_STORAGE_KEY = 'web3.auth.token';

export const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const storeAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};
