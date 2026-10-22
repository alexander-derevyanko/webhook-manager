import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../features/auth/AuthContext';
import LoginPage from '../features/auth/LoginPage';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import { useAuth } from '../features/auth/hooks/useAuth';

function WebhooksPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Webhook Manager</h1>
      <p>Signed in as {user?.email}</p>
      <p>Webhook list will be implemented in the next stage.</p>
      <button type="button" onClick={() => void logout()}>
        Sign out
      </button>
    </main>
  );
}

function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/webhooks" element={<WebhooksPlaceholder />} />
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
