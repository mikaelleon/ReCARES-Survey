'use client';

import { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import type { StepPlan } from '@/survey/model';
import { useT } from '@/components/survey/SurveyLanguage';

/**
 * Clickable pagination for the survey. Any step the respondent has finished,
 * and the first one they have not, can be opened. Steps further on stay locked
 * until the pages before them are answered.
 */
export function StepPager({
  roster,
  current,
  reachable,
  done,
  reviewReachable,
  titleOf,
  onGo,
  onReview,
}: {
  roster: Array<{ number: number; shown: boolean; plan: StepPlan }>;
  current: number | 'review';
  reachable: Set<number>;
  done: Set<number>;
  reviewReachable: boolean;
  titleOf: (stepNumber: number) => string;
  onGo: (stepNumber: number) => void;
  onReview: () => void;
}) {
  const t = useT();
  const listRef = useRef<HTMLOListElement | null>(null);

  /* On a phone the row scrolls sideways: keep the current page in view. */
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
  }, [current]);
  const lockedHint = t('Answer the earlier pages first to open this one.');

  /* Pages the answers rule out keep a place in the row (a dash, no number), so the numbers of the
     pages that will be asked never shift under the person while they answer. */
  let counted = 0;
  const numbered = roster.map((item) => ({
    ...item,
    label: item.plan === 'hidden' ? 0 : ++counted,
  }));
  const showLegend =
    typeof current === 'number' && numbered.some((item) => item.number > current && item.plan !== 'shown');

  return (
    <nav className="survey-pager" aria-label={t('Survey pages')}>
      <ol ref={listRef}>
        {numbered.map((item) => {
          const isCurrent = current === item.number;
          const open = item.shown && reachable.has(item.number);
          const finished = done.has(item.number) && !isCurrent;
          const title = titleOf(item.number);
          const state = isCurrent ? 'current' : finished ? 'done' : open ? 'open' : 'locked';
          const planHint =
            item.plan === 'hidden'
              ? t('Skipped for your answers')
              : item.plan === 'pending'
                ? t('Waiting for an answer that decides it.')
                : lockedHint;
          const label = open
            ? `${t('Page')} ${item.label}: ${title}`
            : `${t('Page')} ${item.label || ''}${item.label ? '. ' : ''}${planHint}`.trim();
          return (
            <li key={item.number}>
              <button
                type="button"
                className="survey-pager__item"
                data-state={state}
                data-plan={isCurrent || finished ? undefined : item.plan}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={!open || undefined}
                aria-label={label}
                title={open ? title : planHint}
                onClick={() => {
                  if (open && !isCurrent) onGo(item.number);
                }}
              >
                {finished ? (
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                ) : item.plan === 'hidden' && !isCurrent ? (
                  <Minus size={14} strokeWidth={3} aria-hidden="true" />
                ) : (
                  item.label
                )}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="survey-pager__item survey-pager__item--review"
            data-state={current === 'review' ? 'current' : reviewReachable ? 'open' : 'locked'}
            aria-current={current === 'review' ? 'step' : undefined}
            aria-disabled={!reviewReachable || undefined}
            title={reviewReachable ? t('Review') : lockedHint}
            onClick={() => {
              if (reviewReachable && current !== 'review') onReview();
            }}
          >
            {t('Review')}
          </button>
        </li>
      </ol>
      {showLegend ? (
        <p className="survey-pager__legend">
          <span data-plan="shown">{t('Will be asked')}</span>
          <span data-plan="pending">{t('Waiting for your answer')}</span>
          <span data-plan="hidden">{t('Skipped')}</span>
        </p>
      ) : null}
    </nav>
  );
}
