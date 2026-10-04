import type { CSSProperties } from 'react';

type SkelLineSize = 'sm' | 'md' | 'lg' | 'full';

export function SkelLine({
  size = 'full',
  style,
}: {
  size?: SkelLineSize;
  style?: CSSProperties;
}) {
  return <span className={`skel skel-line skel-line--${size}`} style={style} />;
}

/** KPI / card placeholder that mirrors real card padding. */
export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="dash-stat-grid skel-region" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading metrics</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel-stat">
          <SkelLine size="sm" />
          <SkelLine size="lg" />
          <SkelLine size="md" />
        </div>
      ))}
    </div>
  );
}

/** Table-shaped placeholder for list views. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skel-table skel-region" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading table</span>
      <div className="skel-table__head" aria-hidden="true">
        <SkelLine size="sm" />
        <SkelLine size="md" />
        <SkelLine size="sm" />
        <SkelLine size="sm" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skel-table__row" aria-hidden="true">
          <SkelLine size="md" />
          <SkelLine size="full" />
          <SkelLine size="sm" />
          <SkelLine size="sm" />
        </div>
      ))}
    </div>
  );
}

/** Chart / panel placeholder. */
export function ChartSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div className="skel-chart" style={{ minHeight: height }} aria-hidden="true">
      <SkelLine size="sm" />
      <div className="skel-chart__bars">
        <span className="skel skel-bar" style={{ height: '42%' }} />
        <span className="skel skel-bar" style={{ height: '68%' }} />
        <span className="skel skel-bar" style={{ height: '55%' }} />
        <span className="skel skel-bar" style={{ height: '88%' }} />
        <span className="skel skel-bar" style={{ height: '36%' }} />
      </div>
    </div>
  );
}
