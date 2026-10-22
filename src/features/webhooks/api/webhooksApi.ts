import { apiRequest } from '../../../shared/api/httpClient';
import type { WebhookList } from '../../../shared/api/types';

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
