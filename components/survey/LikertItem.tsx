'use client';

import type { CSSProperties } from 'react';

export interface LikertItemProps {
  question: string;
  subtext?: string;
  labels?: [string, string, string, string, string];
  value: number | null;
  onChange: (value: number) => void;
}

/**
 * Reusable five-point Likert scale used across survey sections.
 */
export function LikertItem({
  question,
  subtext,
  labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  value,
  onChange,
}: LikertItemProps) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 'clamp(20px, 3vw, 32px)',
        animation: 'riseIn 360ms ease-in-out both',
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.4,
          color: 'var(--text-body)',
          textWrap: 'pretty',
        }}
      >
        {question}
      </div>
      {subtext ? (
        <div
          style={{
            margin: '8px 0 20px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--text-caption)',
            textWrap: 'pretty',
          }}
        >
          {subtext}
        </div>
      ) : (
        <div style={{ marginBottom: 20 }} />
      )}
      <div style={{ fontFamily: 'var(--font-sans)', width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = value === n;
            const style: CSSProperties = {
              flex: 1,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              background: selected ? 'var(--bright-amber)' : 'var(--surface-1)',
              color: selected ? 'var(--text-on-accent)' : 'var(--text-body)',
              border: selected ? 'none' : '1px solid var(--border-default)',
              transition: 'background var(--motion-duration) var(--motion-ease)',
            };
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-label={labels[n - 1] || String(n)}
                style={style}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 'var(--text-caption-size)',
            color: 'var(--text-caption)',
          }}
        >
          <span>{labels[0]}</span>
          <span>{labels[4]}</span>
        </div>
      </div>
    </div>
  );
}
