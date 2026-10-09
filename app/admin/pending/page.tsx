'use client';

import Link from 'next/link';
import { AuthPageShell } from '@/components/admin/AuthPageShell';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';
import { goToAdminLogin } from '@/lib/firebase/auth';

export default function AdminPendingPage() {
  const { logout } = useAuth();
  const { ready, user, allowRender } = useAdminRouteGate('pending');

  if (!ready || !allowRender || !user) {
    return <PageLoader label="Checking your access…" />;
  }

  const handleLogout = () => {
    void logout().then(() => goToAdminLogin());
  };

  return (
    <AuthPageShell sessionEmail={user.email} onLogout={handleLogout}>
      <div className="auth-card auth-card--status" data-auth="">
        <div className="auth-card__intro">
          <h1 className="auth-card__title">Awaiting approval</h1>
          <p className="auth-card__lead">
            Your account is waiting for a superadmin to approve access. The dashboard and survey
            data stay closed until then.
          </p>
        </div>
        {user.requestedRole ? (
          <p className="auth-card__meta">Requested role: {user.requestedRole}</p>
        ) : null}
        <div className="auth-card__actions">
          <Button variant="secondary" onDark fullWidth onClick={handleLogout}>
            Log out
          </Button>
          <Button variant="primary" onDark fullWidth href="/">
            Back to the resident site
          </Button>
        </div>
      </div>
      <p className="auth-page__back">
        <Link href="/">Home</Link>
      </p>
    </AuthPageShell>
  );
}
