'use client';

import type { ChangeEventHandler, CSSProperties } from 'react';

export interface SelectProps {
  label?: string;
  options?: string[];
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  placeholder?: string;
  required?: boolean;
}

export function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  required = false,
}: SelectProps) {
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
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    height: 44,
    padding: '0 14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    appearance: 'none',
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: 'var(--harvest-orange)' }}>*</span>}
        </label>
      )}
      <select value={value} onChange={onChange} style={selectStyle}>
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
