import { useNavigate, useParams } from 'react-router-dom';

import type { Webhook } from '../../../../shared/api/types';
import { useWebhook } from '../../hooks/useWebhook';
import { useWebhookEditForm } from '../../hooks/useWebhookEditForm';

interface WebhookEditFormProps {
  webhook: Webhook;
}

function WebhookEditForm({ webhook }: WebhookEditFormProps) {
  const {
    name,
    url,
    status,
    fieldErrors,
    formError,
    isPending,
    handleNameChange,
    handleUrlChange,
    handleStatusChange,
    handleSubmit,
    cancel,
  } = useWebhookEditForm(webhook);

  console.log('status', status);

  return (
    <main>
      <h1>Edit webhook</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="webhook-name">Name</label>
          <input
            id="webhook-name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'webhook-name-error' : undefined}
          />

          {fieldErrors.name && (
            <p id="webhook-name-error" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="webhook-url">Endpoint URL</label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(event) => handleUrlChange(event.target.value)}
            aria-invalid={Boolean(fieldErrors.url)}
            aria-describedby={fieldErrors.url ? 'webhook-url-error' : undefined}
          />

          {fieldErrors.url && (
            <p id="webhook-url-error" role="alert">
              {fieldErrors.url}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="webhook-status">Status</label>
          <input
            id="webhook-status"
            type="checkbox"
            checked={status}
            onChange={(event) => handleStatusChange(event.target.checked)}
          />
        </div>

        {formError && <p role="alert">{formError}</p>}

        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save changes'}
        </button>

        <button type="button" onClick={cancel} disabled={isPending}>
          Cancel
        </button>
      </form>
    </main>
  );
}

export default function WebhookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { isPending, isError, refetch, data } = useWebhook(id!);

  if (!id) {
    return <p role="alert">Webhook ID is missing.</p>;
  }

  if (isPending) {
    return <p>Loading webhook...</p>;
  }

  if (isError) {
    return (
      <main>
        <p role="alert">Failed to load webhook.</p>
        <button type="button" onClick={() => void refetch()}>
          Try again
        </button>
        <button type="button" onClick={() => navigate('/webhooks')}>
          Back to webhooks
        </button>
      </main>
    );
  }

  return <WebhookEditForm key={data.id} webhook={data} />;
}
