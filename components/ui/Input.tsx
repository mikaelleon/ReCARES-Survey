'use client';

import type { ChangeEventHandler, CSSProperties } from 'react';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string | null;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  error = null,
  helperText = null,
}: InputProps) {
  const wrapperStyle: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  };

  const labelStyle: CSSProperties = {
    fontSize: 'var(--text-label-size)',
    fontWeight: 'var(--text-label-weight)',
    color: 'var(--text-body)',
    display: 'flex',
    gap: 4,
  };

  const inputStyle: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-body-size)',
    color: 'var(--text-body)',
    background: 'var(--surface-2)',
    border: error ? '1px solid var(--error-red)' : '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    height: 44,
    padding: '0 14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const helperStyle: CSSProperties = {
    fontSize: 'var(--text-caption-size)',
    lineHeight: 1.5,
    color: 'var(--text-caption)',
  };

  const errorStyle: CSSProperties = {
    fontSize: 'var(--text-caption-size)',
    color: 'var(--status-error)',
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: 'var(--status-error)' }} aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      {helperText ? <span style={helperStyle}>{helperText}</span> : null}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
      {error ? <span style={errorStyle}>{error}</span> : null}
    </div>
  );
}
