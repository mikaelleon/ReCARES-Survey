'use client';

import { useMemo, useState } from 'react';
import type { ResidentSeries } from '@/lib/admin/dataAnalytics';

type Mode = 'daily' | 'total';

const W = 640;
const H = 250;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = value / pow <= 2 ? 2 : value / pow <= 5 ? 5 : 10;
  const unit = (step * pow) / 5;
  return Math.ceil(value / unit) * unit;
}

/**
 * Responses over time, stacked by resident group. Each group has its own colour
 * (and a labelled legend with totals), so the mix of homeowners and tenants is
 * visible at a glance. Hover a day to read each group's count.
 */
export function StackedArea({
  series,
  readOnly = false,
  initialMode = 'total',
}: {
  series: ResidentSeries;
  readOnly?: boolean;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [active, setActive] = useState<number | null>(null);
  const { points, groups } = series;

  const stacks = useMemo(() => {
    const values = groups.map((g) => (mode === 'daily' ? g.daily : g.total));
    const lower = points.map(() => 0);
    return values.map((vals) => {
      const base = [...lower];
      vals.forEach((v, i) => {
        lower[i]! += v;
      });
      return { base, top: [...lower] };
    });
  }, [groups, points, mode]);

  if (points.length === 0 || groups.length === 0) {
    return <p className="gf-chart-empty">No responses in this period yet.</p>;
  }

  const topMost = stacks[stacks.length - 1]!.top;
  const max = niceMax(Math.max(...topMost, 1));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const labelAt = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, arr) => arr.indexOf(v) === i);

  const areaPath = (base: number[], top: number[]) => {
    const upper = top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const lower = base
      .map((v, i) => [x(i), y(v)] as const)
      .reverse()
      .map(([px, py]) => `L ${px.toFixed(1)} ${py.toFixed(1)}`)
      .join(' ');
    return `${upper} ${lower} Z`;
  };

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
    return Math.max(0, Math.min(points.length - 1, idx));
  };

  const shown = active != null ? points[active]! : null;

  return (
    <div className="an-trend an-stack">
      {readOnly ? null : (
        <div className="an-trend__bar">
          <div className="an-seg" role="group" aria-label="Chart type">
            <button type="button" aria-pressed={mode === 'total'} onClick={() => setMode('total')}>
              Running total
            </button>
            <button type="button" aria-pressed={mode === 'daily'} onClick={() => setMode('daily')}>
              Per day
            </button>
          </div>
          <p className="an-trend__read" aria-live="polite">
            {shown ? (
              <>
                <strong>{shown.label}</strong>
                {groups.map((g) => (
                  <span key={g.id} className="an-stack__tip">
                    <i className={`an-grp an-grp--${g.id}`} aria-hidden="true" />
                    {(mode === 'daily' ? g.daily : g.total)[active!]}
                  </span>
                ))}
              </>
            ) : (
              <span>Hover the chart to read a day</span>
            )}
          </p>
        </div>
      )}

      <svg
        className="an-trend__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Responses ${mode === 'daily' ? 'per day' : 'running total'} by resident type, ${points[0]!.label} to ${points[points.length - 1]!.label}`}
        onPointerMove={readOnly ? undefined : (e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={readOnly ? undefined : () => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="an-trend__grid" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="an-trend__tick">
              {t}
            </text>
          </g>
        ))}

        {stacks.map((stack, i) => (
          <path key={groups[i]!.id} d={areaPath(stack.base, stack.top)} className={`an-stack__area an-grp--${groups[i]!.id}`} />
        ))}

        {labelAt.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} className="an-trend__tick">
            {points[i]!.label}
          </text>
        ))}

        {active != null ? (
          <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} className="an-trend__cursor" />
        ) : null}
      </svg>

      <ul className="an-stack__legend">
        {groups.map((g) => (
          <li key={g.id}>
            <i className={`an-grp an-grp--${g.id}`} aria-hidden="true" />
            <span>{g.label}</span>
            <strong>{g.sum}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
