import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import type { User } from '../../shared/api/types';
import { resetAuthFailureState, setAuthFailureHandler } from '../../shared/api/httpClient';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from './api/authApi';
import { AuthContext } from './types/auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    setAuthFailureHandler(() => {
      if (!mounted) {
        return;
      }

      setUser(null);
      setIsInitializing(false);
      navigate('/login', { replace: true });
    });

    void getCurrentUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsInitializing(false);
        }
      });

    return () => {
      mounted = false;
      setAuthFailureHandler(() => {});
    };
  }, [navigate]);

  const login = useCallback(
    async (email: string, password: string) => {
      const authenticatedUser = await loginRequest({
        email,
        password,
      });

      resetAuthFailureState();
      setUser(authenticatedUser);
      navigate('/webhooks', { replace: true });
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
