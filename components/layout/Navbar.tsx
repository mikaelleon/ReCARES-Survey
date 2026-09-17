'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeProvider';

type SectionKey = 'home' | 'about' | 'faq';

const links: { href: string; label: string; section: SectionKey }[] = [
  { href: '/', label: 'Home', section: 'home' },
  { href: '/#about', label: 'About', section: 'about' },
  { href: '/#faq', label: 'FAQ', section: 'faq' },
];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Sticky resident navbar with mobile drawer below 768px.
 */
export function Navbar() {
  const pathname = usePathname();
  const { toggleTheme, themeLabel } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionKey>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const updateFromScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);

    if (pathname !== '/') {
      setActive('home');
      return;
    }

    const marker = window.scrollY + 88;
    const about = document.getElementById('about');
    const faq = document.getElementById('faq');
    const contact = document.getElementById('contact');

    let next: SectionKey = 'home';
    if (about && marker >= about.offsetTop) next = 'about';
    if (faq && marker >= faq.offsetTop) next = 'faq';
    if (contact && marker >= contact.offsetTop) next = 'faq';
    setActive(next);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    updateFromScroll();
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    return () => {
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
    };
  }, [updateFromScroll]);

  useEffect(() => {
    if (!menuOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const menuButton = menuButtonRef.current;
    const drawer = drawerRef.current;
    const focusables = () =>
      drawer
        ? Array.from(
            drawer.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !drawer) return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
      menuButton?.focus();
    };
  }, [menuOpen]);

  const scrollToHash = (hash: string | null) => {
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (!hash) {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior, block: 'start' });
  };

  const onNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false);
    if (pathname !== '/') return;

    if (href === '/') {
      e.preventDefault();
      scrollToHash(null);
      return;
    }

    if (href.startsWith('/#')) {
      e.preventDefault();
      scrollToHash(href.slice(2));
    }
  };

  const linkStyle = (isActive: boolean) => ({
    fontFamily: 'var(--font-sans)',
    minHeight: 40,
    padding: '0 10px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase' as const,
    color: isActive ? 'var(--bright-amber)' : 'var(--white)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'color 220ms ease-in-out',
  });

  const desktopLinks = (
    <>
      {links.map((l) => {
        const isActive = pathname === '/' ? active === l.section : false;
        return (
          <Link
            key={l.label}
            href={l.href}
            className="nav-link"
            onClick={(e) => onNavClick(e, l.href)}
            style={linkStyle(isActive)}
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
        }}
      >
        Login
      </Link>
    </>
  );

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
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
          boxShadow: scrolled ? '0 4px 18px rgba(0, 0, 0, 0.28)' : 'none',
          transition: 'box-shadow 220ms ease-in-out',
        }}
      >
        <Link
          href="/"
          aria-label="ReCARES home"
          onClick={(e) => onNavClick(e, '/')}
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
            justifyContent: 'flex-end',
          }}
        >
          {!isMobile && desktopLinks}

          {isMobile && (
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls={titleId}
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,.55)',
                background: 'transparent',
                color: 'var(--white)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <ThemeToggle onDark aria-label={themeLabel} onClick={toggleTheme} />
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div
          role="presentation"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'var(--overlay-backdrop)',
          }}
        >
          <div
            ref={drawerRef}
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 'min(320px, 88vw)',
              height: '100%',
              background: 'var(--dark-emerald)',
              padding: '20px 20px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: 'var(--shadow-modal)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,.55)',
                  background: 'transparent',
                  color: 'var(--white)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {links.map((l) => {
              const isActive = pathname === '/' ? active === l.section : false;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className="nav-link"
                  onClick={(e) => onNavClick(e, l.href)}
                  style={{
                    ...linkStyle(isActive),
                    minHeight: 48,
                    width: '100%',
                    padding: '12px 8px',
                    borderBottom: '1px solid rgba(255,255,255,.14)',
                  }}
                >
                  {l.label}
                </Link>
              );
            })}

            <Link
              href="/admin/signup"
              onClick={() => setMenuOpen(false)}
              style={{
                marginTop: 16,
                fontFamily: 'var(--font-sans)',
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,.85)',
                background: 'transparent',
                color: 'var(--white)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Sign up
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-sans)',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 999,
                border: 'none',
                background: 'var(--white)',
                color: 'var(--dark-emerald)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
