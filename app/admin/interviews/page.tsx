'use client';

import { useMemo } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { InterviewAvailabilityCalendar } from '@/components/admin/InterviewAvailabilityCalendar';
import { InterviewBoard } from '@/components/admin/InterviewBoard';
import { InterviewKpiGrid } from '@/components/admin/InterviewKpiGrid';
import { computeInterviewKpis } from '@/lib/admin/interviewAnalytics';
import { useInterviewInvites } from '@/lib/admin/useInterviewInvites';
import { useAuth } from '@/lib/auth/AuthProvider';

function InterviewInvitesContent() {
  const { rows, loading, error, note, busyId, markContacted, confirm, withdraw } =
    useInterviewInvites();
  const kpis = useMemo(() => computeInterviewKpis(rows), [rows]);

  return (
    <section className="dash-page iv-page" aria-labelledby="admin-interview-title">
      <div className="dash-page__header">
        <h1 id="admin-interview-title" className="dash-page__title">
          Interview Invites
        </h1>
      </div>

      <p className="iv-page__lead">
        Resident-provided contact preferences only. These records are never joined to anonymous
        survey responses.
      </p>

      {error ? (
        <p className="na-error" role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p role="status" className="admin-kanban-note">
          {note}
        </p>
      ) : null}

      {!loading ? (
        <InterviewBoard
          rows={rows}
          busyId={busyId}
          onMarkContacted={(id, email) => void markContacted(id, email)}
          onConfirm={(id, email) => void confirm(id, email)}
          onWithdraw={(id, email) => void withdraw(id, email)}
        />
      ) : (
        <p className="admin-section__lead">Loading interview pipeline…</p>
      )}

      <InterviewKpiGrid kpis={kpis} loading={loading} />

      <div className="iv-page__main">
        <InterviewAvailabilityCalendar rows={rows} loading={loading} />
        <aside className="iv-page__aside dash-insight" aria-label="Form preference snapshot">
          <h2 className="dash-insight__title">Preferred weekdays</h2>
          <p className="dash-insight__hint">Across all open + confirmed invites</p>
          <ul className="iv-day-bars">
            {kpis.dayCounts.map((d) => {
              const max = Math.max(1, ...kpis.dayCounts.map((x) => x.count));
              const pct = Math.round((d.count / max) * 100);
              const isTop = kpis.topDay?.label === d.label && d.count > 0;
              return (
                <li
                  key={d.label}
                  className={`iv-day-bars__row${isTop ? ' is-top' : ''}${d.count === 0 ? ' is-zero' : ''}`}
                >
                  <span className="iv-day-bars__label">{d.label.slice(0, 3)}</span>
                  <span className="iv-day-bars__track" aria-hidden="true">
                    <span className="iv-day-bars__fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="iv-day-bars__value">{d.count}</span>
                </li>
              );
            })}
          </ul>
          <h2 className="dash-insight__title iv-page__aside-sub">Time windows</h2>
          <ul className="iv-day-bars">
            {kpis.timeCounts.map((t) => {
              const max = Math.max(1, ...kpis.timeCounts.map((x) => x.count));
              const pct = Math.round((t.count / max) * 100);
              const isTop = kpis.topTime?.label === t.label && t.count > 0;
              return (
                <li
                  key={t.label}
                  className={`iv-day-bars__row${isTop ? ' is-top' : ''}${t.count === 0 ? ' is-zero' : ''}`}
                >
                  <span className="iv-day-bars__label">{t.label}</span>
                  <span className="iv-day-bars__track" aria-hidden="true">
                    <span className="iv-day-bars__fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="iv-day-bars__value">{t.count}</span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </section>
  );
}

/**
 * Interview Invites — KPIs, availability calendar, and Kanban pipeline.
 */
export default function AdminInterviewsPage() {
  const { can } = useAuth();
  const canInterview = can('interviewInvites');

  return (
    <AdminAppShell>
      {canInterview ? (
        <InterviewInvitesContent />
      ) : (
        <section className="admin-section" aria-labelledby="admin-interview-title">
          <h1 id="admin-interview-title" className="admin-section__title">
            Interview Invites
          </h1>
          <p className="admin-section__lead">
            You do not have permission to view interview invites. Ask a superadmin if you need
            access.
          </p>
        </section>
      )}
    </AdminAppShell>
  );
}
