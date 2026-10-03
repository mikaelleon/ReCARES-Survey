'use client';

import { useMemo } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { DashboardStatGrid } from '@/components/admin/DashboardStatGrid';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { computeKpis } from '@/lib/admin/analytics';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Dashboard overview — activity + live branch KPIs (same response source as Responses).
 */
export default function AdminDashboardPage() {
  const { user, can } = useAuth();
  const { records, status, source } = useSurveyResponses();
  const kpis = useMemo(() => computeKpis(records), [records]);
  const canResponses = can('responsesDashboard');

  const roleTone = user?.role === 'superadmin' ? 'amber' : 'emerald';
  const statusTone =
    user?.status === 'active' ? 'emerald' : user?.status === 'removed' ? 'danger' : 'neutral';

  return (
    <AdminAppShell>
      <section className="admin-section" aria-labelledby="admin-welcome-title">
        <h1 id="admin-welcome-title" className="admin-section__title">
          Welcome, {user?.name || user?.email}!
        </h1>
        <div className="admin-welcome-badges">
          <StatusBadge tone={roleTone}>{user?.role || '—'}</StatusBadge>
          <StatusBadge tone={statusTone}>{user?.status || 'active'}</StatusBadge>
        </div>
        <p className="admin-section__lead">Signed in with {user?.signInMethod}</p>
      </section>

      {canResponses ? (
        <section className="admin-section" aria-labelledby="admin-overview-title">
          <h2 id="admin-overview-title" className="admin-section__title admin-section__title--h2">
            Dashboard
          </h2>
          <p className="admin-section__lead">
            Aggregate coverage for the Camella Homes Tibig needs assessment. Data source matches
            Responses ({source === 'firestore' ? 'Firestore' : 'sample stub'}).
          </p>
          <DashboardStatGrid kpis={kpis} loading={status === 'loading'} />
        </section>
      ) : (
        <section className="admin-section">
          <p className="admin-section__lead">
            You do not have permission to view the responses dashboard. Ask a superadmin if you
            need access.
          </p>
        </section>
      )}
    </AdminAppShell>
  );
}
