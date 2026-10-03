'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { AdminTopBar } from '@/components/dashboard/AdminTopBar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { SurveyResponsesProvider } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';

/**
 * Active-admin chrome: left sidebar + top bar + main column.
 */
export function AdminAppShell({ children }: { children: ReactNode }) {
  const { firestoreError } = useAuth();
  const { ready, user, allowRender } = useAdminRouteGate('active');
  const [navOpen, setNavOpen] = useState(false);
  const onOpenChange = useCallback((open: boolean) => setNavOpen(open), []);

  if (!ready || !allowRender || !user) {
    return <p className="admin-dashboard__inner">Loading…</p>;
  }

  return (
    <div className="admin-app">
      <SidebarNav open={navOpen} onOpenChange={onOpenChange} />
      <div className="admin-app__main">
        <AdminTopBar onOpenNav={() => setNavOpen(true)} />
        <div className="admin-app__content">
          {firestoreError ? (
            <div style={{ maxWidth: 720, margin: '0 0 16px' }}>
              <FirestoreBlockedNotice message={firestoreError} />
            </div>
          ) : null}
          <SurveyResponsesProvider>{children}</SurveyResponsesProvider>
        </div>
      </div>
    </div>
  );
}
