import { useContext } from 'react';
import { type AuthContextValue, AuthContext } from '../types/auth-context';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
