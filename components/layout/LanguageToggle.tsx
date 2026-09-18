'use client';

import type { CSSProperties } from 'react';

export type LanguageValue = 'EN' | 'FIL';

export interface LanguageToggleProps {
  value?: LanguageValue;
  onChange?: (value: LanguageValue) => void;
  /** Optional display labels; defaults to EN / FIL codes. */
  labels?: Partial<Record<LanguageValue, string>>;
}

const OPTIONS: LanguageValue[] = ['EN', 'FIL'];

export function LanguageToggle({
  value = 'EN',
  onChange,
  labels,
}: LanguageToggleProps) {
  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    gap: 8,
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div style={containerStyle}>
      {OPTIONS.map((option) => {
        const isActive = value === option;
        const buttonStyle: CSSProperties = {
          height: 40,
          padding: '0 20px',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          background: isActive ? 'var(--bright-amber)' : 'var(--surface-1)',
          color: isActive ? 'var(--text-on-accent)' : 'var(--text-body)',
          transition: 'background var(--motion-duration) var(--motion-ease)',
        };

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange?.(option)}
            style={buttonStyle}
          >
            {labels?.[option] ?? option}
          </button>
        );
      })}
    </div>
  );
}
