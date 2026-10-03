'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useId,
  type ComponentType,
  type SVGProps,
} from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarHeart,
  LayoutDashboard,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

function isActivePath(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const target = href.endsWith('/') ? href.slice(0, -1) : href;
  return normalized === target;
}

/**
 * Persistent left nav for active proponent / superadmin app pages.
 * Desktop: fixed sidebar. Mobile: drawer controlled by AdminTopBar.
 * Identity / logout live in AdminTopBar — footer is navigation only.
 */
export function SidebarNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname() || '';
  const { user, isSuperadmin } = useAuth();
  const titleId = useId();

  useEffect(() => {
    onOpenChange(false);
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

  if (!user) return null;

  const links: { href: string; label: string; Icon: IconType }[] = [
    { href: '/admin/dashboard/', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/responses/', label: 'Responses', Icon: BarChart3 },
    { href: '/admin/interviews/', label: 'Interview Invites', Icon: CalendarHeart },
  ];

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
        className={`admin-sidebar${open ? ' is-open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar__brand">
          <Link
            href="/admin/dashboard/"
            className="admin-sidebar__logo"
            onClick={() => onOpenChange(false)}
          >
            ReCARES Survey
          </Link>
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
            Menu
          </p>
          {links.map(({ href, label, Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-sidebar__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onOpenChange(false)}
              >
                <Icon className="admin-sidebar__icon" size={18} strokeWidth={2.2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
          {isSuperadmin ? (
            <>
              <p className="admin-sidebar__group-label admin-sidebar__group-label--spaced" aria-hidden="true">
                General
              </p>
              <Link
                href="/admin/members/"
                className={`admin-sidebar__link${isActivePath(pathname, '/admin/members/') ? ' is-active' : ''}`}
                aria-current={isActivePath(pathname, '/admin/members/') ? 'page' : undefined}
                onClick={() => onOpenChange(false)}
              >
                <Users className="admin-sidebar__icon" size={18} strokeWidth={2.2} aria-hidden="true" />
                <span>Members &amp; Invites</span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="admin-sidebar__footer">
          <Link href="/" className="admin-sidebar__resident" onClick={() => onOpenChange(false)}>
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>Back to resident site</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
