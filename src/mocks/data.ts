import type { User, Webhook } from '../shared/api/types';

const webhookNames = [
  'Order created',
  'Payment succeeded',
  'Payment failed',
  'User registered',
  'Subscription renewed',
  'Subscription cancelled',
  'Invoice generated',
  'Customer updated',
  'Refund processed',
  'Product created',
];

export const TEST_CREDENTIALS = {
  email: 'alex@example.com',
  password: 'Password123!',
} as const;

export const MOCK_USER: User = {
  id: 'user-1',
  email: TEST_CREDENTIALS.email,
  first_name: 'Alex',
  last_name: 'Developer',
  name: 'Alex Developer',
};

export const mockWebhooks: Webhook[] = Array.from({ length: 30 }, (_, index) => ({
  id: `webhook-${index + 1}`,
  name: `${webhookNames[index % webhookNames.length]} ${index + 1}`,
  url: `https://api.example.com/webhooks/${index + 1}`,
  active: index % 4 !== 0,
  created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
}));
