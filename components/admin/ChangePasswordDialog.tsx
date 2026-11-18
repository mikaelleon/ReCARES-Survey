'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { changeOwnPassword, currentUserHasPassword, loginErrorMessage } from '@/lib/firebase/auth';

const MIN_LENGTH = 8;

const WRONG_CURRENT = new Set([
  'auth/wrong-password',
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
]);

/**
 * Lets a signed-in member update their own password. A Google-only account has no current
 * password, so it confirms with Google and gets a password attached instead.
 */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const hasPassword = currentUserHasPassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<'changed' | 'added' | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (hasPassword && !current) nextErrors.current = 'Enter your current password.';
    if (next.length < MIN_LENGTH) nextErrors.next = `Use at least ${MIN_LENGTH} characters.`;
    else if (hasPassword && next === current) nextErrors.next = 'Choose a password you do not already use.';
    if (confirm !== next) nextErrors.confirm = 'The two passwords do not match.';
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      setDone(await changeOwnPassword({ currentPassword: current, newPassword: next }));
    } catch (error) {
      const code = (error as { code?: string } | null)?.code ?? '';
      if (hasPassword && WRONG_CURRENT.has(code)) {
        setErrors({ current: 'That is not your current password.' });
      } else {
        setFormError(loginErrorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Modal open onClose={onClose}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
          {done === 'added' ? 'Password added' : 'Password changed'}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
          {done === 'added'
            ? 'You can now sign in with your email and this password, or with Google.'
            : 'Use the new password the next time you sign in.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={busy ? () => undefined : onClose}>
      <form onSubmit={(event) => void submit(event)} noValidate style={{ display: 'grid', gap: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
            {hasPassword ? 'Change password' : 'Add a password'}
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
            {hasPassword
              ? 'Enter your current password, then choose a new one.'
              : 'You sign in with Google. Add a password to use email and password too. Google will ask you to confirm it is you.'}
          </p>
        </div>

        {hasPassword ? (
          <Input
            id="cp-current"
            name="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={current}
            autoFocus
            disabled={busy}
            required
            error={errors.current ?? null}
            onChange={(e) => setCurrent(e.target.value)}
          />
        ) : null}
        <Input
          id="cp-new"
          name="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          autoFocus={!hasPassword}
          disabled={busy}
          required
          helperText={`At least ${MIN_LENGTH} characters.`}
          error={errors.next ?? null}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          id="cp-confirm"
          name="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          disabled={busy}
          required
          error={errors.confirm ?? null}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {formError ? (
          <p className="na-error" role="alert" style={{ margin: 0 }}>
            {formError}
          </p>
        ) : null}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={busy} disabled={busy}>
            {busy ? 'Saving…' : hasPassword ? 'Change password' : 'Add password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
