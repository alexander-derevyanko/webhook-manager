import { http, HttpResponse } from 'msw';

import type { ApiError, Webhook } from '../shared/api/types';
import { MOCK_USER, mockWebhooks, TEST_CREDENTIALS } from './data';

const CSRF_TOKEN = 'mock-csrf-token';
const SESSION_DURATION_MS = 30_000;

interface LoginBody {
  email?: string;
  password?: string;
  fingerprint?: string;
}

interface IssueBody {
  device_session_token?: string;
  fingerprint?: string;
}

interface FingerprintBody {
  fingerprint?: string;
}

interface UpdateBody {
  name?: string;
  url?: string;
  active?: boolean;
}

// Mock-server state. Nothing is stored in browser storage.
interface MockSessionState {
  activeFingerprint: string | null;
  sessionExpiresAt: number;
  sessionIssued: boolean;
}

const MOCK_SESSION_STORAGE_KEY = 'webhook-manager:mock-session';

const EMPTY_SESSION: MockSessionState = {
  activeFingerprint: null,
  sessionExpiresAt: 0,
  sessionIssued: false,
};

function isMockSessionState(value: unknown): value is MockSessionState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    (session.activeFingerprint === null || typeof session.activeFingerprint === 'string') &&
    typeof session.sessionExpiresAt === 'number' &&
    typeof session.sessionIssued === 'boolean'
  );
}

function readMockSession(): MockSessionState {
  try {
    const raw = sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY);

    if (!raw) {
      return EMPTY_SESSION;
    }

    const parsed: unknown = JSON.parse(raw);

    return isMockSessionState(parsed) ? parsed : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
}

let deviceSessionToken: string | null = null;

const initialSession = readMockSession();

let activeFingerprint = initialSession.activeFingerprint;
let sessionExpiresAt = initialSession.sessionExpiresAt;
let sessionIssued = initialSession.sessionIssued;

function persistMockSession(): void {
  sessionStorage.setItem(
    MOCK_SESSION_STORAGE_KEY,
    JSON.stringify({
      activeFingerprint,
      sessionExpiresAt,
      sessionIssued,
    } satisfies MockSessionState),
  );
}

function apiError(
  status: number,
  type: string,
  message: string,
  payload?: Record<string, string[]>,
) {
  const body: ApiError = {
    error: {
      type,
      message,
      ...(payload ? { payload } : {}),
    },
  };

  return HttpResponse.json(body, { status });
}

function unauthorized() {
  return apiError(401, 'AuthenticationException', 'Unauthenticated.');
}

function validationError(payload: Record<string, string[]>) {
  return apiError(422, 'ValidationException', 'The given data was invalid.', payload);
}

function hasValidCsrf(request: Request): boolean {
  return request.headers.get('X-CSRF-TOKEN') === CSRF_TOKEN;
}

function hasValidFingerprint(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{32}$/.test(value);
}

function isSessionValid(): boolean {
  return sessionIssued && activeFingerprint !== null && Date.now() < sessionExpiresAt;
}

function csrfError() {
  return apiError(419, 'TokenMismatchException', 'CSRF token mismatch.');
}

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function findWebhook(id: string): Webhook | undefined {
  return mockWebhooks.find((webhook) => webhook.id === id);
}

