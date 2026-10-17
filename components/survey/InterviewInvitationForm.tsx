'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/components/survey/SurveyLanguage';
import { submitInterviewInvitation } from '@/lib/firebase/firestore';
import {
  HOURS_12,
  MINUTES_5,
  isValidFutureDate,
  isWithinInterviewHours,
  partOfDay,
  to24Hour,
  tomorrowIso,
  weekdayOf,
} from '@/survey/interviewSchedule';
import type { InterviewInvitation } from '@/survey/schema';

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
  const t = useT();
  const embedded = variant === 'embedded';
  const [email, setEmail] = useState('');
  const [interviewFormat, setInterviewFormat] = useState<
    InterviewInvitation['interviewFormat'] | ''
  >('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM' | ''>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailOk = isValidEmail(email);
  const formatOk = interviewFormat !== '';
  const minDate = tomorrowIso();
  const dateOk = isValidFutureDate(date);
  const clock = to24Hour(hour, minute, meridiem);
  const timeOk = clock != null && isWithinInterviewHours(clock);
  const canSubmit = emailOk && formatOk && dateOk && timeOk && !submitting;

  const submit = async () => {
    if (!canSubmit || !interviewFormat || !clock) {
      setError(
        !dateOk && date
          ? 'Please pick a date from tomorrow onward.'
          : clock && !timeOk
            ? 'Please pick a time between 8:00 AM and 10:00 PM.'
            : 'Please complete all required fields before submitting.',
      );
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitInterviewInvitation({
        email: email.trim(),
        interviewFormat,
        preferredDate: date,
        preferredClock: clock,
        // Kept in the older shape so existing reports still group these invites.
        preferredDays: [weekdayOf(date) ?? ''],
        preferredTime: partOfDay(clock),
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
          {t('Your interview interest was saved separately from your survey answers.')}
          {embedded ? ` ${t('You can continue to the next screen when ready.')}` : ''}
        </p>
        {!embedded && onSkip ? (
          <div className="survey-actions" style={{ marginTop: 16 }}>
            {onBack ? (
              <Button variant="secondary" onClick={onBack}>
                {t('Back')}
              </Button>
            ) : null}
            <Button variant="primary" onClick={onSkip}>
              {t('Continue')}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <p className="na-intro">{t("Some respondents may be invited to a short follow-up interview to explore certain topics from the survey in more depth. This form is separate from your survey answers — what you provide here cannot be linked to them. Taking part is completely voluntary. Providing your details here doesn't guarantee you'll be selected; participants are chosen based on the study's needs and the overall survey results. If you're interested, we'll email you ahead of time before scheduling anything.")}</p>
      {embedded ? (
        <p className="na-required-note">{t("Optional. Complete the fields below and save your interest, or continue without them.")}</p>
      ) : (
        <p className="na-required-note">{t("A red asterisk (*) means you need to answer that question before you can continue. You may skip this form and continue.")}</p>
      )}

      <div
        className={
          embedded ? 'interview-invite-fields' : 'survey-questions interview-invite-fields'
        }
      >
        <div className="survey-card">
          <label className="na-q" htmlFor="interview-email">
            {t('Email address')}{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </label>
          <p className="na-hint">{t("Your email is stored separately from your survey answers and is used only to contact you about a possible interview.")}</p>
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
            {t('Preferred interview format')}{' '}
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
                  <span>{t(format.label)}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="survey-card">
          <label className="na-q" htmlFor="preferred-date">
            {t('Preferred interview date')}{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </label>
          <p className="na-hint">{t('Pick the exact date you can be interviewed. We will email you to confirm before anything is scheduled.')}</p>
          <input
            id="preferred-date"
            className="na-input na-date"
            type="date"
            min={minDate}
            value={date}
            aria-invalid={date && !dateOk ? true : undefined}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="survey-card">
          <div className="na-q" id="preferred-time-label">
            {t('Preferred interview time')}{' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </div>
          <p className="na-hint">{t('Pick an exact start time between 8:00 AM and 10:00 PM.')}</p>
          <div className="na-time" role="group" aria-labelledby="preferred-time-label">
            <select
              className="na-input"
              aria-label={t('Hour')}
              value={hour}
              onChange={(event) => setHour(event.target.value)}
            >
              <option value="" disabled>
                {t('Hour')}
              </option>
              {HOURS_12.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span className="na-time__sep" aria-hidden="true">
              :
            </span>
            <select
              className="na-input"
              aria-label={t('Minute')}
              value={minute}
              onChange={(event) => setMinute(event.target.value)}
            >
              <option value="" disabled>
                {t('Minute')}
              </option>
              {MINUTES_5.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <div className="na-meridiem" role="group" aria-label="AM / PM">
              {(['AM', 'PM'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={meridiem === value}
                  onClick={() => setMeridiem(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          {clock && !timeOk ? (
            <p className="na-error" role="alert">
              {t('Please pick a time between 8:00 AM and 10:00 PM.')}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="na-error" role="alert">
          {t(error)}
        </p>
      ) : null}

      <div
        className={embedded ? 'interview-invite-actions' : 'survey-actions'}
      >
        {!embedded && onBack ? (
          <Button variant="secondary" onClick={onBack}>
            {t('Back')}
          </Button>
        ) : null}
        {!embedded && onSkip ? (
          <Button variant="secondary" onClick={onSkip}>
            {t('Skip for now')}
          </Button>
        ) : null}
        <Button variant="primary" disabled={!canSubmit} onClick={submit}>
          {t('Save interview interest')}
        </Button>
      </div>
    </>
  );
}
