import { useMemo, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { LoginPage } from './components/auth/LoginPage';
import { PairsDashboard } from './components/pairs/PairsDashboard';
import {
  getStoredThemeMode,
  getThemeByMode,
  storeThemeMode,
  type AppThemeMode,
} from './components/pairs/PairsDashboard.theme';
import { useAuth } from './hooks/useAuth';

function App() {
  const { error, loading, login, logout, token } = useAuth();
  const [themeMode, setThemeMode] = useState<AppThemeMode>(() => getStoredThemeMode());
  const theme = useMemo(() => getThemeByMode(themeMode), [themeMode]);

  const handleThemeToggle = () => {
    setThemeMode((previousThemeMode) => {
      const nextThemeMode = previousThemeMode === 'dark' ? 'light' : 'dark';

      storeThemeMode(nextThemeMode);

      return nextThemeMode;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      {!token ? (
        <LoginPage error={error} loading={loading} onLogin={login} />
      ) : (
        <PairsDashboard
          authToken={token}
          themeMode={themeMode}
          onLogout={logout}
          onThemeToggle={handleThemeToggle}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
