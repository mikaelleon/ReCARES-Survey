'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';
import { completeGoogleAdmin, signupErrorMessage } from '@/lib/firebase/auth';

/**
 * Access-code gate for a Google account that has no admins profile yet.
 */
export default function AdminCompletePage() {
  const { user, ready, reloadProfile } = useAuth();
  const [role, setRole] = useState('Proponent');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <p style={{ padding: 32 }}>Loading…</p>;
  }
  if (!user) {
    redirect('/admin/login');
  }
  if (user.authorized) {
    redirect('/admin/dashboard');
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      setFormError('Enter the access code.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await completeGoogleAdmin({ role, accessCode: code });
      await reloadProfile();
      window.location.assign('/admin/dashboard');
    } catch (error) {
      setFormError(signupErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div
          data-auth=""
          style={{
            ['--text-body' as string]: 'var(--white)',
            ['--surface-2' as string]: 'rgba(255,255,255,.14)',
            ['--text-caption' as string]: 'rgba(255,255,255,.75)',
            background: 'var(--card-fill-brand)',
            borderRadius: 16,
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: 'var(--white)',
              textTransform: 'uppercase',
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 700,
            }}
          >
            Finish proponent access
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.85)', fontSize: 14, lineHeight: 1.5 }}>
            Google confirmed who you are. An access code is still required before this account can
            open survey responses.
          </p>
          <Input
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            helperText="Defaults to Proponent. Edit it if this account needs a different label."
          />
          <Input
            label="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {formError ? (
            <p role="alert" style={{ margin: 0, color: 'var(--bright-amber)', fontSize: 14 }}>
              {formError}
            </p>
          ) : null}
          <Button variant="primary" onDark onClick={handleSubmit} disabled={busy}>
            {busy ? 'Saving…' : 'Continue'}
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 14, color: 'var(--text-caption)' }}>
            Back to the resident site
          </Link>
        </div>
      </div>
    </div>
  );
}
