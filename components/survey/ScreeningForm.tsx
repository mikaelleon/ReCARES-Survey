'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SCREENING_FIELDS } from '@/survey/content';
import type { ScreeningErrors } from '@/survey/validation';

export interface ScreeningFormProps {
  values: Record<string, string>;
  multi: Record<string, Record<string, boolean>>;
  onChange: (id: string, value: string) => void;
  onMultiToggle: (id: string, option: string) => void;
  errors?: ScreeningErrors;
}

type ScreeningField = (typeof SCREENING_FIELDS)[number];
type ScreeningFieldId = ScreeningField['id'];

/**
 * Side-by-side pairs. Conditional follow-ups stay full-width rows after their trigger.
 * Solo fields (phase, pwd_self, resident_type, primary_channel) are not listed here.
 */
const PAIR_ROWS: ReadonlyArray<readonly [ScreeningFieldId, ScreeningFieldId]> = [
  ['addr_block', 'addr_lot'],
  ['household_size', 'civil_status'],
  ['children_yn', 'pwd_household'],
  ['sex', 'age_range'],
];

const ROW_GAP = 'clamp(16px, 2.4vw, 24px)';

function chipStyle(selected: boolean, hasError: boolean): CSSProperties {
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
    border: selected
      ? '1px solid var(--bright-amber)'
      : hasError
        ? '1px solid var(--error-red)'
        : '1px solid var(--border-default)',
    transform: selected ? 'translateY(-1px)' : 'none',
    transition:
      'background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease)',
  };
}

function isVisible(field: ScreeningField, values: Record<string, string>): boolean {
  return !('when' in field) || !field.when || field.when(values);
}

function fieldRequired(field: ScreeningField): boolean {
  return 'required' in field && field.required === true;
}

function fieldHint(field: ScreeningField): string | undefined {
  return 'hint' in field && field.hint ? field.hint : undefined;
}

function FieldLabel({
  id,
  label,
  required,
}: {
  id?: string;
  label: string;
  required: boolean;
}) {
  return (
    <div
      id={id}
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-body)',
        display: 'flex',
        gap: 4,
      }}
    >
      {label}
      {required ? (
        <span style={{ color: 'var(--status-error)' }} aria-label="required">
          *
        </span>
      ) : null}
    </div>
  );
}

function FieldHint({ id, text }: { id?: string; text: string }) {
  return (
    <div id={id} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
      {text}
    </div>
  );
}

/**
 * Screening step fields.
 * Standard order: label → subtext → control. Required fields show a red asterisk.
 */
export function ScreeningForm({
  values,
  multi,
  onChange,
  onMultiToggle,
  errors = {},
}: ScreeningFormProps) {
  const byId = new Map<ScreeningFieldId, ScreeningField>(
    SCREENING_FIELDS.map((field) => [field.id, field]),
  );
  const rendered = new Set<ScreeningFieldId>();

  const renderField = (field: ScreeningField): ReactNode => {
    const value = values[field.id] ?? '';
    const error = errors[field.id];
    const errorId = `screening-${field.id}-error`;
    const hintId = `screening-${field.id}-hint`;
    const labelId = `screening-${field.id}-label`;
    const required = fieldRequired(field);
    const hint = fieldHint(field);

    if (field.type === 'select') {
      return (
        <Select
          key={field.id}
          id={`screening-${field.id}`}
          label={field.label}
          options={[...field.options]}
          value={value}
          required={required}
          helperText={hint ?? null}
          error={error ?? null}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    }

    if (field.type === 'text') {
      return (
        <Input
          key={field.id}
          label={field.label}
          placeholder={'placeholder' in field ? field.placeholder : undefined}
          value={value}
          required={required}
          helperText={hint ?? null}
          error={error ?? null}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    }

    // radio / multi — shared label → hint → control → error template
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

    return (
      <div
        key={field.id}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <FieldLabel id={labelId} label={field.label} required={required} />
        {hint ? <FieldHint id={hintId} text={hint} /> : null}

        {field.type === 'radio' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {field.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange(field.id, option)}
                style={chipStyle(value === option, Boolean(error))}
                aria-pressed={value === option}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
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
        )}

        {error ? (
          <span id={errorId} role="alert" style={{ fontSize: 14, color: 'var(--status-error)' }}>
            {error}
          </span>
        ) : null}
      </div>
    );
  };

  const rows: ReactNode[] = [];

  for (const field of SCREENING_FIELDS) {
    if (rendered.has(field.id) || !isVisible(field, values)) continue;

    const pair = PAIR_ROWS.find(([a, b]) => a === field.id || b === field.id);
    if (pair) {
      const [leftId, rightId] = pair;
      if (field.id !== leftId) continue;

      const left = byId.get(leftId);
      const right = byId.get(rightId);
      if (!left || !right) continue;
      if (!isVisible(left, values) && !isVisible(right, values)) continue;

      rendered.add(leftId);
      rendered.add(rightId);

      rows.push(
        <div
          key={`${leftId}-${rightId}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: ROW_GAP,
          }}
        >
          {isVisible(left, values) ? renderField(left) : null}
          {isVisible(right, values) ? renderField(right) : null}
        </div>,
      );
      continue;
    }

    rendered.add(field.id);
    rows.push(
      <div key={field.id} style={{ gridColumn: '1 / -1', width: '100%' }}>
        {renderField(field)}
      </div>,
    );
  }

  return (
    <div
      style={{
        marginTop: 28,
        background: 'var(--surface-1)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 'clamp(20px, 3vw, 32px)',
        animation: 'riseIn 360ms ease-in-out both',
        display: 'flex',
        flexDirection: 'column',
        gap: ROW_GAP,
      }}
    >
      {rows}
    </div>
  );
}
