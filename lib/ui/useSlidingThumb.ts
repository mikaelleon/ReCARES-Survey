'use client';

import { useLayoutEffect, useRef } from 'react';

/** What marks the chosen option inside a segmented control. */
const ACTIVE = '[aria-pressed="true"], [aria-selected="true"], .is-active';

/**
 * One thumb that slides to whichever option is chosen, whatever its width. It measures the
 * active option and writes `--thumb-x/y/w/h` on the container; styles/admin-polish.css draws the
 * thumb as the container's `::before`. `data-thumb` is "set" for the first paint (no travel from
 * nowhere) and "live" from the next frame on, when movement is allowed.
 */
export function useSlidingThumb<T extends HTMLElement>(activeKey: string | null | undefined) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;

    const measure = () => {
      const active = el.querySelector<HTMLElement>(ACTIVE);
      if (!active) {
        el.removeAttribute('data-thumb');
        return;
      }
      // Relative to the container's padding box, which is where the thumb is positioned from.
      const box = el.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      el.style.setProperty('--thumb-x', `${rect.left - box.left - el.clientLeft}px`);
      el.style.setProperty('--thumb-y', `${rect.top - box.top - el.clientTop}px`);
      el.style.setProperty('--thumb-w', `${rect.width}px`);
      el.style.setProperty('--thumb-h', `${rect.height}px`);
      if (el.getAttribute('data-thumb') !== 'live') {
        el.setAttribute('data-thumb', 'set');
        // A timer, not a frame callback: frames pause in a hidden tab, and 'live' must still arrive.
        // Scheduled again after every re-run, so React's strict-mode remount cannot strand it.
        window.clearTimeout(timer);
        timer = window.setTimeout(() => el.setAttribute('data-thumb', 'live'), 60);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.querySelectorAll('button').forEach((button) => observer.observe(button));
    void document.fonts?.ready.then(measure);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [activeKey]);

  return ref;
}
