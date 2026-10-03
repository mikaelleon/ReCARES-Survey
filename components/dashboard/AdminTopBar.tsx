'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/lib/auth/AuthProvider';
import { goToAdminLogin } from '@/lib/firebase/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';

function initials(name?: string, email?: string): string {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

/**
 * Persistent top chrome: nav open (mobile), notifications, account menu.
 * Sidebar stays navigation-only; identity lives here.
 */
export function AdminTopBar({ onOpenNav }: { onOpenNav: () => void }) {
  const { user, logout } = useAuth();
  const { toggleTheme, themeLabel } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const bellId = useId();

  useEffect(() => {
    if (!menuOpen && !bellOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (bellOpen && bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setBellOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, bellOpen]);

  if (!user) return null;

  const displayName = user.name || user.email;
  const roleTone = user.role === 'superadmin' ? 'amber' : 'emerald';
  const statusTone =
    user.status === 'active' ? 'emerald' : user.status === 'removed' ? 'danger' : 'neutral';

  const handleLogout = () => {
    setMenuOpen(false);
    void logout().then(() => goToAdminLogin());
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button
          type="button"
          className="admin-topbar__menu"
          aria-label="Open menu"
          onClick={onOpenNav}
        >
          <Menu size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className="admin-topbar__right">
        <div className="admin-topbar__bell-wrap" ref={bellRef}>
          <button
            type="button"
            className="admin-topbar__icon-btn"
            aria-label="Notifications"
            aria-expanded={bellOpen}
            aria-controls={bellId}
            onClick={() => {
              setBellOpen((v) => !v);
              setMenuOpen(false);
            }}
          >
            <Bell size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {bellOpen ? (
            <div id={bellId} className="admin-topbar__popover" role="status">
              <p className="admin-topbar__popover-title">Notifications</p>
              <p className="admin-topbar__popover-empty">No notifications yet.</p>
            </div>
          ) : null}
        </div>

        <div className="admin-topbar__account" ref={menuRef}>
          <button
            type="button"
            className="admin-topbar__user"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => {
              setMenuOpen((v) => !v);
              setBellOpen(false);
            }}
          >
            <span className="admin-avatar" aria-hidden="true">
              {initials(user.name, user.email)}
            </span>
            <span className="admin-topbar__user-text">
              <span className="admin-topbar__user-name">{displayName}</span>
              <span className="admin-topbar__user-email">{user.email}</span>
            </span>
            <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div id={menuId} className="admin-topbar__popover admin-topbar__popover--account" role="menu">
              <div className="admin-topbar__badges">
                <StatusBadge tone={roleTone}>{user.role || '—'}</StatusBadge>
                <StatusBadge tone={statusTone}>{user.status || 'active'}</StatusBadge>
              </div>
              <p className="admin-topbar__method">Signed in with {user.signInMethod}</p>
              <div className="admin-topbar__menu-row">
                <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} />
                <button
                  type="button"
                  className="admin-topbar__logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