export const handlers = [
  // GET /csrf
  http.get('/csrf', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'X-CSRF-TOKEN': CSRF_TOKEN,
      },
    });
  }),

  // POST /auth/login
  http.post('/auth/login', async ({ request }) => {
    if (!hasValidCsrf(request)) {
      return csrfError();
    }

    if (!request.headers.get('X-Captcha-Token')?.trim()) {
      return validationError({
        captcha: ['Captcha token is required.'],
      });
    }

    const body = (await request.json()) as LoginBody;

    if (body.email !== TEST_CREDENTIALS.email || body.password !== TEST_CREDENTIALS.password) {
      return validationError({
        password: ['The provided credentials are incorrect.'],
      });
    }

    if (!hasValidFingerprint(body.fingerprint)) {
      return validationError({
        fingerprint: ['Invalid device fingerprint.'],
      });
    }

    // A new login invalidates the previous mock session.
    deviceSessionToken = crypto.randomUUID();
    activeFingerprint = null;
    sessionIssued = false;
    sessionExpiresAt = 0;

    persistMockSession();

    return HttpResponse.json({
      device_session_token: deviceSessionToken,
    });
  }),

  // POST /auth/token/issue
  http.post('/auth/token/issue', async ({ request }) => {
    if (!hasValidCsrf(request)) {
      return csrfError();
    }

    const body = (await request.json()) as IssueBody;

    if (
      !deviceSessionToken ||
      body.device_session_token !== deviceSessionToken ||
      !hasValidFingerprint(body.fingerprint)
    ) {
      return apiError(422, 'ValidationException', 'Invalid device session.');
    }

    // Consume the device token. It cannot be used again.
    deviceSessionToken = null;
    activeFingerprint = body.fingerprint;
    sessionIssued = true;
    sessionExpiresAt = Date.now() + SESSION_DURATION_MS;

    persistMockSession();

    return new HttpResponse(null, { status: 200 });
  }),

  // POST /auth/token/rotate
  http.post('/auth/token/rotate', async ({ request }) => {
    if (!hasValidCsrf(request)) {
      return csrfError();
    }

    const body = (await request.json()) as FingerprintBody;

    // An expired session may be rotated, but a revoked or
    // never-issued session may not.
    if (!sessionIssued || !activeFingerprint || body.fingerprint !== activeFingerprint) {
      return apiError(400, 'BadRequestException', 'Cannot rotate session.');
    }

    sessionExpiresAt = Date.now() + SESSION_DURATION_MS;

    persistMockSession();

    return new HttpResponse(null, { status: 200 });
  }),

  // POST /auth/token/revoke
  http.post('/auth/token/revoke', async ({ request }) => {
    if (!hasValidCsrf(request)) {
      return csrfError();
    }

    const body = (await request.json()) as FingerprintBody;

    if (activeFingerprint && body.fingerprint === activeFingerprint) {
      sessionIssued = false;
      sessionExpiresAt = 0;
      activeFingerprint = null;
      deviceSessionToken = null;

      persistMockSession();
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // GET /v1/me
  http.get('/v1/me', () => {
    if (!isSessionValid()) {
      return unauthorized();
    }

    return HttpResponse.json(MOCK_USER);
  }),

  // GET /v1/webhooks?page=&limit=&search=
  http.get('/v1/webhooks', ({ request }) => {
    if (!isSessionValid()) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const pageValue = Number(url.searchParams.get('page') ?? '1');
    const limitValue = Number(url.searchParams.get('limit') ?? '10');
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();

    const page = Number.isFinite(pageValue) ? Math.max(1, Math.floor(pageValue)) : 1;

    const limit = Number.isFinite(limitValue)
      ? Math.min(100, Math.max(1, Math.floor(limitValue)))
      : 10;

    const filtered = mockWebhooks.filter((webhook) => webhook.name.toLowerCase().includes(search));

    const lastPage = Math.max(1, Math.ceil(filtered.length / limit));
    const currentPage = Math.min(page, lastPage);
    const offset = (currentPage - 1) * limit;

    return HttpResponse.json({
      data: filtered.slice(offset, offset + limit),
      paging: {
        pages: {
          current: currentPage,
          last: lastPage,
        },
        results: {
          total: filtered.length,
          limitation: limit,
        },
      },
    });
  }),

  // GET /v1/webhooks/:id
  http.get('/v1/webhooks/:id', ({ params }) => {
    if (!isSessionValid()) {
      return unauthorized();
    }

    const webhook = findWebhook(String(params.id));

    if (!webhook) {
      return apiError(404, 'NotFoundException', 'Webhook not found.');
    }

    return HttpResponse.json(webhook);
  }),

  // PUT /v1/webhooks/:id
  http.put('/v1/webhooks/:id', async ({ request, params }) => {
    if (!isSessionValid()) {
      return unauthorized();
    }

    if (!hasValidCsrf(request)) {
      return csrfError();
    }

    const webhook = findWebhook(String(params.id));

    if (!webhook) {
      return apiError(404, 'NotFoundException', 'Webhook not found.');
    }

    const body = (await request.json()) as UpdateBody;
    const errors: Record<string, string[]> = {};

    if (!body.name?.trim()) {
      errors.name = ['The name field is required.'];
    }

    if (!isValidHttpUrl(body.url)) {
      errors.url = ['The url must be a valid HTTP or HTTPS URL.'];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const updated: Webhook = {
      ...webhook,
      name: body.name!.trim(),
      url: body.url!,
      active: body.active!,
    };

    const index = mockWebhooks.findIndex((item) => item.id === updated.id);

    mockWebhooks[index] = updated;

    return HttpResponse.json(updated);
  }),
];
