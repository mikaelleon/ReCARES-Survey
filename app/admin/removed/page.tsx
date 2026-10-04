'use client';

import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';
import { goToAdminLogin } from '@/lib/firebase/auth';

export default function AdminRemovedPage() {
  const { logout } = useAuth();
  const { ready, user, allowRender, firestoreError } = useAdminRouteGate('removed');

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
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: 'var(--surface-1)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 'clamp(20px, 3vw, 32px)',
        }}
      >
        <FirestoreBlockedNotice message={firestoreError} />
        <h1 style={{ margin: '0 0 12px', fontSize: 24 }}>Access removed</h1>
        <p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 1.55 }}>
          Your proponent access has been removed. You can still sign in, but you cannot open the
          dashboard or survey data. Contact a superadmin if this was a mistake.
        </p>
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
    </div>
  );
}
