'use client';

import type { ReactNode } from 'react';
import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { FIELD_CODE_HELP, FieldCodeHint } from '@/components/admin/FieldCodeHint';
import type { DashboardKpis } from '@/lib/admin/analytics';
import {
  digitalFeasibility,
  interviewOptIn,
  serviceQualityGauge,
  waitTimeStat,
} from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/** Research sample-size target. */
const RESPONDENT_TARGET = 100;

function Row({
  label,
  href,
  hint,
  value,
  note,
}: {
  label: string;
  href?: string;
  hint?: { content: string };
  value: ReactNode;
  note?: string;
}) {
  const name = href ? (
    <AdminNavLink href={href} className="ledger__link">
      {label}
    </AdminNavLink>
  ) : (
    label
  );
  return (
    <div className="ledger__row">
      <dt>
        {hint ? <FieldCodeHint content={hint.content}>{name}</FieldCodeHint> : name}
      </dt>
      <dd>
        <span className="ledger__value">{value}</span>
        {note ? <span className="ledger__note">{note}</span> : null}
      </dd>
    </div>
  );
}

/**
 * Detailed dashboard head: the respondent count is the figure, every other
 * headline number is one ruled row. Row labels link to the matching Responses
 * view (Interview opt-ins live on Interview Invites, not Responses).
 */
export function DashboardLedger({
  kpis,
  records,
  loading = false,
  empty = false,
  periodTrend = null,
}: {
  kpis: DashboardKpis;
  records: SampleRecord[];
  loading?: boolean;
  empty?: boolean;
  periodTrend?: string | null;
}) {
  if (loading) {
    return (
      <div className="ledger skel-region" aria-busy="true">
        <span className="visually-hidden">Loading metrics</span>
        <div className="ledger__count skel-stat" style={{ minHeight: 150 }} />
        <div className="ledger__rows skel-stat" style={{ minHeight: 150 }} />
      </div>
    );
  }

  const digital = digitalFeasibility(records);
  const service = serviceQualityGauge(records);
  const wait = waitTimeStat(records);
  const interview = interviewOptIn(records);
  const dash = <span className="ledger__none">—</span>;
  const counted = Math.min(kpis.total, RESPONDENT_TARGET);
  const progress = Math.round((counted / RESPONDENT_TARGET) * 100);

  return (
    <section className="ledger" aria-label="Headline numbers">
      <div className="ledger__count">
        <p className="ledger__eyebrow">Respondents</p>
        <p className="ledger__figure">
          {empty ? dash : kpis.total}
          <span> of {RESPONDENT_TARGET}</span>
        </p>
        <div
          className="ledger__track"
          role="progressbar"
          aria-label={`Respondents toward target of ${RESPONDENT_TARGET}`}
          aria-valuemin={0}
          aria-valuemax={RESPONDENT_TARGET}
          aria-valuenow={empty ? 0 : counted}
        >
          <div className="ledger__track-fill" style={{ transform: `scaleX(${empty ? 0 : progress / 100})` }} />
        </div>
        <p className="ledger__trend">
          {empty
            ? 'None in this date range'
            : periodTrend
              ? periodTrend.replace('from prior period', 'vs prior period')
              : `${progress}% of target`}
        </p>
      </div>

      <dl className="ledger__rows">
        <Row
          label="Homeowners"
          hint={{
            content:
              'Grouped total: A1 options 1–4 (living-in, OFW, absentee, and family/household member of a homeowner).',
          }}
          value={empty ? dash : kpis.homeownerCount}
          note={empty ? undefined : `${kpis.homeownerPct}%`}
        />
        <Row
          label="Tenants"
          hint={{
            content:
              'Grouped total: A1 options 5–6 (tenant/lessee and family/household member of a tenant).',
          }}
          value={empty ? dash : kpis.tenantCount}
          note={empty ? undefined : `${kpis.tenantPct}%`}
        />
        <Row
          label="Accessibility screening"
          hint={{ content: FIELD_CODE_HELP.a4 }}
          value={empty ? dash : kpis.pwdRelatedCount}
          note={empty ? undefined : `${kpis.pwdRelatedPct}%`}
        />
        <Row
          label="Interview opt-ins"
          href="/admin/interviews/"
          hint={{ content: FIELD_CODE_HELP.iv1 }}
          value={empty ? dash : interview.yes}
        />
        <Row
          label="Digital feasibility"
          href="/admin/responses/?focus=digital-feasibility"
          note="smartphone + internet"
          value={empty ? dash : `${digital.pct}%`}
        />
        <Row
          label="Service quality"
          href="/admin/responses/?focus=service-quality"
          hint={{
            content:
              empty || service.n === 0
                ? FIELD_CODE_HELP.s1s3
                : `${FIELD_CODE_HELP.s1s3} Current average ${service.average}/5 from ${service.respondentN} respondent${service.respondentN === 1 ? '' : 's'}.`,
          }}
          value={empty || service.n === 0 ? dash : `${service.pctOfScale}%`}
          note="office access, response time"
        />
        <Row
          label="Wait at the gate"
          href="/admin/responses/?focus=wait-time"
          hint={{
            content:
              wait.answered > 0
                ? `${FIELD_CODE_HELP.p4} Based on ${wait.answered} answer${wait.answered === 1 ? '' : 's'} in this range.`
                : FIELD_CODE_HELP.p4,
          }}
          value={empty || wait.averageMinutes == null ? dash : `${wait.averageMinutes} min`}
        />
      </dl>
    </section>
  );
}
