'use client';

import { useId, type ChangeEventHandler, type CSSProperties } from 'react';

export interface SelectProps {
  label?: string;
  options?: string[];
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string | null;
  id?: string;
}

export function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  required = false,
  error = null,
  helperText = null,
  id,
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

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

  const selectStyle: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-body-size)',
    color: value ? 'var(--text-body)' : 'var(--text-caption)',
    background: 'var(--surface-2)',
    border: error ? '1px solid var(--error-red)' : '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    height: 44,
    padding: '0 14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    appearance: 'none',
  };

  const describedBy = [helperText ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={selectId} style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: 'var(--status-error)' }} aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      {helperText ? (
        <span id={helperId} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
          {helperText}
        </span>
      ) : null}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        style={selectStyle}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} role="alert" style={{ fontSize: 14, color: 'var(--status-error)' }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
