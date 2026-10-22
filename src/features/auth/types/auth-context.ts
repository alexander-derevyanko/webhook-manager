import { createContext } from 'react';

import type { User } from '../../../shared/api/types';

export interface AuthContextValue {
  user: User | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
