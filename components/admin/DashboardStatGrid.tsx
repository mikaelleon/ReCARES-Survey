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

function StatGroup({
  title,
  stats,
  reduced,
}: {
  title: string;
  stats: StatDef[];
  reduced: boolean;
}) {
  return (
    <div className="admin-stat-group">
      <h3 className="admin-stat-group__title">{title}</h3>
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
    </div>
  );
}

/**
 * KPI strip: overall activity vs live gated-branch breakdowns.
 * Accessibility path = same gate as Responses “Accessibility”.
 * PWD screening = A4 Yes only (not OR accessibility).
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

  const activity: StatDef[] = [
    {
      label: 'Responses',
      value: kpis.total,
      caption: 'Same query as the Responses page',
      delay: '0ms',
    },
    {
      label: 'Last 7 days',
      value: kpis.last7DaysCount,
      caption: 'Submissions in the rolling week',
      delay: '60ms',
    },
    {
      label: 'PWD screening (Yes)',
      value: kpis.pwdRelatedCount,
      caption: `Screening A4 only · ${formatKpiCaption(kpis.pwdRelatedCount, kpis.total, kpis.pwdRelatedPct)}`,
      delay: '120ms',
    },
  ];

  const branches: StatDef[] = [
    {
      label: 'Tenant / lessee',
      value: kpis.tenantCount,
      caption: formatKpiCaption(kpis.tenantCount, kpis.total, kpis.tenantPct),
      delay: '0ms',
    },
    {
      label: 'Homeowner branch',
      value: kpis.homeownerCount,
      caption: formatKpiCaption(kpis.homeownerCount, kpis.total, kpis.homeownerPct),
      delay: '60ms',
    },
    {
      label: 'Accessibility path',
      value: kpis.accessibilityCount,
      caption: `Same gate as Responses → Accessibility · ${formatKpiCaption(kpis.accessibilityCount, kpis.total, kpis.accessibilityPct)}`,
      delay: '120ms',
    },
  ];

  return (
    <div className="admin-stat-groups">
      <StatGroup title="Overall activity" stats={activity} reduced={reduced} />
      <StatGroup title="Live branch coverage" stats={branches} reduced={reduced} />
    </div>
  );
}
