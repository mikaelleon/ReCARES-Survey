'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthPageShell } from '@/components/admin/AuthPageShell';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ADMIN_ROLE_LABELS, ADMIN_ROLE_OPTIONS } from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';
import {
  completeGoogleAdmin,
  goToAdminLogin,
  goToAdminPath,
  signupErrorMessage,
} from '@/lib/firebase/auth';

const REQUESTED_ROLE_OPTIONS = ADMIN_ROLE_OPTIONS.map((role) => ADMIN_ROLE_LABELS[role]);

/**
 * Access-code gate for a Google account that has no admins profile yet.
 * Creates a pending profile (not immediately active).
 */
export default function AdminCompletePage() {
  const { logout, reloadProfile } = useAuth();
  const { ready, user, allowRender, firestoreError } = useAdminRouteGate('signed-in-no-profile');
  const [requestedRole, setRequestedRole] = useState('Proponent');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!ready || !allowRender || !user) {
    return <PageLoader label="Checking your access…" />;
  }

  const handleLogout = () => {
    void logout().then(() => goToAdminLogin());
  };

  const handleCheckAccess = async () => {
    setChecking(true);
    setFormError(null);
    try {
      await reloadProfile();
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      setFormError(signupErrorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setFormError('Enter the access code.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await completeGoogleAdmin({ requestedRole, accessCode: code });
      await reloadProfile();
      goToAdminPath('/admin/pending');
    } catch (error) {
      setFormError(signupErrorMessage(error));
      setBusy(false);
    }
  };

  return (
    <AuthPageShell sessionEmail={user.email} onLogout={handleLogout}>
      <div className="auth-card auth-card--signup" data-auth="">
        <div className="auth-card__intro">
          <h1 className="auth-card__title">Finish access</h1>
          <p className="auth-card__lead">
            Google confirmed who you are. If a superadmin already created your profile, check access
            again. Otherwise enter the access code to request approval.
          </p>
        </div>

        <p className="auth-card__meta">
          Signed in as <strong>{user.email}</strong>
          <br />
          Auth UID (admins document ID):
          <br />
          <code className="auth-card__code">{user.uid}</code>
        </p>

        <Button
          variant="secondary"
          onDark
          fullWidth
          onClick={handleCheckAccess}
          disabled={checking || busy}
        >
          {checking ? 'Checking…' : 'Check access again'}
        </Button>

        <Select
          label="Requested role"
          options={REQUESTED_ROLE_OPTIONS}
          placeholder="Select a role"
          value={requestedRole}
          disabled={busy}
          onChange={(e) => setRequestedRole(e.target.value)}
          required
          helperText="Shown during approval. Does not grant access by itself."
        />
        <Input
          label="Access code"
          value={code}
          spellCheck={false}
          autoComplete="one-time-code"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          helperText="Case does not matter."
        />

        {formError ? (
          <p role="alert" className="auth-card__alert">
            {formError}
          </p>
        ) : null}

        <div className="auth-card__actions">
          <Button
            variant="primary"
            onDark
            fullWidth
            onClick={handleSubmit}
            disabled={busy || Boolean(firestoreError)}
          >
            {busy ? 'Saving…' : 'Submit for approval'}
          </Button>
        </div>
      </div>

      <p className="auth-page__back">
        <Link href="/">Back to the resident site</Link>
      </p>
    </AuthPageShell>
  );
}
