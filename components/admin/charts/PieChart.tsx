'use client';

import type { CountBucket } from '@/lib/admin/analytics';

const PIE_COLORS = [
  '#13693f',
  '#e87820',
  '#1a8f56',
  '#c45c12',
  '#2d6a4f',
  '#f0a060',
  '#0d4d2e',
  '#8f4510',
];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

/**
 * Google Forms–style pie with external legend and slice % labels.
 */
export function PieChart({
  buckets,
  animate = true,
}: {
  buckets: CountBucket[];
  animate?: boolean;
}) {
  const active = buckets.filter((b) => b.count > 0);
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 88;

  if (active.length === 0) {
    return <p className="gf-chart-empty">No responses yet for this question.</p>;
  }

  if (active.length === 1) {
    const only = active[0];
    const color = PIE_COLORS[0];
    return (
      <div className="gf-pie">
        <svg viewBox={`0 0 ${size} ${size}`} className="gf-pie__svg" aria-hidden="true">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={color}
            style={{ opacity: animate ? 1 : 0, transition: 'opacity 480ms ease' }}
          />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="gf-pie__label">
            {only.pct}%
          </text>
        </svg>
        <ul className="gf-pie__legend">
          {buckets.map((b, i) => (
            <li key={b.label} className="gf-pie__legend-item">
              <span
                className="gf-pie__swatch"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                aria-hidden="true"
              />
              <span className="gf-pie__legend-label">{b.label}</span>
              <span className="gf-pie__legend-pct">{b.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  let angle = 0;
  const slices = active.map((b) => {
    const sweep = (b.count / active.reduce((s, x) => s + x.count, 0)) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const mid = start + sweep / 2;
    const labelPos = polar(cx, cy, r * 0.62, mid);
    return { ...b, start, end, mid, labelPos, showLabel: sweep >= 18 };
  });

  const colorOf = (label: string) => {
    const idx = buckets.findIndex((b) => b.label === label);
    return PIE_COLORS[(idx < 0 ? 0 : idx) % PIE_COLORS.length];
  };

  return (
    <div className="gf-pie">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="gf-pie__svg"
        role="img"
        aria-label="Pie chart of response distribution"
      >
        {slices.map((s) => (
          <path
            key={s.label}
            d={arcPath(cx, cy, r, s.start, s.end)}
            fill={colorOf(s.label)}
            style={{
              opacity: animate ? 1 : 0,
              transition: 'opacity 480ms ease',
            }}
          />
        ))}
        {slices.map((s) =>
          s.showLabel ? (
            <text
              key={`${s.label}-pct`}
              x={s.labelPos.x}
              y={s.labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="gf-pie__label"
            >
              {s.pct}%
            </text>
          ) : null,
        )}
      </svg>
      <ul className="gf-pie__legend">
        {buckets.map((b) => (
          <li key={b.label} className="gf-pie__legend-item">
            <span
              className="gf-pie__swatch"
              style={{ background: colorOf(b.label) }}
              aria-hidden="true"
            />
            <span className="gf-pie__legend-label">{b.label}</span>
            <span className="gf-pie__legend-pct">{b.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
