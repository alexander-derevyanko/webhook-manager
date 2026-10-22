import { useQuery } from '@tanstack/react-query';

import { getWebhooks } from '../api/webhooksApi';

interface UseWebhooksParams {
  page: number;
  search: string;
}

const PAGE_SIZE = 10;

export function useWebhooks({ page, search }: UseWebhooksParams) {
  return useQuery({
    queryKey: ['webhooks', { page, search }],
    queryFn: () =>
      getWebhooks({
        page,
        limit: PAGE_SIZE,
        search,
      }),
  });
}
