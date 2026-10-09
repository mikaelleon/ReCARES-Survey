'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  deleteInquiry,
  listInquiries,
  updateInquiryStatus,
  type InquiryRow,
} from '@/lib/firebase/inquiryManage';
import type { InquiryStatus } from '@/survey/schema';

const STATUS_FILTER = ['All', 'New', 'In progress', 'Resolved'];
const SORT_OPTIONS = ['Newest first', 'Oldest first', 'From (A–Z)'];

function filterLabel(status: InquiryStatus): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'resolved') return 'Resolved';
  return 'New';
}

function statusFromFilter(label: string): InquiryStatus | 'all' {
  if (label === 'New') return 'new';
  if (label === 'In progress') return 'in_progress';
  if (label === 'Resolved') return 'resolved';
  return 'all';
}

function formatWhen(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function InquiryInboxContent() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest first');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InquiryRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await listInquiries();
    setRows(next);
  }, []);

  useEffect(() => {
    void refresh()
      .catch(() => setError('Could not load inquiries from Firestore.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const shown = useMemo(() => {
    const wanted = statusFromFilter(filter);
    const list = wanted === 'all' ? [...rows] : rows.filter((r) => r.status === wanted);
    list.sort((a, b) => {
      if (sortBy === 'From (A–Z)') {
        const nameA = (a.name || a.email).toLowerCase();
        const nameB = (b.name || b.email).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      const cmp = a.createdMs - b.createdMs;
      return sortBy === 'Oldest first' ? cmp : -cmp;
    });
    return list;
  }, [rows, filter, sortBy]);

  const setStatus = async (row: InquiryRow, status: InquiryStatus) => {
    setBusyId(row.id);
    setError(null);
    setNote(null);
    try {
      await updateInquiryStatus(row.id, status);
      await refresh();
      setNote(`Marked ${row.email || 'inquiry'} as ${filterLabel(status).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not update that inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    setError(null);
    setNote(null);
    try {
      await deleteInquiry(deleteTarget.id);
      await refresh();
      setNote(`Deleted inquiry from ${deleteTarget.email || deleteTarget.name || 'unknown sender'}.`);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message ? err.message : 'Could not delete that inquiry.',
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <section className="dash-page inquiries-page" aria-labelledby="inquiries-title">
      <div className="dash-page__header">
        <h1 id="inquiries-title" className="dash-page__title">
          Inquiries
        </h1>
        <div className="dash-page__tools">
          <div className="admin-toolbar__select inquiries-page__filter">
            <Select
              label="Status"
              options={STATUS_FILTER}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="admin-toolbar__select inquiries-page__filter">
            <Select
              label="Sort"
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>
      </div>
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
      {loading ? (
        <p className="na-intro" role="status">
          Loading inquiries…
        </p>
      ) : rows.length === 0 ? (
        <div className="admin-empty" role="status">
          <p className="admin-empty__title">No inquiries yet</p>
          <p className="admin-empty__body">
            When someone submits the contact form on the resident homepage, their message will
            appear here.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="admin-empty" role="status">
          <p className="admin-empty__title">No inquiries match</p>
          <p className="admin-empty__body">Try a different status filter.</p>
          {filter !== 'All' ? (
            <button type="button" className="admin-empty__btn" onClick={() => setFilter('All')}>
              Show all
            </button>
          ) : null}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>From</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="admin-table__row">
                  <td>{formatWhen(row.createdAt)}</td>
                  <td>
                    <div>{row.name || '—'}</div>
                    <a href={`mailto:${row.email}`}>{row.email}</a>
                  </td>
                  <td className="inquiries-page__message">{row.message}</td>
                  <td>{filterLabel(row.status)}</td>
                  <td>
                    <div className="inquiry-row-actions">
                      {row.status !== 'in_progress' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === row.id || deleteBusy}
                          onClick={() => void setStatus(row, 'in_progress')}
                        >
                          In progress
                        </Button>
                      ) : null}
                      {row.status !== 'resolved' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === row.id || deleteBusy}
                          onClick={() => void setStatus(row, 'resolved')}
                        >
                          Resolved
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === row.id || deleteBusy}
                          onClick={() => void setStatus(row, 'new')}
                        >
                          Reopen
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === row.id || deleteBusy}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(row);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete inquiry from ${deleteTarget?.email || deleteTarget?.name || 'this person'}?`}
        body="Permanently removes this homepage contact message from Firestore. This cannot be undone."
        busy={deleteBusy}
        error={deleteError}
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

export default function AdminInquiriesPage() {
  return (
    <AdminAppShell>
      <InquiryInboxContent />
    </AdminAppShell>
  );
}
