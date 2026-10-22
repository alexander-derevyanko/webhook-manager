import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App';

import './index.css';

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
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
