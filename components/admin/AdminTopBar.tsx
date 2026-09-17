'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';

function subtitleForPath(pathname: string): string {
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
    logout();
    router.push('/');
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__brand">
        <Link href={user ? '/admin/dashboard' : '/'} className="admin-topbar__logo">
          ReCARES
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
