'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { DashboardAnalyticsSections } from '@/components/admin/DashboardAnalyticsSections';
import { DashboardExtendedStats } from '@/components/admin/DashboardExtendedStats';
import { DashboardQuickActions } from '@/components/admin/DashboardQuickActions';
import { DashboardStatGrid } from '@/components/admin/DashboardStatGrid';
import { RecentSubmissionsTable } from '@/components/admin/RecentSubmissionsTable';
import { DashboardHeaderTools } from '@/components/admin/DashboardHeaderTools';
import { RecentActivityCard } from '@/components/admin/RecentActivityCard';
import { computeKpis } from '@/lib/admin/analytics';
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
import { useAuth } from '@/lib/auth/AuthProvider';

function phaseBuckets(records: { phase: string }[]) {
  const total = records.length;
  return PHASE_OPTIONS.filter((p) => p !== 'Not sure').map((label) => {
    const count = records.filter((r) => r.phase === label).length;
    return {
      label,
      count,
      pct: total <= 0 ? 0 : Math.round((count / total) * 100),
    };
  });
}

function firstName(name?: string, email?: string): string {
  const base = (name || '').trim();
  if (base) return base.split(/\s+/)[0] ?? base;
  const local = (email || '').split('@')[0] || 'there';
  return local;
}

function DashboardContent() {
  const { can, user } = useAuth();
  const { records, status, source, usingDemoSample } = useSurveyResponses();
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);

  useEffect(() => {
    setDateRange(loadStoredDateRange());
  }, []);

  const ranged = useMemo(
    () => filterRecordsByDateRange(records, dateRange),
    [records, dateRange],
  );
  const kpis = useMemo(() => computeKpis(ranged), [ranged]);
  const phases = useMemo(() => phaseBuckets(ranged), [ranged]);
  const canResponses = can('responsesDashboard');

  const loading = status === 'loading';
  const empty = !loading && status !== 'error' && ranged.length === 0;
  const allTimeCount = records.length;
  const greetName = firstName(user?.name, user?.email);

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
    <section className="dash-page" aria-labelledby="admin-overview-title">
      {!canResponses ? (
        <p className="admin-section__lead">
          You do not have permission to view the responses dashboard. Ask a superadmin if you
          need access.
        </p>
      ) : (
        <>
          <div className="dash-page__header">
            <h1 id="admin-overview-title" className="dash-page__title">
              Dashboard <span className="dash-page__greet">· Hi, {greetName}!</span>
            </h1>
            <DashboardHeaderTools
              dateRange={dateRange}
              onDateRangeChange={(next) => {
                setDateRange(next);
                storeDateRange(next);
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

          <div className="dash-bento">
            <div className="dash-bento__main">
              <div className="dash-bento__kpis">
                <DashboardStatGrid
                  kpis={kpis}
                  loading={loading}
                  empty={empty}
                  periodTrend={periodTrend}
                />
                <DashboardExtendedStats records={ranged} loading={loading} empty={empty} />
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
              <DashboardQuickActions />
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Dashboard — bento quick summary over live Firestore responses.
 */
export default function AdminDashboardPage() {
  return (
    <AdminAppShell fitViewport>
      <DashboardContent />
    </AdminAppShell>
  );
}
