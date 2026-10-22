// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, resetAuthFailureState, setAuthFailureHandler } from './httpClient';
import { clearCsrfToken } from './csrf';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest concurrent session rotation', () => {
  let protectedRequestCount: number;
  let rotateRequestCount: number;
  let authFailureHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    protectedRequestCount = 0;
    rotateRequestCount = 0;

    authFailureHandler = vi.fn();
    setAuthFailureHandler(authFailureHandler);
    resetAuthFailureState();
    clearCsrfToken();

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'a'.repeat(32)),
      setItem: vi.fn(),
    });

    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url === '/csrf') {
        return new Response(null, {
          status: 204,
          headers: { 'X-CSRF-TOKEN': 'test-csrf-token' },
        });
      }

      if (url === '/auth/token/rotate' && method === 'POST') {
        rotateRequestCount += 1;
        return jsonResponse({ success: true });
      }

      if (url === '/v1/me' && method === 'GET') {
        protectedRequestCount += 1;

        // Both original requests receive 401.
        if (protectedRequestCount <= 2) {
          return jsonResponse(
            {
              error: {
                type: 'unauthorized',
                message: 'Unauthorized',
              },
            },
            401,
          );
        }

        // Both retries succeed.
        return jsonResponse({
          success: true,
          attempt: protectedRequestCount,
        });
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    clearCsrfToken();
    resetAuthFailureState();
    setAuthFailureHandler(() => {});
    vi.unstubAllGlobals();
  });

  it('rotates the session once and retries both concurrent requests', async () => {
    const [firstResult, secondResult] = await Promise.all([
      apiRequest<{ success: boolean; attempt: number }>('/v1/me'),
      apiRequest<{ success: boolean; attempt: number }>('/v1/me'),
    ]);

    expect(rotateRequestCount).toBe(1);

    // Two original requests + two successful retries.
    expect(protectedRequestCount).toBe(4);

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);

    expect([firstResult.attempt, secondResult.attempt].sort()).toEqual([3, 4]);

    expect(authFailureHandler).not.toHaveBeenCalled();
  });
});
