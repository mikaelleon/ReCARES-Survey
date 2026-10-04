'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarHeart,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from 'lucide-react';
import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { roleLabel } from '@/lib/admin/access';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/lib/auth/AuthProvider';
import { goToAdminLogin } from '@/lib/firebase/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';

type IconType = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }
>;

function isActivePath(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const target = href.endsWith('/') ? href.slice(0, -1) : href;
  return normalized === target;
}

function initials(name?: string, email?: string): string {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

/**
 * Persistent left nav for active proponent / superadmin app pages.
 * Desktop: fixed sidebar (collapsible to icon-only). Mobile: drawer.
 */
export function SidebarNav({
  open,
  onOpenChange,
  collapsed = false,
  onCollapsedChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname() || '';
  const { user, logout, can } = useAuth();
  const { toggleTheme, themeLabel } = useTheme();
  const titleId = useId();
  const bellId = useId();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onOpenChange(false);
    setBellOpen(false);
  }, [pathname, onOpenChange]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => {
      if (!mq.matches) onOpenChange(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!bellOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBellOpen(false);
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [bellOpen]);

  if (!user) return null;

  const primaryLinks: { href: string; label: string; Icon: IconType; show: boolean }[] = [
    { href: '/admin/dashboard/', label: 'Dashboard', Icon: LayoutDashboard, show: true },
    {
      href: '/admin/responses/',
      label: 'Responses',
      Icon: BarChart3,
      show: can('responsesDashboard'),
    },
    {
      href: '/admin/interviews/',
      label: 'Interview Invites',
      Icon: CalendarHeart,
      show: can('interviewInvites'),
    },
  ];

  const manageLinks: { href: string; label: string; Icon: IconType }[] = [
    { href: '/admin/members/', label: 'Members & Invites', Icon: Users },
  ];

  const displayName = user.name || user.email.split('@')[0] || user.email;
  const roleText = roleLabel(user.role);
  const statusText = (user.status || 'active').toLowerCase();

  const handleLogout = () => {
    void logout().then(() => goToAdminLogin());
  };

  return (
    <>
      {open ? (
        <button
          type="button"
          className="admin-sidebar__backdrop"
          aria-label="Close menu"
          onClick={() => onOpenChange(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar-panel"
        className={`admin-sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar__brand">
          <AdminNavLink
            href="/admin/dashboard/"
            className="admin-sidebar__logo"
            onNavigate={() => onOpenChange(false)}
            title="ReCARES Survey Administration"
          >
            <span className="admin-sidebar__logo-name">ReCARES</span>
            <span className="admin-sidebar__logo-sub">Survey Administration</span>
          </AdminNavLink>
          {onCollapsedChange ? (
            <button
              type="button"
              className="admin-sidebar__collapse"
              onClick={() => onCollapsedChange(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                size={18}
                strokeWidth={2.2}
                aria-hidden="true"
                className={collapsed ? 'is-flipped' : undefined}
              />
            </button>
          ) : null}
          <button
            type="button"
            className="admin-sidebar__close"
            onClick={() => onOpenChange(false)}
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar__nav" aria-labelledby={titleId}>
          <p id={titleId} className="visually-hidden">
            Admin sections
          </p>

          <p className="admin-sidebar__group-label" aria-hidden="true">
            Workspace
          </p>
          {primaryLinks
            .filter((link) => link.show)
            .map(({ href, label, Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <AdminNavLink
                  key={href}
                  href={href}
                  className={`admin-sidebar__link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  onNavigate={() => onOpenChange(false)}
                >
                  <Icon className="admin-sidebar__icon" size={18} strokeWidth={2.2} aria-hidden="true" />
                  <span className="admin-sidebar__link-label">{label}</span>
                </AdminNavLink>
              );
            })}

          <p className="admin-sidebar__group-label admin-sidebar__group-label--spaced" aria-hidden="true">
            Manage
          </p>
          {manageLinks.map(({ href, label, Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <AdminNavLink
                key={href}
                href={href}
                className={`admin-sidebar__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? label : undefined}
                onNavigate={() => onOpenChange(false)}
              >
                <Icon className="admin-sidebar__icon" size={18} strokeWidth={2.2} aria-hidden="true" />
                <span className="admin-sidebar__link-label">{label}</span>
              </AdminNavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__tools">
            <div className="admin-sidebar__bell-wrap" ref={bellRef}>
              <button
                type="button"
                className={`admin-sidebar__icon-btn${bellOpen ? ' is-active' : ''}`}
                aria-label="Notifications"
                aria-expanded={bellOpen}
                aria-controls={bellId}
                onClick={() => {
                  setBellOpen((v) => !v);
                }}
              >
                <Bell size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
              {bellOpen ? (
                <div id={bellId} className="admin-sidebar__popover" role="status">
                  <p className="admin-sidebar__popover-title">Notifications</p>
                  <p className="admin-sidebar__popover-empty">No notifications yet.</p>
                </div>
              ) : null}
            </div>
            <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} onDark quiet />
          </div>

          <div className="admin-sidebar__account">
            <div
              className="admin-sidebar__user"
              title={collapsed ? `${displayName} · ${roleText}` : undefined}
            >
              <span className="admin-avatar admin-avatar--on-dark" aria-hidden="true">
                {initials(user.name, user.email)}
              </span>
              <span className="admin-sidebar__user-text">
                <span className="admin-sidebar__user-name">{displayName}</span>
                <span className="admin-sidebar__user-meta">
                  {roleText}
                  <span className="admin-sidebar__user-dot" aria-hidden="true">
                    ·
                  </span>
                  <span className={`admin-sidebar__status admin-sidebar__status--${statusText}`}>
                    {statusText}
                  </span>
                </span>
              </span>
            </div>
            <button
              type="button"
              className="admin-sidebar__logout"
              onClick={handleLogout}
              title={collapsed ? 'Log out' : undefined}
            >
              <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
              <span className="admin-sidebar__logout-label">Log out</span>
            </button>
          </div>

          <Link
            href="/"
            className="admin-sidebar__resident"
            title={collapsed ? 'Back to resident site' : undefined}
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            <span className="admin-sidebar__resident-label">Back to resident site</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
