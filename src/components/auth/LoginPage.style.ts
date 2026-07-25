import styled, { createGlobalStyle } from 'styled-components';

export const LoginGlobalStyle = createGlobalStyle`
  body {
    background: #eef2f5;
    color: #18202a;
  }
`;

export const LoginPageShell = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
  background: linear-gradient(180deg, #f7f9fb 0%, #edf2f6 100%);
`;

export const LoginPanel = styled.form`
  width: min(100%, 390px);
  display: grid;
  gap: 14px;
  border: 1px solid #d9e1e8;
  border-radius: 8px;
  background: #ffffff;
  padding: 22px;
  box-shadow: 0 18px 50px rgba(30, 41, 59, 0.1);
`;

export const LoginTitle = styled.h1`
  margin: 0 0 4px;
  color: #111827;
  font-size: 1.35rem;
  line-height: 1.2;
`;

export const FieldGroup = styled.label`
  display: grid;
  gap: 7px;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
`;

export const LoginInput = styled.input`
  height: 40px;
  border: 1px solid #d5dde6;
  border-radius: 7px;
  background: #ffffff;
  color: #111827;
  padding: 0 11px;
  outline: none;
  font-size: 0.95rem;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`;

export const LoginButton = styled.button`
  height: 40px;
  border: 0;
  border-radius: 7px;
  background: #1f2937;
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.58;
  }
`;

export const LoginError = styled.div`
  border: 1px solid #fecaca;
  border-radius: 7px;
  background: #fff1f2;
  color: #991b1b;
  padding: 10px 11px;
  font-size: 0.86rem;
  font-weight: 800;
`;
