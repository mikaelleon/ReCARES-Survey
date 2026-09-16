import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  children?: ReactNode;
  padding?: number;
}

export function Card({ children, padding = 24 }: CardProps) {
  const style: CSSProperties = {
    background: 'var(--surface-1)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
    padding,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-body)',
  };

  return <div style={style}>{children}</div>;
}
