'use client';

import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';

interface SampleRecord {
  id: string;
  ts: string;
  phase: string;
  resident: string;
  pwd: string;
  s4: boolean;
  s5: boolean;
  s7a: boolean;
  s7b: boolean;
  ext: boolean;
}

const SAMPLE: SampleRecord[] = [
  {
    id: 'RC-0141',
    ts: '14 Sep 2026, 09:12',
    phase: 'Phase 1',
    resident: 'Homeowner',
    pwd: 'No',
    s4: true,
    s5: true,
    s7a: false,
    s7b: true,
    ext: true,
  },
  {
    id: 'RC-0142',
    ts: '14 Sep 2026, 11:40',
    phase: 'Phase 3',
    resident: 'Renter or lessee',
    pwd: 'No',
    s4: false,
    s5: false,
    s7a: false,
    s7b: false,
    ext: false,
  },
  {
    id: 'RC-0143',
    ts: '14 Sep 2026, 16:05',
    phase: 'Phase 4',
    resident: 'Homeowner',
    pwd: 'Yes',
    s4: true,
    s5: true,
    s7a: true,
    s7b: false,
    ext: true,
  },
  {
    id: 'RC-0144',
    ts: '15 Sep 2026, 08:22',
    phase: 'Phase 2',
    resident: 'Household member of a homeowner',
    pwd: 'No',
    s4: true,
    s5: false,
    s7a: false,
    s7b: true,
    ext: false,
  },
  {
    id: 'RC-0145',
    ts: '15 Sep 2026, 13:58',
    phase: 'Phase 5',
    resident: 'Live-in household staff',
    pwd: 'No',
    s4: false,
    s5: false,
    s7a: false,
    s7b: false,
    ext: false,
  },
];

function formatSections(r: SampleRecord): string {
  const parts = [
    r.ext ? '3 extended' : null,
    r.s4 ? '4' : null,
    r.s5 ? '5' : null,
    r.s7a ? '7a' : null,
    r.s7b ? '7b' : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'None';
}

/**
 * Proponent dashboard with AuthGuard redirect.
 * TODO: replace client-side redirect with middleware.ts once Firebase Auth is wired.
 */
export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [records] = useState(SAMPLE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.id, r.phase, r.resident, r.pwd].join(' ').toLowerCase().includes(q),
    );
  }, [query, records]);

  // TODO: move this guard to Next.js middleware.ts once Firebase Auth session handling is implemented,
  // so auth state is checked before the page renders.
  if (!user) {
    redirect('/admin/login');
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div>
      <div
        style={{
          background: 'var(--dark-emerald)',
          padding: '12px clamp(16px, 4vw, 32px)',
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--white)', fontSize: 20, fontWeight: 700, letterSpacing: '.04em' }}>
            ReCARES
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,.75)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
            }}
          >
            Response management
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,.7)',
              color: 'var(--white)',
              height: 40,
              padding: '0 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              transition: 'background 220ms ease-in-out',
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'clamp(20px, 3vw, 32px) clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
        }}
      >
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            color: 'var(--text-caption)',
            textWrap: 'pretty',
          }}
        >
          TODO: protect this route with middleware.ts once Firebase Auth session handling is in place.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(16px, 2.4vw, 24px)',
            marginBottom: 'clamp(16px, 2.4vw, 24px)',
          }}
        >
          <div
            className="stat-card"
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(18px, 2.5vw, 24px)',
              animation: 'riseIn 360ms ease-in-out both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-caption)',
              }}
            >
              Responses
            </div>
            <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: 'var(--text-headline)' }}>
              {records.length}
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(18px, 2.5vw, 24px)',
              animation: 'riseIn 360ms ease-in-out 80ms both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-caption)',
              }}
            >
              Section 4 answered
            </div>
            <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: 'var(--text-headline)' }}>
              {records.filter((r) => r.s4).length}
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(18px, 2.5vw, 24px)',
              animation: 'riseIn 360ms ease-in-out 160ms both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-caption)',
              }}
            >
              PWD in household
            </div>
            <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: 'var(--text-headline)' }}>
              {records.filter((r) => r.pwd === 'Yes' || r.s7b).length}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-1)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 'clamp(20px, 3vw, 32px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <div style={{ flex: '1 1 240px', maxWidth: 340 }}>
              <Input
                label="Search responses"
                placeholder="Response ID, phase, resident type"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant="primary">Add response</Button>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(110px,1fr) minmax(140px,1.2fr) minmax(90px,1fr) minmax(150px,1.4fr) minmax(70px,.7fr) minmax(170px,1.6fr) minmax(150px,1.2fr)',
                gap: 0,
                minWidth: 900,
              }}
            >
              {['Response', 'Submitted', 'Phase', 'Resident type', 'PWD', 'Gated sections shown', 'Actions'].map(
                (header) => (
                  <div
                    key={header}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-caption)',
                      padding: '0 12px 12px 0',
                    }}
                  >
                    {header}
                  </div>
                ),
              )}

              {filtered.map((r) => (
                <div key={r.id} style={{ display: 'contents' }}>
                  <div
                    style={{
                      padding: '14px 12px 14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-body)',
                    }}
                  >
                    {r.id}
                  </div>
                  <div
                    style={{
                      padding: '14px 12px 14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 14,
                      color: 'var(--text-caption)',
                    }}
                  >
                    {r.ts}
                  </div>
                  <div
                    style={{
                      padding: '14px 12px 14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 14,
                      color: 'var(--text-body)',
                    }}
                  >
                    {r.phase}
                  </div>
                  <div
                    style={{
                      padding: '14px 12px 14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 14,
                      color: 'var(--text-body)',
                    }}
                  >
                    {r.resident}
                  </div>
                  <div
                    style={{
                      padding: '14px 12px 14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 14,
                      color: 'var(--text-body)',
                    }}
                  >
                    {r.pwd}
                  </div>
                  <div
                    style={{
                      padding: '14px 12px 14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 14,
                      color: 'var(--text-caption)',
                    }}
                  >
                    {formatSections(r)}
                  </div>
                  <div
                    style={{
                      padding: '14px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        background: 'transparent',
                        color: 'var(--text-body)',
                        border: '1px solid var(--border-default)',
                        transition: 'background 220ms ease-in-out',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        background: 'transparent',
                        color: 'var(--status-error)',
                        border: '1px solid var(--status-error)',
                        transition: 'background 220ms ease-in-out',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '32px 0 0', fontSize: 16, color: 'var(--text-caption)' }}>
              No responses match that search.
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--text-caption)',
              textWrap: 'pretty',
            }}
          >
            Fields belonging to a section a respondent never unlocked are stored as not_shown rather
            than blank, so an unanswered question and an unasked question stay distinguishable in
            analysis.
          </div>

          <div style={{ marginTop: 16 }}>
            <Link href="/" style={{ fontSize: 14, color: 'var(--text-caption)' }}>
              Back to the resident site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
