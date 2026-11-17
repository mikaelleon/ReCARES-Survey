'use client';

import { ArrowRight } from 'lucide-react';
import { FormEvent, useState, type CSSProperties } from 'react';
import { Notice } from '@/components/ui/Notice';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { submitInquiry } from '@/lib/firebase/firestore';
import { TEAR_MS, useTear } from '@/lib/ui/useTear';

const REQUIRED = 'This field is required.';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Homepage inquiry form, printed as a reply slip. Sending tears the stub off and
 * leaves the torn edge; typing again puts a fresh stub back.
 */
export function InquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { state, tear, restore } = useTear();

  const afterEdit = () => {
    if (sent) {
      setSent(false);
      restore();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const nextEmailError = !trimmedEmail
      ? REQUIRED
      : !isValidEmail(trimmedEmail)
        ? 'Enter a valid email address.'
        : null;
    const nextMessageError = !message.trim() ? REQUIRED : null;
    setEmailError(nextEmailError);
    setMessageError(nextMessageError);
    if (nextEmailError || nextMessageError) {
      document.getElementById(nextEmailError ? 'inquiry-email' : 'inquiry-message')?.focus();
      return;
    }

    setSent(false);
    setSubmitting(true);
    try {
      await submitInquiry({
        name: name.trim() || undefined,
        email: trimmedEmail,
        message: message.trim(),
      });
      setSent(true);
      setMessage('');
      setMessageError(null);
      tear(() => {}, { keepTorn: true });
    } catch {
      setMessageError('The message could not be sent. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form data-inq onSubmit={handleSubmit} noValidate>
      <Notice
        tear={state}
        style={{ '--tear-ms': `${TEAR_MS}ms` } as CSSProperties}
        stub={
          <button type="submit" className="notice__stub" disabled={submitting}>
            <span>{submitting ? 'Sending…' : 'Send message'}</span>
            <ArrowRight size={22} strokeWidth={2.4} aria-hidden="true" />
          </button>
        }
      >
        <h3 className="notice__title" style={{ fontSize: 'clamp(22px, 4.6vw, 26px)' }}>
          Send a message
        </h3>
        <div className="slip-fields">
          <Input
            id="inquiry-name"
            name="name"
            label="Name (optional)"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            disabled={submitting}
            onChange={(e) => {
              setName(e.target.value);
              afterEdit();
            }}
          />
          <Input
            id="inquiry-email"
            name="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            disabled={submitting}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
              afterEdit();
            }}
            required
            error={emailError}
          />
          <Textarea
            id="inquiry-message"
            name="message"
            label="Message"
            placeholder="How can we help?"
            value={message}
            disabled={submitting}
            rows={5}
            onChange={(e) => {
              setMessage(e.target.value);
              if (messageError) setMessageError(null);
              afterEdit();
            }}
            required
            error={messageError}
          />
        </div>
        {sent ? (
          <p className="slip-sent" role="status">
            Message sent. We will reply to the email you gave.
          </p>
        ) : null}
      </Notice>
    </form>
  );
}
