'use client';

import { AdminNavLink } from '@/components/admin/AdminNavLink';
import type { DashboardSimpleSnapshot } from '@/lib/admin/dashboardView';
import { RecentSubmissionsTable } from '@/components/admin/RecentSubmissionsTable';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

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
      <div className="dash-simple" aria-hidden="true">
        <div className="dash-stat--skeleton" style={{ minHeight: 120 }} />
        <div className="dash-stat--skeleton" style={{ minHeight: 180 }} />
      </div>
    );
  }

  return (
    <div className="dash-simple">
      <section className="dash-simple__hero" aria-labelledby="dash-simple-progress">
        <div className="dash-simple__hero-top">
          <h2 id="dash-simple-progress" className="dash-simple__hero-title">
            Response progress
          </h2>
          <p className="dash-simple__hero-value">
            {empty ? '—' : snapshot.total}
            <span> / {snapshot.respondentTarget}</span>
          </p>
        </div>
        <div
          className="dash-simple__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={snapshot.respondentTarget}
          aria-valuenow={empty ? 0 : Math.min(snapshot.total, snapshot.respondentTarget)}
          aria-label="Progress toward respondent target"
        >
          <div
            className="dash-simple__bar-fill"
            style={{ width: empty ? '0%' : `${snapshot.progressPct}%` }}
          />
        </div>
        <p className="dash-simple__hero-note">
          {empty
            ? 'No responses in this date range yet.'
            : `${snapshot.progressPct}% of the research target. Homeowners ${snapshot.homeownerPct}% · Tenants ${snapshot.tenantPct}% · Accessibility screening ${snapshot.pwdPct}%.`}
        </p>
      </section>

      {empty ? (
        <p className="dash-tile__empty">Widen the date range or wait for more submissions.</p>
      ) : (
        <>
          <section className="dash-simple__takeaways" aria-label="What this means for the system">
            <h2 className="dash-simple__section-title">What this means for the system plan</h2>
            <ul className="dash-simple__cards">
              {snapshot.takeaways.map((item) => (
                <li key={item.id} className="dash-simple__card">
                  <p className="dash-simple__card-kicker">{item.title}</p>
                  <p className="dash-simple__card-value">{item.value}</p>
                  <p className="dash-simple__card-meaning">{item.meaning}</p>
                  <p className="dash-simple__card-plan">{item.forPlan}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="dash-simple__lists">
            <section className="dash-simple__list-card" aria-labelledby="dash-simple-features">
              <h2 id="dash-simple-features" className="dash-simple__section-title">
                Top features residents want
              </h2>
              {snapshot.topFeatures.length === 0 ? (
                <p className="dash-tile__empty">No feature scores yet.</p>
              ) : (
                <ol className="dash-simple__rank">
                  {snapshot.topFeatures.map((f, i) => (
                    <li key={f.label}>
                      <span className="dash-simple__rank-num">{i + 1}</span>
                      <span className="dash-simple__rank-label">{f.label}</span>
                      <span className="dash-simple__rank-score">{f.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="dash-simple__list-card" aria-labelledby="dash-simple-problems">
              <h2 id="dash-simple-problems" className="dash-simple__section-title">
                Top problems residents report
              </h2>
              {snapshot.topProblems.length === 0 ? (
                <p className="dash-tile__empty">No open-problem answers yet.</p>
              ) : (
                <ol className="dash-simple__rank">
                  {snapshot.topProblems.map((p, i) => (
                    <li key={p.label}>
                      <span className="dash-simple__rank-num">{i + 1}</span>
                      <span className="dash-simple__rank-label">{p.label}</span>
                      <span className="dash-simple__rank-score">
                        {p.count} ({p.pct}%)
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}

      <div className="dash-simple__footer">
        <RecentSubmissionsTable
          records={records}
          limit={3}
          loading={loading}
          variant="panel"
        />
        <div className="dash-simple__cta">
          <p className="dash-simple__cta-text">
            Need charts, filters, and full breakdowns? Open Responses.
          </p>
          <AdminNavLink href="/admin/responses/" className="dash-quick__btn dash-quick__btn--primary">
            View Responses →
          </AdminNavLink>
        </div>
      </div>
    </div>
  );
}
