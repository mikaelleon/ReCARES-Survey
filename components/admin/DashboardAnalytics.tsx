'use client';

import { useEffect, useRef, useState } from 'react';
import type { CountBucket, GateCoverage, LikertMean } from '@/lib/admin/analytics';

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function HBarList({
  title,
  buckets,
  animate,
}: {
  title: string;
  buckets: CountBucket[];
  animate: boolean;
}) {
  return (
    <div className="admin-chart">
      <h3 className="admin-chart__title">{title}</h3>
      <ul className="admin-chart__list">
        {buckets.map((b) => (
          <li key={b.label} className="admin-chart__row">
            <div className="admin-chart__meta">
              <span>{b.label}</span>
              <span>
                {b.count} · {b.pct}%
              </span>
            </div>
            <div className="admin-chart__track" aria-hidden="true">
              <div
                className="admin-chart__fill"
                style={{ width: animate ? `${b.pct}%` : '0%' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Aggregate charts: phase, resident type, gated coverage, Section 2 means.
 */
export function DashboardAnalytics({
  byPhase,
  byResident,
  gates,
  likert,
  total,
  loading = false,
}: {
  byPhase: CountBucket[];
  byResident: CountBucket[];
  gates: GateCoverage[];
  likert: LikertMean[];
  total: number;
  loading?: boolean;
}) {
  const { ref, seen } = useInViewOnce<HTMLElement>();

  if (loading) {
    return (
      <div className="admin-analytics admin-analytics--skeleton" aria-hidden="true">
        <div className="admin-chart admin-chart--skeleton" />
        <div className="admin-chart admin-chart--skeleton" />
      </div>
    );
  }

  if (total === 0) return null;

  return (
    <section ref={ref} className="admin-analytics" aria-label="Response analytics">
      <div className="admin-analytics__grid">
        <HBarList title="By phase" buckets={byPhase} animate={seen} />
        <HBarList title="By resident type" buckets={byResident} animate={seen} />
      </div>

      <div className="admin-chart admin-chart--gates">
        <h3 className="admin-chart__title">Gated section coverage</h3>
        <div className="admin-gate-strip">
          {gates.map((g) => (
            <div key={g.key} className="admin-gate-strip__item">
              <div className="admin-gate-strip__label">{g.label}</div>
              <div className="admin-gate-strip__track" aria-hidden="true">
                <div
                  className="admin-gate-strip__fill"
                  style={{ width: seen ? `${g.pct}%` : '0%' }}
                />
              </div>
              <div className="admin-gate-strip__pct">
                {g.pct}% · {g.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-chart admin-chart--likert">
        <h3 className="admin-chart__title">Communication quality (Section 2)</h3>
        <p className="admin-chart__note">
          Mean Likert 1–5 · n={total} · stub data until Firestore
        </p>
        <ul className="admin-likert">
          {likert.map((item) => (
            <li key={item.key} className="admin-likert__row">
              <span className="admin-likert__label">{item.label}</span>
              <div className="admin-likert__track" aria-hidden="true">
                <div
                  className="admin-likert__fill"
                  style={{ width: seen ? `${(item.mean / 5) * 100}%` : '0%' }}
                />
              </div>
              <span className="admin-likert__mean">{item.mean.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="admin-analytics__caption">
        Aggregates only. No household identifiers appear in these charts.
      </p>
    </section>
  );
}
