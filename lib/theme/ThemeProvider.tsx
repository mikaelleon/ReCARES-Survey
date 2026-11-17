'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

/** Fired just before the theme changes by a toggle. detail: the new Theme. */
export const THEME_SHIFT = 'theme:shift';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  themeLabel: string;
}

/**
 * Only an explicit choice (the moon button) is stored. With nothing stored, the screens follow the
 * device's light or dark setting, live. The old `recares-theme` key is ignored on purpose: it was
 * written on every first visit, so it cannot tell a real choice from a default.
 */
const STORAGE_KEY = 'recares-theme-choice';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readChoice(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // storage unavailable: behave as if nothing was chosen
  }
  return null;
}

function systemTheme(): Theme {
  try {
    return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const themeRef = useRef<Theme>('light');
  themeRef.current = theme;

  useEffect(() => {
    const initial = readChoice() ?? systemTheme();
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);

    // Follow the device while the visitor has not picked a mode themselves.
    const media = window.matchMedia?.(DARK_QUERY);
    if (!media) return;
    const onChange = () => {
      if (readChoice() !== null) return;
      const next: Theme = media.matches ? 'dark' : 'light';
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = themeRef.current === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice still applies for this visit
    }
    /* Tell the landing stage first, so it can start its dusk or dawn crossfade before the
       theme attribute flips under it (see FenceStage). */
    window.dispatchEvent(new CustomEvent<Theme>(THEME_SHIFT, { detail: next }));
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      themeLabel: theme === 'dark' ? 'Light mode' : 'Dark mode',
    }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
