'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useQueryParam } from '@/lib/navigation/useQueryParam';
import {
  registerAdmin,
  registerAdminFromInvite,
  signupErrorMessage,
} from '@/lib/firebase/auth';

export default function AdminSignupPage() {
  const router = useRouter();
  const inviteId = useQueryParam('invite')?.trim() || '';
  const { reloadProfile } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestedRole, setRequestedRole] = useState('Proponent');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password || !password2) {
      setFormError('Fill in every field.');
      return;
    }
    if (!inviteId && (!code.trim() || !requestedRole.trim())) {
      setFormError('Fill in every field.');
      return;
    }
    if (password !== password2) {
      setFormError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      if (inviteId) {
        await registerAdminFromInvite({
          fullName: name,
          email,
          password,
          inviteId,
        });
        await reloadProfile();
        router.push('/admin/dashboard');
      } else {
        await registerAdmin({
          fullName: name,
          email,
          password,
          requestedRole,
          accessCode: code,
        });
        await reloadProfile();
        router.push('/admin/pending');
      }
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
            {inviteId ? 'Accept invite' : 'Create proponent account'}
          </h1>

          {inviteId ? (
            <p style={{ margin: 0, color: 'rgba(255,255,255,.85)', fontSize: 14, lineHeight: 1.5 }}>
              You were invited. Use the same email the invite was issued for. Access is granted
              immediately after signup.
            </p>
          ) : (
            <p style={{ margin: 0, color: 'rgba(255,255,255,.85)', fontSize: 14, lineHeight: 1.5 }}>
              Self-registration creates a pending account. A superadmin must approve you before the
              dashboard opens.
            </p>
          )}

          <Input
            label="Name"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Institutional or team email"
            type="email"
            placeholder="name@ub.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!inviteId ? (
            <>
              <Input
                label="Requested role"
                placeholder="Proponent"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                required
                helperText="Shown to the superadmin during approval. Does not grant access by itself."
              />
              <Input
                label="Access code"
                placeholder="Shared with the proponent team"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                helperText="Required for self-registration. Access stays pending until approved."
              />
            </>
          ) : null}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />

          {formError ? (
            <p role="alert" style={{ margin: 0, color: 'var(--bright-amber)', fontSize: 14 }}>
              {formError}
            </p>
          ) : null}

          <div style={{ marginTop: 8 }}>
            <Button variant="primary" onDark onClick={handleSubmit} disabled={busy}>
              {busy ? 'Creating account…' : inviteId ? 'Create account from invite' : 'Create account'}
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
            <Link
              href="/admin/login"
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
              Already have an account? Log in
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
