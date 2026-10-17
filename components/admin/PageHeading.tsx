import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/PageTitle';

/**
 * Standard admin page heading. The title is visible and doubles as the help trigger:
 * hovering it shows the one-line description (`sub`), and selecting it opens a plain-language
 * guide to the page (see PAGE_HELP). The description stays in the document for screen readers.
 */
export function PageHeading({
  id,
  title,
  sub,
  children,
}: {
  /** Id of the h1, and the key into PAGE_HELP. */
  id: string;
  title: ReactNode;
  sub: string;
  /** Optional visible row under the title (for example a status chip). */
  children?: ReactNode;
}) {
  return (
    <div className="dash-page__heading">
      <PageTitle pageId={id}>{title}</PageTitle>
      <p className="visually-hidden">{sub}</p>
      {children}
    </div>
  );
}
