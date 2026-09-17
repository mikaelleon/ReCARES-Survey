'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fixed control that scrolls the page to the top after the user scrolls down.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  return (
    <button
      type="button"
      className="scroll-top"
      onClick={goTop}
      aria-label="Scroll to top"
      data-visible={visible ? 'true' : 'false'}
      tabIndex={visible ? 0 : -1}
    >
      <ChevronUp size={22} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}
