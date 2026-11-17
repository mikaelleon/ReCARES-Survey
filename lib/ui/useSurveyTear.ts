'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useSurveyWindow } from '@/lib/admin/useSurveyWindow';
import { prefersReducedMotion, TEAR_MS, useTear } from '@/lib/ui/useTear';

/**
 * The "Start the survey" stub, shared by the hero and the board. Open: it tears
 * off, then the survey opens. Paused or closed: a plain link that says so. Without
 * JavaScript, with a modifier key, or with reduced motion it is an ordinary link.
 */
export function useSurveyTear() {
  const router = useRouter();
  const { acceptsResponses, config } = useSurveyWindow();
  const { state, tear } = useTear();

  const survey = acceptsResponses ? 'open' : config.status === 'paused' ? 'paused' : 'closed';
  const label =
    survey === 'open' ? 'Start the survey' : survey === 'paused' ? 'Survey paused' : 'Survey closed';

  const onStubClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (survey !== 'open' || state === 'tearing' || prefersReducedMotion()) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    tear(() => router.push('/survey'));
  };

  return { survey, label, tear: state, onStubClick, tearMs: TEAR_MS };
}
