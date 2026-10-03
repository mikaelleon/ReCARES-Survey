'use client';

import Link from 'next/link';

/**
 * Standardized Dashboard → Responses drill-down.
 * Always: label “See on Responses →”, bottom-right via parent footer class.
 */
export function ResponsesDrilldownLink({ focus }: { focus: string }) {
  const href = `/admin/responses/?focus=${encodeURIComponent(focus)}`;
  return (
    <Link href={href} className="dash-insight__link">
      See on Responses →
    </Link>
  );
}
