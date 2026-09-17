'use client';

import type { CountBucket } from '@/lib/admin/analytics';

/**
 * Google Forms–style horizontal bars with count (pct) annotations.
 */
export function HorizontalBars({
  buckets,
  animate = true,
}: {
  buckets: CountBucket[];
  animate?: boolean;
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  if (buckets.every((b) => b.count === 0)) {
    return <p className="gf-chart-empty">No responses yet for this question.</p>;
  }

  return (
    <ul className="gf-hbar">
      {buckets.map((b) => {
        const widthPct = (b.count / max) * 100;
        return (
          <li key={b.label} className="gf-hbar__row">
            <div className="gf-hbar__label" title={b.label}>
              {b.label}
            </div>
            <div className="gf-hbar__track" aria-hidden="true">
              <div
                className="gf-hbar__fill"
                style={{ width: animate ? `${widthPct}%` : '0%' }}
              />
            </div>
            <div className="gf-hbar__value">
              {b.count} ({b.pct}%)
            </div>
          </li>
        );
      })}
    </ul>
  );
}
