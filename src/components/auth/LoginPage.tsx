import { useState, type FormEvent } from 'react';
import {
  FieldGroup,
  LoginButton,
  LoginError,
  LoginGlobalStyle,
  LoginInput,
  LoginPageShell,
  LoginPanel,
  LoginTitle,
} from './LoginPage.style';

interface LoginPageProps {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ error, loading, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await onLogin(email.trim(), password);
    } catch {
      return;
    }
  };

  return (
    <>
      <LoginGlobalStyle />
      <LoginPageShell>
        <LoginPanel onSubmit={handleSubmit}>
          <LoginTitle>Sign in</LoginTitle>
          {error && <LoginError role="alert">{error}</LoginError>}
          <FieldGroup>
            Email
            <LoginInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </FieldGroup>
          <FieldGroup>
            Password
            <LoginInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </FieldGroup>
          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </LoginButton>
        </LoginPanel>
      </LoginPageShell>
    </>
  );
}
