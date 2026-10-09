'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { BranchingGuide } from '@/components/admin/BranchingGuide';
import { DashboardHeaderTools } from '@/components/admin/DashboardHeaderTools';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ResponseDetailDrawer } from '@/components/admin/ResponseDetailDrawer';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { ResponseViewsPanel, type ResponseViewTab } from '@/components/admin/ResponseViewsPanel';
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal';
import {
  ResponsesToolbar,
  type BranchFilter,
  type SortDir,
  type SortKey,
} from '@/components/dashboard/ResponsesToolbar';
import { buildCsv, buildSummaryText } from '@/lib/admin/analytics';
import {
  DEFAULT_DATE_RANGE,
  filterRecordsByDateRange,
  loadStoredDateRange,
  storeDateRange,
  type DateRangeValue,
} from '@/lib/admin/dateRange';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { isExtendedWidgetId } from '@/lib/admin/extendedWidgets';
import {
  DEFAULT_SUMMARY_WIDGETS,
  normalizeSummaryWidgets,
  SUMMARY_WIDGET_CATALOG,
} from '@/lib/admin/summaryWidgets';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';
import { saveSummaryWidgets } from '@/lib/firebase/auth';
import { deleteNeedsAssessment } from '@/lib/firebase/firestore';
import { useQueryParam } from '@/lib/navigation/useQueryParam';
import { TableSkeleton } from '@/components/ui/Skeleton';

type DemoState = 'data' | 'loading' | 'empty' | 'error';

