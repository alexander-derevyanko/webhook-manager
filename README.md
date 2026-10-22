# Webhook Manager

A React + TypeScript application for managing webhooks. This project demonstrates authenticated API communication, session rotation, CSRF protection, server-side validation, URL-synchronized search and pagination, and automated testing.

## Features

- Authentication with server-side credential validation.
- Mock API powered by Mock Service Worker (MSW).
- Session initialization, rotation, and revocation.
- Shared session rotation for concurrent `401 Unauthorized` responses.
- CSRF token initialization and retry after a CSRF validation error.
- Protected routes and logout.
- Webhook list with case-insensitive search and pagination.
- URL-synchronized list state with browser Back/Forward navigation.
- Webhook editing with client-side and server-side validation.
- Automated test covering concurrent session rotation.

## Tech Stack

- React
- TypeScript with strict type checking
- Vite
- React Router
- TanStack Query
- Mock Service Worker (MSW)
- Vitest
- React Testing Library

## Requirements

- Node.js (current LTS version recommended)
- npm

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.development` file in the project root:

```env
VITE_API_MOCKING=enabled
```

This enables MSW API mocking during development.

The `VITE_` prefix makes the variable accessible to client-side code. This flag is not a secret; never store credentials, API keys, or other sensitive values in `VITE_` variables.

### 3. Start the development server

```bash
npm run dev
```

The application uses MSW to simulate backend API responses, so no separate backend service is required for local development.

## Test Credentials

Use the following credentials to log in:

- **Email:** `alex@example.com`
- **Password:** `Password123!`

These credentials are for the mock API only.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run format
npm run format:check
npm run test
npm run test:watch
```

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Starts the Vite development server.   |
| `npm run build`      | Runs the configured production build. |
| `npm run lint`       | Runs ESLint checks.                   |
| `npm run test`       | Runs tests once and exits.            |
| `npm run test:watch` | Starts Vitest in watch mode.          |

## Application Flow

1. The user submits the login form.
2. The client initializes CSRF protection and sends the login request with the required headers.
3. The mock API validates the credentials and returns a device session token.
4. The client issues an authenticated session and loads the current user.
5. The user can browse, search, paginate, and edit webhooks.
6. If a protected API request returns `401 Unauthorized`, the client attempts to rotate the session and retries the original request once.
7. Concurrent unauthorized requests share a single in-flight session rotation request.
8. Logout revokes the session and clears local authentication state.

## Architecture

The application follows a feature-oriented structure:

- `src/shared/api` — shared HTTP client, CSRF handling, fingerprint generation, and API types.
- `src/features/auth` — login, authentication context, and protected-route logic.
- `src/features/webhooks` — webhook API functions, queries, list, and edit form.
- `src/mocks` — mock API handlers, mock data, and MSW setup.

## Design Decisions

### Centralized HTTP Client

A shared HTTP client handles common request headers, CSRF protection, and session rotation. This keeps authentication-related behavior consistent across API calls.

### Concurrent Session Rotation

Concurrent protected requests that receive `401 Unauthorized` reuse the same in-flight rotation request. Each original request is retried at most once, preventing multiple simultaneous rotation attempts and infinite retry loops.

### CSRF Protection

The client retrieves the CSRF token from `/csrf` and includes it in non-safe requests. When the API returns a CSRF validation error, the client refreshes the token and retries the request once.

### URL-Synchronized List State

Search and pagination are stored in URL query parameters. This supports shareable URLs and browser Back/Forward navigation.

### Server-Side Validation

The webhook edit form performs basic client-side validation and displays field-level validation errors returned by the API.

### Mocked Backend

MSW simulates the backend API contract, allowing the application to run and its client-side behavior to be tested without a real backend.

## Testing

The automated test for session rotation verifies that:

- Two concurrent protected requests receive `401 Unauthorized`.
- Only one session rotation request is issued.
- Both original requests are retried.
- Both retries succeed.
- The authentication failure handler is not called.

Run the tests with:

```bash
npm run test
```

## Limitations

- The backend API is mocked; no production backend is connected.
- Test credentials and mock responses are intended only for local development.
- Session and CSRF behavior are simulated for this assignment and should not be considered
