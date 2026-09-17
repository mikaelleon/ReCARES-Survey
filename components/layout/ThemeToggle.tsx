'use client';

import { useState, type CSSProperties, type MouseEventHandler } from 'react';

export interface ThemeToggleProps {
  'aria-label': string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onDark?: boolean;
}

function MoonIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={spinning ? 'theme-toggle-icon theme-toggle-icon--spin' : 'theme-toggle-icon'}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

export function ThemeToggle({
  'aria-label': ariaLabel,
  onClick,
  onDark = false,
}: ThemeToggleProps) {
  const [hover, setHover] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const style: CSSProperties = onDark
    ? {
        marginLeft: 4,
        width: 36,
        height: 36,
        flex: '0 0 36px',
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: hover ? 'rgba(255,255,255,.14)' : 'transparent',
        color: 'var(--white)',
        border: `1px solid ${hover ? 'var(--white)' : 'rgba(255,255,255,.55)'}`,
        transition:
          'background var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease)',
      }
    : {
        width: 40,
        height: 40,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: hover ? 'var(--surface-2)' : 'transparent',
        color: 'var(--text-body)',
        border: `1px solid ${hover ? 'var(--text-body)' : 'var(--border-default)'}`,
        transition:
          'background var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease)',
      };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        setSpinning(true);
        window.setTimeout(() => setSpinning(false), 220);
        onClick?.(e);
      }}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <MoonIcon spinning={spinning} />
    </button>
  );
}
