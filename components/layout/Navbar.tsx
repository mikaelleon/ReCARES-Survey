'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeProvider';

const links = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#faq', label: 'FAQ' },
] as const;

/**
 * Full-bleed resident navbar matching the homepage mockups.
 * Flush to the viewport edges — no top/side whitespace outside the bar.
 */
export function Navbar() {
  const pathname = usePathname();
  const { toggleTheme, themeLabel } = useTheme();
  const onHome = pathname === '/';

  return (
    <nav
      style={{
        width: '100%',
        margin: 0,
        background: 'var(--dark-emerald)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 clamp(12px, 3vw, 28px)',
        minHeight: 56,
        boxSizing: 'border-box',
      }}
    >
      <Link
        href="/"
        aria-label="ReCARES home"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <Home size={18} color="var(--dark-emerald)" strokeWidth={2.25} aria-hidden="true" />
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1.2vw, 12px)',
          marginLeft: 'auto',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {links.map((l) => {
          const active = onHome && l.label === 'Home';
          return (
            <Link
              key={l.label}
              href={l.href}
              className="nav-link"
              style={{
                fontFamily: 'var(--font-sans)',
                minHeight: 40,
                padding: '0 10px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: active ? 'var(--bright-amber)' : 'var(--white)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'color 220ms ease-in-out',
              }}
            >
              {l.label}
            </Link>
          );
        })}

        <Link
          href="/admin/signup"
          style={{
            fontFamily: 'var(--font-sans)',
            minHeight: 36,
            padding: '0 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,.85)',
            background: 'transparent',
            color: 'var(--white)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            transition: 'background 220ms ease-in-out',
          }}
        >
          Sign up
        </Link>

        <Link
          href="/admin/login"
          style={{
            fontFamily: 'var(--font-sans)',
            minHeight: 36,
            padding: '0 18px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--white)',
            color: 'var(--dark-emerald)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            transition: 'opacity 220ms ease-in-out',
          }}
        >
          Login
        </Link>

        <ThemeToggle onDark aria-label={themeLabel} onClick={toggleTheme} />
      </div>
    </nav>
  );
}
