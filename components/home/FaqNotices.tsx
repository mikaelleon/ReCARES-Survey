'use client';

import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Notice } from '@/components/ui/Notice';
import { useSurveyTear } from '@/lib/ui/useSurveyTear';
import { FAQ } from '@/survey/content';

/**
 * The FAQ notice. Wide: the questions on the left, the answer beside them, so nothing
 * changes height and nothing needs scrolling. Narrow: the list, then one answer at a time
 * with a plain "All questions" way back.
 */
export function FaqNotice() {
  const [open, setOpen] = useState<number | null>(null);
  const shown = open ?? 0;
  const questionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const backRef = useRef<HTMLButtonElement>(null);
  const lastOpen = useRef<number | null>(null);

  /* On a narrow screen the list and the answer swap: move focus with them. */
  useEffect(() => {
    if (open !== null) {
      lastOpen.current = open;
      const back = backRef.current;
      if (back && back.offsetParent !== null) back.focus();
    } else if (lastOpen.current !== null) {
      questionRefs.current[lastOpen.current]?.focus();
    }
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target: Record<string, number> = {
      ArrowDown: Math.min(FAQ.length - 1, index + 1),
      ArrowUp: Math.max(0, index - 1),
      Home: 0,
      End: FAQ.length - 1,
    };
    if (e.key in target) {
      e.preventDefault();
      questionRefs.current[target[e.key]]?.focus();
    }
  };

  return (
    <Notice>
      <h2 id="faq-heading" className="notice__title">
        Frequently asked questions
      </h2>
      <div className="faq" data-view={open === null ? 'list' : 'detail'}>
        <ul className="faq__list">
          {FAQ.map((item, index) => (
            <li key={item.question}>
              <button
                ref={(el) => {
                  questionRefs.current[index] = el;
                }}
                type="button"
                className="faq__q"
                aria-current={shown === index}
                aria-controls="faq-detail"
                onClick={() => setOpen(index)}
                onKeyDown={(e) => onKeyDown(e, index)}
              >
                <span>{item.question}</span>
                <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <div id="faq-detail" className="faq__detail" aria-live="polite">
          <button ref={backRef} type="button" className="faq__back" onClick={() => setOpen(null)}>
            <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
            All questions
          </button>
          <div key={shown}>
            <h3>{FAQ[shown].question}</h3>
            <p>{FAQ[shown].answer}</p>
          </div>
        </div>
      </div>
    </Notice>
  );
}

/** The survey facts, and a second way in: the same stub, the same tear. */
export function FactsNotice() {
  const { survey, label, tear, onStubClick, tearMs } = useSurveyTear();

  return (
    <Notice
      tear={tear}
      style={{ '--tear-ms': `${tearMs}ms` } as CSSProperties}
      stub={
        <Link href="/survey" className="notice__stub" data-survey={survey} onClick={onStubClick}>
          <span>{label}</span>
          {survey === 'open' ? <ArrowRight size={22} strokeWidth={2.4} aria-hidden="true" /> : null}
        </Link>
      }
    >
      <Fact title="Estimated time" body="The survey takes about 11 to 13 minutes to complete." />
      <Fact
        title="Voluntary"
        body="You can skip any question, and some sections only appear if they apply to you."
      />
      <Fact title="Confidential" body="Your answers are never shared with your name attached." />
    </Notice>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="fact">
      <p className="fact__title">{title}</p>
      <p className="fact__body">{body}</p>
    </div>
  );
}
