'use client';

import { LayoutGrid, List, Rows3, Search, Table2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CountLedger } from '@/components/admin/CountLedger';
import { PageHeading } from '@/components/admin/PageHeading';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { InquiryCards } from '@/components/admin/inquiries/InquiryCards';
import { InquiryList, InquiryTable } from '@/components/admin/inquiries/InquiryRows';
import { InquirySkeleton } from '@/components/admin/inquiries/InquirySkeleton';
import {
  INQUIRY_VIEW_MODES,
  SORT_FROM,
  SORT_NEWEST,
  SORT_OLDEST,
  SORT_OPTIONS,
  filterLabel,
  senderLabel,
  statusFromFilter,
  type InquiryViewMode,
} from '@/components/admin/inquiries/inquiryMeta';
import { Select } from '@/components/ui/Select';
import { ViewSwitcher, type ViewOption } from '@/components/ui/ViewSwitcher';
import { useViewMode } from '@/lib/admin/useViewMode';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  deleteInquiry,
  listInquiries,
  updateInquiryStatus,
  type InquiryRow,
} from '@/lib/firebase/inquiryManage';
import type { InquiryStatus } from '@/survey/schema';

const VIEW_STORAGE_KEY = 'recares.admin.inquiries.view';
const NOTE_MS = 6000;

const VIEW_OPTIONS: ViewOption<InquiryViewMode>[] = [
  { id: 'table', label: 'Table', icon: <Table2 size={16} aria-hidden="true" /> },
  { id: 'comfortable', label: 'Comfortable', icon: <LayoutGrid size={16} aria-hidden="true" /> },
  { id: 'compact', label: 'Compact', icon: <Rows3 size={16} aria-hidden="true" /> },
  { id: 'list', label: 'List', icon: <List size={16} aria-hidden="true" /> },
];

function InquiryInboxContent() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState(SORT_NEWEST);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InquiryRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [mode, setMode] = useViewMode<InquiryViewMode>(
    VIEW_STORAGE_KEY,
    INQUIRY_VIEW_MODES,
    'table',
    'list',
  );

  const refresh = useCallback(async () => {
    const next = await listInquiries();
    setRows(next);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void refresh()
      .catch(() => setLoadError('Could not load inquiries from Firestore.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), NOTE_MS);
    return () => window.clearTimeout(timer);
  }, [note]);

  /** Search first, so the status chip counts always describe what the search matches. */
  const searched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${r.name} ${r.email} ${r.message}`.toLowerCase().includes(needle));
  }, [rows, query]);

  const counts = useMemo(() => {
    const tally: Record<string, number> = { All: searched.length, New: 0, 'In progress': 0, Resolved: 0 };
    for (const r of searched) tally[filterLabel(r.status)] += 1;
    return tally;
  }, [searched]);

  const shown = useMemo(() => {
    const wanted = statusFromFilter(filter);
    const list = wanted === 'all' ? [...searched] : searched.filter((r) => r.status === wanted);
    list.sort((a, b) => {
      if (sortBy === SORT_FROM) {
        return senderLabel(a).toLowerCase().localeCompare(senderLabel(b).toLowerCase());
      }
      const cmp = a.createdMs - b.createdMs;
      return sortBy === SORT_OLDEST ? cmp : -cmp;
    });
    return list;
  }, [searched, filter, sortBy]);

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

  const handlers = {
    busyId,
    locked: deleteBusy,
    onStatus: (row: InquiryRow, status: InquiryStatus) => void setStatus(row, status),
    onDelete: (row: InquiryRow) => {
      setDeleteError(null);
      setDeleteTarget(row);
    },
  };

  const clearFilters = () => {
    setQuery('');
    setFilter('All');
  };

  /** Ledger rows are the status filter; selecting the active one clears it. */
  const toggleFilter = (label: string) => setFilter((current) => (current === label ? 'All' : label));
  const ledgerRows = ['New', 'In progress', 'Resolved'].map((label) => ({
    label,
    value: counts[label] ?? 0,
    note: label === 'New' ? 'not answered yet' : label === 'In progress' ? 'being handled' : 'answered',
    active: filter === label,
    onSelect: () => toggleFilter(label),
  }));

  const renderResults = () => {
    if (loading) return <InquirySkeleton mode={mode} />;
    if (loadError) {
      return (
        <div className="admin-empty inq-state" role="alert">
          <p className="admin-empty__title">Inquiries did not load</p>
          <p className="admin-empty__body">{loadError} Check your connection, then try again.</p>
          <button type="button" className="inq-btn" onClick={load}>
            Retry
          </button>
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="admin-empty inq-state" role="status">
          <p className="admin-empty__title">No inquiries yet</p>
          <p className="admin-empty__body">
            When someone submits the contact form on the resident homepage, their message will
            appear here.
          </p>
        </div>
      );
    }
    if (shown.length === 0) {
      return (
        <div className="admin-empty inq-state" role="status">
          <p className="admin-empty__title">No inquiries match</p>
          <p className="admin-empty__body">
            Nothing fits the current search or status. Clear them to see all {rows.length} inquiries.
          </p>
          <button type="button" className="inq-btn" onClick={clearFilters}>
            Clear search and filter
          </button>
        </div>
      );
    }
    if (mode === 'table') {
      return (
        <InquiryTable rows={shown} total={rows.length} sortBy={sortBy} onSort={setSortBy} {...handlers} />
      );
    }
    if (mode === 'list') return <InquiryList rows={shown} {...handlers} />;
    return <InquiryCards rows={shown} variant={mode} {...handlers} />;
  };

  return (
    <section className="dash-page inquiries-page" aria-labelledby="inquiries-title">
      <div className="dash-page__header">
        <PageHeading id="inquiries-title" title="Inquiries" sub={"Messages from the homepage contact form. Reply from your own email, then set a status so the team knows where each one stands."} />
      </div>

      <CountLedger
        ariaLabel="Inquiries summary"
        label="Inquiries"
        total={counts.All ?? 0}
        totalNote={
          filter === 'All'
            ? 'Messages from the homepage contact form'
            : `Showing ${filter.toLowerCase()} only. Select it again to see all`
        }
        empty={rows.length === 0}
        loading={loading}
        rows={ledgerRows}
      />

      <div className="inq-toolbar">
        <div className="inq-toolbar__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search name, email or message"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="inq-toolbar__sort">
          <Select label="Sort" options={SORT_OPTIONS} value={sortBy} onChange={(e) => setSortBy(e.target.value)} />
        </div>
        <ViewSwitcher label="Inquiry view" value={mode} options={VIEW_OPTIONS} onChange={setMode} />
      </div>

      <div className="inq-notes">
        {note ? (
          <p role="status" className="inq-note">
            {note}
          </p>
        ) : null}
        {error ? (
          <p className="inq-note inq-note--error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {renderResults()}

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
  const { canTeamOps } = useAuth();

  return (
    <AdminAppShell>
      {canTeamOps ? (
        <InquiryInboxContent />
      ) : (
        <section className="dash-page" aria-labelledby="inquiries-title">
          <div className="dash-page__header">
            <PageHeading id="inquiries-title" title="Inquiries" sub={"Messages from the homepage contact form. Reply from your own email, then set a status so the team knows where each one stands."} />
          </div>
          <p className="na-error" role="alert">
            Advisers cannot view the public inquiry inbox. Ask a proponent or superadmin if you need
            a message forwarded.
          </p>
        </section>
      )}
    </AdminAppShell>
  );
}
