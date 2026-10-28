import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { HttpError } from '../../../shared/api/httpClient';
import type { Webhook, WebhookUpdateInput } from '../../../shared/api/types';
import { updateWebhook } from '../api/webhooksApi';

type FieldName = 'name' | 'url' | 'active';
type FieldErrors = Partial<Record<FieldName, string>>;

interface ApiErrorResponse {
  error?: {
    payload?: Partial<Record<FieldName, string[]>>;
  };
}

function getServerFieldErrors(data: unknown): FieldErrors {
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return {};
  }

  const error = (data as ApiErrorResponse).error;
  const payload = error?.payload;

  return {
    ...(payload?.name?.[0] ? { name: payload.name[0] } : {}),
    ...(payload?.url?.[0] ? { url: payload.url[0] } : {}),
  };
}

export function useWebhookEditForm(webhook: Webhook) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(webhook.name);
  const [url, setUrl] = useState(webhook.url);
  const [status, setStatus] = useState(webhook.active);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const mutation = useMutation({
    mutationFn: (input: WebhookUpdateInput) => updateWebhook(webhook.id, input),

    onSuccess: async (updatedWebhook) => {
      queryClient.setQueryData(['webhook', webhook.id], updatedWebhook);

      await queryClient.invalidateQueries({
        queryKey: ['webhooks'],
      });

      navigate('/webhooks');
    },

    onError: (error: unknown) => {
      if (error instanceof HttpError && error.status === 422) {
        const errors = getServerFieldErrors(error.data);

        setFieldErrors(errors);

        if (Object.keys(errors).length === 0) {
          setFormError('The server rejected the submitted values.');
        }

        return;
      }

      setFormError('Failed to save webhook. Please try again.');
    },
  });

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  }

  function handleNameChange(value: string) {
    setName(value);
    clearFieldError('name');
  }

  function handleUrlChange(value: string) {
    setUrl(value);
    clearFieldError('url');
  }

  function handleStatusChange(value: boolean) {
    console.log('hanlde', value);
    setStatus(value);
    clearFieldError('active');
  }

  function validate(): WebhookUpdateInput | null {
    const normalizedName = name.trim();
    const normalizedUrl = url.trim();

    if (!normalizedName) {
      setFieldErrors({ name: 'Name is required.' });

      return null;
    }

    try {
      const parsedUrl = new URL(normalizedUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setFieldErrors({
          url: 'URL must use HTTP or HTTPS.',
        });

        return null;
      }
    } catch {
      setFieldErrors({ url: 'Enter a valid URL.' });

      return null;
    }

    return {
      name: normalizedName,
      url: normalizedUrl,
      active: status,
    };
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError('');

    const input = validate();

    if (!input) {
      return;
    }

    console.log(input);

    mutation.mutate(input);
  }

  function cancel() {
    navigate('/webhooks');
  }

  return {
    name,
    url,
    status,
    fieldErrors,
    formError,
    isPending: mutation.isPending,
    handleNameChange,
    handleUrlChange,
    handleStatusChange,
    handleSubmit,
    cancel,
  };
}
