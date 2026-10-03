'use client';

import { useState } from 'react';
import type { CountBucket } from '@/lib/admin/analytics';

function shortPhaseLabel(label: string): string {
  const match = label.match(/^Phase\s+(\d+)/i);
  return match ? `Phase ${match[1]}` : label;
}

function tipText(b: CountBucket): string {
  const noun = b.count === 1 ? 'response' : 'responses';
  return `${b.label}: ${b.count} ${noun}, ${b.pct}%`;
}

/**
 * Rectangular vertical bars for development-phase counts.
 * Values sit above the bar so labels stay readable. Peak is not a separate color.
 */
export function PhaseBarChart({ buckets }: { buckets: CountBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const [tip, setTip] = useState<string | null>(null);

  return (
    <div className="phase-bars-wrap">
      <div className="phase-bars" role="img" aria-label="Responses by development phase">
        {buckets.map((b) => {
          const empty = b.count <= 0;
          const heightPct = empty ? 0 : Math.max(18, Math.round((b.count / max) * 100));
          return (
            <div key={b.label} className={`phase-bars__col${empty ? ' is-empty' : ''}`}>
              <span className={`phase-bars__value${empty ? ' is-empty' : ''}`}>
                {empty ? '0' : `${b.count} (${b.pct}%)`}
              </span>
              <div className="phase-bars__track">
                <div
                  className={`phase-bars__bar${empty ? ' is-empty' : ''}`}
                  style={{ height: empty ? '4px' : `${heightPct}%` }}
                  onMouseEnter={() => setTip(tipText(b))}
                  onMouseLeave={() => setTip(null)}
                >
                  <title>{tipText(b)}</title>
                </div>
              </div>
              <span className="phase-bars__label">{shortPhaseLabel(b.label)}</span>
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
