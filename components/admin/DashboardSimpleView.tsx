'use client';

import { AdminNavLink } from '@/components/admin/AdminNavLink';
import type { DashboardSimpleSnapshot } from '@/lib/admin/dashboardView';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { RecentSubmissionsTable } from '@/components/admin/RecentSubmissionsTable';
import { ChartSkeleton } from '@/components/ui/Skeleton';

/**
 * Optional plain-language Dashboard — takeaways for the system plan.
 * Detailed charts stay on the other toggle / Responses screen.
 */
export function DashboardSimpleView({
  snapshot,
  records,
  loading = false,
  empty = false,
}: {
  snapshot: DashboardSimpleSnapshot;
  records: SampleRecord[];
  loading?: boolean;
  empty?: boolean;
}) {
  if (loading) {
    return (
      <div className="dash-simple skel-region" aria-busy="true">
        <span className="visually-hidden">Loading dashboard</span>
        <ChartSkeleton height={120} />
        <ChartSkeleton height={180} />
      </div>
    );
  }

  return (
    <div className="dash-simple">
      <section className="ledger__count dash-simple__count" aria-labelledby="dash-simple-progress">
        <p id="dash-simple-progress" className="ledger__eyebrow">
          Respondents
        </p>
        <p className="ledger__figure">
          {empty ? <span className="ledger__none">—</span> : snapshot.total}
          <span> of {snapshot.respondentTarget}</span>
        </p>
        <div
          className="ledger__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={snapshot.respondentTarget}
          aria-valuenow={empty ? 0 : Math.min(snapshot.total, snapshot.respondentTarget)}
          aria-label="Progress toward respondent target"
        >
          <div
            className="ledger__track-fill"
            style={{ transform: `scaleX(${empty ? 0 : snapshot.progressPct / 100})` }}
          />
        </div>
        <p className="ledger__trend">
          {empty
            ? 'No responses in this date range yet. Widen the range or wait for submissions.'
            : `Homeowners ${snapshot.homeownerPct}% · Tenants ${snapshot.tenantPct}% · Accessibility screening ${snapshot.pwdPct}%`}
        </p>
      </section>

      {empty ? null : (
        <>
          <section aria-labelledby="dash-simple-plan">
            <h2 id="dash-simple-plan" className="dash-simple__section-title">
              What this means for the system plan
            </h2>
            <ul className="dash-simple__plan">
              {snapshot.takeaways.map((item) => (
                <li key={item.id}>
                  <p className="dash-simple__plan-title">{item.title}</p>
                  <p className="dash-simple__plan-value">{item.value}</p>
                  <p className="dash-simple__plan-text">
                    {item.meaning} <strong>{item.forPlan}</strong>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="dash-simple__lists">
            <RankList
              id="dash-simple-features"
              title="Features residents want"
              empty="No feature scores yet."
              rows={snapshot.topFeatures.map((f) => ({ label: f.label, score: f.score }))}
            />
            <RankList
              id="dash-simple-problems"
              title="Problems residents report"
              empty="No open-problem answers yet."
              rows={snapshot.topProblems.map((p) => ({
                label: p.label,
                score: `${p.count} (${p.pct}%)`,
              }))}
            />
          </div>
        </>
      )}

      <div className="dash-simple__footer">
        <RecentSubmissionsTable records={records} limit={3} loading={loading} variant="panel" />
        <AdminNavLink href="/admin/responses/" className="dash-insight__link">
          Charts and filters in Responses →
        </AdminNavLink>
      </div>
    </div>
  );
}

function RankList({
  id,
  title,
  empty,
  rows,
}: {
  id: string;
  title: string;
  empty: string;
  rows: { label: string; score: string }[];
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="dash-simple__section-title">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="dash-tile__empty">{empty}</p>
      ) : (
        <ol className="dash-simple__rank">
          {rows.map((r, i) => (
            <li key={r.label}>
              <span className="dash-simple__rank-num">{i + 1}</span>
              <span className="dash-simple__rank-label">{r.label}</span>
              <span className="dash-simple__rank-score">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
