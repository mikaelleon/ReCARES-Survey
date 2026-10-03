'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAdminAccessState, pathForAccessState } from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  getAdminProfile,
  loginErrorMessage,
  loginWithEmail,
  loginWithGoogle,
} from '@/lib/firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';

export default function AdminLoginPage() {
  const router = useRouter();
  const { reloadProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const routeAfterLogin = async () => {
    await reloadProfile();
    const uid = getFirebaseAuth()?.currentUser?.uid;
    if (!uid) {
      router.push('/admin/login');
      return;
    }
    const profile = await getAdminProfile(uid);
    const state = getAdminAccessState(profile);
    if (state === 'unauthenticated') {
      router.push('/admin/complete');
      return;
    }
    router.push(pathForAccessState(state));
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await loginWithEmail(email, password);
      await routeAfterLogin();
    } catch (error) {
      setFormError(loginErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const result = await loginWithGoogle();
      await reloadProfile();
      if (result === 'needs-access-code') {
        router.push('/admin/complete');
      } else if (result === 'pending') {
        router.push('/admin/pending');
      } else if (result === 'removed') {
        router.push('/admin/removed');
      } else if (result === 'active') {
        router.push('/admin/dashboard');
      } else {
        router.push('/admin/complete');
      }
    } catch (error) {
      setFormError(loginErrorMessage(error));
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
            Proponent log in
          </h1>

          <Input
            label="Email"
            type="email"
            placeholder="name@ub.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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

          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'rgba(255,255,255,.8)',
                textDecoration: 'underline',
                transition: 'color 220ms ease-in-out',
              }}
            >
              Forgot password
            </button>
            <Link
              href="/admin/signup"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'rgba(255,255,255,.8)',
                textDecoration: 'underline',
                transition: 'color 220ms ease-in-out',
              }}
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link
            href="/"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--text-caption)',
              textDecoration: 'underline',
            }}
          >
            Back to the resident site
          </Link>
        </div>
      </div>
    </div>
  );
}
