'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pathForAccessState, type AdminAccessState } from '@/lib/admin/access';
import { useAuth, type AdminUser } from '@/lib/auth/AuthProvider';

function withTrailingSlash(path: string): string {
  if (path.endsWith('/')) return path;
  return `${path}/`;
}

export type AdminGateMode = AdminAccessState | 'signed-in-no-profile';

/**
 * Client-side admin route guard for static export.
 * Avoid next/navigation `redirect()` during render — it throws a special object
 * that can surface as React error #310 on Firebase Hosting.
 */
export function useAdminRouteGate(allowed: AdminGateMode): {
  ready: boolean;
  user: AdminUser | null;
  /** True when this page may render its main UI. */
  allowRender: boolean;
  firestoreError: string | null;
} {
  const router = useRouter();
  const { user, ready, firestoreError } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.replace(withTrailingSlash('/admin/login'));
      return;
    }

    if (allowed === 'signed-in-no-profile') {
      if (user.accessState === 'active') {
        router.replace(withTrailingSlash('/admin/dashboard'));
        return;
      }
      if (user.accessState === 'pending') {
        router.replace(withTrailingSlash('/admin/pending'));
        return;
      }
      if (user.accessState === 'removed') {
        router.replace(withTrailingSlash('/admin/removed'));
      }
      return;
    }

    if (user.accessState !== allowed) {
      if (user.accessState === 'unauthenticated') {
        router.replace(withTrailingSlash('/admin/complete'));
        return;
      }
      router.replace(withTrailingSlash(pathForAccessState(user.accessState)));
    }
  }, [allowed, ready, router, user]);

  if (!ready || !user) {
    return { ready, user, allowRender: false, firestoreError };
  }

  if (allowed === 'signed-in-no-profile') {
    return {
      ready,
      user,
      allowRender: user.accessState === 'unauthenticated',
      firestoreError,
    };
  }

  return {
    ready,
    user,
    allowRender: user.accessState === allowed,
    firestoreError,
  };
}
