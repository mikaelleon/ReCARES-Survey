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

const LIKELIHOOD = [
  { id: '1', label: 'Very unlikely' },
  { id: '2', label: 'Unlikely' },
  { id: '3', label: 'Not sure' },
  { id: '4', label: 'Likely' },
  { id: '5', label: 'Very likely' },
] as const;

function Question({
  id,
  text,
  required,
}: {
  id: string;
  text: string;
  required?: boolean;
}) {
  return (
    <div className="na-q" id={id}>
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
    </div>
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

function Card({
  error,
  className,
  children,
}: {
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${error ? 'survey-card survey-card--error' : 'survey-card'}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

type ChoiceOption = { id: string; label: string; hint?: string; wide?: boolean };

function RadioMark({
  name,
  option,
  checked,
  onChange,
}: {
  name: string;
  option: ChoiceOption;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={option.wide ? 'na-radio na-radio-wide' : 'na-radio'}>
      <input type="radio" name={name} value={option.id} checked={checked} onChange={onChange} />
      <span className="na-dot" aria-hidden="true" />
      <span className="na-radio-copy">
        <span>{option.label}</span>
        {option.hint ? <span className="na-radio-hint">{option.hint}</span> : null}
      </span>
    </label>
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
  columns = 1,
  className,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  options: readonly ChoiceOption[];
  error?: string;
  onChange: (value: string) => void;
  hint?: string;
  columns?: 1 | 2;
  className?: string;
}) {
  const errorId = `${code}-error`;
  const labelId = `${code}-label`;
  return (
    <Card error={error} className={className}>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined}>
        <Question id={labelId} text={question} required={required} />
        {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{hint}</p> : null}
        <div className={columns === 2 ? 'na-radios na-radios--2' : 'na-radios'}>
          {options.map((option) => (
            <RadioMark
              key={option.id}
              name={code}
              option={option}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
          ))}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
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
  const labelId = `${code}-label`;
  return (
    <Card error={error}>
      <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined}>
        <Question id={labelId} text={question} required={required} />
        {hint ? <p className="na-hint">{hint}</p> : null}
        <div className="na-checks">
          {options.map((option) => {
            const disabled = optionDisabled(value, option.id, exclusiveId, maxNonExclusive);
            const checked = (value ?? []).includes(option.id);
            return (
              <label key={option.id} className="na-check">
                <input
                  type="checkbox"
                  name={code}
                  value={option.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(toggleMulti(value, option.id, exclusiveId, maxNonExclusive))}
                />
                <span className="na-box" aria-hidden="true">
                  {checked ? '✓' : ''}
                </span>
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
  );
}

export function LikertChoice({
  code,
  question,
  scale,
  value,
  error,
  onChange,
}: {
  code: string;
  question: string;
  scale: 'agreement' | 'likelihood';
  value?: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const options = scale === 'likelihood' ? LIKELIHOOD : AGREEMENT;
  const errorId = `${code}-error`;
  const labelId = `${code}-label`;
  return (
    <Card error={error}>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined}>
        <Question id={labelId} text={question} required />
        <div className="na-likert">
          {options.map((option) => {
            const selected = String(value) === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className="na-likert-btn"
                aria-pressed={selected}
                aria-label={option.label}
                onClick={() => onChange(Number(option.id))}
              >
                {option.id}
              </button>
            );
          })}
        </div>
        <div className="na-likert-ends">
          <span>{options[0].label}</span>
          <span>{options.find((option) => option.id === '5')?.label}</span>
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
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
    <Card error={error}>
      <label className="na-q" htmlFor={inputId}>
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
        className={error ? 'na-input na-input--error' : 'na-input'}
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
    </Card>
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
    <Card error={error}>
      <label className="na-q" htmlFor={inputId}>
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
      {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{hint}</p> : null}
      <textarea
        id={inputId}
        className={error ? 'na-area na-area--error' : 'na-area'}
        maxLength={maxLength}
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id={errorId} message={error} />
    </Card>
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
    <Card error={error}>
      <label className="na-q" htmlFor={inputId}>
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
        className={error ? 'na-input na-input--error' : 'na-input'}
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
    </Card>
  );
}

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

  return (
    <Card error={error} className="bento-tall">
      <div role="radiogroup" aria-labelledby="A1-label" aria-describedby={error ? errorId : undefined}>
        <Question id="A1-label" text="Which best describes you?" required />
        <div className="na-radios">
          <RadioMark
            name="A1"
            option={{ id: '1', label: 'Homeowner living in the unit' }}
            checked={value === 1}
            onChange={() => onChange(1)}
          />
          <fieldset className="na-sub">
            <legend className="na-sub-legend">Homeowner who does not live in the unit</legend>
            <RadioMark
              name="A1"
              option={{ id: '2', label: 'OFW homeowner', hint: '(the owner works abroad)' }}
              checked={value === 2}
              onChange={() => onChange(2)}
            />
            <RadioMark
              name="A1"
              option={{
                id: '3',
                label: 'Absentee homeowner',
                hint: '(the owner lives elsewhere in the Philippines)',
              }}
              checked={value === 3}
              onChange={() => onChange(3)}
            />
          </fieldset>
          <RadioMark
            name="A1"
            option={{ id: '4', label: 'Family or household member of a homeowner' }}
            checked={value === 4}
            onChange={() => onChange(4)}
          />
          <RadioMark
            name="A1"
            option={{ id: '5', label: 'Tenant or lessee' }}
            checked={value === 5}
            onChange={() => onChange(5)}
          />
          <RadioMark
            name="A1"
            option={{ id: '6', label: 'Family or household member of a tenant or lessee' }}
            checked={value === 6}
            onChange={() => onChange(6)}
          />
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
  );
}
