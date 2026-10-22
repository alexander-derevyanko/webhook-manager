const CSRF_ENDPOINT = '/csrf';

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(CSRF_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  const token = response.headers.get('X-CSRF-TOKEN');

  if (!response.ok || !token) {
    throw new Error('Failed to initialize CSRF protection');
  }

  csrfToken = token;

  return token;
}

export function getCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    csrfToken = null;
  }

  if (csrfToken) {
    return Promise.resolve(csrfToken);
  }

  if (csrfRequest) {
    return csrfRequest;
  }

  csrfRequest = fetchCsrfToken().finally(() => {
    csrfRequest = null;
  });

  return csrfRequest;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}
