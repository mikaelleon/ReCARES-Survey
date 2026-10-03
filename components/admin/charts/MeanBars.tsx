'use client';

/**
 * Horizontal bars sized by mean on a 1–5 scale (bar length = mean × 20%).
 * Set wrapLabels to allow full feature names on two lines (with title fallback).
 * highlightTop marks the first N ranked rows (emerald) and mutes the rest.
 */
export function MeanBars({
  items,
  wrapLabels = false,
  highlightTop = 0,
}: {
  items: { label: string; mean: number; n: number }[];
  wrapLabels?: boolean;
  /** When > 0, first N rows are emphasized; remaining rows are subtle. */
  highlightTop?: number;
}) {
  if (items.every((i) => i.n === 0)) {
    return <p className="gf-chart-empty">No scored responses yet for this chart.</p>;
  }

  return (
    <ul className={`gf-hbar${wrapLabels ? ' gf-hbar--wrap' : ''}`}>
      {items.map((item, index) => {
        const widthPct = Math.max(0, Math.min(100, (item.mean / 5) * 100));
        const rankClass =
          highlightTop > 0
            ? index < highlightTop
              ? ' is-top'
              : ' is-muted'
            : item.n === 0
              ? ' is-zero'
              : '';
        return (
          <li key={item.label} className={`gf-hbar__row${rankClass}`}>
            <div className="gf-hbar__label" title={item.label}>
              {item.label}
            </div>
            <div className="gf-hbar__track" aria-hidden="true">
              <div className="gf-hbar__fill" style={{ width: `${widthPct}%` }} />
            </div>
            <div className="gf-hbar__value">
              {item.n === 0 ? '—' : `${item.mean.toFixed(1)} (n=${item.n})`}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
