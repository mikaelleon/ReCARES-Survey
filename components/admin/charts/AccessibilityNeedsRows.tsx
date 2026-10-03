'use client';

import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import type { CountBucket } from '@/lib/admin/analytics';

/**
 * Accessibility Needs — same horizontal-bar treatment as Open Problem Discovery,
 * including subtle zero-data rows for every AC1 option.
 */
export function AccessibilityNeedsRows({
  buckets,
  baseN,
}: {
  buckets: CountBucket[];
  baseN: number;
}) {
  if (baseN <= 0) {
    return <p className="dash-tile__empty">No AC1 answers on the accessibility path yet.</p>;
  }

  return <HorizontalBars buckets={buckets} />;
}
