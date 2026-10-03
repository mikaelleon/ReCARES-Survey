'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { submitInterviewInvitation } from '@/lib/firebase/firestore';
import type { InterviewInvitation } from '@/survey/schema';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const FORMATS: { id: InterviewInvitation['interviewFormat']; label: string }[] = [
  {
    id: 'Online',
    label: 'Online — via Google Meet; a link will be emailed before the interview',
  },
  {
    id: 'Face-to-face',
    label:
      'Face-to-face — at Dear Joe, just outside Camella Homes Tibig, open daily from 8:00 AM to 10:00 PM',
  },
];

const TIMES: { id: InterviewInvitation['preferredTime']; label: string }[] = [
  { id: 'Morning', label: 'Morning — 8:00 AM to 12:00 NN' },
  { id: 'Afternoon', label: 'Afternoon — 12:00 NN to 5:00 PM' },
  { id: 'Evening', label: 'Evening — 5:00 PM to 10:00 PM' },
  { id: 'Other', label: 'Other — enter a specific time' },
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function InterviewInvitationForm({
  variant = 'page',
  onSent,
  onSkip,
  onBack,
}: {
  variant?: 'page' | 'embedded';
  onSent?: () => void;
  onSkip?: () => void;
  onBack?: () => void;
}) {
  const embedded = variant === 'embedded';
  const [email, setEmail] = useState('');
  const [interviewFormat, setInterviewFormat] = useState<
    InterviewInvitation['interviewFormat'] | ''
  >('');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState<InterviewInvitation['preferredTime'] | ''>(
    '',
  );
  const [preferredTimeOther, setPreferredTimeOther] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailOk = isValidEmail(email);
  const formatOk = interviewFormat !== '';
  const daysOk = preferredDays.length > 0;
  const timeOk =
    preferredTime !== '' &&
    (preferredTime !== 'Other' || preferredTimeOther.trim().length > 0);
  const canSubmit = emailOk && formatOk && daysOk && timeOk && !submitting;

  const toggleDay = (day: string) => {
    setPreferredDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const submit = async () => {
    if (!canSubmit || !interviewFormat || !preferredTime) {
      setError('Please complete all required fields before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitInterviewInvitation({
        email: email.trim(),
        interviewFormat,
        preferredDays,
        preferredTime,
        ...(preferredTime === 'Other'
          ? { preferredTimeOther: preferredTimeOther.trim() }
          : {}),
      });
      setSent(true);
      onSent?.();
    } catch {
      setError('The invitation could not be saved. Please try again.');
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="survey-card">
        <p className="na-intro" style={{ margin: 0 }}>
          Your interview interest was saved separately from your survey answers.
          {embedded ? ' You can continue to the next screen when ready.' : ''}
        </p>
        {!embedded && onSkip ? (
          <div className="survey-actions" style={{ marginTop: 16 }}>
            {onBack ? (
              <Button variant="secondary" onClick={onBack}>
                Back
              </Button>
            ) : null}
            <Button variant="primary" onClick={onSkip}>
              Continue
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <p className="na-intro">
        Some respondents may be invited to a short follow-up interview to explore certain topics
        from the survey in more depth. This form is separate from your survey answers — what you
        provide here cannot be linked to them. Taking part is completely voluntary. Providing your
        details here doesn&apos;t guarantee you&apos;ll be selected; participants are chosen based
        on the study&apos;s needs and the overall survey results. If you&apos;re interested,
        we&apos;ll email you ahead of time before scheduling anything.
      </p>
      {embedded ? (
        <p className="na-required-note">
          Optional. Complete the fields below and save your interest, or continue without them.
        </p>
      ) : (
        <p className="na-required-note">
          A red asterisk (*) means you need to answer that question before you can continue. You may
          skip this form and continue.
        </p>
      )}

      <div
        className={
          embedded ? 'interview-invite-fields' : 'survey-questions interview-invite-fields'
        }
      >
        <div className="survey-card">
          <label className="na-q" htmlFor="interview-email">
            Email address{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </label>
          <p className="na-hint">
            Your email is stored separately from your survey answers and is used only to contact
            you about a possible interview.
          </p>
          <input
            id="interview-email"
            className="na-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="survey-card">
          <div className="na-q" id="interview-format-label">
            Preferred interview format{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </div>
          <div className="na-radios" role="radiogroup" aria-labelledby="interview-format-label">
            {FORMATS.map((format) => (
              <label key={format.id} className="na-radio na-radio-wide">
                <input
                  type="radio"
                  name="interview-format"
                  checked={interviewFormat === format.id}
                  onChange={() => setInterviewFormat(format.id)}
                />
                <span className="na-dot" aria-hidden="true" />
                <span className="na-radio-copy">
                  <span>{format.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="survey-card">
          <div className="na-q" id="preferred-days-label">
            Preferred day(s), select all that apply{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </div>
          <div className="na-checks" role="group" aria-labelledby="preferred-days-label">
            {DAYS.map((day) => {
              const checked = preferredDays.includes(day);
              return (
                <label key={day} className="na-check">
                  <input type="checkbox" checked={checked} onChange={() => toggleDay(day)} />
                  <span className="na-box" aria-hidden="true">
                    {checked ? '✓' : ''}
                  </span>
                  <span>{day}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="survey-card">
          <div className="na-q" id="preferred-time-label">
            Preferred time of day{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </div>
          <div className="na-radios" role="radiogroup" aria-labelledby="preferred-time-label">
            {TIMES.map((time) => (
              <label key={time.id} className="na-radio na-radio-wide">
                <input
                  type="radio"
                  name="preferred-time"
                  checked={preferredTime === time.id}
                  onChange={() => setPreferredTime(time.id)}
                />
                <span className="na-dot" aria-hidden="true" />
                <span className="na-radio-copy">
                  <span>{time.label}</span>
                </span>
              </label>
            ))}
          </div>
          {preferredTime === 'Other' ? (
            <div className="interview-invite-fields__other">
              <label className="na-q" htmlFor="preferred-time-other">
                Specific time{' '}
                <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="preferred-time-other"
                className="na-input"
                value={preferredTimeOther}
                onChange={(event) => setPreferredTimeOther(event.target.value)}
                placeholder="for example, around 6:30 PM"
              />
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="na-error" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={embedded ? 'interview-invite-actions' : 'survey-actions'}
      >
        {!embedded && onBack ? (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        {!embedded && onSkip ? (
          <Button variant="secondary" onClick={onSkip}>
            Skip for now
          </Button>
        ) : null}
        <Button variant="primary" disabled={!canSubmit} onClick={submit}>
          Save interview interest
        </Button>
      </div>
    </>
  );
}
