'use client';

import type { ReactNode } from 'react';
import { FIELD_CODE_HELP, FieldCodeHint } from '@/components/admin/FieldCodeHint';
import { ResponsesDrilldownLink } from '@/components/admin/ResponsesDrilldownLink';
import { AccessibilityNeedsRows } from '@/components/admin/charts/AccessibilityNeedsRows';
import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import { MeanBars } from '@/components/admin/charts/MeanBars';
import { PhaseBarChart } from '@/components/admin/charts/PhaseBarChart';
import { ChartSkeleton } from '@/components/ui/Skeleton';
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
        {loading ? <ChartSkeleton height={100} /> : children}
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
          hint={
            <FieldCodeHint
              content={
                empty
                  ? allTimeCount === 0
                    ? 'No live submissions in Firestore yet.'
                    : 'No responses in this date range. Try All time or widen the range.'
                  : `${responseCount} response${responseCount === 1 ? '' : 's'} in the selected range. Hover a bar for count and share.`
              }
            >
              By phase
            </FieldCodeHint>
          }
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
            <FieldCodeHint content={`${FIELD_CODE_HELP.f1f6} Hover a feature for average and sample size.`}>
              Proposed website features
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
              valueMode="tooltip"
              items={features.map((feature) => ({
                label: feature.label,
                mean: feature.averageLikelihood,
                n: feature.responseCount,
              }))}
            />
          )}
        </InsightTile>
      </div>

      <div className="dash-bento__detail">
        <InsightTile
          title="Open Problem Discovery"
          hint={
            <FieldCodeHint content="Problems residents raised beyond the named survey topics. Hover a row for count and share.">
              Open topics
            </FieldCodeHint>
          }
          loading={loading}
          responsesFocus="open-problems"
        >
          {empty ? (
            <p className="dash-tile__empty">No open-problem answers yet.</p>
          ) : (
            <HorizontalBars buckets={problems} valueMode="tooltip" />
          )}
        </InsightTile>

        <InsightTile
          title="Accessibility Needs"
          hint={
            <FieldCodeHint
              content={
                ac.baseN > 0
                  ? `${FIELD_CODE_HELP.ac1} Path base: ${ac.baseN} respondent${ac.baseN === 1 ? '' : 's'}. Hover a row for count and share.`
                  : FIELD_CODE_HELP.ac1
              }
            >
              Accessibility checklist
            </FieldCodeHint>
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
