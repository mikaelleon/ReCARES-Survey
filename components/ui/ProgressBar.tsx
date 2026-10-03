import type { CSSProperties } from 'react';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  /**
   * accent = Harvest Orange (actions / survey step progress).
   * data = Dark Emerald (dashboard / analytics fills).
   */
  tone?: 'accent' | 'data';
}

export function ProgressBar({ value = 0, max = 100, tone = 'accent' }: ProgressBarProps) {
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
    background: tone === 'data' ? 'var(--dark-emerald)' : 'var(--accent-primary)',
    transition: 'width var(--motion-duration) var(--motion-ease)',
  };

  return (
    <div style={trackStyle} data-tone={tone}>
      <div style={fillStyle} />
    </div>
  );
}
