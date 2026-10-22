import { apiRequest } from '../../../shared/api/httpClient';
import type { Webhook, WebhookList, WebhookUpdateInput } from '../../../shared/api/types';

export interface GetWebhooksParams {
  page: number;
  limit: number;
  search: string;
}

export function getWebhooks({ page, limit, search }: GetWebhooksParams): Promise<WebhookList> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  });

  return apiRequest<WebhookList>(`/v1/webhooks?${params.toString()}`);
}

export function getWebhook(id: string): Promise<Webhook> {
  return apiRequest<Webhook>(`/v1/webhooks/${encodeURIComponent(id)}`);
}

export function updateWebhook(id: string, input: WebhookUpdateInput): Promise<Webhook> {
  return apiRequest<Webhook>(`/v1/webhooks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}
