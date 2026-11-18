'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { EvidenceSummaryView } from '@/components/admin/analytics/EvidenceSummaryView';
import type { EvidenceSummary } from '@/lib/admin/evidence';
import type { Interpretation } from '@/lib/admin/interpretation';

const EVIDENCE_ID = 'evidence';

export interface Fact {
  id: string;
  label: string;
  value: string;
  note?: string;
  /** Report section this fact is explained in; the card jumps there. */
  topic?: string;
}

/**
 * Interpretation, one topic at a time. The written report used to be every section and every
 * chart explanation stacked in one scroll; here a list of topics sits beside a single reading
 * pane (≤68ch), with a "Next" link at the foot so reading in order is one click per topic.
 * Order: the written summary, the chart-by-chart evidence, then the remaining sections.
 */
export function InterpretationPanel({
  interpretation,
  evidence,
  facts = [],
}: {
  interpretation: Interpretation;
  evidence: EvidenceSummary;
  facts?: Fact[];
}) {
  const topics = useMemo(() => {
    const [first, ...rest] = interpretation.sections;
    const sections = [
      ...(first ? [{ id: first.id as string, label: first.title }] : []),
      { id: EVIDENCE_ID, label: 'Chart by chart' },
      ...rest.map((s) => ({ id: s.id as string, label: s.title })),
    ];
    return sections;
  }, [interpretation.sections]);

  const [topic, setTopic] = useState<string>(topics[0]?.id ?? EVIDENCE_ID);
  const index = Math.max(
    0,
    topics.findIndex((t) => t.id === topic),
  );
  const current = topics[index];
  const next = topics[index + 1];
  const section = interpretation.sections.find((s) => s.id === current?.id);

  return (
    <div className="an-span-12 an-interp-wrap">
      {facts.length ? (
        <ul className="an-facts" aria-label="Key facts">
          {facts.map((f) => {
            const target = f.topic && topics.some((t) => t.id === f.topic) ? f.topic : null;
            const body = (
              <>
                <span className="an-facts__label">{f.label}</span>
                <span className="an-facts__value">{f.value}</span>
                {f.note ? <span className="an-facts__note">{f.note}</span> : null}
              </>
            );
            return (
              <li key={f.id}>
                {target ? (
                  <button type="button" className="an-facts__card" onClick={() => setTopic(target)}>
                    {body}
                  </button>
                ) : (
                  <div className="an-facts__card">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="an-interp">
      <nav className="an-interp__nav" aria-label="Interpretation topics">
        <ol>
          {topics.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                className="an-interp__link"
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setTopic(t.id)}
              >
                <span className="an-interp__n" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{t.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <article className="an-interp__pane" aria-labelledby="an-interp-title" key={current?.id}>
        <header className="an-interp__head">
          <h2 id="an-interp-title">{current?.label}</h2>
          <p className="an-interp__sample">{interpretation.sampleNote}</p>
        </header>

        {current?.id === EVIDENCE_ID ? (
          <EvidenceSummaryView summary={evidence} collapsible />
        ) : section ? (
          <div className="an-interp__body">
            {section.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {next ? (
          <button type="button" className="an-interp__next" onClick={() => setTopic(next.id)}>
            <span>
              <small>Next</small>
              {next.label}
            </span>
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </article>
      </div>
    </div>
  );
}
