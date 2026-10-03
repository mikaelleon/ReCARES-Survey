'use client';

/**
 * Simple radial % gauge (Dark Emerald arc). Value is already 0–100.
 */
export function RadialGauge({
  pct,
  caption,
}: {
  pct: number;
  caption: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  return (
    <div className="radial-gauge">
      <svg viewBox="0 0 140 140" className="radial-gauge__svg" aria-hidden="true">
        <circle cx="70" cy="70" r={r} className="radial-gauge__track" />
        <circle
          cx="70"
          cy="70"
          r={r}
          className="radial-gauge__arc"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="74" textAnchor="middle" className="radial-gauge__value">
          {clamped}%
        </text>
      </svg>
      <p className="radial-gauge__caption">{caption}</p>
    </div>
  );
}
