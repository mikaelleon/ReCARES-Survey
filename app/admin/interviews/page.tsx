'use client';

import { PageHeading } from '@/components/admin/PageHeading';
import { useMemo, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { InterviewAvailabilityCalendar } from '@/components/admin/InterviewAvailabilityCalendar';
import { InterviewBoard } from '@/components/admin/InterviewBoard';
import { InterviewKpiGrid } from '@/components/admin/InterviewKpiGrid';
import { computeInterviewKpis, buildInterviewContactsCsv } from '@/lib/admin/interviewAnalytics';
import { downloadCsv } from '@/lib/admin/csvDownload';
import { useInterviewInvites } from '@/lib/admin/useInterviewInvites';
import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';
import { useAuth } from '@/lib/auth/AuthProvider';

const INTERVIEW_SORT = ['Newest first', 'Oldest first', 'Email (A–Z)'];

function InterviewInvitesContent() {
  const { user } = useAuth();
  const {
    rows,
    loading,
    error,
    note,
    busyId,
    markContacted,
    confirm,
    remove,
    addNote,
  } = useInterviewInvites();
  const [sortBy, setSortBy] = useState('Newest first');
  const [deleteTarget, setDeleteTarget] = useState<InterviewInviteRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const kpis = useMemo(() => computeInterviewKpis(rows), [rows]);
  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      if (sortBy === 'Email (A–Z)') {
        return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
      }
      const cmp = a.submittedAt.localeCompare(b.submittedAt);
      return sortBy === 'Oldest first' ? cmp : -cmp;
    });
    return list;
  }, [rows, sortBy]);

  const handleExport = () => {
    if (rows.length === 0) return;
    downloadCsv('recares-interview-contacts.csv', buildInterviewContactsCsv(rows));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const ok = await remove(deleteTarget.id, deleteTarget.email);
    setDeleteBusy(false);
    if (ok) setDeleteTarget(null);
  };

  return (
    <section className="dash-page iv-page" aria-labelledby="admin-interview-title">
      <div className="dash-page__header iv-page__header">
        <PageHeading id="admin-interview-title" title="Interview Invites" sub={"Residents who agreed to a follow-up interview. Move each card through outreach, keep notes, and check when people are free."} />
        <div className="iv-page__header-tools">
          <InterviewKpiGrid kpis={kpis} loading={loading} />
          <div className="admin-toolbar__select inquiries-page__filter">
            <Select
              label="Sort"
              options={INTERVIEW_SORT}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
            Export contacts CSV
          </Button>
        </div>
      </div>

      {error && !deleteTarget ? (
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
          canDelete={user?.role !== 'adviser'}
          rows={sortedRows}
          busyId={busyId}
          onMarkContacted={(id, email) => void markContacted(id, email)}
          onConfirm={(id, email) => void confirm(id, email)}
          onRequestDelete={(row) => {
            setDeleteError(null);
            setDeleteTarget(row);
          }}
          onAddNote={(id, existing, text) =>
            void addNote(id, existing, text, user?.uid || '', user?.name || user?.email || 'Team')
          }
        />
      ) : (
        <div className="skel-region" aria-busy="true" role="status">
          <span className="visually-hidden">Loading interview pipeline</span>
          <div className="skel-stat" style={{ minHeight: 160 }} />
          <div className="skel-stat" style={{ minHeight: 120 }} />
        </div>
      )}

      <div className="iv-page__main">
        <InterviewAvailabilityCalendar rows={rows} loading={loading} />
        <aside className="iv-page__aside" aria-label="Preference charts">
          <article className="dash-insight iv-prefs-card iv-prefs-card--days">
            <header className="iv-prefs-card__head">
              <h2 className="dash-insight__title">Preferred weekdays</h2>
              {kpis.topDay && kpis.topDay.count > 0 ? (
                <span className="iv-prefs-card__badge">{kpis.topDay.label}</span>
              ) : null}
            </header>
            <ul className="iv-day-bars iv-day-bars--roomy">
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
          </article>

          <article className="dash-insight iv-prefs-card iv-prefs-card--times">
            <header className="iv-prefs-card__head">
              <h2 className="dash-insight__title">Time windows</h2>
              {kpis.topTime && kpis.topTime.count > 0 ? (
                <span className="iv-prefs-card__badge">{kpis.topTime.label}</span>
              ) : null}
            </header>
            <ul className="iv-day-bars iv-day-bars--roomy">
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
          </article>
        </aside>
      </div>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete invite for ${deleteTarget?.email || 'this person'}?`}
        body="Permanently removes this interview opt-in from Firestore, including contact notes. This cannot be undone."
        busy={deleteBusy || Boolean(deleteTarget && busyId === deleteTarget.id)}
        error={deleteError || (deleteTarget ? error : null)}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}

/**
 * Interview Invites — pipeline first, compact prefs, availability calendar.
 */
export default function AdminInterviewsPage() {
  const { can } = useAuth();
  const canInterview = can('interviewInvites');

  return (
    <AdminAppShell>
      {canInterview ? (
        <InterviewInvitesContent />
      ) : (
        <section className="dash-page" aria-labelledby="admin-interview-title">
          <div className="dash-page__header">
            <PageHeading id="admin-interview-title" title="Interview Invites" sub={"Residents who agreed to a follow-up interview. Move each card through outreach, keep notes, and check when people are free."} />
          </div>
          <p className="na-error" role="alert">
            You do not have permission to view interview invites. Ask a superadmin if you need
            access.
          </p>
        </section>
      )}
    </AdminAppShell>
  );
}
