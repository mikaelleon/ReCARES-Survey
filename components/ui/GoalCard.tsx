import type { CSSProperties, ReactNode } from 'react';

export interface GoalCardProps {
  title?: string;
  children?: ReactNode;
}

export function GoalCard({ title, children }: GoalCardProps) {
  const cardStyle: CSSProperties = {
    flex: '1 1 0',
    minWidth: 0,
    background: 'var(--card-fill-brand)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--card-padding)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-on-card-brand)',
  };

  const titleStyle: CSSProperties = {
    margin: '0 0 12px',
    color: 'var(--white)',
    textTransform: 'uppercase',
    fontSize: 'var(--text-card-title-size)',
    fontWeight: 'var(--text-card-title-weight)',
    letterSpacing: 'var(--text-card-title-tracking)',
    lineHeight: 1.35,
  };

  const bodyStyle: CSSProperties = {
    color: 'var(--white)',
    fontSize: 'var(--text-body-size)',
    fontWeight: 'var(--weight-body)',
    lineHeight: 'var(--text-body-line)',
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}
