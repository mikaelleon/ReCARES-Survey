'use client';

import { useState } from 'react';
import type { CountBucket } from '@/lib/admin/analytics';

function shortPhaseLabel(label: string): string {
  const match = label.match(/^Phase\s+(\d+)/i);
  return match ? `Phase ${match[1]}` : label;
}

function tipText(bucket: CountBucket): string {
  const noun = bucket.count === 1 ? 'response' : 'responses';
  return `${bucket.label}: ${bucket.count} ${noun}, ${bucket.pct}%`;
}

/**
 * Rectangular vertical bars for development-phase counts.
 * Counts live in hover tip only — keeps the chart scannable.
 */
export function PhaseBarChart({ buckets }: { buckets: CountBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const [tip, setTip] = useState<string | null>(null);

  return (
    <div className="phase-bars-wrap">
      <div className="phase-bars" role="img" aria-label="Responses by development phase">
        {buckets.map((bucket) => {
          const empty = bucket.count <= 0;
          const heightPct = empty ? 0 : Math.max(18, Math.round((bucket.count / max) * 100));
          return (
            <div
              key={bucket.label}
              className={`phase-bars__col${empty ? ' is-empty' : ''}`}
              title={tipText(bucket)}
            >
              <div className="phase-bars__track">
                <div
                  className={`phase-bars__bar${empty ? ' is-empty' : ''}`}
                  style={{ height: empty ? '4px' : `${heightPct}%` }}
                  onMouseEnter={() => setTip(tipText(bucket))}
                  onMouseLeave={() => setTip(null)}
                  onFocus={() => setTip(tipText(bucket))}
                  onBlur={() => setTip(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={tipText(bucket)}
                />
              </div>
              <span className="phase-bars__label">{shortPhaseLabel(bucket.label)}</span>
            </div>
          );
        })}
      </div>
      {tip ? (
        <div className="phase-bars__tip" role="status">
          {tip}
        </div>
      ) : null}
    </div>
  );
}
