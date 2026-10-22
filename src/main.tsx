import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './app/App';

import './index.css';

const queryClient = new QueryClient();

async function enableMocks(): Promise<void> {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  await worker.start({
    onUnhandledRequest: 'error',
  });
}

async function bootstrap(): Promise<void> {
  await enableMocks();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
