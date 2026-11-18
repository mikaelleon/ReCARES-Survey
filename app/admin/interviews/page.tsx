'use client';

import { PageHeading } from '@/components/admin/PageHeading';
import { useEffect, useMemo, useState } from 'react';
import { CountLedger } from '@/components/admin/CountLedger';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { InterviewAvailabilityCalendar } from '@/components/admin/InterviewAvailabilityCalendar';
import { InterviewBoard } from '@/components/admin/InterviewBoard';
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
    removeMany,
    addNote,
  } = useInterviewInvites();
  const canDelete = user?.role !== 'adviser';
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
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

  /** Drop selections for invites that no longer exist (deleted here or elsewhere). */
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const live = new Set(rows.map((r) => r.id));
      const next = new Set(Array.from(prev).filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const allSelected = sortedRows.length > 0 && selectedIds.size === sortedRows.length;

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const failed = await removeMany(ids);
    setBulkBusy(false);
    setBulkOpen(false);
    setSelectedIds(new Set(failed));
    if (failed.length === 0) setSelectMode(false);
  };

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
        <PageHeading id="admin-interview-title" title="Interview invites" sub={"Residents who agreed to a follow-up interview. Move each one through outreach, keep notes, and check when people are free."} />
        <div className="dash-page__tools iv-page__tools">
          <div className="admin-toolbar__select inquiries-page__filter">
            <Select
              label="Sort"
              options={INTERVIEW_SORT}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
            Export contacts
          </Button>
          {canDelete ? (
            <Button
              size="sm"
              variant="secondary"
              aria-pressed={selectMode}
              disabled={loading || rows.length === 0}
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? 'Done' : 'Select'}
            </Button>
          ) : null}
        </div>
      </div>

      <CountLedger
        ariaLabel="Interview invites summary"
        label="Invites"
        total={kpis.total}
        totalNote="Residents who agreed to be interviewed"
        empty={kpis.total === 0}
        loading={loading}
        rows={[
          { label: 'Not contacted', value: kpis.notContacted, note: 'no outreach yet' },
          { label: 'Pending', value: kpis.pending, note: 'waiting for a reply' },
          { label: 'Confirmed', value: kpis.confirmed, note: 'date agreed' },
        ]}
      />

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

      {selectMode && canDelete ? (
        <div className="iv-bulk" role="toolbar" aria-label="Bulk actions">
          <label className="iv-bulk__all">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = selectedIds.size > 0 && !allSelected;
              }}
              onChange={() =>
                setSelectedIds(allSelected ? new Set() : new Set(sortedRows.map((r) => r.id)))
              }
            />
            <span>Select all ({sortedRows.length})</span>
          </label>
          <span className="iv-bulk__count" aria-live="polite">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            className="iv-bulk__danger"
            disabled={selectedIds.size === 0 || busyId === '__bulk__'}
            onClick={() => setBulkOpen(true)}
          >
            Delete{selectedIds.size > 0 ? ` ${selectedIds.size}` : ''}
          </button>
          <button type="button" className="iv-bulk__cancel" onClick={exitSelectMode}>
            Cancel
          </button>
        </div>
      ) : null}

      {!loading ? (
        <InterviewBoard
          selection={
            selectMode && canDelete
              ? { active: true, selected: selectedIds, onToggle: toggleSelected }
              : undefined
          }
          canDelete={canDelete}
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

      <section className="iv-avail" aria-label="When people are free">
        <div className="iv-avail__lead">
          <p className="iv-avail__eyebrow">Most often free</p>
          {kpis.topDay ? (
            <p className="iv-avail__slot">
              {kpis.topDay.label}
              {kpis.topTime ? `, ${kpis.topTime.label.toLowerCase()}` : ''}
            </p>
          ) : (
            <p className="iv-avail__slot iv-avail__slot--none">—</p>
          )}
          <p className="iv-avail__note">
            {kpis.topDay
              ? `${kpis.topDay.count} of ${kpis.total} invites prefer ${kpis.topDay.label}`
              : 'Appears once invites come in'}
          </p>
        </div>
        <InterviewAvailabilityCalendar rows={rows} loading={loading} />
      </section>

      <ConfirmDeleteModal
        open={bulkOpen}
        title={`Delete ${selectedIds.size} interview ${selectedIds.size === 1 ? 'invite' : 'invites'}?`}
        body="Permanently removes these contacts from Firestore. This cannot be undone."
        busy={bulkBusy}
        confirmLabel={`Delete ${selectedIds.size}`}
        onCancel={() => {
          if (!bulkBusy) setBulkOpen(false);
        }}
        onConfirm={() => void confirmBulkDelete()}
      />
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
            <PageHeading id="admin-interview-title" title="Interview invites" sub={"Residents who agreed to a follow-up interview. Move each one through outreach, keep notes, and check when people are free."} />
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
