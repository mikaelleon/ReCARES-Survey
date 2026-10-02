'use client';

import { onAuthStateChanged } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAdminProfile, logoutAdmin, signInMethodLabel } from '@/lib/firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';

export interface AdminUser {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
  /** Display label for the current provider (Email and Password or Google). */
  signInMethod: string;
  /** True only when an admins document exists for this UID. */
  authorized: boolean;
}

interface AuthContextValue {
  user: AdminUser | null;
  /** False until the first auth state check finishes. */
  ready: boolean;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function sessionFromUid(uid: string, email: string, providerId: string | undefined): Promise<AdminUser> {
  let profile = await getAdminProfile(uid);
  if (!profile) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    profile = await getAdminProfile(uid);
  }
  return {
    uid,
    email: profile?.email || email,
    name: profile?.fullName || undefined,
    role: profile?.role,
    status: profile?.status,
    signInMethod: signInMethodLabel(providerId),
    authorized: Boolean(profile),
  };
}

/**
 * Firebase Auth session plus the admins profile.
 * Authenticated without an admins document stays unauthorized.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  const reloadProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const current = auth?.currentUser;
    if (!current) {
      setUser(null);
      return;
    }
    const next = await sessionFromUid(
      current.uid,
      current.email ?? '',
      current.providerData[0]?.providerId,
    );
    setUser(next);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(null);
      setReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setReady(true);
        return;
      }
      void sessionFromUid(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        firebaseUser.providerData[0]?.providerId,
      ).then((session) => {
        setUser(session);
        setReady(true);
      });
    });

    return unsubscribe;
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, logout, reloadProfile }),
    [user, ready, logout, reloadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
