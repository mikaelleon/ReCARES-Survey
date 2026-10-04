'use client';

import type { CountBucket } from '@/lib/admin/analytics';

/**
 * Horizontal bars with optional inline count/pct (or tooltip-only on Dashboard).
 */
export function HorizontalBars({
  buckets,
  animate = true,
  valueMode = 'inline',
}: {
  buckets: CountBucket[];
  animate?: boolean;
  valueMode?: 'inline' | 'tooltip';
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const hideValues = valueMode === 'tooltip';

  if (buckets.every((b) => b.count === 0)) {
    return <p className="gf-chart-empty">No responses yet for this question.</p>;
  }

  return (
    <ul className={`gf-hbar${hideValues ? ' gf-hbar--tooltip-values' : ''}`}>
      {buckets.map((b) => {
        const widthPct = (b.count / max) * 100;
        const empty = b.count <= 0;
        const statsTip = `${b.label}: ${b.count} (${b.pct}%)`;
        return (
          <li
            key={b.label}
            className={`gf-hbar__row${empty ? ' is-zero' : ''}`}
            title={statsTip}
            aria-label={statsTip}
          >
            <div className="gf-hbar__label">{b.label}</div>
            <div className="gf-hbar__track" aria-hidden="true">
              <div
                className={`gf-hbar__fill${empty ? ' is-empty' : ''}`}
                style={{ width: animate ? (empty ? '4%' : `${widthPct}%`) : '0%' }}
              />
            </div>
            {!hideValues ? (
              <div className="gf-hbar__value">
                {b.count} ({b.pct}%)
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
