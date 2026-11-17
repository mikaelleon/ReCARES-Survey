'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Menu, RotateCcw, X } from 'lucide-react';
import { RecaresLogo } from '@/components/brand/RecaresLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useSurveyWindow } from '@/lib/admin/useSurveyWindow';
import { useTheme } from '@/lib/theme/ThemeProvider';
import {
  stageGo,
  stageStep,
  STAGE_SECTION,
  STAGE_STATE,
  type StageSection,
  type StageState,
} from '@/lib/ui/stage';

type SectionKey = 'home' | 'about' | 'faq' | 'contact';

const STAGE_OF: Record<SectionKey, StageSection> = {
  home: 'survey',
  about: 'about',
  faq: 'faq',
  contact: 'contact',
};

const links: { href: string; label: string; section: SectionKey }[] = [
  { href: '/', label: 'Home', section: 'home' },
  { href: '/#about', label: 'About', section: 'about' },
  { href: '/#faq', label: 'FAQ', section: 'faq' },
  { href: '/#contact', label: 'Contact', section: 'contact' },
];

/**
 * On a phone the stage's Back and Next live here, so the whole screen below the nav
 * stays for the notices. The label says where you are.
 */
function StageSteps() {
  const [state, setState] = useState<StageState | undefined>(undefined);
  useEffect(() => {
    setState(window.__stageState);
    const onState = (e: Event) => setState((e as CustomEvent<StageState>).detail);
    window.addEventListener(STAGE_STATE, onState);
    return () => window.removeEventListener(STAGE_STATE, onState);
  }, []);

  const atStart = !state || state.index === 0;
  const atEnd = !!state && state.index >= state.count - 1;
  const box = {
    width: 44,
    height: 44,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,.55)',
    background: 'transparent',
    color: 'var(--white)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  } as const;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        aria-label="Back"
        disabled={atStart}
        onClick={() => stageStep(-1)}
        style={{ ...box, opacity: atStart ? 0.4 : 1, cursor: atStart ? 'default' : 'pointer' }}
      >
        <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span
        style={{
          minWidth: 64,
          maxWidth: 96,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--bright-amber)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {state?.label ?? 'Survey'}
      </span>
      <button
        type="button"
        aria-label={atEnd ? 'Back to start' : 'Next'}
        onClick={() => stageStep(1)}
        style={box}
      >
        {atEnd ? (
          <RotateCcw size={20} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <ChevronRight size={22} strokeWidth={2.4} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/**
 * Sticky resident navbar with mobile drawer below 768px.
 */
export function Navbar() {
  const pathname = usePathname();
  const { toggleTheme, themeLabel } = useTheme();
  const { acceptsResponses, config } = useSurveyWindow();
  const surveyCta =
    acceptsResponses ? 'Start the survey' : config.status === 'paused' ? 'Survey paused' : 'Survey closed';
  const [active, setActive] = useState<SectionKey>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  /* The landing page never scrolls: it is one locked screen (FenceStage) that reports
     which section it is showing. Other pages do not highlight anything. */
  useEffect(() => {
    if (pathname !== '/') {
      setActive('home');
      return;
    }
    const fromStage = (section: StageSection | undefined) =>
      setActive(section === 'about' || section === 'faq' || section === 'contact' ? section : 'home');
    fromStage(window.__stageSection);
    const onSection = (e: Event) => fromStage((e as CustomEvent<StageSection>).detail);
    window.addEventListener(STAGE_SECTION, onSection);
    return () => window.removeEventListener(STAGE_SECTION, onSection);
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

  const onNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string, section: SectionKey) => {
    setMenuOpen(false);
    if (pathname !== '/') return;
    if (href === '/' || href.startsWith('/#')) {
      e.preventDefault();
      stageGo(STAGE_OF[section]);
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
            onClick={(e) => onNavClick(e, l.href, l.section)}
            style={linkStyle(isActive)}
          >
            {l.label}
          </Link>
        );
      })}
      <Link
        href="/survey"
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
        {surveyCta}
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
        }}
      >
        <Link
          href="/"
          aria-label="ReCARES Survey home"
          onClick={(e) => onNavClick(e, '/', 'home')}
          className="recares-logo-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            textDecoration: 'none',
            lineHeight: 0,
          }}
        >
          <RecaresLogo surface="dark" size={40} priority />
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

          {isMobile && pathname === '/' && <StageSteps />}

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
                  onClick={(e) => onNavClick(e, l.href, l.section)}
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
              href="/survey"
              onClick={() => setMenuOpen(false)}
              style={{
                marginTop: 16,
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
              {surveyCta}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
