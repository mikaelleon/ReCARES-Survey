'use client';

import { useState } from 'react';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeProvider';

/**
 * Admin chrome — theme/language bar only; no resident Navbar.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { toggleTheme, themeLabel } = useTheme();
  const [lang, setLang] = useState<'EN' | 'FIL'>('EN');

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '12px clamp(16px, 4vw, 32px)',
        }}
      >
        <LanguageToggle value={lang} onChange={setLang} />
        <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} />
      </div>
      {lang === 'FIL' && (
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto 16px',
            padding: '12px clamp(16px, 4vw, 32px)',
            background: 'var(--bright-amber)',
            color: 'var(--black)',
            fontSize: 14,
            borderRadius: 8,
            animation: 'fadeIn 260ms ease-in-out both',
          }}
        >
          Filipino translations are pending. Strings are shown in English for now; every string has a
          Filipino counterpart in the final build.
        </div>
      )}
      {children}
    </>
  );
}
