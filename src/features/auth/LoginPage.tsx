import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { HttpError } from '../../shared/api/httpClient';
import { useAuth } from './hooks/useAuth';

function getFieldErrors(data: unknown): Record<string, string[]> {
  if (typeof data !== 'object' || data === null) {
    return {};
  }

  const error = 'error' in data ? data.error : null;

  if (typeof error !== 'object' || error === null) {
    return {};
  }

  const payload = 'payload' in error ? error.payload : null;

  if (typeof payload !== 'object' || payload === null) {
    return {};
  }

  return payload as Record<string, string[]>;
}

export default function LoginPage() {
  const { user, isInitializing, login } = useAuth();

  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (isInitializing) {
    return <p>Checking session…</p>;
  }

  if (user) {
    return <Navigate to="/webhooks" replace />;
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setFormError('');
    setFieldErrors({});

    try {
      await login(email, password);
    } catch (error: unknown) {
      if (error instanceof HttpError && error.status === 422) {
        const errors = getFieldErrors(error.data);

        setFieldErrors(errors);

        if (Object.keys(errors).length === 0) {
          setFormError('Unable to sign in. Check your credentials.');
        }
      } else {
        setFormError('Sign-in failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Webhook Manager</h1>
        <p>Sign in to manage your webhooks.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {fieldErrors.email?.map((message) => (
          <p className="field-error" key={message}>
            {message}
          </p>
        ))}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {fieldErrors.password?.map((message) => (
          <p className="field-error" key={message}>
            {message}
          </p>
        ))}

        {formError && <p role="alert">{formError}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="login-hint">Test account: alex@example.com / Password123!</p>
      </form>
    </main>
  );
}
