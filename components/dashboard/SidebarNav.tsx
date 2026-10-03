'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useId,
  useState,
  type ComponentType,
  type SVGProps,
} from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarHeart,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/lib/auth/AuthProvider';
import { goToAdminLogin } from '@/lib/firebase/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

function isActivePath(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const target = href.endsWith('/') ? href.slice(0, -1) : href;
  return normalized === target;
}

/**
 * Persistent left nav for active proponent / superadmin app pages.
 * Desktop: sticky sidebar. Mobile: hamburger drawer.
 * "Members & Invites" is omitted from the DOM for non-superadmins.
 */
export function SidebarNav() {
  const pathname = usePathname() || '';
  const { user, logout, isSuperadmin } = useAuth();
  const { toggleTheme, themeLabel } = useTheme();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => {
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const links: { href: string; label: string; Icon: IconType }[] = [
    { href: '/admin/dashboard/', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/responses/', label: 'Responses', Icon: BarChart3 },
    { href: '/admin/interviews/', label: 'Interview Invites', Icon: CalendarHeart },
  ];

  const handleLogout = () => {
    void logout().then(() => goToAdminLogin());
  };

  const roleTone = user.role === 'superadmin' ? 'amber' : 'emerald';
  const statusTone =
    user.status === 'active' ? 'emerald' : user.status === 'removed' ? 'danger' : 'neutral';

  const nav = (
    <>
      <div className="admin-sidebar__brand">
        <Link
          href="/admin/dashboard/"
          className="admin-sidebar__logo"
          onClick={() => setOpen(false)}
        >
          ReCARES Survey
        </Link>
        <button
          type="button"
          className="admin-sidebar__close"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <nav className="admin-sidebar__nav" aria-labelledby={titleId}>
        <p id={titleId} className="visually-hidden">
          Admin sections
        </p>
        {links.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar__link${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon className="admin-sidebar__icon" size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
        {isSuperadmin ? (
          <Link
            href="/admin/members/"
            className={`admin-sidebar__link${isActivePath(pathname, '/admin/members/') ? ' is-active' : ''}`}
            aria-current={isActivePath(pathname, '/admin/members/') ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            <Users className="admin-sidebar__icon" size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>Members &amp; Invites</span>
          </Link>
        ) : null}
      </nav>

      <div className="admin-sidebar__footer">
        <Link href="/" className="admin-sidebar__resident" onClick={() => setOpen(false)}>
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>Back to resident site</span>
        </Link>

        <div className="admin-sidebar__session">
          <div className="admin-sidebar__name">{user.name || user.email}</div>
          <div className="admin-sidebar__badges">
            <StatusBadge tone={roleTone}>{user.role || '—'}</StatusBadge>
            <StatusBadge tone={statusTone}>{user.status || 'active'}</StatusBadge>
          </div>
          <p className="admin-sidebar__method">Signed in with {user.signInMethod}</p>
          <div className="admin-sidebar__actions">
            <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} onDark />
            <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
              <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="admin-mobile-bar">
        <button
          type="button"
          className="admin-mobile-bar__menu"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-sidebar-panel"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <Link href="/admin/dashboard/" className="admin-mobile-bar__logo">
          ReCARES Survey
        </Link>
        <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} onDark />
      </header>

      {open ? (
        <button
          type="button"
          className="admin-sidebar__backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar-panel"
        className={`admin-sidebar${open ? ' is-open' : ''}`}
        aria-label="Admin navigation"
      >
        {nav}
      </aside>
    </>
  );
}
