import { API_BASE_URL } from './pairs';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message?: string;
}

const readResponseBody = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to sign in');
  }

  return data;
}
