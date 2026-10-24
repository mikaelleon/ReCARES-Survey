'use client';

import type { ScaleKind, ScaleRow } from '@/lib/admin/dataAnalytics';

const LABELS: Record<ScaleKind, string[]> = {
  agreement: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  likelihood: ['Very unlikely', 'Unlikely', 'Not sure', 'Likely', 'Very likely'],
};

/**
 * One 100% stacked bar per scale question: warm for the low end, grey in the
 * middle, green for the high end. The mean sits beside each bar so rows can be
 * ranked at a glance, and the full split is a hover away.
 */
export function ScaleBars({ rows, kind }: { rows: ScaleRow[]; kind: ScaleKind }) {
  const labels = LABELS[kind];
  if (rows.every((r) => r.n === 0)) {
    return <p className="gf-chart-empty">No answers to these questions yet.</p>;
  }

  return (
    <div className="an-scale">
      <ul className="an-scale__legend" aria-hidden="true">
        {labels.map((label, i) => (
          <li key={label}>
            <span className={`an-swatch an-lk-${i + 1}`} />
            {label}
          </li>
        ))}
      </ul>

      <ul className="an-scale__rows">
        {rows.map((row) => {
          const tip = `${row.label}: ${labels.map((l, i) => `${l} ${row.counts[i]}`).join(', ')}${row.notApplicable ? `, not applicable ${row.notApplicable}` : ''}`;
          return (
            <li key={row.code} className="an-scale__row" title={tip}>
              <div className="an-scale__label">
                <span>{row.label}</span>
                <small>
                  {row.n} answered{row.notApplicable ? ` · ${row.notApplicable} N/A` : ''}
                </small>
              </div>
              <div className="an-scale__bar" role="img" aria-label={tip}>
                {row.counts.map((count, i) => {
                  const share = row.n ? (count / row.n) * 100 : 0;
                  return share > 0 ? (
                    <span key={i} className={`an-lk-${i + 1}`} style={{ width: `${share}%` }}>
                      {share >= 12 ? `${Math.round(share)}%` : ''}
                    </span>
                  ) : null;
                })}
                {row.n === 0 ? <span className="an-scale__none">No answers</span> : null}
              </div>
              <div className="an-scale__mean" aria-label={`Average ${row.mean} of 5`}>
                {row.n ? row.mean.toFixed(1) : '—'}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
