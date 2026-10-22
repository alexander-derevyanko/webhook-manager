import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../features/auth/AuthContext';
import LoginPage from '../features/auth/LoginPage';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import WebhooksPage from '../features/webhooks/components/WebhooksPage/WebhooksPage';
import WebhookEditPage from '../features/webhooks/components/WebhookEditPage/WebhookEditPage';

function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/webhooks" element={<WebhooksPage />} />

          <Route path="/webhooks/:id/edit" element={<WebhookEditPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/webhooks" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
