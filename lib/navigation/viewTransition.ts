/**
 * Soft navigation helpers for admin UI — View Transitions when available.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

type ViewTransitionLike = {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Run a DOM/route update inside a View Transition when supported.
 * Falls back to an immediate update (and never throws).
 */
export function runWithViewTransition(update: () => void): void {
  if (typeof document === 'undefined' || prefersReducedMotion()) {
    update();
    return;
  }
  const doc = document as Document & ViewTransitionLike;
  if (typeof doc.startViewTransition !== 'function') {
    update();
    return;
  }
  try {
    doc.startViewTransition(update);
  } catch {
    update();
  }
}
