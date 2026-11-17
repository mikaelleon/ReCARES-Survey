'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The step bar stays at the top while the page scrolls, so any page is one tap away from anywhere.
 * `data-stuck` turns on once it has left its resting place, to draw a hairline under it.
 */
export function StickyProgress({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry!.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className="survey-progress__sentinel" aria-hidden="true" />
      <div className="survey-progress" data-stuck={stuck ? 'true' : 'false'}>
        {children}
      </div>
    </>
  );
}
