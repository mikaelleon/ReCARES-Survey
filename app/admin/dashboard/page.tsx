'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { DashboardStatGrid } from '@/components/admin/DashboardStatGrid';
import { PhaseBarChart } from '@/components/admin/charts/PhaseBarChart';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
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

function DashboardContent() {
  const { can } = useAuth();
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
          <div className="dash-page__pill">
            <DateRangePicker
              value={dateRange}
              onChange={(next) => {
                setDateRange(next);
                storeDateRange(next);
              }}
            />
          </div>

          <h1 id="admin-overview-title" className="dash-page__title">
            Dashboard
          </h1>

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

          <DashboardStatGrid
            kpis={kpis}
            loading={status === 'loading'}
            periodTrend={periodTrend}
          />

          <div className="dash-analytics">
            <h2 className="dash-analytics__title">Analytics by Phase</h2>
            <div className="dash-analytics__row">
              <div className="dash-panel dash-panel--chart">
                {status === 'loading' ? (
                  <div className="dash-stat--skeleton" style={{ minHeight: 220 }} />
                ) : (
                  <PhaseBarChart buckets={phases} />
                )}
              </div>
              <div className="dash-panel dash-panel--aside">
                <p className="dash-panel__aside-lead">
                  Drill into any question, pin Summary widgets, and export filtered rows on
                  Responses.
                </p>
                <Link href="/admin/responses/" className="dash-panel__aside-link">
                  Open Responses
                  <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Soft bento Dashboard — same Firestore response set as Responses.
 * Hook runs inside AdminAppShell (SurveyResponsesProvider).
 */
export default function AdminDashboardPage() {
  return (
    <AdminAppShell>
      <DashboardContent />
    </AdminAppShell>
  );
}
