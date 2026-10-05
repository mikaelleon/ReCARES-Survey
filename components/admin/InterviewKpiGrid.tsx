'use client';

import { SkelLine } from '@/components/ui/Skeleton';
import type { InterviewKpis } from '@/lib/admin/interviewAnalytics';

/**
 * Compact preference strip — pipeline counts live on the Kanban columns.
 */
export function InterviewKpiGrid({
  kpis,
  loading = false,
}: {
  kpis: InterviewKpis;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="iv-summary skel-region" aria-busy="true">
        <span className="visually-hidden">Loading interview snapshot</span>
        <div className="skel-stat" style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center' }}>
          <SkelLine size="sm" />
          <SkelLine size="md" />
          <SkelLine size="sm" />
        </div>
      </div>
    );
  }

  const empty = kpis.total === 0;
  const items = [
    {
      key: 'total',
      label: 'Total',
      value: empty ? '—' : String(kpis.total),
    },
    {
      key: 'online',
      label: 'Online',
      value: empty ? '—' : String(kpis.online),
    },
    {
      key: 'f2f',
      label: 'Face-to-face',
      value: empty ? '—' : String(kpis.faceToFace),
    },
    {
      key: 'day',
      label: 'Top day',
      value: kpis.topDay?.label ?? '—',
    },
    {
      key: 'time',
      label: 'Top time',
      value: kpis.topTime?.label ?? '—',
    },
  ];

  return (
    <ul className="iv-summary" aria-label="Interview preference snapshot">
      {items.map((item) => (
        <li key={item.key} className="iv-summary__item">
          <span className="iv-summary__label">{item.label}</span>
          <span className="iv-summary__value">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
