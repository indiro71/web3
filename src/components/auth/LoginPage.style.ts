import styled, { createGlobalStyle } from 'styled-components';

export const LoginGlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primaryText};
    color-scheme: ${({ theme }) => theme.mode};
  }
`;

export const LoginPageShell = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
  background: ${({ theme }) => theme.colors.pageGradient};
`;

export const LoginPanel = styled.form`
  width: min(100%, 390px);
  display: grid;
  gap: 14px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  padding: 22px;
  box-shadow: ${({ theme }) => theme.colors.elevatedShadow};
`;

export const LoginTitle = styled.h1`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.primaryText};
  font-size: 1.35rem;
  line-height: 1.2;
`;

export const FieldGroup = styled.label`
  display: grid;
  gap: 7px;
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.84rem;
  font-weight: 800;
`;

export const LoginInput = styled.input`
  height: 40px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.primaryText};
  padding: 0 11px;
  outline: none;
  font-size: 0.95rem;

  &:focus {
    border-color: ${({ theme }) => theme.colors.activeBorder};
    box-shadow: ${({ theme }) => theme.colors.focusShadow};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.mutedText};
  }
`;

export const LoginButton = styled.button`
  height: 40px;
  border: 0;
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.buttonDarkBackground};
  color: ${({ theme }) => theme.colors.buttonDarkText};
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.58;
  }
`;

export const LoginError = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.dangerBackground};
  color: ${({ theme }) => theme.colors.dangerText};
  padding: 10px 11px;
  font-size: 0.86rem;
  font-weight: 800;
`;
