'use client';

import type { ReactNode } from 'react';
import { optionDisabled, toggleMulti } from '@/survey/exclusive';

export const REQUIRED_NOTE =
  'A red asterisk (*) means you need to answer that question before you can continue.';

const AGREEMENT = [
  { id: '1', label: 'Strongly disagree' },
  { id: '2', label: 'Disagree' },
  { id: '3', label: 'Neutral' },
  { id: '4', label: 'Agree' },
  { id: '5', label: 'Strongly agree' },
] as const;

const AGREEMENT_NA = [...AGREEMENT, { id: '99', label: 'Not applicable' }] as const;

const LIKELIHOOD = [
  { id: '1', label: 'Very unlikely' },
  { id: '2', label: 'Unlikely' },
  { id: '3', label: 'Not sure' },
  { id: '4', label: 'Likely' },
  { id: '5', label: 'Very likely' },
] as const;

function Legend({ text, required }: { text: string; required?: boolean }) {
  return (
    <legend className="na-legend">
      {text}
      {required ? (
        <>
          {' '}
          <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
            *
          </span>
          <span className="visually-hidden"> required</span>
        </>
      ) : null}
    </legend>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="na-error" role="alert">
      {message}
    </p>
  );
}

export function SingleChoice({
  code,
  question,
  required = true,
  value,
  options,
  error,
  onChange,
  hint,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  options: readonly { id: string; label: string }[];
  error?: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const errorId = `${code}-error`;
  return (
    <fieldset className="na-stack" aria-describedby={error ? errorId : undefined}>
      <Legend text={question} required={required} />
      {hint ? <p className="na-hint">{hint}</p> : null}
      {options.map((option) => (
        <label key={option.id} className={`na-choice${error ? ' na-choice--error' : ''}`}>
          <input
            type="radio"
            name={code}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span>{option.label}</span>
        </label>
      ))}
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

export function MultiChoice({
  code,
  question,
  required = true,
  value,
  options,
  exclusiveId,
  maxNonExclusive,
  error,
  onChange,
  hint,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string[];
  options: readonly { id: string; label: string }[];
  exclusiveId?: string;
  maxNonExclusive?: number;
  error?: string;
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  const errorId = `${code}-error`;
  return (
    <fieldset className="na-stack" aria-describedby={error ? errorId : undefined}>
      <Legend text={question} required={required} />
      {hint ? <p className="na-hint">{hint}</p> : null}
      {options.map((option) => {
        const disabled = optionDisabled(value, option.id, exclusiveId, maxNonExclusive);
        const checked = (value ?? []).includes(option.id);
        return (
          <label key={option.id} className={`na-choice${error ? ' na-choice--error' : ''}`}>
            <input
              type="checkbox"
              name={code}
              value={option.id}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(toggleMulti(value, option.id, exclusiveId, maxNonExclusive))}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

export function LikertChoice({
  code,
  question,
  scale,
  withNotApplicable = false,
  value,
  error,
  onChange,
}: {
  code: string;
  question: string;
  scale: 'agreement' | 'likelihood';
  withNotApplicable?: boolean;
  value?: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const options =
    scale === 'likelihood' ? LIKELIHOOD : withNotApplicable ? AGREEMENT_NA : AGREEMENT;
  return (
    <SingleChoice
      code={code}
      question={question}
      value={value == null ? undefined : String(value)}
      options={options}
      error={error}
      onChange={(next) => onChange(Number(next))}
    />
  );
}

export function NumberField({
  code,
  question,
  required = false,
  value,
  min,
  max,
  error,
  onChange,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: number;
  min: number;
  max: number;
  error?: string;
  onChange: (value: number | undefined) => void;
}) {
  const errorId = `${code}-error`;
  const inputId = `${code}-input`;
  return (
    <div className="na-stack">
      <label className="na-legend" htmlFor={inputId}>
        {question}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> required</span>
          </>
        ) : null}
      </label>
      <input
        id={inputId}
        className="na-input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isNaN(parsed) ? undefined : parsed);
        }}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function TextField({
  code,
  question,
  required = false,
  value,
  maxLength,
  error,
  onChange,
  hint,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  maxLength: number;
  error?: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const errorId = `${code}-error`;
  const inputId = `${code}-input`;
  return (
    <div className="na-stack">
      <label className="na-legend" htmlFor={inputId}>
        {question}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> required</span>
          </>
        ) : null}
      </label>
      {hint ? <p className="na-hint">{hint}</p> : null}
      <textarea
        id={inputId}
        className="na-area"
        maxLength={maxLength}
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function SelectChoice({
  code,
  question,
  required = true,
  value,
  options,
  error,
  onChange,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  options: readonly { id: string; label: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${code}-error`;
  const inputId = `${code}-input`;
  return (
    <div className="na-stack">
      <label className="na-legend" htmlFor={inputId}>
        {question}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> required</span>
          </>
        ) : null}
      </label>
      <select
        id={inputId}
        className="na-input"
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

const A1_STANDALONE: { id: number; label: string }[] = [
  { id: 1, label: 'Homeowner living in the unit' },
  { id: 4, label: 'Family or household member of a homeowner' },
  { id: 5, label: 'Tenant or lessee' },
  { id: 6, label: 'Family or household member of a tenant or lessee' },
];

export function ResidentTypeField({
  value,
  error,
  onChange,
}: {
  value?: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const errorId = 'A1-error';
  const radio = (id: number, label: string) => (
    <label key={id} className={`na-choice${error ? ' na-choice--error' : ''}`}>
      <input
        type="radio"
        name="A1"
        value={id}
        checked={value === id}
        onChange={() => onChange(id)}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <fieldset className="na-stack" aria-describedby={error ? errorId : undefined}>
      <Legend text="Which best describes you?" required />
      {radio(A1_STANDALONE[0].id, A1_STANDALONE[0].label)}
      <fieldset className="na-sub">
        <legend className="na-legend">Homeowner who does not live in the unit</legend>
        {radio(2, 'OFW homeowner (the owner works abroad)')}
        {radio(3, 'Absentee homeowner (the owner lives elsewhere in the Philippines)')}
      </fieldset>
      {A1_STANDALONE.slice(1).map((option) => radio(option.id, option.label))}
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

export function Block({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>;
}
