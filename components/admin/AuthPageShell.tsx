'use client';

import type { ReactNode } from 'react';
import { RecaresWordmark } from '@/components/brand/RecaresWordmark';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeProvider';

/**
 * Full-viewport auth chrome — no top navbar.
 * Brand leads; theme toggle (and optional session actions) sit in the corner.
 */
export function AuthPageShell({
  children,
  eyebrow = 'Survey Administration',
  sessionEmail,
  onLogout,
}: {
  children: ReactNode;
  eyebrow?: string;
  sessionEmail?: string | null;
  onLogout?: () => void;
}) {
  const { toggleTheme, themeLabel } = useTheme();

  return (
    <div className="auth-page">
      <div className="auth-page__atmosphere" aria-hidden="true">
        <span className="auth-page__orb auth-page__orb--emerald" />
        <span className="auth-page__orb auth-page__orb--orange" />
        <span className="auth-page__grid" />
      </div>

      <div className="auth-page__tools">
        {sessionEmail ? (
          <span className="auth-page__session" title={sessionEmail}>
            {sessionEmail}
          </span>
        ) : null}
        {onLogout ? (
          <button type="button" className="auth-page__logout" onClick={onLogout}>
            Log out
          </button>
        ) : null}
        <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} />
      </div>

      <div className="auth-page__inner">
        <header className="auth-page__brand">
          <RecaresWordmark size={40} />
          <p className="auth-page__eyebrow">{eyebrow}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
