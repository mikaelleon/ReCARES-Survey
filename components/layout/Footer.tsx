'use client';

import Link from 'next/link';
import { RecaresLogo } from '@/components/brand/RecaresLogo';

/**
 * Resident footer with a single proponent/admin access link (not in the nav).
 * Language selection lives only on the survey consent gate — not in the footer.
 */
export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--dark-emerald)',
        marginTop: 'clamp(48px, 8vw, 96px)',
        padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4vw, 32px) 0',
      }}
    >
      {/* TODO: footer content — expand with final adviser contact details before go-live */}
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(24px, 3.5vw, 44px)',
        }}
      >
        <div style={{ flex: '1 1 230px', minWidth: 0 }}>
          <RecaresLogo surface="dark" size={56} />
          <p
            style={{
              margin: '18px 0 0',
              color: 'rgba(255,255,255,.94)',
              fontSize: 16,
              lineHeight: 1.65,
              textWrap: 'pretty',
            }}
          >
            Resident Centered Assistance for Reporting and Emergency System. A capstone research
            project by fourth-year Information Technology students of the University of Batangas,
            Lipa Campus.
          </p>
        </div>

        <div style={{ flex: '1 1 230px', minWidth: 0 }}>
          <div
            style={{
              color: 'var(--bright-amber)',
              fontFamily: 'var(--font-title)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
            }}
          >
            Collaboration
          </div>
          <p
            style={{
              margin: '18px 0 0',
              color: 'rgba(255,255,255,.94)',
              fontSize: 16,
              lineHeight: 1.65,
              textWrap: 'pretty',
            }}
          >
            We are currently exploring a possible collaboration with the Camella Homes Tibig
            Homeowners Association. Nothing here represents an established partnership.
          </p>
        </div>

        <div style={{ flex: '1 1 230px', minWidth: 0 }}>
          <div
            style={{
              color: 'var(--bright-amber)',
              fontFamily: 'var(--font-title)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
            }}
          >
            Contact
          </div>
          <p
            style={{
              margin: '18px 0 0',
              color: 'rgba(255,255,255,.94)',
              fontSize: 16,
              lineHeight: 1.65,
              textWrap: 'pretty',
            }}
          >
            Questions about the survey or the study behind it? Use the{' '}
            <a
              href="/#contact"
              className="footer-link"
              onClick={(e) => {
                if (typeof window === 'undefined') return;
                if (window.location.pathname !== '/') return;
                e.preventDefault();
                const el = document.getElementById('contact');
                if (!el) return;
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
              }}
              style={{
                color: 'var(--white)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                transition: 'color 220ms ease-in-out',
              }}
            >
              inquiry form
            </a>{' '}
            on this page and we will get back to you.
          </p>
          <Link
            href="/admin/login"
            className="footer-link"
            style={{
              display: 'inline-block',
              marginTop: 20,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.8)',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
              transition: 'color 220ms ease-in-out',
            }}
          >
            Proponent access
          </Link>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1120,
          margin: 'clamp(28px, 4vw, 44px) auto 0',
          borderTop: '1px solid rgba(255,255,255,.22)',
          padding: '20px 0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,.75)',
            fontSize: 14,
            lineHeight: 1.5,
            textWrap: 'pretty',
            textAlign: 'center',
          }}
        >
          Supervised by our academic adviser · the survey asks for no name and no account.
        </div>
      </div>
    </footer>
  );
}
