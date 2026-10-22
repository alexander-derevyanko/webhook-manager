import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';

export default function ProtectedRoute() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <p>Loading session…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
