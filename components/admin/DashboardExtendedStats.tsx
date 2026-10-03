'use client';

import Link from 'next/link';
import {
  Clock3,
  MessageSquareQuote,
  Signal,
  Smartphone,
} from 'lucide-react';
import { FIELD_CODE_HELP, FieldCodeHint } from '@/components/admin/FieldCodeHint';
import { ResponsesDrilldownLink } from '@/components/admin/ResponsesDrilldownLink';
import {
  digitalFeasibility,
  interviewOptIn,
  serviceQualityGauge,
  waitTimeStat,
} from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

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
      <div className="dash-extended-stats" aria-hidden="true">
        <div className="dash-stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="dash-stat dash-stat--skeleton" />
          ))}
        </div>
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
            {empty || service.n === 0 ? (
              <FieldCodeHint content={FIELD_CODE_HELP.s1s3}>
                S1–S3 average as % of scale
              </FieldCodeHint>
            ) : (
              <FieldCodeHint content={FIELD_CODE_HELP.s1s3}>
                S1–S3 mean {service.average}/5 · n={service.respondentN}
              </FieldCodeHint>
            )}
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
            <FieldCodeHint content={FIELD_CODE_HELP.p4}>
              P4 optional · based on {wait.answered} answer{wait.answered === 1 ? '' : 's'}
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
            <FieldCodeHint content={FIELD_CODE_HELP.iv1}>IV1 = Yes</FieldCodeHint>
          </div>
          <div className="dash-stat__foot">
            <Link href="/admin/interviews/" className="dash-insight__link">
              Interview Invites
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
