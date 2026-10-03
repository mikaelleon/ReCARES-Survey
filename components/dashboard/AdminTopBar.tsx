'use client';

import { Menu } from 'lucide-react';

/**
 * Mobile-only chrome: opens the sidebar drawer.
 * Account, notifications, and theme live in SidebarNav footer.
 */
export function AdminTopBar({ onOpenNav }: { onOpenNav: () => void }) {
  return (
    <header className="admin-topbar admin-topbar--mobile-only">
      <button
        type="button"
        className="admin-topbar__menu"
        aria-label="Open menu"
        aria-controls="admin-sidebar-panel"
        onClick={onOpenNav}
      >
        <Menu size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <span className="admin-topbar__mobile-title">ReCARES Survey</span>
    </header>
  );
}
