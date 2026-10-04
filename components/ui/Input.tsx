'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ChangeEventHandler, type HTMLInputTypeAttribute } from 'react';

export interface InputProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: HTMLInputTypeAttribute;
  required?: boolean;
  error?: string | null;
  helperText?: string | null;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputMode?: 'email' | 'text' | 'numeric' | 'tel' | 'url' | 'search';
  spellCheck?: boolean;
}

export function Input({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  error = null,
  helperText = null,
  autoComplete,
  autoFocus = false,
  disabled = false,
  inputMode,
  spellCheck,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

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
      <div className={`field__control${isPassword ? ' field__control--password' : ''}`}>
        <input
          id={inputId}
          name={name}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode={inputMode}
          spellCheck={spellCheck}
          aria-invalid={error ? true : undefined}
          aria-describedby={[helperText ? helperId : null, error ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined}
          className={`field__input${error ? ' is-invalid' : ''}`}
        />
        {isPassword ? (
          <button
            type="button"
            className="field__reveal"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            disabled={disabled}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <span id={errorId} className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
