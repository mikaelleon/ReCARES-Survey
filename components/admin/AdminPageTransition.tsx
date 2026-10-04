'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Re-plays a short enter animation when the admin route changes.
 * Sidebar stays outside this wrapper so chrome does not flash.
 */
export function AdminPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div key={pathname} className="admin-page-transition">
      {children}
    </div>
  );
}
