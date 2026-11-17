'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tear storyboard (ms). Keep in step with `stubTear` in styles/notice.css,
 * which reads the same number through --tear-ms.
 *   0       press: the left end pulls down (CSS :active)
 *   0-84    the stub lets go, torn edge shows
 *   84-560  it falls on an arc, the paper kicks back
 *   560     whatever the tear was for happens (the survey opens)
 */
export const TEAR_MS = 560;

/** If the page never changes, put the stub back rather than leave no way in. */
const TEAR_RESET_MS = 4000;

export type TearState = 'idle' | 'tearing' | 'torn' | 'restored';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * State for a notice's tear-off stub. `tear(then, { keepTorn })` plays the tear and
 * calls `then` when it ends; with `keepTorn` the paper stays torn (a form that was sent),
 * otherwise a stall timer restores the stub (a link that did not open).
 */
export function useTear() {
  const [state, setState] = useState<TearState>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setState('restored'); // back/forward cache restores a torn page
    };
    window.addEventListener('pageshow', onShow);
    const pending = timers.current;
    return () => {
      window.removeEventListener('pageshow', onShow);
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const tear = useCallback((then: () => void, options: { keepTorn?: boolean } = {}) => {
    if (prefersReducedMotion()) {
      // Same outcome, no movement.
      setState(options.keepTorn ? 'torn' : 'idle');
      then();
      return;
    }
    setState('tearing');
    timers.current.push(
      window.setTimeout(() => {
        if (options.keepTorn) setState('torn');
        then();
      }, TEAR_MS),
    );
    if (!options.keepTorn) {
      timers.current.push(window.setTimeout(() => setState('restored'), TEAR_RESET_MS));
    }
  }, []);

  const restore = useCallback(() => setState('restored'), []);

  return { state, tear, restore };
}
