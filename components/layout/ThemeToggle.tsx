'use client';

import { useState, type CSSProperties, type MouseEventHandler } from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';

export interface ThemeToggleProps {
  'aria-label': string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onDark?: boolean;
  /** Borderless icon control — matches admin sidebar tool buttons. */
  quiet?: boolean;
}

function MoonIcon() {
  return (
    <svg
      className="theme-toggle-icon"
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

function SunIcon() {
  return (
    <svg
      className="theme-toggle-icon"
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function ThemeToggle({
  'aria-label': ariaLabel,
  onClick,
  onDark = false,
  quiet = false,
}: ThemeToggleProps) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);

  const style: CSSProperties = quiet
    ? {
        width: 36,
        height: 36,
        flex: '0 0 36px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: hover ? 'rgba(255,255,255,.12)' : 'transparent',
        color: 'var(--white)',
        border: 'none',
        transition: 'background var(--motion-duration) var(--motion-ease)',
      }
    : onDark
    ? {
        width: 44,
        height: 44,
        flex: '0 0 44px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: hover ? 'rgba(255,255,255,.14)' : 'transparent',
        color: 'var(--white)',
        border: `1px solid ${hover ? 'var(--white)' : 'rgba(255,255,255,.55)'}`,
        transition:
          'background 150ms ease, border-color 150ms ease, transform 120ms ease-out',
      }
    : {
        width: 44,
        height: 44,
        borderRadius: 8,
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
      className="nav-btn"
      aria-label={ariaLabel}
      onClick={(e) => {
        onClick?.(e);
      }}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Both icons sit in one cell and swap at once: the one leaving shrinks and blurs away,
          the one arriving grows in. The icon shows the mode you will get. */}
      <span className="theme-icons" data-now={theme}>
        <span className="theme-icons__moon">
          <MoonIcon />
        </span>
        <span className="theme-icons__sun">
          <SunIcon />
        </span>
      </span>
    </button>
  );
}
