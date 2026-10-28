export interface Webhook {
  id: string;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
}

export interface WebhookList {
  data: Webhook[];
  paging: {
    pages: {
      current: number;
      last: number;
    };
    results: {
      total: number;
      limitation: number;
    };
  };
}

export interface WebhookUpdateInput {
  name: string;
  url: string;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
}

export interface ApiError {
  error: {
    type: string;
    message: string;
    payload?: Record<string, string[]>;
  };
}
