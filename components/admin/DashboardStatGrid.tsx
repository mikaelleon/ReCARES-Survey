'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatKpiCaption,
  type DashboardKpis,
} from '@/lib/admin/analytics';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function AnimatedNumber({ value, reduced }: { value: number; reduced: boolean }) {
  const [display, setDisplay] = useState(reduced ? value : 0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    const duration = 520;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, reduced]);

  return <>{display}</>;
}

interface StatDef {
  label: string;
  value: number;
  caption: string;
  delay: string;
}

/**
 * KPI strip for the dashboard overview.
 */
export function DashboardStatGrid({
  kpis,
  loading = false,
}: {
  kpis: DashboardKpis;
  loading?: boolean;
}) {
  const reduced = usePrefersReducedMotion();

  if (loading) {
    return (
      <div className="admin-stat-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card admin-stat admin-stat--skeleton" />
        ))}
      </div>
    );
  }

  const stats: StatDef[] = [
    {
      label: 'Responses',
      value: kpis.total,
      caption: kpis.last7DaysCount
        ? `${kpis.last7DaysCount} in the last 7 days`
        : 'No submissions in the last 7 days',
      delay: '0ms',
    },
    {
      label: 'Section 4 shown',
      value: kpis.section4Count,
      caption: formatKpiCaption(kpis.section4Count, kpis.total, kpis.section4Pct),
      delay: '60ms',
    },
    {
      label: 'PWD-related',
      value: kpis.pwdRelatedCount,
      caption: formatKpiCaption(kpis.pwdRelatedCount, kpis.total, kpis.pwdRelatedPct),
      delay: '120ms',
    },
    {
      label: 'Last 7 days',
      value: kpis.last7DaysCount,
      caption: 'Submissions in the rolling week',
      delay: '180ms',
    },
  ];

  return (
    <div className="admin-stat-grid">
      {stats.map((s) => (
        <div
          key={s.label}
          className="stat-card admin-stat"
          style={{ animationDelay: s.delay }}
        >
          <div className="admin-stat__label">{s.label}</div>
          <div className="admin-stat__value">
            <AnimatedNumber value={s.value} reduced={reduced} />
          </div>
          <div className="admin-stat__caption">{s.caption}</div>
        </div>
      ))}
    </div>
  );
}
