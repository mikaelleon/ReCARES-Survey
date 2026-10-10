import type { ReactNode } from 'react';

/**
 * Standard admin page heading: a title plus a one-line sub-text that says what the
 * page shows and what the reader can do here. Use on every admin screen.
 */
export function PageHeading({
  id,
  title,
  sub,
  children,
}: {
  id: string;
  title: ReactNode;
  sub: string;
  /** Optional extra row under the sub-text (for example a status chip). */
  children?: ReactNode;
}) {
  return (
    <div className="dash-page__heading">
      <h1 id={id} className="dash-page__title">
        {title}
      </h1>
      <p className="dash-page__sub">{sub}</p>
      {children}
    </div>
  );
}
