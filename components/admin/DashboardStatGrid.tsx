'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { DashboardKpis } from '@/lib/admin/analytics';

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

function TrendIcon({ caption }: { caption: string }) {
  if (caption.startsWith('+')) {
    return <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />;
  }
  if (caption.startsWith('-')) {
    return <ArrowDownRight size={14} strokeWidth={2.4} aria-hidden="true" />;
  }
  return <Minus size={14} strokeWidth={2.4} aria-hidden="true" />;
}

/**
 * Soft four-up KPI row.
 * Homeowner / Tenant cards = survey branch groups (A1 1–4 / 5–6), not single A1 options.
 */
export function DashboardStatGrid({
  kpis,
  loading = false,
  periodTrend = null,
}: {
  kpis: DashboardKpis;
  loading?: boolean;
  /** Real prior-period delta only — never a placeholder. */
  periodTrend?: string | null;
}) {
  const reduced = usePrefersReducedMotion();

  if (loading) {
    return (
      <div className="dash-stat-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-stat dash-stat--skeleton" />
        ))}
      </div>
    );
  }

  const trendOr = (fallback: string) =>
    periodTrend ? (
      <span className="dash-stat__trend">
        <TrendIcon caption={periodTrend} />
        {periodTrend}
      </span>
    ) : (
      fallback
    );

  return (
    <div className="dash-stat-grid">
      <div className="dash-stat dash-stat--hero" style={{ animationDelay: '0ms' }}>
        <div className="dash-stat__label">Total Respondents</div>
        <div className="dash-stat__value">
          <AnimatedNumber value={kpis.total} reduced={reduced} />
        </div>
        <div className="dash-stat__caption">{trendOr('In selected date range')}</div>
      </div>

      <div
        className="dash-stat"
        style={{ animationDelay: '60ms' }}
        title="Grouped total: A1 options 1–4 (living-in, OFW, absentee, and family/household member of a homeowner). Not a count of only “Homeowner living in the unit.”"
      >
        <div className="dash-stat__label">Total Homeowners</div>
        <div className="dash-stat__value">
          <AnimatedNumber value={kpis.homeownerCount} reduced={reduced} />
        </div>
        <div className="dash-stat__caption">
          {trendOr(`${kpis.homeownerPct}% · grouped homeowner branch (incl. household members)`)}
        </div>
      </div>

      <div className="dash-stat" style={{ animationDelay: '120ms' }}>
        <div className="dash-stat__label">Total PWD Residents</div>
        <div className="dash-stat__value">
          <AnimatedNumber value={kpis.pwdRelatedCount} reduced={reduced} />
        </div>
        <div className="dash-stat__caption">
          {trendOr(`${kpis.pwdRelatedPct}% · screening A4 Yes only`)}
        </div>
      </div>

      <div
        className="dash-stat"
        style={{ animationDelay: '180ms' }}
        title="Grouped total: A1 options 5–6 (tenant/lessee and family/household member of a tenant). Not a count of only “Tenant or lessee.”"
      >
        <div className="dash-stat__label">Total Tenants</div>
        <div className="dash-stat__value">
          <AnimatedNumber value={kpis.tenantCount} reduced={reduced} />
        </div>
        <div className="dash-stat__caption">
          {trendOr(`${kpis.tenantPct}% · grouped tenant branch (incl. household members)`)}
        </div>
      </div>
    </div>
  );
}
