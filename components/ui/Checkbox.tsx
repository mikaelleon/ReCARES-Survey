'use client';

import type { ChangeEventHandler, CSSProperties } from 'react';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function Checkbox({ label, checked = false, onChange }: CheckboxProps) {
  const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    minHeight: 'var(--touch-target-min)',
  };

  const boxStyle: CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 'var(--radius-checkbox)',
    flexShrink: 0,
    background: checked ? 'var(--bright-amber)' : 'var(--surface-1)',
    border: checked ? 'none' : '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background var(--motion-duration) var(--motion-ease)',
  };

  const checkStyle: CSSProperties = {
    color: 'var(--text-on-accent)',
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1,
  };

  const textStyle: CSSProperties = {
    color: 'var(--text-body)',
    fontSize: 'var(--text-body-size)',
  };

  return (
    <label style={labelStyle}>
      <span style={boxStyle}>{checked && <span style={checkStyle}>✓</span>}</span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span style={textStyle}>{label}</span>
    </label>
  );
}
