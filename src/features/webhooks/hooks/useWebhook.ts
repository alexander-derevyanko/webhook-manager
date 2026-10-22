import { useQuery } from '@tanstack/react-query';

import { getWebhook } from '../api/webhooksApi';

export function useWebhook(id: string) {
  return useQuery({
    queryKey: ['webhook', id],
    queryFn: () => getWebhook(id!),
    enabled: Boolean(id),
  });
}
