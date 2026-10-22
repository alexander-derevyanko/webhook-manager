import { getFingerprint } from '../../../shared/api/fingerprint';
import { apiRequest } from '../../../shared/api/httpClient';
import type { User } from '../../../shared/api/types';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  device_session_token: string;
}

export async function login(input: LoginInput): Promise<User> {
  const fingerprint = getFingerprint();

  const loginResponse = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Token': 'mock-captcha-token',
    },
    body: JSON.stringify({
      ...input,
      fingerprint,
    }),
  });

  await apiRequest<void>('/auth/token/issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_session_token: loginResponse.device_session_token,
      fingerprint,
    }),
  });

  return apiRequest<User>('/v1/me');
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/v1/me');
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/token/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint: getFingerprint(),
    }),
  });
}
