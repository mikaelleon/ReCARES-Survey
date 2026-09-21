'use client';

import type { CSSProperties } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';

export type InterviewWillingness = 'yes' | 'no' | null;
export type InterviewFormat = 'Online' | 'Face-to-face' | null;
export type InterviewTime = 'Morning' | 'Afternoon' | 'Evening' | 'Other' | null;

export type InterviewErrors = Partial<
  Record<'willingness' | 'email' | 'format' | 'days' | 'time' | 'timeOther', string>
>;

export interface InterviewOptInValue {
  willingness: InterviewWillingness;
  email: string;
  format: InterviewFormat;
  days: Record<string, boolean>;
  time: InterviewTime;
  timeOther: string;
}

export interface InterviewOptInCardProps {
  value: InterviewOptInValue;
  errors: InterviewErrors;
  onChange: (next: InterviewOptInValue) => void;
}

export const INTERVIEW_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const ONLINE_NOTE = 'Via Google Meet; a link will be emailed before the interview.';
const VENUE_NOTE =
  'At Dear Joe, just outside Camella Homes Tibig, open daily from 8:00 AM to 10:00 PM.';

const TIME_OPTIONS: ReadonlyArray<{ id: Exclude<InterviewTime, null>; label: string; note: string }> =
  [
    { id: 'Morning', label: 'Morning', note: '8:00 AM to 12:00 NN' },
    { id: 'Afternoon', label: 'Afternoon', note: '12:00 NN to 5:00 PM' },
    { id: 'Evening', label: 'Evening', note: '5:00 PM to 10:00 PM' },
    { id: 'Other', label: 'Other', note: 'Enter a specific time' },
  ];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function chipStyle(selected: boolean, hasError: boolean): CSSProperties {
  return {
    minHeight: 44,
    padding: '0 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: selected ? 700 : 400,
    background: selected ? 'var(--bright-amber)' : 'var(--surface-2)',
    color: selected ? 'var(--black)' : 'var(--text-body)',
    border: selected
      ? '1px solid var(--bright-amber)'
      : hasError
        ? '1px solid var(--error-red)'
        : '1px solid var(--border-default)',
    transform: selected ? 'translateY(-1px)' : 'none',
    transition:
      'background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease)',
    textAlign: 'left' as const,
  };
}

