'use client';

import Link from 'next/link';
import { Copy, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { AccessibilityNeedsRows } from '@/components/admin/charts/AccessibilityNeedsRows';
import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import { MeanBars } from '@/components/admin/charts/MeanBars';
import { PieChart } from '@/components/admin/charts/PieChart';
import { RadialGauge } from '@/components/admin/charts/RadialGauge';
import {
  EXTENDED_WIDGET_META,
  accessibilityNeeds,
  digitalFeasibility,
  interviewOptIn,
  isExtendedWidgetId,
  openProblems,
  rankFeatures,
  registrationComfort,
  registrationRetention,
  responseHealth,
  serviceQualityGauge,
  streetClosureC1,
  streetClosureSatisfaction,
  waitTimeStat,
  type ExtendedWidgetId,
} from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

function metaTitle(id: ExtendedWidgetId): string {
  return EXTENDED_WIDGET_META.find((m) => m.id === id)?.title ?? id;
}

/**
 * Renders one extended Summary widget from live SampleRecord answers.
 */
export function ExtendedWidgetCard({
  id,
  records,
  compact = false,
  onRemove,
}: {
  id: string;
  records: SampleRecord[];
  compact?: boolean;
  onRemove?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!isExtendedWidgetId(id)) return null;

  const title = metaTitle(id);
  const body = renderBody(id, records);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n${body.copyText}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className={`gf-card${compact ? ' gf-card--compact' : ''}`}>
      <header className="gf-card__head">
        <div className="gf-card__titles">
          <h3 className="gf-card__title">{title}</h3>
          {body.hint ? <p className="gf-card__meta">{body.hint}</p> : null}
        </div>
        <div className="gf-card__head-actions">
          <button
            type="button"
            className="gf-card__copy"
            onClick={() => void handleCopy()}
            aria-label={`Copy chart for ${title}`}
          >
            <Copy size={16} strokeWidth={2.2} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy chart'}
          </button>
          {onRemove ? (
            <button
              type="button"
              className="gf-card__remove"
              onClick={onRemove}
              aria-label={`Remove ${title} from Summary`}
              title="Remove from Summary"
            >
              <X size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>
      <div className="gf-card__body">{body.node}</div>
    </article>
  );
}

function renderBody(
  id: ExtendedWidgetId,
  records: SampleRecord[],
): { node: ReactNode; copyText: string; hint?: string } {
  switch (id) {
    case 'top-features': {
      const ranked = rankFeatures(records);
      return {
        hint: 'Average likelihood to use (1–5), highest first',
        copyText: ranked
          .map((f) => `${f.label}: ${f.averageLikelihood} (n=${f.responseCount})`)
          .join('\n'),
        node: (
          <MeanBars
            highlightTop={3}
            items={ranked.map((f) => ({
              label: f.label,
              mean: f.averageLikelihood,
              n: f.responseCount,
            }))}
          />
        ),
      };
    }
    case 'digital-feasibility': {
      const d = digitalFeasibility(records);
      return {
        copyText: `Reliable smartphone + internet access: ${d.pct}% (${d.count}/${d.total})`,
        node: (
          <div className="ext-stat">
            <div className="ext-stat__value">{d.pct}%</div>
            <p className="ext-stat__label">Reliable smartphone + internet access</p>
            <p className="ext-stat__note">
              Share of respondents with a smartphone, laptop/desktop, or tablet (B1) and
              wifi/broadband or mobile data (B3) — not “no regular internet.” {d.count} of{' '}
              {d.total} in the current filter.
            </p>
          </div>
        ),
      };
    }
    case 'service-quality': {
      const g = serviceQualityGauge(records);
      return {
        copyText: `Current service quality: avg ${g.average}/5 → ${g.pctOfScale}% (n=${g.n} item scores)`,
        node: (
          <RadialGauge
            pct={g.pctOfScale}
            caption={`Mean of S1–S3 = ${g.average || '—'}/5 · n=${g.n} scored items (99/not shown excluded)`}
          />
        ),
      };
    }
    case 'wait-time': {
      const w = waitTimeStat(records);
      return {
        copyText:
          w.averageMinutes == null
            ? `Average wait time: no P4 answers (0 of ${w.total})`
            : `Average reported wait time: ${w.averageMinutes} minutes (based on ${w.answered} of ${w.total})`,
        node: (
          <div className="ext-stat">
            <div className="ext-stat__value">
              {w.averageMinutes == null ? '—' : `${w.averageMinutes} min`}
            </div>
            <p className="ext-stat__label">Average reported wait time</p>
            <p className="ext-stat__note">
              Based on {w.answered} of {w.total} respondents who answered P4 (optional).
            </p>
          </div>
        ),
      };
    }
    case 'street-closure': {
      const c1 = streetClosureC1(records);
      const sat = streetClosureSatisfaction(records);
      const n = records.length;
      return {
        copyText: [
          ...c1.map((b) => `${b.label}: ${b.count} (${b.pct}%)`),
          `Notice clarity (C2) avg: ${sat.noticeAvg}`,
          `Rerouting notice (C3) avg: ${sat.rerouteAvg}`,
        ].join('\n'),
        node: (
          <div className="ext-composite">
            <PieChart buckets={c1} />
            {sat.n > 0 ? (
              <MeanBars
                items={[
                  { label: 'Permit process is clear (C2)', mean: sat.noticeAvg, n: sat.n },
                  { label: 'Notices reach me in time (C3)', mean: sat.rerouteAvg, n: sat.n },
                ]}
              />
            ) : null}
            <p className="gf-chart-hint">
              C1 breakdown reflects {n} response{n === 1 ? '' : 's'}.
              {sat.n === 0 ? (
                <span>
                  {' '}
                  No C2/C3 satisfaction scores yet — these only apply to residents who selected
                  “Requested” or “Affected.”
                </span>
              ) : (
                <span>
                  {' '}
                  Satisfaction averages exclude 99 / not-shown and respondents who chose “Neither”
                  on C1.
                </span>
              )}
            </p>
          </div>
        ),
      };
    }
    case 'accessibility-needs': {
      const { buckets, baseN } = accessibilityNeeds(records);
      return {
        hint: `Out of ${baseN} respondents who indicated a disability or mobility limitation`,
        copyText: buckets.map((b) => `${b.label}: ${b.count} (${b.pct}%)`).join('\n'),
        node: (
          <>
            <AccessibilityNeedsRows buckets={buckets} baseN={baseN} />
            <p className="gf-chart-hint">
              Base = respondents with AC1 present (A4 path), not all survey respondents.
            </p>
          </>
        ),
      };
    }
    case 'open-problems': {
      const buckets = openProblems(records);
      return {
        hint: 'Problems beyond what this survey asked about directly',
        copyText: buckets.map((b) => `${b.label}: ${b.count} (${b.pct}%)`).join('\n'),
        node: <HorizontalBars buckets={buckets} />,
      };
    }
    case 'registration-ai': {
      const comfort = registrationComfort(records);
      const retention = registrationRetention(records);
      return {
        hint: 'Relevant to the open AI ID-validation scope decision',
        copyText: [
          `R1 avg: ${comfort.r1Avg} (n=${comfort.r1N})`,
          `R2 avg: ${comfort.r2Avg} (n=${comfort.r2N})`,
          ...retention.map((b) => `${b.label}: ${b.count} (${b.pct}%)`),
        ].join('\n'),
        node: (
          <div className="ext-composite">
            <MeanBars
              items={[
                {
                  label: 'Comfortable uploading ID photo (R1)',
                  mean: comfort.r1Avg,
                  n: comfort.r1N,
                },
                {
                  label: 'Trust authorized HOA access (R2)',
                  mean: comfort.r2Avg,
                  n: comfort.r2N,
                },
              ]}
            />
            <PieChart buckets={retention} />
          </div>
        ),
      };
    }
    case 'interview-recruitment': {
      const iv = interviewOptIn(records);
      return {
        copyText: `${iv.yes} respondents opted into a follow-up interview (${iv.total} in filter)`,
        node: (
          <div className="ext-stat">
            <div className="ext-stat__value">{iv.yes}</div>
            <p className="ext-stat__label">Respondents opted into a follow-up interview</p>
            <p className="ext-stat__note">IV1 = Yes · {iv.total} in current filter</p>
            <Link href="/admin/interviews/" className="ext-stat__link">
              View Interview Invites
            </Link>
          </div>
        ),
      };
    }
    case 'response-health': {
      const h = responseHealth(records);
      return {
        copyText: [
          ...(h.completionAvailable && h.completionPct != null
            ? [`Completion: ${h.completionPct}%`]
            : []),
          ...h.deviceBuckets.map((b) => `Device ${b.label}: ${b.count} (${b.pct}%)`),
          ...h.languageBuckets.map((b) => `Language ${b.label}: ${b.count} (${b.pct}%)`),
        ].join('\n'),
        node: (
          <div className="ext-health">
            {h.completionAvailable && h.completionPct != null ? (
              <div className="ext-health__row">
                <span className="ext-health__k">Completion rate</span>
                <span className="ext-health__v">{h.completionPct}%</span>
              </div>
            ) : null}
            <h4 className="ext-health__sub">Device class</h4>
            <HorizontalBars buckets={h.deviceBuckets} />
            <h4 className="ext-health__sub">Language</h4>
            <HorizontalBars buckets={h.languageBuckets} />
          </div>
        ),
      };
    }
    default:
      return { node: null, copyText: '' };
  }
}
