import type { CSSProperties, ReactNode } from 'react';

export interface GoalCardProps {
  title?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

export function GoalCard({ title, children, icon }: GoalCardProps) {
  const cardStyle: CSSProperties = {
    flex: '1 1 0',
    minWidth: 0,
    width: '100%',
    background: 'var(--card-fill-brand)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--card-padding)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-on-card-brand)',
    transition:
      'transform var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease)',
  };

  const titleStyle: CSSProperties = {
    margin: '0 0 12px',
    color: 'var(--white)',
    textTransform: 'uppercase',
    fontSize: 'var(--text-card-title-size)',
    fontWeight: 'var(--text-card-title-weight)',
    letterSpacing: 'var(--text-card-title-tracking)',
    lineHeight: 1.35,
    transition: 'color var(--motion-duration) var(--motion-ease)',
  };

  const bodyStyle: CSSProperties = {
    color: 'var(--white)',
    fontSize: 'var(--text-body-size)',
    fontWeight: 'var(--weight-body)',
    lineHeight: 'var(--text-body-line)',
  };

  const iconSlotStyle: CSSProperties = {
    background: 'transparent',
    color: 'var(--white)',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div className="goal-card" style={cardStyle}>
      {icon ? (
        <div style={iconSlotStyle} aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="goal-card__title" style={titleStyle}>
        {title}
      </h3>
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}
