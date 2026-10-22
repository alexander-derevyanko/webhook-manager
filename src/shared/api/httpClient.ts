import { getCsrfToken } from './csrf';
import { getFingerprint } from './fingerprint';

const ROTATE_ENDPOINT = '/auth/token/rotate';

export class HttpError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(status: number, data: unknown) {
    super(`HTTP request failed with status ${status}`);

    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

type AuthFailureHandler = () => void;

let authFailureHandler: AuthFailureHandler | null = null;
let authFailureNotified = false;
let rotationRequest: Promise<void> | null = null;

export function setAuthFailureHandler(handler: AuthFailureHandler): void {
  authFailureHandler = handler;
}

export function resetAuthFailureState(): void {
  authFailureNotified = false;
}

function notifyAuthFailure(): void {
  if (authFailureNotified) {
    return;
  }

  authFailureNotified = true;
  authFailureHandler?.();
}

function isProtectedEndpoint(path: string): boolean {
  return path === '/v1' || path.startsWith('/v1/');
}

function requiresCsrf(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

async function sendWithCsrfRetry(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const shouldUseCsrf = requiresCsrf(method);

  const send = async (): Promise<Response> => {
    const headers = new Headers(init.headers);

    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (shouldUseCsrf) {
      headers.set('X-CSRF-TOKEN', await getCsrfToken());
    }

    return fetch(path, {
      ...init,
      method,
      headers,
      credentials: 'include',
    });
  };

  const response = await send();

  if (response.status !== 419 || !shouldUseCsrf) {
    return response;
  }

  // Refresh CSRF and retry this request only once.
  await getCsrfToken(true);

  return send();
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new HttpError(response.status, data);
  }

  return data as T;
}

async function rotateSession(): Promise<void> {
  const response = await sendWithCsrfRetry(ROTATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint: getFingerprint(),
    }),
  });

  await parseResponse<void>(response);
}

function rotateSessionOnce(): Promise<void> {
  if (!rotationRequest) {
    rotationRequest = rotateSession()
      .catch((error: unknown) => {
        notifyAuthFailure();
        throw error;
      })
      .finally(() => {
        rotationRequest = null;
      });
  }

  return rotationRequest;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response = await sendWithCsrfRetry(path, init);

  if (response.status !== 401 || !isProtectedEndpoint(path)) {
    return parseResponse<T>(response);
  }

  // Concurrent 401 responses share the same rotation promise.
  await rotateSessionOnce();

  // Retry the original request exactly once.
  response = await sendWithCsrfRetry(path, init);

  if (response.status === 401) {
    notifyAuthFailure();
  }

  return parseResponse<T>(response);
}
