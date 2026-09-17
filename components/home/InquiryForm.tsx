'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitInquiry } from '@/lib/firebase/firestore';

const REQUIRED = 'This field is required';

/**
 * Homepage inquiry form with brand-fill styling and Firestore submit stub.
 */
export function InquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextEmailError = !email.trim() ? REQUIRED : null;
    const nextMessageError = !message.trim() ? REQUIRED : null;
    setEmailError(nextEmailError);
    setMessageError(nextMessageError);
    if (nextEmailError || nextMessageError) return;

    setSubmitting(true);
    try {
      await submitInquiry({
        name: name.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
      });
      setSent(true);
      setMessage('');
      setMessageError(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-inq
      style={{
        flex: '1.4 1 380px',
        minWidth: 0,
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
        transition: 'transform 220ms ease-in-out',
        width: '100%',
      }}
      className="lift"
    >
      <Input
        label="Name (optional)"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError(null);
        }}
        error={emailError}
      />
      <Input
        label="Message"
        placeholder="How can we help?"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (messageError) setMessageError(null);
        }}
        error={messageError}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 4,
        }}
      >
        <Button variant="primary" onDark disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
        {sent && (
          <span
            style={{
              color: 'var(--white)',
              fontSize: 14,
              animation: 'fadeIn 260ms ease-in-out both',
            }}
          >
            Message sent. We will reply to the email you gave.
          </span>
        )}
      </div>
    </div>
  );
}
