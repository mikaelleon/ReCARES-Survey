'use client';

import Link from 'next/link';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { useState } from 'react';

/**
 * Resident footer with a single proponent/admin access link (not in the nav).
 */
export function Footer() {
  const [lang, setLang] = useState<'EN' | 'FIL'>('EN');

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
          <div
            style={{
              color: 'var(--white)',
              fontFamily: 'var(--font-title)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
            }}
          >
            ReCARES
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
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <LanguageToggle
          value={lang}
          onChange={(v) => setLang(v)}
        />
        <div
          style={{
            color: 'rgba(255,255,255,.75)',
            fontSize: 14,
            lineHeight: 1.5,
            textWrap: 'pretty',
          }}
        >
          Supervised by our academic adviser · the survey asks for no name and no account.
        </div>
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
          Filipino translations are pending. Strings are shown in English for now; every string has
          a Filipino counterpart in the final build.
        </div>
      )}
    </footer>
  );
}
