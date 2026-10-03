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
import {
  getAdminAccessState,
  hasPermission,
  type AdminAccessState,
  type AdminPermissions,
  type AdminRole,
  type DashboardPermissionKey,
} from '@/lib/admin/access';
import { getAdminProfile, logoutAdmin, signInMethodLabel } from '@/lib/firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';

export interface AdminUser {
  uid: string;
  email: string;
  name?: string;
  role: AdminRole | null;
  status?: string;
  requestedRole?: string;
  permissions: AdminPermissions;
  accessState: AdminAccessState;
  /** Display label for the current provider (Email and Password or Google). */
  signInMethod: string;
  /** True when an admins document exists (any status). */
  hasProfile: boolean;
  /** True only when status === 'active'. */
  authorized: boolean;
}

interface AuthContextValue {
  user: AdminUser | null;
  /** False until the first auth state check finishes. */
  ready: boolean;
  /** Set when Firestore profile reads fail (e.g. Brave Shields / ad blockers). */
  firestoreError: string | null;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  can: (key: DashboardPermissionKey) => boolean;
  isSuperadmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const FIRESTORE_BLOCKED_MESSAGE =
  'Could not reach Cloud Firestore. If you use Brave or an ad blocker, allow trackers/shields for this site, then refresh.';

async function sessionFromUid(
  uid: string,
  email: string,
  providerId: string | undefined,
): Promise<{ user: AdminUser; firestoreError: string | null }> {
  let profile = null;
  let firestoreError: string | null = null;
  try {
    profile = await getAdminProfile(uid);
    if (!profile) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      profile = await getAdminProfile(uid);
    }
  } catch {
    firestoreError = FIRESTORE_BLOCKED_MESSAGE;
  }

  const accessState = getAdminAccessState(profile);
  return {
    firestoreError,
    user: {
      uid,
      email: profile?.email || email,
      name: profile?.fullName || undefined,
      role: profile?.role ?? null,
      status: profile?.status,
      requestedRole: profile?.requestedRole,
      permissions: profile?.permissions ?? {},
      accessState,
      signInMethod: signInMethodLabel(providerId),
      hasProfile: Boolean(profile),
      authorized: accessState === 'active',
    },
  };
}

/**
 * Firebase Auth session plus the admins profile.
 * Authenticated without an admins document stays unauthorized.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const reloadProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const current = auth?.currentUser;
    if (!current) {
      setUser(null);
      setFirestoreError(null);
      return;
    }
    const next = await sessionFromUid(
      current.uid,
      current.email ?? '',
      current.providerData[0]?.providerId,
    );
    setUser(next.user);
    setFirestoreError(next.firestoreError);
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
        setFirestoreError(null);
        setReady(true);
        return;
      }
      void sessionFromUid(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        firebaseUser.providerData[0]?.providerId,
      )
        .then((session) => {
          setUser(session.user);
          setFirestoreError(session.firestoreError);
          setReady(true);
        })
        .catch(() => {
          setFirestoreError(FIRESTORE_BLOCKED_MESSAGE);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            role: null,
            permissions: {},
            accessState: 'unauthenticated',
            signInMethod: signInMethodLabel(firebaseUser.providerData[0]?.providerId),
            hasProfile: false,
            authorized: false,
          });
          setReady(true);
        });
    });

    return unsubscribe;
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setUser(null);
    setFirestoreError(null);
  }, []);

  const can = useCallback(
    (key: DashboardPermissionKey) => {
      if (!user || !user.authorized) return false;
      return hasPermission(
        {
          fullName: user.name || '',
          email: user.email,
          requestedRole: user.requestedRole || '',
          role: user.role,
          status:
            user.status === 'pending' || user.status === 'removed' || user.status === 'active'
              ? user.status
              : 'pending',
          permissions: user.permissions,
        },
        key,
      );
    },
    [user],
  );

  const isSuperadmin = Boolean(user?.authorized && user.role === 'superadmin');

  const value = useMemo(
    () => ({ user, ready, firestoreError, logout, reloadProfile, can, isSuperadmin }),
    [user, ready, firestoreError, logout, reloadProfile, can, isSuperadmin],
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
