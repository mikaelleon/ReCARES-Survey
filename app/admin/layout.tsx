'use client';

import { usePathname } from 'next/navigation';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { useAuth } from '@/lib/auth/AuthProvider';

/** Sidebar workspace pages (AdminAppShell) — never show a top navbar. */
const APP_PREFIXES = [
  '/admin/dashboard',
  '/admin/responses',
  '/admin/interviews',
  '/admin/notes',
  '/admin/reviews',
  '/admin/members',
  '/admin/inquiries',
  '/admin/survey',
];

/** Bare full-viewport auth/gate screens — no top navbar. */
const BARE_AUTH_PREFIXES = [
  '/admin/login',
  '/admin/signup',
  '/admin/pending',
  '/admin/removed',
  '/admin/complete',
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Admin chrome:
 * - Active app pages → AdminAppShell (sidebar only)
 * - Auth/gate pages → AuthPageShell (no top bar; theme toggle in page)
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { firestoreError } = useAuth();
  const app = matchesPrefix(pathname, APP_PREFIXES);
  const bareAuth = matchesPrefix(pathname, BARE_AUTH_PREFIXES);

  return (
    <div className="admin-shell">
      {!app && firestoreError ? (
        <div
          className={bareAuth ? 'auth-page__firestore-notice' : undefined}
          style={
            bareAuth
              ? undefined
              : { maxWidth: 720, margin: '12px auto 0', padding: '0 16px' }
          }
        >
          <FirestoreBlockedNotice message={firestoreError} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
