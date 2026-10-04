'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AdminPageTransition } from '@/components/admin/AdminPageTransition';
import { AdminTopBar } from '@/components/dashboard/AdminTopBar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { AdminWorkspaceLoader } from '@/components/admin/AdminWorkspaceLoader';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { SurveyResponsesProvider } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';

const COLLAPSE_KEY = 'recares-admin-sidebar-collapsed';

/**
 * Active-admin chrome: left sidebar (with account footer) + main column.
 * Top bar is mobile-only (drawer trigger).
 * `fitViewport` locks the shell to 100dvh with no page scroll (Dashboard).
 */
export function AdminAppShell({
  children,
  fitViewport = false,
}: {
  children: ReactNode;
  fitViewport?: boolean;
}) {
  const { firestoreError } = useAuth();
  const { ready, user, allowRender } = useAdminRouteGate('active');
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const onOpenChange = useCallback((open: boolean) => setNavOpen(open), []);

  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!fitViewport) return;
    const root = document.documentElement;
    root.classList.add('admin-fit-viewport');
    return () => root.classList.remove('admin-fit-viewport');
  }, [fitViewport]);

  const onCollapsedChange = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      sessionStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  if (!ready || !allowRender || !user) {
    return <AdminWorkspaceLoader />;
  }

  return (
    <div
      className={`admin-app${collapsed ? ' is-sidebar-collapsed' : ''}${fitViewport ? ' is-fit-viewport' : ''}`}
    >
      <SidebarNav
        open={navOpen}
        onOpenChange={onOpenChange}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      />
      <div className="admin-app__main">
        <AdminTopBar onOpenNav={() => setNavOpen(true)} />
        <div className="admin-app__content">
          {firestoreError ? (
            <div style={{ maxWidth: 720, margin: '0 0 16px' }}>
              <FirestoreBlockedNotice message={firestoreError} />
            </div>
          ) : null}
          <SurveyResponsesProvider>
            <AdminPageTransition>{children}</AdminPageTransition>
          </SurveyResponsesProvider>
        </div>
      </div>
    </div>
  );
}
