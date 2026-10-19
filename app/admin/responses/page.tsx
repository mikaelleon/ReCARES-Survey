'use client';

import { PageHeading } from '@/components/admin/PageHeading';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { ResponseViewsPanel, type ResponseViewTab } from '@/components/admin/ResponseViewsPanel';
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal';
import { ResponsesSkeleton } from '@/components/admin/ResponsesSkeleton';
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
import { deleteNeedsAssessment, deleteNeedsAssessments } from '@/lib/firebase/firestore';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { useQueryParam } from '@/lib/navigation/useQueryParam';

type DemoState = 'data' | 'loading' | 'empty' | 'error';

function ResponsesContent() {
  const { can, user, reloadProfile } = useAuth();
  const canResponses = can('responsesDashboard');
  const { records, setRecords, status, source, usingDemoSample, reload } = useSurveyResponses();
  const stateParam = useQueryParam('state');
  const focusParam = useQueryParam('focus');
  const tabParam = useQueryParam('tab');
  const responseIdParam = useQueryParam('responseId');
  const initialTab: ResponseViewTab | undefined =
    tabParam === 'summary' || tabParam === 'question' || tabParam === 'individual' || tabParam === 'list'
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
  const [deleteTarget, setDeleteTarget] = useState<SampleRecord | null>(null);
  const [undo, setUndo] = useState<{ record: SampleRecord; index: number } | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [bulkTargets, setBulkTargets] = useState<string[] | null>(null);
  const [bulkClearSignal, setBulkClearSignal] = useState(0);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveDelete = source === 'firestore' && !usingDemoSample;
  const canDelete =
    (liveDelete || usingDemoSample) && user?.role !== 'adviser' && can('responsesDelete');

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

  const loadFailed = status === 'error' && !usingDemoSample && demoState === 'data';

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

  /** Page-level feedback toast; the latest message replaces the previous one. */
  const notify = useCallback((message: string, ms = 2400) => {
    setCopyNote(message);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setCopyNote(null), ms);
  }, []);

  /** Responses exist, but the active date range excludes every one of them. */
  const rangeEmpty = demoState !== 'empty' && records.length > 0 && workingRecords.length === 0;

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
    notify(`Downloaded ${filtered.length} ${filtered.length === 1 ? 'response' : 'responses'} as CSV`);
  }, [filtered, notify]);

  const handleCopySummary = useCallback(async () => {
    const text = buildSummaryText(workingRecords);
    try {
      await navigator.clipboard.writeText(text);
      notify('Summary copied');
    } catch {
      notify('Copy failed');
    }
  }, [workingRecords, notify]);

  const requestDelete = useCallback(
    (record: SampleRecord) => {
      if (!canDelete) {
        notify('Delete is unavailable until live Firestore responses are loaded.', 3000);
        return;
      }
      setDeleteError(null);
      setDeleteTarget(record);
    },
    [canDelete, notify],
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
        setDeleteTarget(null);
        setUndo(null);
        notify('Response deleted from Firestore.');
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
    setDeleteTarget(null);
    setUndo({ record: removed, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  }, [deleteTarget, records, setRecords, liveDelete, usingDemoSample, notify]);

  const requestBulkDelete = useCallback(
    (ids: string[]) => {
      if (!canDelete) {
        notify('Delete is unavailable until live Firestore responses are loaded.', 3000);
        return;
      }
      if (ids.length === 0) return;
      setDeleteError(null);
      setBulkTargets(ids);
    },
    [canDelete, notify],
  );

  const confirmBulkDelete = useCallback(async () => {
    if (!bulkTargets?.length) return;
    const idSet = new Set(bulkTargets);
    const count = idSet.size;

    if (liveDelete) {
      setDeleteBusy(true);
      setDeleteError(null);
      try {
        await deleteNeedsAssessments(bulkTargets);
        setRecords((prev) => prev.filter((r) => !idSet.has(r.id)));
        setBulkTargets(null);
        setBulkClearSignal((n) => n + 1);
        notify(`${count} ${count === 1 ? 'response' : 'responses'} deleted from Firestore.`);
      } catch (err) {
        setDeleteError(
          err instanceof Error && err.message
            ? err.message
            : 'Could not delete the selected responses.',
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

    setRecords((prev) => prev.filter((r) => !idSet.has(r.id)));
    setBulkTargets(null);
    setBulkClearSignal((n) => n + 1);
    notify(`${count} ${count === 1 ? 'response' : 'responses'} removed from demo data.`);
  }, [bulkTargets, liveDelete, usingDemoSample, setRecords, notify]);

  const handleUndo = useCallback(() => {
    if (!undo) return;
    setRecords((prev) => {
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.record);
      return next;
    });
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [undo, setRecords]);

  return (
    <>
      <section className="dash-page resp-page" aria-labelledby="admin-responses-title">
        {!canResponses ? (
          <>
            <PageHeading
              id="admin-responses-title"
              title="Responses"
              sub="Explore every submitted answer as a summary, one question at a time, or one resident at a time. Filter, export, or open a response for detail."
            />
            <p className="na-error" role="alert">
              You do not have permission to view responses. Ask a superadmin if you need access.
            </p>
          </>
        ) : (
          <>
            <div className="dash-page__header">
              <PageHeading
              id="admin-responses-title"
              title="Responses"
              sub="Explore every submitted answer as a summary, one question at a time, or one resident at a time. Filter, export, or open a response for detail."
            />
            </div>

            {usingDemoSample ? (
              <p className="na-error" role="status">
                Demo sample mode (?demo=sample). Not live Firestore data.
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
              onResetFilters={resetFilters}
              trailing={<DateRangePicker value={dateRange} onChange={handleDateChange} />}
            />

            <div className="rr-toast-region" role="status" aria-live="polite">
              {copyNote ? <p className="rr-toast">{copyNote}</p> : null}
            </div>

            <div className="resp-page__body">
              {demoState === 'error' || loadFailed ? (
                <div className="admin-panel">
                  <ResponseEmptyState
                    kind="error"
                    detail={
                      demoState === 'error'
                        ? undefined
                        : source === 'error'
                          ? 'The live Firestore query failed. Check your connection and permissions, then retry.'
                          : 'Firestore is unavailable. Check that the app is configured and you are signed in, then retry.'
                    }
                    onReset={
                      demoState === 'error'
                        ? () => window.location.assign('/admin/responses/')
                        : () => void reload()
                    }
                  />
                </div>
              ) : demoState === 'loading' ? (
                <ResponsesSkeleton />
              ) : (
                <ResponseViewsPanel
                  rangeEmpty={rangeEmpty}
                  onResetDateRange={() => handleDateChange(DEFAULT_DATE_RANGE)}
                  records={workingRecords}
                  filtered={filtered}
                  onExport={handleExport}
                  onCopySummary={() => void handleCopySummary()}
                  exportDisabled={filtered.length === 0}
                  onDelete={requestDelete}
                  onBulkDelete={requestBulkDelete}
                  bulkClearSignal={bulkClearSignal}
                  canDelete={canDelete}
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

      <ConfirmDeleteModal
        open={bulkTargets !== null}
        title={`Delete ${bulkTargets?.length ?? 0} ${bulkTargets?.length === 1 ? 'response' : 'responses'}?`}
        body={
          liveDelete
            ? 'Permanently deletes the selected responses from Firestore. Dashboard charts and exports will update. This cannot be undone.'
            : 'Removes the selected responses from the local demo dataset only.'
        }
        busy={deleteBusy}
        error={deleteError}
        confirmLabel="Delete all"
        onCancel={() => {
          if (deleteBusy) return;
          setBulkTargets(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmBulkDelete()}
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
