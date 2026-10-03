'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAdminRouteGate } from '@/lib/auth/useAdminRouteGate';
import { completeGoogleAdmin, signupErrorMessage } from '@/lib/firebase/auth';

/**
 * Access-code gate for a Google account that has no admins profile yet.
 * Creates a pending profile (not immediately active).
 */
export default function AdminCompletePage() {
  const { reloadProfile } = useAuth();
  const { ready, user, allowRender, firestoreError } = useAdminRouteGate('signed-in-no-profile');
  const [requestedRole, setRequestedRole] = useState('Proponent');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready || !allowRender || !user) {
    return <p style={{ padding: 32 }}>Loading…</p>;
  }

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
      window.location.assign('/admin/pending/');
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
        <FirestoreBlockedNotice message={firestoreError} />
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
            Google confirmed who you are. Enter the access code to submit a pending access request.
            A superadmin must approve you before the dashboard opens.
          </p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.75)', fontSize: 13, lineHeight: 1.45 }}>
            Signed in as {user.email}. If your <code style={{ color: 'var(--bright-amber)' }}>admins</code>{' '}
            document already exists, its document ID must match your Auth UID — then refresh after
            allowing Firestore in the browser (Brave Shields off for this site).
          </p>
          <Input
            label="Requested role"
            value={requestedRole}
            onChange={(e) => setRequestedRole(e.target.value)}
            required
            helperText="Shown to the superadmin during approval. Does not grant access by itself."
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
          <Button
            variant="primary"
            onDark
            onClick={handleSubmit}
            disabled={busy || Boolean(firestoreError)}
          >
            {busy ? 'Saving…' : 'Submit for approval'}
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
