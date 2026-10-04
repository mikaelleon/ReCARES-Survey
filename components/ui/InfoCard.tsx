import type { ReactNode } from 'react';

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
  return (
    <div className={`info-card-row${iconSide === 'left' ? ' info-card-row--icon-left' : ''}`}>
      <div className="info-card">
        {heading ? <h2 className="info-card__heading">{heading}</h2> : null}
        <div className="info-card__body">{children}</div>
      </div>
      {icon ? (
        <div className="info-card-row__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
    </div>
  );
}
