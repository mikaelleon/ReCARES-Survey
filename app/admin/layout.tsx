'use client';

import { usePathname } from 'next/navigation';
import { AdminAuthChrome } from '@/components/admin/AdminAuthChrome';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { useAuth } from '@/lib/auth/AuthProvider';

const APP_PREFIXES = [
  '/admin/dashboard',
  '/admin/responses',
  '/admin/interviews',
  '/admin/members',
  '/admin/inquiries',
  '/admin/survey',
];

function isAppRoute(pathname: string): boolean {
  return APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Admin chrome. Auth gates (login/signup/pending/removed/complete) use a slim top bar.
 * Active app pages (dashboard, responses, interviews, members, inquiries, survey)
 * supply their own sidebar via AdminAppShell — no auth top bar.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { firestoreError } = useAuth();
  const app = isAppRoute(pathname);

  return (
    <div className="admin-shell">
      {app ? null : <AdminAuthChrome />}
      {!app && firestoreError ? (
        <div style={{ maxWidth: 720, margin: '12px auto 0', padding: '0 16px' }}>
          <FirestoreBlockedNotice message={firestoreError} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
