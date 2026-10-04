'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { submitInquiry } from '@/lib/firebase/firestore';

const REQUIRED = 'This field is required.';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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
    if (nextEmailError || nextMessageError) return;

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form data-inq className="home-inquiry lift" onSubmit={handleSubmit} noValidate>
      <Input
        id="inquiry-name"
        name="name"
        label="Name (optional)"
        autoComplete="name"
        placeholder="Your name"
        value={name}
        disabled={submitting}
        onChange={(e) => setName(e.target.value)}
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
        }}
        required
        error={messageError}
      />
      <div className="home-inquiry__foot">
        <Button variant="primary" onDark type="submit" loading={submitting} disabled={submitting}>
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
        {sent ? (
          <span className="home-inquiry__sent" role="status">
            Message sent. We will reply to the email you gave.
          </span>
        ) : null}
      </div>
    </form>
  );
}
