'use client';

import { useEffect } from 'react';
import { pathForAccessState, type AdminAccessState } from '@/lib/admin/access';
import { useAuth, type AdminUser } from '@/lib/auth/AuthProvider';

function withTrailingSlash(path: string): string {
  if (path.endsWith('/')) return path;
  return `${path}/`;
}

export type AdminGateMode = AdminAccessState | 'signed-in-no-profile';

/**
 * Client-side admin route guard for static export.
 * Uses hard navigation (location.assign) so Firebase Hosting always loads the
 * correct prerendered HTML entry.
 */
export function useAdminRouteGate(allowed: AdminGateMode): {
  ready: boolean;
  user: AdminUser | null;
  allowRender: boolean;
  firestoreError: string | null;
} {
  const { user, ready, firestoreError } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      window.location.assign(withTrailingSlash('/admin/login'));
      return;
    }

    if (allowed === 'signed-in-no-profile') {
      if (user.accessState === 'active') {
        window.location.assign(withTrailingSlash('/admin/dashboard'));
        return;
      }
      if (user.accessState === 'pending') {
        window.location.assign(withTrailingSlash('/admin/pending'));
        return;
      }
      if (user.accessState === 'removed') {
        window.location.assign(withTrailingSlash('/admin/removed'));
      }
      return;
    }

    if (user.accessState !== allowed) {
      if (user.accessState === 'unauthenticated') {
        window.location.assign(withTrailingSlash('/admin/complete'));
        return;
      }
      window.location.assign(withTrailingSlash(pathForAccessState(user.accessState)));
    }
  }, [allowed, ready, user]);

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
