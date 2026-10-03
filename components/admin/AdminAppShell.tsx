'use client';

import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';

/**
 * Active-admin chrome: left sidebar + main column.
 */
export function AdminAppShell({ children }: { children: ReactNode }) {
  const { firestoreError } = useAuth();
  const { ready, user, allowRender } = useAdminRouteGate('active');

  if (!ready || !allowRender || !user) {
    return <p className="admin-dashboard__inner">Loading…</p>;
  }

  return (
    <div className="admin-app">
      <SidebarNav />
      <div className="admin-app__main">
        {firestoreError ? (
          <div style={{ maxWidth: 720, margin: '0 0 16px' }}>
            <FirestoreBlockedNotice message={firestoreError} />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
