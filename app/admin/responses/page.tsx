'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ResponseDetailDrawer } from '@/components/admin/ResponseDetailDrawer';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { ResponseViewsPanel } from '@/components/admin/ResponseViewsPanel';
import {
  ResponsesToolbar,
  type BranchFilter,
  type SortDir,
  type SortKey,
} from '@/components/dashboard/ResponsesToolbar';
import { buildCsv, buildSummaryText } from '@/lib/admin/analytics';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useQueryParam } from '@/lib/navigation/useQueryParam';

type DemoState = 'data' | 'loading' | 'empty' | 'error';

/**
 * Responses analysis — Summary / Question / Individual.
 */
export default function AdminResponsesPage() {
  const { can } = useAuth();
  const canResponses = can('responsesDashboard');
  const { records, setRecords, status, source } = useSurveyResponses();
  const stateParam = useQueryParam('state');
  const demoState: DemoState =
    stateParam === 'loading' || stateParam === 'empty' || stateParam === 'error'
      ? stateParam
      : status === 'loading'
        ? 'loading'
        : 'data';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [phase, setPhase] = useState('');
  const [branch, setBranch] = useState<BranchFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('submitted');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewRecord, setViewRecord] = useState<SampleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SampleRecord | null>(null);
  const [undo, setUndo] = useState<{ record: SampleRecord; index: number } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 160);
    return () => clearTimeout(t);
  }, [query]);

  const workingRecords = demoState === 'empty' ? [] : records;

  const filtered = useMemo(() => {
    let list = [...workingRecords];
    if (debouncedQuery) {
      list = list.filter((r) =>
        [r.id, r.phase, r.resident, r.pwd].join(' ').toLowerCase().includes(debouncedQuery),
      );
    }
    if (phase) list = list.filter((r) => r.phase === phase);
    if (branch === 'tenant') list = list.filter((r) => r.tenant);
    if (branch === 'homeowner') list = list.filter((r) => r.homeowner);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'phase') cmp = a.phase.localeCompare(b.phase);
      else cmp = a.submittedAt.localeCompare(b.submittedAt);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [workingRecords, debouncedQuery, phase, branch, sortKey, sortDir]);

  const resetFilters = useCallback(() => {
    setQuery('');
    setPhase('');
    setBranch('all');
  }, []);

  const handleExport = useCallback(() => {
    if (filtered.length === 0) return;
    const csv = buildCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recares-responses.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const handleCopySummary = useCallback(async () => {
    const text = buildSummaryText(workingRecords);
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote('Summary copied');
    } catch {
      setCopyNote('Copy failed');
    }
    setTimeout(() => setCopyNote(null), 2000);
  }, [workingRecords]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const index = records.findIndex((r) => r.id === deleteTarget.id);
    if (index < 0) {
      setDeleteTarget(null);
      return;
    }
    const removed = records[index];
    setRecords((prev) => prev.filter((r) => r.id !== removed.id));
    setDeleteTarget(null);
    setUndo({ record: removed, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  }, [deleteTarget, records, setRecords]);

  const handleUndo = useCallback(() => {
    if (!undo) return;
    setRecords((prev) => {
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.record);
      return next;
    });
    setFlashId(undo.record.id);
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setTimeout(() => setFlashId(null), 900);
  }, [undo, setRecords]);

  return (
    <AdminAppShell>
      <section className="admin-section" aria-labelledby="admin-responses-title">
        <h1 id="admin-responses-title" className="admin-section__title">
          Responses
        </h1>
        <p className="admin-section__lead">
          Browse aggregates by question, or step through each submission. Source:{' '}
          {source === 'firestore' ? 'Firestore' : 'sample stub (no live docs yet)'}.
        </p>

        {!canResponses ? (
          <p className="admin-section__lead">
            You do not have permission to view responses. Ask a superadmin if you need access.
          </p>
        ) : (
          <>
            <ResponsesToolbar
              query={query}
              onQueryChange={setQuery}
              phase={phase}
              onPhaseChange={setPhase}
              branch={branch}
              onBranchChange={setBranch}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortKeyChange={setSortKey}
              onToggleSortDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              showing={filtered.length}
              total={workingRecords.length}
              onExport={handleExport}
              onCopySummary={() => void handleCopySummary()}
              exportDisabled={filtered.length === 0}
            />

            {demoState === 'error' ? (
              <div className="admin-panel">
                <ResponseEmptyState
                  kind="error"
                  onReset={() => window.location.assign('/admin/responses/')}
                />
              </div>
            ) : demoState === 'loading' ? (
              <div className="admin-panel">
                <div className="admin-table-skel" aria-hidden="true">
                  <div className="admin-table-skel__row" />
                  <div className="admin-table-skel__row" />
                  <div className="admin-table-skel__row" />
                </div>
              </div>
            ) : (
              <ResponseViewsPanel
                records={workingRecords}
                filtered={filtered}
                onExport={handleExport}
                onCopySummary={() => void handleCopySummary()}
                copyNote={copyNote}
                exportDisabled={filtered.length === 0}
                onView={setViewRecord}
                onDelete={setDeleteTarget}
                highlightId={flashId}
                onResetFilters={resetFilters}
                emptyDataset={workingRecords.length === 0}
              />
            )}
          </>
        )}
      </section>

      <ResponseDetailDrawer record={viewRecord} onClose={() => setViewRecord(null)} />
      <DeleteConfirmModal
        record={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {undo ? (
        <div className="admin-undo" role="status">
          <span>Deleted {undo.record.id}</span>
          <button type="button" onClick={handleUndo}>
            Undo
          </button>
        </div>
      ) : null}
    </AdminAppShell>
  );
}
