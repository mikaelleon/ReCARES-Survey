'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';
import { RecaresWordmark } from '@/components/brand/RecaresWordmark';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useQueryParam } from '@/lib/navigation/useQueryParam';
import {
  registerAdmin,
  registerAdminFromInvite,
  signupErrorMessage,
} from '@/lib/firebase/auth';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AdminSignupPage() {
  const router = useRouter();
  const inviteId = useQueryParam('invite')?.trim() || '';
  const { reloadProfile } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestedRole, setRequestedRole] = useState('Proponent');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [password2Error, setPassword2Error] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordHint =
    password.length === 0
      ? 'At least 6 characters. 8 or more is stronger.'
      : password.length < 6
        ? 'Too short — add a few more characters.'
        : password.length < 8
          ? 'Acceptable. Longer passwords are harder to guess.'
          : 'Looks good.';

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextNameError = !name.trim() ? 'Name is required.' : null;
    const trimmedEmail = email.trim();
    const nextEmailError = !trimmedEmail
      ? 'Email is required.'
      : !isValidEmail(trimmedEmail)
        ? 'Enter a valid email address.'
        : null;
    const nextRoleError = !inviteId && !requestedRole.trim() ? 'Requested role is required.' : null;
    const nextCodeError = !inviteId && !code.trim() ? 'Access code is required.' : null;
    const nextPasswordError = !password
      ? 'Password is required.'
      : password.length < 6
        ? 'Password must be at least 6 characters.'
        : null;
    const nextPassword2Error = !password2
      ? 'Confirm your password.'
      : password && password2 !== password
        ? 'Passwords do not match.'
        : null;

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setRoleError(nextRoleError);
    setCodeError(nextCodeError);
    setPasswordError(nextPasswordError);
    setPassword2Error(nextPassword2Error);

    if (
      nextNameError ||
      nextEmailError ||
      nextRoleError ||
      nextCodeError ||
      nextPasswordError ||
      nextPassword2Error
    ) {
      setFormError(null);
      focusFirstInvalid();
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      if (inviteId) {
        await registerAdminFromInvite({
          fullName: name.trim(),
          email: trimmedEmail,
          password,
          inviteId,
        });
        await reloadProfile();
        router.push('/admin/dashboard');
      } else {
        await registerAdmin({
          fullName: name.trim(),
          email: trimmedEmail,
          password,
          requestedRole: requestedRole.trim(),
          accessCode: code.trim(),
        });
        await reloadProfile();
        router.push('/admin/pending');
      }
    } catch (error) {
      setFormError(signupErrorMessage(error));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__inner">
        <div className="auth-page__brand">
          <RecaresWordmark size={28} />
          <p className="auth-page__eyebrow">Proponent access</p>
        </div>

        <form ref={formRef} className="auth-card" data-auth="" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-card__title">
            {inviteId ? 'Accept invite' : 'Create proponent account'}
          </h1>
          <p className="auth-card__lead">
            {inviteId
              ? 'You were invited. Use the same email the invite was issued for. Access is granted immediately after signup.'
              : 'Self-registration creates a pending account. A superadmin must approve you before the dashboard opens.'}
          </p>

          <Input
            id="signup-name"
            name="name"
            label="Name"
            autoComplete="name"
            placeholder="Full name"
            value={name}
            autoFocus
            disabled={busy}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            required
            error={nameError}
          />
          <Input
            id="signup-email"
            name="email"
            label="Institutional or team email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@ub.edu.ph"
            value={email}
            disabled={busy}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            required
            error={emailError}
          />
          {!inviteId ? (
            <>
              <Input
                id="signup-role"
                name="requestedRole"
                label="Requested role"
                autoComplete="organization-title"
                placeholder="Proponent"
                value={requestedRole}
                disabled={busy}
                onChange={(e) => {
                  setRequestedRole(e.target.value);
                  if (roleError) setRoleError(null);
                }}
                required
                error={roleError}
                helperText="Shown to the superadmin during approval. Does not grant access by itself."
              />
              <Input
                id="signup-code"
                name="accessCode"
                label="Access code"
                autoComplete="one-time-code"
                placeholder="Shared with the proponent team"
                value={code}
                disabled={busy}
                spellCheck={false}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError(null);
                }}
                required
                error={codeError}
                helperText="Required for self-registration. Access stays pending until approved."
              />
            </>
          ) : null}
          <Input
            id="signup-password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            disabled={busy}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            required
            error={passwordError}
            helperText={passwordHint}
          />
          <Input
            id="signup-password2"
            name="passwordConfirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password2}
            disabled={busy}
            onChange={(e) => {
              setPassword2(e.target.value);
              if (password2Error) setPassword2Error(null);
            }}
            required
            error={password2Error}
          />

          {formError ? (
            <p role="alert" className="auth-card__alert">
              {formError}
            </p>
          ) : null}

          <div className="auth-card__actions">
            <Button variant="primary" onDark type="submit" fullWidth loading={busy} disabled={busy}>
              {busy
                ? 'Creating account…'
                : inviteId
                  ? 'Create account from invite'
                  : 'Create account'}
            </Button>
          </div>

          <p className="auth-card__footer">
            Already have an account?{' '}
            <Link href="/admin/login" className="auth-card__link">
              Log in
            </Link>
          </p>
        </form>

        <p className="auth-page__back">
          <Link href="/">Back to the resident site</Link>
        </p>
      </div>
    </div>
  );
}
