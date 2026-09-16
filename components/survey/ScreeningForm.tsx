'use client';

import type { CSSProperties } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SCREENING_FIELDS } from '@/survey/content';

export interface ScreeningFormProps {
  values: Record<string, string>;
  multi: Record<string, Record<string, boolean>>;
  onChange: (id: string, value: string) => void;
  onMultiToggle: (id: string, option: string) => void;
}

function chipStyle(selected: boolean): CSSProperties {
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
    border: selected ? '1px solid var(--bright-amber)' : '1px solid var(--border-default)',
    transform: selected ? 'translateY(-1px)' : 'none',
    transition:
      'background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease)',
  };
}

/**
 * Screening step fields with conditional visibility via `when` predicates.
 */
export function ScreeningForm({ values, multi, onChange, onMultiToggle }: ScreeningFormProps) {
  const visibleFields = SCREENING_FIELDS.filter(
    (field) => !('when' in field) || !field.when || field.when(values),
  );

  return (
    <div
      style={{
        marginTop: 28,
        background: 'var(--surface-1)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 'clamp(20px, 3vw, 32px)',
        animation: 'riseIn 360ms ease-in-out both',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'clamp(16px, 2.4vw, 24px)',
        }}
      >
        {visibleFields.map((field) => {
          const value = values[field.id] ?? '';
          const cellStyle: CSSProperties = {
            gridColumn: 'wide' in field && field.wide ? '1 / -1' : 'auto',
          };

          return (
            <div key={field.id} style={cellStyle}>
              {field.type === 'select' && (
                <Select
                  label={field.label}
                  options={[...field.options]}
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}

              {field.type === 'text' && (
                <Input
                  label={field.label}
                  placeholder={'placeholder' in field ? field.placeholder : undefined}
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}

              {field.type === 'radio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-body)' }}>
                    {field.label}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {field.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onChange(field.id, option)}
                        style={chipStyle(value === option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {field.type === 'multi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-body)' }}>
                    {field.label}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '4px 24px',
                    }}
                  >
                    {field.options.map((option) => (
                      <Checkbox
                        key={option}
                        label={option}
                        checked={!!multi[field.id]?.[option]}
                        onChange={() => onMultiToggle(field.id, option)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {'hint' in field && field.hint && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--text-caption)',
                  }}
                >
                  {field.hint}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
