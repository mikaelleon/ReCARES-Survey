'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface AdminUser {
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  /** Placeholder login — does not call Firebase yet. */
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Placeholder auth context defaults to null (unauthenticated).
 * TODO: replace with Firebase Auth session + middleware.ts once real auth exists.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, setUser, logout }), [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
