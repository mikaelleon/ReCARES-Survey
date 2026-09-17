'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import { PieChart } from '@/components/admin/charts/PieChart';
import type { CountBucket } from '@/lib/admin/analytics';
import { chartTextForCopy, type ChartKind } from '@/lib/admin/responseQuestions';

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
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

/**
 * Forms-style question card: title, response count, chart, copy action.
 */
export function QuestionChartCard({
  title,
  responseCount,
  kind,
  buckets,
}: {
  title: string;
  responseCount: number;
  kind: ChartKind;
  buckets: CountBucket[];
}) {
  const { ref, seen } = useInViewOnce<HTMLElement>();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        chartTextForCopy(title, responseCount, buckets),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article ref={ref} className="gf-card">
      <header className="gf-card__head">
        <div className="gf-card__titles">
          <h3 className="gf-card__title">{title}</h3>
          <p className="gf-card__meta">
            {responseCount} {responseCount === 1 ? 'response' : 'responses'}
          </p>
        </div>
        <button
          type="button"
          className="gf-card__copy"
          onClick={() => void handleCopy()}
          aria-label={`Copy chart for ${title}`}
        >
          <Copy size={16} strokeWidth={2.2} aria-hidden="true" />
          {copied ? 'Copied' : 'Copy chart'}
        </button>
      </header>
      <div className="gf-card__body">
        {kind === 'pie' ? (
          <PieChart buckets={buckets} animate={seen} />
        ) : (
          <HorizontalBars buckets={buckets} animate={seen} />
        )}
      </div>
    </article>
  );
}
