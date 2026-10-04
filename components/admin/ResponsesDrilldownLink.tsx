'use client';

import { AdminNavLink } from '@/components/admin/AdminNavLink';

/**
 * Standardized Dashboard → Responses drill-down.
 * Always: label “See on Responses →”, bottom-right via parent footer class.
 */
export function ResponsesDrilldownLink({ focus }: { focus: string }) {
  const href = `/admin/responses/?focus=${encodeURIComponent(focus)}`;
  return (
    <AdminNavLink href={href} className="dash-insight__link">
      See on Responses →
    </AdminNavLink>
  );
}
