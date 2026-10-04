'use client';

import Link from 'next/link';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';
import { goToAdminLogin } from '@/lib/firebase/auth';

export default function AdminPendingPage() {
  const { logout } = useAuth();
  const { ready, user, allowRender, firestoreError } = useAdminRouteGate('pending');

  if (!ready || !allowRender || !user) {
    return <PageLoader label="Checking your access…" />;
  }

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px)',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%' }}>
        <FirestoreBlockedNotice message={firestoreError} />
        <div
          style={{
            background: 'var(--surface-1)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 'clamp(20px, 3vw, 32px)',
          }}
        >
          <h1 style={{ margin: '0 0 12px', fontSize: 24 }}>Awaiting approval</h1>
          <p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 1.55 }}>
            Your account was created and is waiting for a superadmin to approve access. You cannot
            open the dashboard or survey data until then.
          </p>
          {user.requestedRole ? (
            <p style={{ margin: '12px 0 0', color: 'var(--text-caption)', fontSize: 14 }}>
              Requested role on file: {user.requestedRole}
            </p>
          ) : null}
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={() => {
                void logout().then(() => goToAdminLogin());
              }}
            >
              Log out
            </Button>
            <Button variant="primary" href="/">
              Back to the resident site
            </Button>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/" style={{ fontSize: 14, color: 'var(--text-caption)' }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
