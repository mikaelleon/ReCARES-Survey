'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { submitInterviewInvitation } from '@/lib/firebase/firestore';
import type { InterviewInvitation } from '@/survey/schema';

const METHODS = ['Phone call', 'Email', 'Facebook message'] as const;
const TYPES: { id: InterviewInvitation['residentType']; label: string }[] = [
  { id: 'homeowner', label: 'Homeowner' },
  { id: 'tenant', label: 'Tenant' },
  { id: 'household_member', label: 'Household member' },
  { id: 'caregiver', label: 'Caregiver' },
];

export default function InterviewPage() {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [contactDetail, setContactDetail] = useState('');
  const [residentType, setResidentType] = useState<InterviewInvitation['residentType'] | ''>('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!contactMethod || !contactDetail.trim() || !residentType || !consent) {
      setError('Please choose one answer to continue, including consent to be contacted.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitInterviewInvitation({
        preferredName: preferredName.trim() || undefined,
        contactMethod,
        contactDetail: contactDetail.trim(),
        residentType,
        consent: true,
      });
      router.push('/survey/thank-you?interview=sent');
    } catch {
      setError('The invitation could not be saved. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="survey-flow"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: 'var(--text-headline)',
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        Interview invitation
      </h1>
      <p className="na-intro">
        Would you be open to a short follow-up interview? Taking part is completely voluntary and
        separate from the survey you just completed. Showing interest does not guarantee that you
        will be selected, because interviewees are chosen purposively. Your contact details are
        stored separately from your survey answers.
      </p>
      <p className="na-required-note">
        A red asterisk (*) means you need to answer that question before you can continue.
      </p>

      <div className="na-stack">
        <label className="na-legend" htmlFor="preferred-name">
          Preferred name
        </label>
        <input
          id="preferred-name"
          className="na-input"
          value={preferredName}
          onChange={(event) => setPreferredName(event.target.value)}
        />
      </div>

      <fieldset className="na-stack">
        <legend className="na-legend">
          Preferred contact method{' '}
          <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
            *
          </span>
        </legend>
        {METHODS.map((method) => (
          <label key={method} className="na-choice">
            <input
              type="radio"
              name="contactMethod"
              checked={contactMethod === method}
              onChange={() => setContactMethod(method)}
            />
            <span>{method}</span>
          </label>
        ))}
      </fieldset>

      <div className="na-stack">
        <label className="na-legend" htmlFor="contact-detail">
          Contact detail{' '}
          <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="contact-detail"
          className="na-input"
          value={contactDetail}
          onChange={(event) => setContactDetail(event.target.value)}
        />
      </div>

      <fieldset className="na-stack">
        <legend className="na-legend">
          Resident type{' '}
          <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
            *
          </span>
        </legend>
        {TYPES.map((type) => (
          <label key={type.id} className="na-choice">
            <input
              type="radio"
              name="residentType"
              checked={residentType === type.id}
              onChange={() => setResidentType(type.id)}
            />
            <span>{type.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="na-choice" style={{ marginTop: 16 }}>
        <input type="checkbox" checked={consent} onChange={() => setConsent((value) => !value)} />
        <span>
          I agree to be contacted for a possible interview.{' '}
          <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
            *
          </span>
        </span>
      </label>

      {error ? (
        <p className="na-error" role="alert">
          {error}
        </p>
      ) : null}

      <div style={{ marginTop: 28 }}>
        <Button variant="primary" disabled={submitting} onClick={submit}>
          Send interview interest
        </Button>
      </div>
    </div>
  );
}
