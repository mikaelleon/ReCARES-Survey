'use client';

import {
  Clock3,
  MessageSquareQuote,
  Signal,
  Smartphone,
} from 'lucide-react';
import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { FIELD_CODE_HELP, FieldCodeHint } from '@/components/admin/FieldCodeHint';
import { ResponsesDrilldownLink } from '@/components/admin/ResponsesDrilldownLink';
import {
  digitalFeasibility,
  interviewOptIn,
  serviceQualityGauge,
  waitTimeStat,
} from '@/lib/admin/extendedWidgets';
import { StatSkeleton } from '@/components/ui/Skeleton';

/**
 * Second KPI row (Digital Feasibility, Service Quality, Wait Time, Interview).
 *
 * Drill-down exceptions (documented):
 * - Interview Recruitment → Interview Invites (IV1 opt-ins live there, not Responses Summary).
 */
export function DashboardExtendedStats({
  records,
  loading = false,
  empty = false,
}: {
  records: SampleRecord[];
  loading?: boolean;
  empty?: boolean;
}) {
  if (loading) {
    return (
      <div className="dash-extended-stats">
        <StatSkeleton count={4} />
      </div>
    );
  }

  const digital = digitalFeasibility(records);
  const service = serviceQualityGauge(records);
  const wait = waitTimeStat(records);
  const interview = interviewOptIn(records);

  return (
    <div className="dash-extended-stats">
      <div className="dash-stat-grid">
        <div className="dash-stat dash-stat--metric" style={{ animationDelay: '0ms' }}>
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <Smartphone size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Digital Feasibility</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : `${digital.pct}%`}
          </div>
          <div className="dash-stat__caption">Reliable smartphone + internet</div>
          {empty ? <p className="dash-stat__note">No data yet</p> : null}
          <div className="dash-stat__foot">
            <ResponsesDrilldownLink focus="digital-feasibility" />
          </div>
        </div>

        <div className="dash-stat dash-stat--metric" style={{ animationDelay: '40ms' }}>
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <Signal size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Current Service Quality</div>
          </div>
          <div className="dash-stat__value">
            {empty || service.n === 0 ? (
              <span className="dash-stat__empty">—</span>
            ) : (
              `${service.pctOfScale}%`
            )}
          </div>
          <div className="dash-stat__caption">
            <FieldCodeHint
              content={
                empty || service.n === 0
                  ? FIELD_CODE_HELP.s1s3
                  : `${FIELD_CODE_HELP.s1s3} Current average ${service.average}/5 from ${service.respondentN} respondent${service.respondentN === 1 ? '' : 's'}.`
              }
            >
              Office access &amp; response time
            </FieldCodeHint>
          </div>
          <div className="dash-stat__foot">
            <ResponsesDrilldownLink focus="service-quality" />
          </div>
        </div>

        <div className="dash-stat dash-stat--metric" style={{ animationDelay: '80ms' }}>
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <Clock3 size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Entrance Wait Time</div>
          </div>
          <div className="dash-stat__value">
            {empty || wait.averageMinutes == null ? (
              <span className="dash-stat__empty">—</span>
            ) : (
              <>
                {wait.averageMinutes}
                <span className="dash-stat__unit"> min</span>
              </>
            )}
          </div>
          <div className="dash-stat__caption">
            <FieldCodeHint
              content={
                wait.answered > 0
                  ? `${FIELD_CODE_HELP.p4} Based on ${wait.answered} answer${wait.answered === 1 ? '' : 's'} in this range.`
                  : FIELD_CODE_HELP.p4
              }
            >
              Typical wait at the gate
            </FieldCodeHint>
          </div>
          <div className="dash-stat__foot">
            <ResponsesDrilldownLink focus="wait-time" />
          </div>
        </div>

        <div className="dash-stat dash-stat--metric" style={{ animationDelay: '120ms' }}>
          <div className="dash-stat__top">
            <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
              <MessageSquareQuote size={16} strokeWidth={2.2} />
            </span>
            <div className="dash-stat__label">Interview Recruitment</div>
          </div>
          <div className="dash-stat__value">
            {empty ? <span className="dash-stat__empty">—</span> : interview.yes}
          </div>
          <div className="dash-stat__caption">
            <FieldCodeHint content={FIELD_CODE_HELP.iv1}>Open to a follow-up interview</FieldCodeHint>
          </div>
          <div className="dash-stat__foot">
            <AdminNavLink href="/admin/interviews/" className="dash-insight__link">
              Interview Invites
            </AdminNavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
