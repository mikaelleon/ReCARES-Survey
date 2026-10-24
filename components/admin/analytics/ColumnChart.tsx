'use client';

import type { CountBucket } from '@/lib/admin/analytics';

/** Vertical bars for ordered categories (phase, age). Value above each bar, label below. */
export function ColumnChart({ buckets, unit = 'responses' }: { buckets: CountBucket[]; unit?: string }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  if (buckets.every((b) => b.count === 0)) {
    return <p className="gf-chart-empty">No responses yet.</p>;
  }
  const top = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0]!);

  return (
    <ul className="an-cols" aria-label={`${buckets.length} groups`}>
      {buckets.map((b) => {
        const height = b.count === 0 ? 3 : Math.max(6, (b.count / max) * 100);
        const tip = `${b.label}: ${b.count} ${unit} (${b.pct}%)`;
        return (
          <li key={b.label} className={`an-cols__item${b.label === top.label ? ' is-top' : ''}`} title={tip} aria-label={tip}>
            <span className="an-cols__value">{b.count}</span>
            <span className="an-cols__track">
              <span className="an-cols__fill" style={{ height: `${height}%` }} />
            </span>
            <span className="an-cols__label">{b.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
