'use client';

import type { HeatRow } from '@/lib/admin/dataAnalytics';

/**
 * Problems (rows) by phase (columns). Colour depth is the share of that phase's
 * residents who reported the problem; the number is the share too, so colour is
 * never the only signal.
 */
export function Heatmap({ phases, rows, max }: { phases: string[]; rows: HeatRow[]; max: number }) {
  if (rows.length === 0) {
    return <p className="gf-chart-empty">No problems reported yet.</p>;
  }
  return (
    <div className="an-heat" role="table" aria-label="Share of residents reporting each problem, by phase">
      <div className="an-heat__row an-heat__row--head" role="row">
        <span role="columnheader" className="an-heat__corner">
          Problem
        </span>
        {phases.map((phase) => (
          <span key={phase} role="columnheader" className="an-heat__col">
            {phase.replace(/^Phase /, 'P')}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.id} className="an-heat__row" role="row">
          <span role="rowheader" className="an-heat__name">
            {row.label}
          </span>
          {row.cells.map((cell) => {
            const strength = max > 0 ? cell.pct / max : 0;
            return (
              <span
                key={cell.phase}
                role="cell"
                className={`an-heat__cell${cell.count === 0 ? ' is-zero' : ''}${strength > 0.55 ? ' is-strong' : ''}`}
                style={{ ['--heat' as string]: `${Math.round(strength * 78)}%` }}
                title={`${row.label} · ${cell.phase}: ${cell.count} residents (${cell.pct}%)`}
              >
                {cell.count === 0 ? '·' : `${cell.pct}%`}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
