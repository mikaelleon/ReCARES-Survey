'use client';

import type { CSSProperties } from 'react';
import { LikertItem } from '@/components/survey/LikertItem';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import type { SurveyItem } from '@/survey/questionnaire';

export type AnswerValue = string | number | string[];

export interface SectionItemsProps {
  items: SurveyItem[];
  answers: Record<string, AnswerValue>;
  onChange: (id: string, value: AnswerValue) => void;
  /** Drop the outer top margin when the parent already spaces the block. */
  embedded?: boolean;
}

function chipStyle(selected: boolean): CSSProperties {
  return {
    minHeight: 44,
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: selected ? 700 : 400,
    background: selected ? 'var(--bright-amber)' : 'var(--surface-2)',
    color: selected ? 'var(--black)' : 'var(--text-body)',
    border: selected ? '1px solid var(--bright-amber)' : '1px solid var(--border-default)',
    textAlign: 'left',
  };
}

function cardStyle(): CSSProperties {
  return {
    background: 'var(--surface-1)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-card)',
    padding: 'clamp(20px, 3vw, 32px)',
    animation: 'riseIn 360ms ease-in-out both',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
}

/**
 * Renders one section's visible items (core, or core + extended).
 */
export function SectionItems({ items, answers, onChange, embedded = false }: SectionItemsProps) {
  return (
    <div
      style={{
        marginTop: embedded ? 0 : 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {items.map((item) => {
        if (item.type === 'likert') {
          const raw = answers[item.id];
          const value = typeof raw === 'number' ? raw : null;
          return (
            <LikertItem
              key={item.id}
              question={item.q}
              subtext={item.sub}
              labels={[item.ends[0], '', '', '', item.ends[1]]}
              value={value}
              onChange={(n) => onChange(item.id, n)}
            />
          );
        }

        if (item.type === 'choice') {
          const value = typeof answers[item.id] === 'string' ? String(answers[item.id]) : '';
          return (
            <div key={item.id} style={cardStyle()}>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-body)' }}>
                {item.q}
              </div>
              {item.sub ? (
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>{item.sub}</div>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {item.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange(item.id, option)}
                    style={chipStyle(value === option)}
                    aria-pressed={value === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        if (item.type === 'check') {
          const selected = Array.isArray(answers[item.id]) ? (answers[item.id] as string[]) : [];
          return (
            <div key={item.id} style={cardStyle()}>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-body)' }}>
                {item.q}
              </div>
              {item.sub ? (
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>{item.sub}</div>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {item.options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={selected.includes(option)}
                    onChange={() => {
                      const next = selected.includes(option)
                        ? selected.filter((entry) => entry !== option)
                        : [...selected, option];
                      onChange(item.id, next);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        }

        if (item.type === 'number') {
          const value = answers[item.id] != null ? String(answers[item.id]) : '';
          return (
            <div key={item.id} style={cardStyle()}>
              <Input
                label={item.q}
                type="number"
                placeholder={item.placeholder}
                helperText={item.sub ?? null}
                value={value}
                onChange={(e) => onChange(item.id, e.target.value)}
              />
            </div>
          );
        }

        const text = typeof answers[item.id] === 'string' ? String(answers[item.id]) : '';
        return (
          <div key={item.id} style={cardStyle()}>
            <label
              htmlFor={item.id}
              style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-body)' }}
            >
              {item.q}
            </label>
            {item.sub ? (
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>{item.sub}</div>
            ) : null}
            <textarea
              id={item.id}
              value={text}
              onChange={(e) => onChange(item.id, e.target.value)}
              rows={5}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                lineHeight: 1.5,
                color: 'var(--text-body)',
                background: 'var(--surface-2)',
                border: '1px solid transparent',
                borderRadius: 8,
                padding: 14,
                resize: 'vertical',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
