'use client';

import Link from 'next/link';
import { BarChart3, CalendarHeart, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Real navigation shortcuts for the Dashboard mid-row (no fabricated destinations).
 */
export function DashboardQuickActions() {
  const { can, canTeamOps } = useAuth();

  return (
    <article className="dash-insight dash-quick" aria-label="Quick actions">
      <header className="dash-insight__head">
        <h2 className="dash-insight__title">Quick Actions</h2>
      </header>
      <div className="dash-quick__list">
        {can('responsesDashboard') ? (
          <Link href="/admin/responses/" className="dash-quick__btn dash-quick__btn--primary">
            <BarChart3 size={16} strokeWidth={2.2} aria-hidden="true" />
            View Responses
          </Link>
        ) : null}
        {can('interviewInvites') ? (
          <Link href="/admin/interviews/" className="dash-quick__btn">
            <CalendarHeart size={16} strokeWidth={2.2} aria-hidden="true" />
            Interview Invites
          </Link>
        ) : null}
        {canTeamOps ? (
          <Link href="/admin/members/" className="dash-quick__btn">
            <Users size={16} strokeWidth={2.2} aria-hidden="true" />
            Members &amp; Invites
          </Link>
        ) : null}
      </div>
    </article>
  );
}
