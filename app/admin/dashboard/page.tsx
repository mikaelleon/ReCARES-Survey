'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { DashboardAnalyticsSections } from '@/components/admin/DashboardAnalyticsSections';
import { DashboardLedger } from '@/components/admin/DashboardLedger';
import { RecentSubmissionsTable } from '@/components/admin/RecentSubmissionsTable';
import { DashboardHeaderTools } from '@/components/admin/DashboardHeaderTools';
import { PageTitle } from '@/components/admin/PageTitle';
import { DashboardSimpleView } from '@/components/admin/DashboardSimpleView';
import { RecentActivityCard } from '@/components/admin/RecentActivityCard';
import { computeKpis } from '@/lib/admin/analytics';
import {
  buildDashboardSimpleSnapshot,
  loadDashboardViewMode,
  storeDashboardViewMode,
  type DashboardViewMode,
} from '@/lib/admin/dashboardView';
import {
  DEFAULT_DATE_RANGE,
  countInBounds,
  filterRecordsByDateRange,
  loadStoredDateRange,
  previousPeriodBounds,
  resolveDateBounds,
  storeDateRange,
  type DateRangeValue,
} from '@/lib/admin/dateRange';
import { PHASE_OPTIONS } from '@/lib/admin/sampleResponses';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { useSurveyWindow } from '@/lib/admin/useSurveyWindow';
import { useAuth } from '@/lib/auth/AuthProvider';

function phaseBuckets(records: { phase: string }[]) {
  const total = records.length;
  return PHASE_OPTIONS.map((label) => {
    const count = records.filter((r) => r.phase === label).length;
    return {
      label,
      count,
      pct: total <= 0 ? 0 : Math.round((count / total) * 100),
    };
  });
}

function DashboardContent() {
  const { can } = useAuth();
  const { records, status, source, usingDemoSample } = useSurveyResponses();
  const { config: surveyWindow, acceptsResponses } = useSurveyWindow();
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('detailed');
  // Stored range and view are read after mount; hold the skeleton until then so
  // the page never paints the default and then jumps to the saved choice.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setDateRange(loadStoredDateRange());
    setViewMode(loadDashboardViewMode());
    setRestored(true);
  }, []);

  const ranged = useMemo(
    () => filterRecordsByDateRange(records, dateRange),
    [records, dateRange],
  );
  const kpis = useMemo(() => computeKpis(ranged), [ranged]);
  const phases = useMemo(() => phaseBuckets(ranged), [ranged]);
  const simpleSnapshot = useMemo(
    () => buildDashboardSimpleSnapshot(ranged, kpis),
    [ranged, kpis],
  );
  const canResponses = can('responsesDashboard');

  const loading = status === 'loading' || !restored;
  const failed = status === 'error' && !usingDemoSample;
  const empty = !loading && status !== 'error' && ranged.length === 0;
  const allTimeCount = records.length;

  const periodTrend = useMemo(() => {
    if (source !== 'firestore' || usingDemoSample) return null;
    const prev = previousPeriodBounds(dateRange);
    const cur = resolveDateBounds(dateRange);
    if (!prev || cur.startMs == null || cur.endMs == null) return null;
    const currentCount = countInBounds(records, cur.startMs, cur.endMs);
    const prevCount = countInBounds(records, prev.startMs, prev.endMs);
    if (prevCount === 0 && currentCount === 0) return null;
    const delta = currentCount - prevCount;
    if (delta === 0) return 'Same as prior period';
    return delta > 0 ? `+${delta} from prior period` : `${delta} from prior period`;
  }, [records, dateRange, source, usingDemoSample]);

  return (
    <section
      className={`dash-page${viewMode === 'simple' ? ' dash-page--simple' : ''}`}
      aria-labelledby="admin-overview-title"
    >
      {!canResponses ? (
        <p className="na-error" role="alert">
          You do not have permission to view the responses dashboard. Ask a superadmin if you
          need access.
        </p>
      ) : (
        <>
          <div className="dash-page__header">
            <div>
              <PageTitle pageId="admin-overview-title">Dashboard</PageTitle>
              <p className="visually-hidden">A live summary of survey responses. Use the date range to focus on a period, and the cards to jump into detail.</p>
              <p
                className={`survey-window-chip survey-window-chip--${surveyWindow.status}`}
                style={{ marginTop: 8 }}
                title={
                  acceptsResponses
                    ? 'New submissions are being accepted'
                    : 'Residents cannot submit until a superadmin reopens the survey'
                }
              >
                {acceptsResponses
                  ? 'Survey open'
                  : surveyWindow.status === 'paused'
                    ? 'Survey paused'
                    : 'Survey closed'}
                <span aria-hidden="true"> · </span>
                {surveyWindow.instrumentVersion}
              </p>
            </div>
            <DashboardHeaderTools
              dateRange={dateRange}
              onDateRangeChange={(next) => {
                setDateRange(next);
                storeDateRange(next);
              }}
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                setViewMode(mode);
                storeDashboardViewMode(mode);
              }}
            />
          </div>

          {status === 'error' && !usingDemoSample ? (
            <p className="na-error" role="alert">
              Could not load live responses from Firestore. Numbers below are empty until the
              query succeeds — not sample data.
            </p>
          ) : null}
          {usingDemoSample ? (
            <p className="na-error" role="status">
              Demo sample mode (?demo=sample). Not live Firestore data.
            </p>
          ) : null}

          <div key={viewMode} className="admin-view-transition">
            {viewMode === 'simple' ? (
              <DashboardSimpleView
                snapshot={simpleSnapshot}
                records={ranged}
                loading={loading}
                empty={empty}
              />
            ) : (
              <div className="dash-bento">
                <div className="dash-bento__main">
                  <div className="dash-bento__kpis">
                    <DashboardLedger
                      kpis={kpis}
                      records={ranged}
                      loading={loading}
                      empty={empty || failed}
                      periodTrend={periodTrend}
                    />
                  </div>

                  <DashboardAnalyticsSections
                    records={ranged}
                    phases={phases}
                    loading={loading}
                    empty={empty}
                    allTimeCount={allTimeCount}
                  />
                </div>

                <aside className="dash-bento__rail">
                  <RecentActivityCard limit={3} />
                  <RecentSubmissionsTable
                    records={ranged}
                    limit={3}
                    loading={loading}
                    variant="panel"
                  />
                </aside>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Dashboard — summary over live Firestore responses (Detailed default; Simple optional).
 */
export default function AdminDashboardPage() {
  return (
    <AdminAppShell fitViewport>
      <DashboardContent />
    </AdminAppShell>
  );
}
