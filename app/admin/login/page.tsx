'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AuthPageShell } from '@/components/admin/AuthPageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/PageLoader';
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.26-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const { user, ready, reloadProfile } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<'email' | 'google' | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    routeForAccess(user.accessState);
  }, [ready, user]);

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    });
  };

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    const nextEmailError = !trimmed
      ? 'Email is required.'
      : !isValidEmail(trimmed)
        ? 'Enter a valid email address.'
        : null;
    const nextPasswordError = !password ? 'Password is required.' : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      setFormError(null);
      focusFirstInvalid();
      return;
    }
    setBusy(true);
    setMethod('email');
    setFormError(null);
    try {
      await loginWithEmail(trimmed, password);
      await finishLogin();
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setBusy(false);
      setMethod(null);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setMethod('google');
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
      setMethod(null);
    }
  };

  if (!ready || user) {
    return <PageLoader label={user ? 'Opening your workspace…' : 'Checking your session…'} />;
  }

  return (
    <AuthPageShell>
      <form ref={formRef} className="auth-card" data-auth="" onSubmit={handleSubmit} noValidate>
        <div className="auth-card__intro">
          <h1 className="auth-card__title">Log in</h1>
          <p className="auth-card__lead">
            Use your institutional email. Access follows your approved role.
          </p>
        </div>

        <Input
          id="login-email"
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="name@ub.edu.ph"
          value={email}
          autoFocus
          disabled={busy}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          required
          error={emailError}
        />
        <Input
          id="login-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          disabled={busy}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          required
          error={passwordError}
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
            type="submit"
            fullWidth
            loading={busy && method === 'email'}
            disabled={busy}
          >
            {busy && method === 'email' ? 'Signing in…' : 'Log in'}
          </Button>
          <div className="auth-card__split" role="separator">
            <span>or</span>
          </div>
          <Button
            variant="secondary"
            onDark
            type="button"
            fullWidth
            icon={<GoogleMark />}
            onClick={handleGoogle}
            loading={busy && method === 'google'}
            disabled={busy}
          >
            {busy && method === 'google' ? 'Continuing…' : 'Continue with Google'}
          </Button>
        </div>

        <p className="auth-card__footer">
          New to the team?{' '}
          <Link href="/admin/signup/" className="auth-card__link">
            Create an account
          </Link>
        </p>
      </form>

      <p className="auth-page__back">
        <Link href="/">Back to the resident site</Link>
      </p>
    </AuthPageShell>
  );
}