export function validateInterviewOptIn(value: InterviewOptInValue): InterviewErrors {
  const errors: InterviewErrors = {};

  if (!value.willingness) {
    errors.willingness =
      'Please tell us whether you are willing to be contacted for a follow-up interview.';
    return errors;
  }

  if (value.willingness === 'no') return errors;

  if (!value.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_RE.test(value.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!value.format) {
    errors.format = 'Please select a preferred interview format.';
  }

  const selectedDays = INTERVIEW_DAYS.filter((day) => value.days[day]);
  if (selectedDays.length === 0) {
    errors.days = 'Please select at least one preferred day.';
  }

  if (!value.time) {
    errors.time = 'Please select a preferred time of day.';
  } else if (value.time === 'Other' && !value.timeOther.trim()) {
    errors.timeOther = 'Please enter your preferred time.';
  }

  return errors;
}

/**
 * Required interview opt-in on the review step. Contact fields only appear
 * when the respondent chooses Yes; they are never written to the survey doc.
 */
export function InterviewOptInCard({ value, errors, onChange }: InterviewOptInCardProps) {
  const showDetails = value.willingness === 'yes';

  const setWillingness = (willingness: 'yes' | 'no') => {
    if (willingness === 'no') {
      onChange({
        willingness,
        email: '',
        format: null,
        days: {},
        time: null,
        timeOther: '',
      });
      return;
    }
    onChange({ ...value, willingness });
  };

  const setTime = (time: Exclude<InterviewTime, null>) => {
    onChange({
      ...value,
      time,
      timeOther: time === 'Other' ? value.timeOther : '',
    });
  };

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 'clamp(20px, 3vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--text-section-heading)',
        }}
      >
        Optional Follow-Up Interview
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--text-caption)',
          textWrap: 'pretty',
        }}
      >
        Some respondents may be invited to a short follow-up interview to explore certain topics
        from this survey in more depth. Taking part in an interview is completely voluntary and
        separate from this survey. Saying yes here doesn&apos;t guarantee you&apos;ll be selected —
        participants are chosen based on the study&apos;s needs and the overall survey results. If
        you&apos;re interested, we&apos;ll email you ahead of time before scheduling anything.
      </p>

      <div
        role="group"
        aria-labelledby="interview-willingness-label"
        aria-describedby={errors.willingness ? 'interview-willingness-error' : undefined}
        aria-invalid={errors.willingness ? true : undefined}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div
          id="interview-willingness-label"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-body)',
            display: 'flex',
            gap: 4,
          }}
        >
          Would you be willing to be contacted for a possible follow-up interview?
          <span style={{ color: 'var(--status-error)' }} aria-label="required">
            *
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(
            [
              ['yes', "Yes, I'm willing to be contacted"],
              ['no', "No, I don't wish to be contacted"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setWillingness(id)}
              style={chipStyle(value.willingness === id, Boolean(errors.willingness))}
              aria-pressed={value.willingness === id}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.willingness ? (
          <span
            id="interview-willingness-error"
            role="alert"
            style={{ fontSize: 14, color: 'var(--status-error)' }}
          >
            {errors.willingness}
          </span>
        ) : null}
      </div>

      {showDetails ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 4 }}>
          <div>
            <Input
              label="Email address"
              type="email"
              required
              value={value.email}
              error={errors.email ?? null}
              helperText="Your email is stored separately from your survey answers and is used only to contact you about a possible interview."
              onChange={(e) => onChange({ ...value, email: e.target.value })}
            />
          </div>

          <div
            role="group"
            aria-labelledby="interview-format-label"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div
              id="interview-format-label"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-body)',
                display: 'flex',
                gap: 4,
              }}
            >
              Preferred interview format
              <span style={{ color: 'var(--status-error)' }} aria-label="required">
                *
              </span>
            </div>
            {(
              [
                ['Online', 'Online', ONLINE_NOTE],
                ['Face-to-face', 'Face-to-face', VENUE_NOTE],
              ] as const
            ).map(([id, label, note]) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...value, format: id })}
                style={{
                  ...chipStyle(value.format === id, Boolean(errors.format)),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  padding: '10px 16px',
                  height: 'auto',
                  minHeight: 44,
                }}
                aria-pressed={value.format === id}
              >
                <span>{label}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    lineHeight: 1.45,
                    color: value.format === id ? 'var(--black)' : 'var(--text-caption)',
                    opacity: value.format === id ? 0.85 : 1,
                  }}
                >
                  {note}
                </span>
              </button>
            ))}
            {errors.format ? (
              <span role="alert" style={{ fontSize: 14, color: 'var(--status-error)' }}>
                {errors.format}
              </span>
            ) : null}
          </div>

          <div
            role="group"
            aria-labelledby="interview-days-label"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div
              id="interview-days-label"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-body)',
                display: 'flex',
                gap: 4,
              }}
            >
              Preferred day(s), select all that apply
              <span style={{ color: 'var(--status-error)' }} aria-label="required">
                *
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '4px 16px',
              }}
            >
              {INTERVIEW_DAYS.map((day) => (
                <Checkbox
                  key={day}
                  label={day}
                  checked={!!value.days[day]}
                  onChange={() =>
                    onChange({
                      ...value,
                      days: { ...value.days, [day]: !value.days[day] },
                    })
                  }
                />
              ))}
            </div>
            {errors.days ? (
              <span role="alert" style={{ fontSize: 14, color: 'var(--status-error)' }}>
                {errors.days}
              </span>
            ) : null}
          </div>

          <div
            role="group"
            aria-labelledby="interview-time-label"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div
              id="interview-time-label"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-body)',
                display: 'flex',
                gap: 4,
              }}
            >
              Preferred time of day
              <span style={{ color: 'var(--status-error)' }} aria-label="required">
                *
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTime(option.id)}
                  style={{
                    ...chipStyle(value.time === option.id, Boolean(errors.time)),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '10px 16px',
                    height: 'auto',
                    minHeight: 44,
                  }}
                  aria-pressed={value.time === option.id}
                >
                  <span>{option.label}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      lineHeight: 1.45,
                      color: value.time === option.id ? 'var(--black)' : 'var(--text-caption)',
                      opacity: value.time === option.id ? 0.85 : 1,
                    }}
                  >
                    {option.note}
                  </span>
                </button>
              ))}
            </div>
            {errors.time ? (
              <span role="alert" style={{ fontSize: 14, color: 'var(--status-error)' }}>
                {errors.time}
              </span>
            ) : null}

            {value.time === 'Other' ? (
              <Input
                label="Enter your preferred time"
                required
                value={value.timeOther}
                error={errors.timeOther ?? null}
                placeholder="For example, around 6:30 PM"
                onChange={(e) => onChange({ ...value, timeOther: e.target.value })}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
