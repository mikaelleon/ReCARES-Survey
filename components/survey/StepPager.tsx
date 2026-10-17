'use client';

import { Check } from 'lucide-react';
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
  roster: Array<{ number: number; shown: boolean }>;
  current: number | 'review';
  reachable: Set<number>;
  done: Set<number>;
  reviewReachable: boolean;
  titleOf: (stepNumber: number) => string;
  onGo: (stepNumber: number) => void;
  onReview: () => void;
}) {
  const t = useT();
  const lockedHint = t('Answer the earlier pages first to open this one.');

  return (
    <nav className="survey-pager" aria-label={t('Survey pages')}>
      <ol>
        {roster.map((item, index) => {
          const isCurrent = current === item.number;
          const open = item.shown && reachable.has(item.number);
          const finished = done.has(item.number) && !isCurrent;
          const title = titleOf(item.number);
          const state = isCurrent ? 'current' : finished ? 'done' : open ? 'open' : 'locked';
          const label = open
            ? `${t('Page')} ${index + 1}: ${title}`
            : `${t('Page')} ${index + 1}. ${lockedHint}`;
          return (
            <li key={item.number}>
              <button
                type="button"
                className="survey-pager__item"
                data-state={state}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={!open || undefined}
                aria-label={label}
                title={open ? title : lockedHint}
                onClick={() => {
                  if (open && !isCurrent) onGo(item.number);
                }}
              >
                {finished ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : index + 1}
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
    </nav>
  );
}
