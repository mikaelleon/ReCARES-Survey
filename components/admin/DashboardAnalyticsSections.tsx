'use client';

import type { ReactNode } from 'react';
import { FIELD_CODE_HELP, FieldCodeHint } from '@/components/admin/FieldCodeHint';
import { ResponsesDrilldownLink } from '@/components/admin/ResponsesDrilldownLink';
import { AccessibilityNeedsRows } from '@/components/admin/charts/AccessibilityNeedsRows';
import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import { MeanBars } from '@/components/admin/charts/MeanBars';
import { PhaseBarChart } from '@/components/admin/charts/PhaseBarChart';
import type { CountBucket } from '@/lib/admin/analytics';
import {
  accessibilityNeeds,
  openProblems,
  rankFeatures,
} from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

function InsightTile({
  title,
  hint,
  className = '',
  loading,
  responsesFocus,
  children,
}: {
  title: string;
  hint?: ReactNode;
  className?: string;
  loading?: boolean;
  responsesFocus?: string;
  children: ReactNode;
}) {
  return (
    <article className={`dash-insight ${className}`.trim()} aria-label={title}>
      <header className="dash-insight__head">
        <h2 className="dash-insight__title">{title}</h2>
        {hint ? <div className="dash-insight__hint">{hint}</div> : null}
      </header>
      <div className="dash-insight__body">
        {loading ? (
          <div className="dash-stat--skeleton" style={{ minHeight: 100 }} aria-hidden="true" />
        ) : (
          children
        )}
      </div>
      {responsesFocus ? (
        <div className="dash-insight__foot">
          <ResponsesDrilldownLink focus={responsesFocus} />
        </div>
      ) : null}
    </article>
  );
}

/**
 * Charts under the KPI grid: Phase · Features, then Problems · Accessibility.
 * Right-rail Quick Actions live in the page shell, not here.
 */
export function DashboardAnalyticsSections({
  records,
  phases,
  loading = false,
  empty = false,
  allTimeCount,
}: {
  records: SampleRecord[];
  phases: CountBucket[];
  loading?: boolean;
  empty?: boolean;
  allTimeCount: number;
}) {
  const features = rankFeatures(records);
  const problems = openProblems(records);
  const ac = accessibilityNeeds(records);
  const responseCount = records.length;

  return (
    <div className="dash-bento__analytics">
      <div className="dash-bento__charts">
        <InsightTile
          title="Analytics by Phase"
          hint={`${empty ? 0 : responseCount} in range`}
          loading={loading}
          responsesFocus="phase"
        >
          {empty ? (
            <div className="dash-empty dash-empty--compact" role="status">
              <p className="dash-empty__title">No responses in this date range.</p>
              <p className="dash-empty__secondary">
                {allTimeCount === 0
                  ? 'No live submissions in Firestore yet.'
                  : 'Try “All time” or widen the range.'}
              </p>
            </div>
          ) : (
            <PhaseBarChart buckets={phases} />
          )}
        </InsightTile>

        <InsightTile
          title="Top Requested Features"
          hint={
            <FieldCodeHint content={FIELD_CODE_HELP.f1f6}>
              F1–F6 · top 3 · 99s excluded
            </FieldCodeHint>
          }
          loading={loading}
          responsesFocus="top-features"
        >
          {empty ? (
            <p className="dash-tile__empty">No feature scores yet.</p>
          ) : (
            <MeanBars
              wrapLabels
              highlightTop={3}
              items={features.map((f) => ({
                label: f.label,
                mean: f.averageLikelihood,
                n: f.responseCount,
              }))}
            />
          )}
        </InsightTile>
      </div>

      <div className="dash-bento__detail">
        <InsightTile
          title="Open Problem Discovery"
          hint="Problems beyond named survey topics"
          loading={loading}
          responsesFocus="open-problems"
        >
          {empty ? (
            <p className="dash-tile__empty">No open-problem answers yet.</p>
          ) : (
            <HorizontalBars buckets={problems} />
          )}
        </InsightTile>

        <InsightTile
          title="Accessibility Needs"
          hint={
            ac.baseN > 0 ? (
              `Out of ${ac.baseN} with disability/mobility limitation`
            ) : (
              <FieldCodeHint content={FIELD_CODE_HELP.ac1}>AC1 path only</FieldCodeHint>
            )
          }
          loading={loading}
          responsesFocus="accessibility-needs"
        >
          {empty || ac.baseN === 0 ? (
            <p className="dash-tile__empty">No AC1 answers on the accessibility path yet.</p>
          ) : (
            <AccessibilityNeedsRows buckets={ac.buckets} baseN={ac.baseN} />
          )}
        </InsightTile>
      </div>
    </div>
  );
}
