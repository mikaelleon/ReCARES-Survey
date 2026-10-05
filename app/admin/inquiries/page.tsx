'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  listInquiries,
  updateInquiryStatus,
  type InquiryRow,
} from '@/lib/firebase/inquiryManage';
import type { InquiryStatus } from '@/survey/schema';

const STATUS_FILTER = ['All', 'New', 'In progress', 'Resolved'];

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
  const [busyId, setBusyId] = useState<string | null>(null);

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
    if (wanted === 'all') return rows;
    return rows.filter((r) => r.status === wanted);
  }, [rows, filter]);

  const setStatus = async (row: InquiryRow, status: InquiryStatus) => {
    setBusyId(row.id);
    setError(null);
    setNote(null);
    try {
      await updateInquiryStatus(row.id, status);
      await refresh();
      setNote(`Marked ${row.email || 'inquiry'} as ${filterLabel(status).toLowerCase()}.`);
    } catch {
      setError('Could not update that inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="dash-page" aria-labelledby="inquiries-title">
      <div className="dash-page__header">
        <h1 id="inquiries-title" className="dash-page__title">
          Inquiries
        </h1>
        <div className="admin-toolbar__select" style={{ minWidth: 180 }}>
          <Select
            label="Status"
            options={STATUS_FILTER}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <p className="na-intro" style={{ maxWidth: 640, marginBottom: 16 }}>
        Messages from the public contact form. Reply from your own email. This inbox does not send
        mail automatically.
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
      {loading ? (
        <p className="na-intro">Loading inquiries…</p>
      ) : shown.length === 0 ? (
        <p className="na-intro">No inquiries in this filter.</p>
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
                  <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{row.message}</td>
                  <td>{filterLabel(row.status)}</td>
                  <td>
                    <div className="inquiry-row-actions">
                      {row.status !== 'in_progress' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => void setStatus(row, 'in_progress')}
                        >
                          In progress
                        </Button>
                      ) : null}
                      {row.status !== 'resolved' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => void setStatus(row, 'resolved')}
                        >
                          Resolved
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => void setStatus(row, 'new')}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
