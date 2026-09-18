import type { CSSProperties, ReactNode } from 'react';

export interface InfoCardProps {
  heading?: string;
  children?: ReactNode;
  iconSide?: 'left' | 'right';
  icon?: ReactNode;
}

export function InfoCard({
  heading,
  children,
  iconSide = 'right',
  icon = null,
}: InfoCardProps) {
  const cardStyle: CSSProperties = {
    flex: '1 1 0',
    minWidth: 0,
    background: 'var(--card-fill-neutral)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--card-padding)',
    fontFamily: 'var(--font-sans)',
  };

  const headingStyle: CSSProperties = {
    margin: '0 0 16px',
    color: 'var(--text-section-heading)',
    textTransform: 'uppercase',
    fontSize: 'var(--text-section-heading-size)',
    fontWeight: 'var(--text-section-heading-weight)',
    letterSpacing: 'var(--text-section-heading-tracking)',
    lineHeight: 1.25,
  };

  const bodyStyle: CSSProperties = {
    color: 'var(--text-on-card-neutral)',
    fontSize: 'var(--text-body-size)',
    fontWeight: 'var(--weight-body)',
    lineHeight: 'var(--text-body-line)',
  };

  const iconSlotStyle: CSSProperties = {
    flex: '0 0 220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    gap: 32,
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const card = (
    <div style={cardStyle}>
      {heading && <h2 style={headingStyle}>{heading}</h2>}
      <div style={bodyStyle}>{children}</div>
    </div>
  );

  const iconSlot = <div style={iconSlotStyle}>{icon}</div>;

  return (
    <div style={rowStyle}>
      {iconSide === 'left' ? (
        <>
          {iconSlot}
          {card}
        </>
      ) : (
        <>
          {card}
          {iconSlot}
        </>
      )}
    </div>
  );
}
