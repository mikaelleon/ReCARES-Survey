'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardStatGrid } from '@/components/admin/DashboardStatGrid';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ResponseDetailDrawer } from '@/components/admin/ResponseDetailDrawer';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { ResponseViewsPanel } from '@/components/admin/ResponseViewsPanel';
import type { Section4Filter, SortDir, SortKey } from '@/components/admin/ResponseToolbar';
import {
  buildCsv,
  buildSummaryText,
  computeKpis,
  countByPhase,
} from '@/lib/admin/analytics';
import { SAMPLE_RESPONSES, type SampleRecord } from '@/lib/admin/sampleResponses';
import { useAuth } from '@/lib/auth/AuthProvider';
import { redirect } from 'next/navigation';

type DemoState = 'data' | 'loading' | 'empty' | 'error';

/**
 * Proponent dashboard — overview KPIs + Forms-style response views.
 * Auth guard is client-side until middleware + Firebase session exist.
 */
export function AdminDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const stateParam = searchParams.get('state');
  const demoState: DemoState =
    stateParam === 'loading' || stateParam === 'empty' || stateParam === 'error'
      ? stateParam
      : 'data';

  const [records, setRecords] = useState<SampleRecord[]>(SAMPLE_RESPONSES);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [phase, setPhase] = useState('');
  const [section4, setSection4] = useState<Section4Filter>('all');
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

  useEffect(() => {
    if (demoState === 'empty') setRecords([]);
    else if (demoState === 'data') setRecords(SAMPLE_RESPONSES);
  }, [demoState]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (debouncedQuery) {
      list = list.filter((r) =>
        [r.id, r.phase, r.resident, r.pwd].join(' ').toLowerCase().includes(debouncedQuery),
      );
    }
    if (phase) list = list.filter((r) => r.phase === phase);
    if (section4 === 'yes') list = list.filter((r) => r.s4);
    if (section4 === 'no') list = list.filter((r) => !r.s4);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'phase') cmp = a.phase.localeCompare(b.phase);
      else cmp = a.submittedAt.localeCompare(b.submittedAt);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [records, debouncedQuery, phase, section4, sortKey, sortDir]);

  const kpis = useMemo(() => computeKpis(records), [records]);
  const byPhase = useMemo(() => countByPhase(records), [records]);

  const resetFilters = useCallback(() => {
    setQuery('');
    setPhase('');
    setSection4('all');
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
    const text = buildSummaryText(kpis, byPhase);
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote('Summary copied');
    } catch {
      setCopyNote('Copy failed');
    }
    setTimeout(() => setCopyNote(null), 2000);
  }, [kpis, byPhase]);

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
  }, [deleteTarget, records]);

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
  }, [undo]);

  // TODO: move auth guard to middleware.ts once Firebase Auth session handling exists.
  if (!user) {
    redirect('/admin/login');
  }

  const loading = demoState === 'loading';
  const error = demoState === 'error';
  const emptyDataset = !loading && !error && records.length === 0;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__inner">
        <section className="admin-section" aria-labelledby="admin-overview-title">
          <h1 id="admin-overview-title" className="admin-section__title">
            Dashboard
          </h1>
          <p className="admin-section__lead">
            Aggregate coverage for the Camella Homes Tibig needs assessment. Use Summary, Question,
            and Individual views below for Forms-style response analysis.
          </p>

          <DashboardStatGrid kpis={kpis} loading={loading} />
        </section>

        <section className="admin-section" aria-labelledby="admin-responses-title">
          <h2 id="admin-responses-title" className="admin-section__title admin-section__title--h2">
            Responses
          </h2>
          <p className="admin-section__lead">
            Browse aggregates by question, or step through each submission. Gated fields the
            respondent never unlocked stay <code>not_shown</code>.
          </p>

          {error ? (
            <div className="admin-panel">
              <ResponseEmptyState
                kind="error"
                onReset={() => window.location.assign('/admin/dashboard')}
              />
            </div>
          ) : loading ? (
            <div className="admin-panel">
              <div className="admin-table-skel" aria-hidden="true">
                <div className="admin-table-skel__row" />
                <div className="admin-table-skel__row" />
                <div className="admin-table-skel__row" />
              </div>
            </div>
          ) : (
            <ResponseViewsPanel
              records={records}
              filtered={filtered}
              query={query}
              onQueryChange={setQuery}
              phase={phase}
              onPhaseChange={setPhase}
              section4={section4}
              onSection4Change={setSection4}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortKeyChange={setSortKey}
              onToggleSortDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              onExport={handleExport}
              onCopySummary={() => void handleCopySummary()}
              copyNote={copyNote}
              exportDisabled={filtered.length === 0}
              onView={setViewRecord}
              onDelete={setDeleteTarget}
              highlightId={flashId}
              onResetFilters={resetFilters}
              emptyDataset={emptyDataset}
            />
          )}

          <div className="admin-dashboard__back">
            <Link href="/">Back to the resident site</Link>
          </div>
        </section>
      </div>

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
    </div>
  );
}
