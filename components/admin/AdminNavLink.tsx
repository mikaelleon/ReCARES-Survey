'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { runWithViewTransition } from '@/lib/navigation/viewTransition';

/**
 * Admin sidebar link — uses View Transitions when the browser supports them.
 */
export function AdminNavLink({
  href,
  className,
  title,
  'aria-current': ariaCurrent,
  onNavigate,
  children,
}: {
  href: string;
  className?: string;
  title?: string;
  'aria-current'?: 'page' | undefined;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate?.();
    runWithViewTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      className={className}
      title={title}
      aria-current={ariaCurrent}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
