'use client';

import { useId, useMemo, useState } from 'react';
import type { DayPoint } from '@/lib/admin/dataAnalytics';

type Mode = 'daily' | 'total';

const W = 640;
const H = 230;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = value / pow <= 2 ? 2 : value / pow <= 5 ? 5 : 10;
  return Math.ceil(value / (step * pow / 5)) * (step * pow / 5);
}

/**
 * Responses over time. Area for the running total, line for daily counts.
 * Hover or arrow-key a point to read its value.
 */
export function TrendChart({ points, readOnly = false }: { points: DayPoint[]; readOnly?: boolean }) {
  const [mode, setMode] = useState<Mode>('daily');
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  const values = useMemo(() => points.map((p) => (mode === 'daily' ? p.count : p.total)), [points, mode]);
  const max = niceMax(Math.max(...values, 1));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  if (points.length === 0) {
    return <p className="gf-chart-empty">No responses in this period yet.</p>;
  }

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(values.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const labelAt = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, arr) => arr.indexOf(v) === i);
  const shown = active != null ? points[active]! : null;

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
    return Math.max(0, Math.min(points.length - 1, idx));
  };

  return (
    <div className="an-trend">
      {readOnly ? null : (
      <div className="an-trend__bar">
        <div className="an-seg" role="group" aria-label="Chart type">
          <button type="button" aria-pressed={mode === 'daily'} onClick={() => setMode('daily')}>
            Per day
          </button>
          <button type="button" aria-pressed={mode === 'total'} onClick={() => setMode('total')}>
            Running total
          </button>
        </div>
        <p className="an-trend__read" aria-live="polite">
          {shown ? (
            <>
              <strong>{mode === 'daily' ? shown.count : shown.total}</strong>{' '}
              {mode === 'daily' ? (shown.count === 1 ? 'response' : 'responses') : 'responses so far'} · {shown.label}
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
        aria-label={`Responses ${mode === 'daily' ? 'per day' : 'running total'}, ${points[0]!.label} to ${points[points.length - 1]!.label}`}
        onPointerMove={readOnly ? undefined : (e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={readOnly ? undefined : () => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--emerald-500)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--emerald-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="an-trend__grid" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="an-trend__tick">
              {t}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} className="an-trend__area" />
        <path d={line} className="an-trend__line" fill="none" />

        {labelAt.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} className="an-trend__tick">
            {points[i]!.label}
          </text>
        ))}

        {active != null ? (
          <g>
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} className="an-trend__cursor" />
            <circle cx={x(active)} cy={y(values[active]!)} r={5} className="an-trend__dot" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
