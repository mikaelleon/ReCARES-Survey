'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/lib/auth/AuthProvider';
import { goToAdminLogin, goToAdminPath } from '@/lib/firebase/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';

function subtitleForPath(pathname: string): string {
  if (pathname.includes('/complete')) return 'Finish access';
  if (pathname.includes('/pending')) return 'Awaiting approval';
  if (pathname.includes('/removed')) return 'Access removed';
  if (pathname.includes('/signup')) return 'Proponent signup';
  if (pathname.includes('/login')) return 'Proponent login';
  return 'Admin';
}

/**
 * Minimal top chrome for login / signup / pending / removed / complete.
 * No EN/FIL — admin surfaces are English-only.
 */
export function AdminAuthChrome() {
  const pathname = usePathname() || '';
  const { user, logout } = useAuth();
  const { toggleTheme, themeLabel } = useTheme();
  const subtitle = subtitleForPath(pathname);

  const handleLogout = () => {
    void logout().then(() => goToAdminLogin());
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__brand">
        <Link
          href={user ? '#' : '/'}
          className="admin-topbar__logo"
          onClick={(event) => {
            if (!user) return;
            event.preventDefault();
            goToAdminPath(
              user.accessState === 'pending'
                ? '/admin/pending'
                : user.accessState === 'removed'
                  ? '/admin/removed'
                  : user.accessState === 'active'
                    ? '/admin/dashboard'
                    : '/admin/complete',
            );
          }}
        >
          ReCARES Survey
        </Link>
        <span className="admin-topbar__sub">{subtitle}</span>
      </div>
      <div className="admin-topbar__actions">
        <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} onDark />
        {user ? (
          <>
            <span className="admin-topbar__email">{user.email}</span>
            <button type="button" className="admin-topbar__logout" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
