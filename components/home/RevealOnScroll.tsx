'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Extra delay after the reveal starts (ms), for staggered children. */
  delayMs?: number;
}

/**
 * One-shot enter animation when ~20% of the element is visible.
 * Reduced-motion users see the final state immediately.
 */
export function RevealOnScroll({
  children,
  className = '',
  style,
  delayMs = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' reveal--in' : ''}${className ? ` ${className}` : ''}`}
      style={{
        ...style,
        transitionDelay: visible && delayMs ? `${delayMs}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
