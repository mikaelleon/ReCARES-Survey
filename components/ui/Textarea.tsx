'use client';

import { useId, type ChangeEventHandler } from 'react';

export interface TextareaProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  required?: boolean;
  error?: string | null;
  helperText?: string | null;
  rows?: number;
  disabled?: boolean;
  autoComplete?: string;
}

export function Textarea({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error = null,
  helperText = null,
  rows = 4,
  disabled = false,
  autoComplete,
}: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  return (
    <div className="field">
      {label ? (
        <label htmlFor={inputId} className="field__label">
          {label}
          {required ? (
            <span className="field__req" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {helperText ? (
        <span id={helperId} className="field__help">
          {helperText}
        </span>
      ) : null}
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={[helperText ? helperId : null, error ? errorId : null]
          .filter(Boolean)
          .join(' ') || undefined}
        className={`field__input field__textarea${error ? ' is-invalid' : ''}`}
      />
      {error ? (
        <span id={errorId} className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
