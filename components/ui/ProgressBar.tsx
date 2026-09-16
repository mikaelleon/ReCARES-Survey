import type { CSSProperties } from 'react';

export interface ProgressBarProps {
  value?: number;
  max?: number;
}

export function ProgressBar({ value = 0, max = 100 }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  const trackStyle: CSSProperties = {
    width: '100%',
    height: 8,
    background: 'var(--surface-1)',
    borderRadius: 999,
    overflow: 'hidden',
  };

  const fillStyle: CSSProperties = {
    width: `${pct}%`,
    height: '100%',
    background: 'var(--accent-primary)',
    transition: 'width var(--motion-duration) var(--motion-ease)',
  };

  return (
    <div style={trackStyle}>
      <div style={fillStyle} />
    </div>
  );
}
