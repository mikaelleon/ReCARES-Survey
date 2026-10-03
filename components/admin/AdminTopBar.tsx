'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { pathForAccessState } from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';

function subtitleForPath(pathname: string): string {
  if (pathname.includes('/complete')) return 'Finish access';
  if (pathname.includes('/pending')) return 'Awaiting approval';
  if (pathname.includes('/removed')) return 'Access removed';
  if (pathname.includes('/dashboard')) return 'Response management';
  if (pathname.includes('/signup')) return 'Proponent signup';
  if (pathname.includes('/login')) return 'Proponent login';
  return 'Admin';
}

/**
 * Shared sticky admin header: brand, section label, theme/lang, session actions.
 */
export function AdminTopBar({
  lang,
  onLangChange,
}: {
  lang: 'EN' | 'FIL';
  onLangChange: (value: 'EN' | 'FIL') => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toggleTheme, themeLabel } = useTheme();
  const subtitle = subtitleForPath(pathname);

  const handleLogout = () => {
    void logout().then(() => router.push('/admin/login'));
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__brand">
        <Link
          href={
            user
              ? user.accessState === 'active'
                ? '/admin/dashboard'
                : pathForAccessState(user.accessState) === '/admin/login'
                  ? '/admin/complete'
                  : pathForAccessState(user.accessState)
              : '/'
          }
          className="admin-topbar__logo"
        >
          ReCARES Survey
        </Link>
        <span className="admin-topbar__sub">{subtitle}</span>
      </div>
      <div className="admin-topbar__actions">
        <LanguageToggle value={lang} onChange={onLangChange} />
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
