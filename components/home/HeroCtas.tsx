'use client';

import { type MouseEvent } from 'react';
import { Button } from '@/components/ui/Button';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hero CTAs with scoped glow / lift micro-interactions (CSS classes).
 */
export function HeroCtas() {
  const onLearnMore = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;
    e.preventDefault();
    const el = document.getElementById('about');
    if (!el) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="home-hero__ctas">
      <span className="hero-cta--primary">
        <Button variant="primary" onDark href="/survey">
          Start the survey
        </Button>
      </span>
      <span className="hero-cta--secondary">
        <Button variant="secondary" onDark href="/#about" onClick={onLearnMore}>
          Learn more
        </Button>
      </span>
    </div>
  );
}
