'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAdminAccessState } from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  goToAdminPath,
  loginErrorMessage,
  loginWithEmail,
  loginWithGoogle,
  resolveAdminProfile,
} from '@/lib/firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';

function routeForAccess(state: ReturnType<typeof getAdminAccessState>): void {
  if (state === 'active') {
    goToAdminPath('/admin/dashboard');
    return;
  }
  if (state === 'pending') {
    goToAdminPath('/admin/pending');
    return;
  }
  if (state === 'removed') {
    goToAdminPath('/admin/removed');
    return;
  }
  goToAdminPath('/admin/complete');
}

export default function AdminLoginPage() {
  const { user, ready, reloadProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    routeForAccess(user.accessState);
  }, [ready, user]);

  const finishLogin = async () => {
    await reloadProfile();
    const authUser = getFirebaseAuth()?.currentUser;
    if (!authUser) {
      goToAdminPath('/admin/login');
      return;
    }
    const profile = await resolveAdminProfile(authUser.uid, authUser.email ?? '');
    routeForAccess(getAdminAccessState(profile));
  };

  const handleSubmit = async () => {
    const nextEmailError = !email.trim() ? 'Email is required.' : null;
    const nextPasswordError = !password ? 'Password is required.' : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      setFormError(null);
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await loginWithEmail(email, password);
      await finishLogin();
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const result = await loginWithGoogle();
      await reloadProfile();
      routeForAccess(result === 'needs-access-code' || result === 'unauthenticated' ? 'unauthenticated' : result);
    } catch (error) {
      setFormError(
        `${loginErrorMessage(error)} If you use Brave, turn Shields down for this site so Firestore can load.`,
      );
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
      <div style={{ width: '100%', maxWidth: 440, animation: 'riseIn 420ms ease-in-out both' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '.01em' }}>
            <span style={{ color: 'var(--text-headline)' }}>Re</span>
            <span style={{ color: 'var(--emerald-500)' }}>C</span>
            <span style={{ color: 'var(--harvest-orange)' }}>AR</span>
            <span style={{ color: 'var(--bright-amber)' }}>E</span>
            <span style={{ color: 'var(--text-headline)' }}>S</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--text-caption)',
            }}
          >
            Proponent access
          </div>
        </div>

        <div
          data-auth=""
          style={{
            ['--text-body' as string]: 'var(--white)',
            ['--surface-2' as string]: 'rgba(255,255,255,.14)',
            ['--text-caption' as string]: 'rgba(255,255,255,.75)',
            ['--error-red' as string]: 'var(--bright-amber)',
            ['--status-error' as string]: 'var(--bright-amber)',
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
              letterSpacing: '.04em',
            }}
          >
            Proponent login
          </h1>

          <Input
            label="Email"
            type="email"
            placeholder="name@ub.edu.ph"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            required
            error={emailError}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            required
            error={passwordError}
          />

          {formError ? (
            <p role="alert" style={{ margin: 0, color: 'var(--bright-amber)', fontSize: 14 }}>
              {formError}
            </p>
          ) : null}

          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button variant="primary" onDark onClick={handleSubmit} disabled={busy}>
              {busy ? 'Signing in…' : 'Log in'}
            </Button>
            <Button variant="secondary" onDark onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </Button>
          </div>

          <Link
            href="/admin/signup/"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'rgba(255,255,255,.8)',
              textDecoration: 'underline',
            }}
          >
            Create an account
          </Link>
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
