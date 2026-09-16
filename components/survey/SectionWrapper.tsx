'use client';

import type { ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  /** Optional dashed placeholder when section copy is not yet drafted. */
  pendingNote?: string;
}

export function SectionWrapper({ children, pendingNote }: SectionWrapperProps) {
  return (
    <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {children}
      {pendingNote ? (
        <div
          style={{
            border: '1px dashed var(--border-structural)',
            borderRadius: 8,
            padding: 'clamp(16px, 3vw, 24px)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--text-caption)',
            textWrap: 'pretty',
          }}
        >
          {/* TODO: content pending */}
          {pendingNote}
        </div>
      ) : null}
    </div>
  );
}