function ResponsesContent() {
  const { can, user, reloadProfile } = useAuth();
  const canResponses = can('responsesDashboard');
  const { records, setRecords, status, source, usingDemoSample } = useSurveyResponses();
  const stateParam = useQueryParam('state');
  const focusParam = useQueryParam('focus');
  const tabParam = useQueryParam('tab');
  const responseIdParam = useQueryParam('responseId');
  const initialTab: ResponseViewTab | undefined =
    tabParam === 'summary' || tabParam === 'question' || tabParam === 'individual'
      ? tabParam
      : responseIdParam
        ? 'individual'
        : undefined;
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
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [summaryWidgets, setSummaryWidgets] = useState<string[]>([
    ...DEFAULT_SUMMARY_WIDGETS,
  ]);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const focusPinned = useRef<string | null>(null);
  const focusScrolled = useRef<string | null>(null);
  const [viewRecord, setViewRecord] = useState<SampleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SampleRecord | null>(null);
  const [undo, setUndo] = useState<{ record: SampleRecord; index: number } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveDelete = source === 'firestore' && !usingDemoSample;
  const canDelete = liveDelete || usingDemoSample;

  useEffect(() => {
    setDateRange(loadStoredDateRange());
  }, []);

  useEffect(() => {
    if (user?.summaryWidgets) {
      setSummaryWidgets(
        normalizeSummaryWidgets(user.summaryWidgets, { allowEmpty: true }),
      );
    }
  }, [user?.summaryWidgets]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 160);
    return () => clearTimeout(t);
  }, [query]);

  const workingRecords = useMemo(() => {
    const base = demoState === 'empty' ? [] : records;
    return filterRecordsByDateRange(base, dateRange);
  }, [demoState, records, dateRange]);

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

  const handleDateChange = useCallback((next: DateRangeValue) => {
    setDateRange(next);
    storeDateRange(next);
  }, []);

  const persistWidgets = useCallback(
    async (next: string[]) => {
      const normalized = normalizeSummaryWidgets(next, { allowEmpty: true });
      setSummaryWidgets(normalized);
      if (!user?.uid) return;
      try {
        await saveSummaryWidgets(user.uid, normalized);
        await reloadProfile();
      } catch (error) {
        console.warn('Could not save summaryWidgets', error);
      }
    },
    [user?.uid, reloadProfile],
  );

  /** Dashboard drill-down: pin focus widget if missing, then scroll once it mounts. */
  useEffect(() => {
    if (!focusParam) return;
    const known =
      isExtendedWidgetId(focusParam) ||
      SUMMARY_WIDGET_CATALOG.some((w) => w.id === focusParam);
    if (!known) return;

    if (focusPinned.current !== focusParam && !summaryWidgets.includes(focusParam)) {
      focusPinned.current = focusParam;
      void persistWidgets([...summaryWidgets, focusParam]);
      return;
    }
    focusPinned.current = focusParam;

    if (focusScrolled.current === focusParam) return;
    if (!summaryWidgets.includes(focusParam)) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`summary-widget-${focusParam}`);
      if (!el) return;
      focusScrolled.current = focusParam;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusParam, summaryWidgets, persistWidgets]);

  const handleToggleWidget = useCallback(
    (id: string) => {
      const next = summaryWidgets.includes(id)
        ? summaryWidgets.filter((w) => w !== id)
        : [...summaryWidgets, id];
      void persistWidgets(next.length ? next : []);
    },
    [summaryWidgets, persistWidgets],
  );

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

  const requestDelete = useCallback(
    (record: SampleRecord) => {
      if (!canDelete) {
        setCopyNote('Delete is unavailable until live Firestore responses are loaded.');
        setTimeout(() => setCopyNote(null), 3000);
        return;
      }
      setDeleteError(null);
      setDeleteTarget(record);
    },
    [canDelete],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const index = records.findIndex((r) => r.id === deleteTarget.id);
    if (index < 0) {
      setDeleteTarget(null);
      return;
    }
    const removed = records[index];

    if (liveDelete) {
      setDeleteBusy(true);
      setDeleteError(null);
      try {
        await deleteNeedsAssessment(removed.id);
        setRecords((prev) => prev.filter((r) => r.id !== removed.id));
        if (viewRecord?.id === removed.id) setViewRecord(null);
        setDeleteTarget(null);
        setUndo(null);
        setCopyNote('Response deleted from Firestore.');
        setTimeout(() => setCopyNote(null), 2000);
      } catch (err) {
        setDeleteError(
          err instanceof Error && err.message ? err.message : 'Could not delete that response.',
        );
      } finally {
        setDeleteBusy(false);
      }
      return;
    }

    if (!usingDemoSample) {
      setDeleteError('Delete is unavailable until live Firestore responses are loaded.');
      return;
    }

    setRecords((prev) => prev.filter((r) => r.id !== removed.id));
    if (viewRecord?.id === removed.id) setViewRecord(null);
    setDeleteTarget(null);
    setUndo({ record: removed, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  }, [deleteTarget, records, setRecords, liveDelete, usingDemoSample, viewRecord?.id]);

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
    <>
      <section className="dash-page resp-page" aria-labelledby="admin-responses-title">
        {!canResponses ? (
          <>
            <div className="dash-page__header">
              <h1 id="admin-responses-title" className="dash-page__title">
                Responses
              </h1>
            </div>
            <p className="na-error" role="alert">
              You do not have permission to view responses. Ask a superadmin if you need access.
            </p>
          </>
        ) : (
          <>
            <div className="dash-page__header">
              <h1 id="admin-responses-title" className="dash-page__title">
                Responses
              </h1>
              <DashboardHeaderTools dateRange={dateRange} onDateRangeChange={handleDateChange} />
            </div>

            {usingDemoSample ? (
              <p className="na-error" role="status">
                Demo sample mode (?demo=sample). Not live Firestore data.
              </p>
            ) : null}
            {source === 'error' && !usingDemoSample ? (
              <p className="na-error" role="alert">
                Live Firestore query failed — showing empty until reload succeeds.
              </p>
            ) : null}
            {source !== 'firestore' && source !== 'error' && !usingDemoSample ? (
              <p className="na-error" role="status">
                Firestore unavailable — showing empty until config/auth is ready.
              </p>
            ) : null}

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

            <BranchingGuide />

            <div className="resp-page__body">
              {demoState === 'error' ? (
                <div className="admin-panel">
                  <ResponseEmptyState
                    kind="error"
                    onReset={() => window.location.assign('/admin/responses/')}
                  />
                </div>
              ) : demoState === 'loading' ? (
                <div className="admin-panel">
                  <TableSkeleton rows={8} />
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
                  onDelete={requestDelete}
                  highlightId={flashId}
                  onResetFilters={resetFilters}
                  emptyDataset={workingRecords.length === 0}
                  summaryWidgets={summaryWidgets}
                  onOpenWidgetPicker={() => setWidgetModalOpen(true)}
                  onRemoveWidget={(id) => handleToggleWidget(id)}
                  initialTab={initialTab}
                  focusResponseId={responseIdParam}
                />
              )}
            </div>
          </>
        )}
      </section>

      <AddWidgetModal
        open={widgetModalOpen}
        selectedIds={summaryWidgets}
        onClose={() => setWidgetModalOpen(false)}
        onToggle={handleToggleWidget}
      />

      <ResponseDetailDrawer
        record={viewRecord}
        onClose={() => setViewRecord(null)}
        onDelete={canDelete ? requestDelete : undefined}
        deleteDisabled={deleteBusy}
      />
      <DeleteConfirmModal
        record={deleteTarget}
        live={liveDelete}
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDelete()}
      />

      {undo && !liveDelete ? (
        <div className="admin-undo" role="status">
          <span>Deleted {undo.record.id}</span>
          <button type="button" onClick={handleUndo}>
            Undo
          </button>
        </div>
      ) : null}
    </>
  );
}

/**
 * Responses analysis — Summary / Question / Individual.
 * Hook runs inside AdminAppShell (SurveyResponsesProvider).
 */
export default function AdminResponsesPage() {
  return (
    <AdminAppShell>
      <ResponsesContent />
    </AdminAppShell>
  );
}
