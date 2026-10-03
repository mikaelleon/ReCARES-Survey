'use client';

import {
  Accessibility,
  ArrowDownRight,
  ArrowUpRight,
  Home,
  KeyRound,
  Minus,
  Users,
} from 'lucide-react';
import { FIELD_CODE_HELP, FieldCodeHint } from '@/components/admin/FieldCodeHint';
import type { DashboardKpis } from '@/lib/admin/analytics';

/** Research sample-size target for Total Respondents progress. */
const RESPONDENT_TARGET = 100;

function TrendIcon({ caption }: { caption: string }) {
  if (caption.startsWith('+')) {
    return <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />;
  }
  if (caption.startsWith('-')) {
    return <ArrowDownRight size={14} strokeWidth={2.4} aria-hidden="true" />;
  }
  return <Minus size={14} strokeWidth={2.4} aria-hidden="true" />;
}

/**
 * Four-up KPI strip: one dominant filled card + three neutral cards with share bars.
 *
 * Deliberate drill-down exception: these headline counts have no single Responses
 * Summary chart to land on (unlike widgets below). See ADMIN_ACCESS_DECISIONS §11.
 */
export function DashboardStatGrid({
  kpis,
  loading = false,
  empty = false,
  periodTrend = null,
}: {
  kpis: DashboardKpis;
  loading?: boolean;
  empty?: boolean;
  periodTrend?: string | null;
}) {
  if (loading) {
    return (
      <div className="dash-stat-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-stat dash-stat--skeleton" />
        ))}
      </div>
    );
  }

  const valueNode = (n: number) =>
    empty ? <span className="dash-stat__empty">—</span> : <>{n}</>;

  return (
    <div className="dash-stat-grid">
      <div className="dash-stat dash-stat--hero" style={{ animationDelay: '0ms' }}>
        <div className="dash-stat__top">
          <span className="dash-stat__icon" aria-hidden="true">
            <Users size={18} strokeWidth={2.2} />
          </span>
          <div className="dash-stat__label">Total Respondents</div>
        </div>
        <div className="dash-stat__value-row">
          <div className="dash-stat__value">{valueNode(kpis.total)}</div>
          {!empty ? (
            <span className="dash-stat__share">
              {Math.min(kpis.total, RESPONDENT_TARGET)}/{RESPONDENT_TARGET}
            </span>
          ) : null}
        </div>
        <div
          className="dash-stat__bar"
          role="progressbar"
          aria-label={`Respondents toward target of ${RESPONDENT_TARGET}`}
          aria-valuemin={0}
          aria-valuemax={RESPONDENT_TARGET}
          aria-valuenow={empty ? 0 : Math.min(kpis.total, RESPONDENT_TARGET)}
        >
          <div
            className="dash-stat__bar-fill"
            style={{
              width: empty
                ? '0%'
                : `${Math.min(100, Math.round((kpis.total / RESPONDENT_TARGET) * 100))}%`,
            }}
          />
        </div>
        <div className="dash-stat__caption">
          {empty ? (
            'No data yet in this date range'
          ) : periodTrend ? (
            <span className="dash-stat__trend">
              <TrendIcon caption={periodTrend} />
              {periodTrend}
              <span className="dash-stat__trend-sep" aria-hidden="true">
                ·
              </span>
              {kpis.total} of {RESPONDENT_TARGET} target
            </span>
          ) : (
            `${kpis.total} of ${RESPONDENT_TARGET} target respondents`
          )}
        </div>
      </div>

      <div
        className="dash-stat dash-stat--neutral"
        style={{ animationDelay: '60ms' }}
        title="Grouped total: A1 options 1–4 (living-in, OFW, absentee, and family/household member of a homeowner)."
      >
        <div className="dash-stat__top">
          <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
            <Home size={18} strokeWidth={2.2} />
          </span>
          <div className="dash-stat__label">Total Homeowners</div>
        </div>
        <div className="dash-stat__value-row">
          <div className="dash-stat__value">{valueNode(kpis.homeownerCount)}</div>
          {!empty ? <span className="dash-stat__share">{kpis.homeownerPct}%</span> : null}
        </div>
        {!empty ? (
          <div className="dash-stat__bar" aria-hidden="true">
            <div className="dash-stat__bar-fill" style={{ width: `${kpis.homeownerPct}%` }} />
          </div>
        ) : null}
        <div className="dash-stat__caption">
          {empty ? 'No data yet' : 'Grouped homeowner branch'}
        </div>
      </div>

      <div className="dash-stat dash-stat--neutral" style={{ animationDelay: '120ms' }}>
        <div className="dash-stat__top">
          <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
            <Accessibility size={18} strokeWidth={2.2} />
          </span>
          <div className="dash-stat__label">Total PWD Residents</div>
        </div>
        <div className="dash-stat__value-row">
          <div className="dash-stat__value">{valueNode(kpis.pwdRelatedCount)}</div>
          {!empty ? <span className="dash-stat__share">{kpis.pwdRelatedPct}%</span> : null}
        </div>
        {!empty ? (
          <div className="dash-stat__bar" aria-hidden="true">
            <div className="dash-stat__bar-fill" style={{ width: `${kpis.pwdRelatedPct}%` }} />
          </div>
        ) : null}
        <div className="dash-stat__caption">
          {empty ? (
            'No data yet'
          ) : (
            <FieldCodeHint content={FIELD_CODE_HELP.a4}>Screening A4 Yes only</FieldCodeHint>
          )}
        </div>
      </div>

      <div
        className="dash-stat dash-stat--neutral"
        style={{ animationDelay: '180ms' }}
        title="Grouped total: A1 options 5–6 (tenant/lessee and family/household member of a tenant)."
      >
        <div className="dash-stat__top">
          <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
            <KeyRound size={18} strokeWidth={2.2} />
          </span>
          <div className="dash-stat__label">Total Tenants</div>
        </div>
        <div className="dash-stat__value-row">
          <div className="dash-stat__value">{valueNode(kpis.tenantCount)}</div>
          {!empty ? <span className="dash-stat__share">{kpis.tenantPct}%</span> : null}
        </div>
        {!empty ? (
          <div className="dash-stat__bar" aria-hidden="true">
            <div className="dash-stat__bar-fill" style={{ width: `${kpis.tenantPct}%` }} />
          </div>
        ) : null}
        <div className="dash-stat__caption">
          {empty ? 'No data yet' : 'Grouped tenant branch'}
        </div>
      </div>
    </div>
  );
}
