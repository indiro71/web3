import { LoginPage } from './components/auth/LoginPage';
import { PairsDashboard } from './components/pairs/PairsDashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { error, loading, login, logout, token } = useAuth();

  if (!token) {
    return <LoginPage error={error} loading={loading} onLogin={login} />;
  }

  return <PairsDashboard authToken={token} onLogout={logout} />;
}

export default App;
