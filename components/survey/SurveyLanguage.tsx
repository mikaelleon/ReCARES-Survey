'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { translate, type SurveyLang } from '@/survey/i18n';

const STORAGE_KEY = 'recares-survey-lang';

interface SurveyLanguageValue {
  lang: SurveyLang;
  setLang: (lang: SurveyLang) => void;
  t: (text: string) => string;
  /** Tagalog wording supplied by the live instrument (English text to Tagalog text). */
  setOverrides: (overrides: Record<string, string>) => void;
}

const SurveyLanguageContext = createContext<SurveyLanguageValue>({
  lang: 'EN',
  setLang: () => {},
  t: (text) => text,
  setOverrides: () => {},
});

export function SurveyLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SurveyLang>('EN');
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'FIL') setLangState('FIL');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'FIL' ? 'fil' : 'en';
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  const langRef = useRef<SurveyLang>('EN');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      delete document.documentElement.dataset.langPhase;
    };
  }, []);

  const commit = useCallback((next: SurveyLang) => {
    langRef.current = next;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Switching dips the page content for a beat while the words change, then
   * brings it back (see data-lang-phase in globals.css). With reduced motion
   * the words simply swap.
   */
  const setLang = useCallback(
    (next: SurveyLang) => {
      if (next === langRef.current) return;
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        commit(next);
        return;
      }
      const root = document.documentElement;
      root.dataset.langPhase = 'out';
      timers.current.push(
        window.setTimeout(() => {
          commit(next);
          root.dataset.langPhase = 'in';
        }, 150),
        window.setTimeout(() => {
          delete root.dataset.langPhase;
        }, 480),
      );
    },
    [commit],
  );

  const value = useMemo<SurveyLanguageValue>(
    () => ({
      lang,
      setLang,
      setOverrides,
      t: (text) => (lang === 'FIL' && overrides[text] ? overrides[text]! : translate(text, lang)),
    }),
    [lang, setLang, overrides],
  );

  return <SurveyLanguageContext.Provider value={value}>{children}</SurveyLanguageContext.Provider>;
}

export function useSurveyLanguage(): SurveyLanguageValue {
  return useContext(SurveyLanguageContext);
}

export function useT(): (text: string) => string {
  return useContext(SurveyLanguageContext).t;
}

/** EN / Tagalog switch shown at the top of every survey screen. */
export function SurveyLanguageToggle() {
  const { lang, setLang } = useSurveyLanguage();
  const { toggleTheme, themeLabel } = useTheme();
  const options: Array<{ id: SurveyLang; label: string }> = [
    { id: 'EN', label: 'English' },
    { id: 'FIL', label: 'Tagalog' },
  ];
  return (
    <div className="survey-controls">
    <div className="survey-lang" role="group" aria-label="Language / Wika">
      <div className="lang-switch" data-lang={lang}>
        <span className="lang-switch__thumb" aria-hidden="true" />
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            lang={option.id === 'FIL' ? 'fil' : 'en'}
            aria-pressed={lang === option.id}
            onClick={() => setLang(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className="visually-hidden" role="status" aria-live="polite">
        {lang === 'FIL' ? 'Wika: Tagalog' : 'Language: English'}
      </span>
    </div>
    <span className="survey-theme">
      <ThemeToggle aria-label={themeLabel} onClick={toggleTheme} />
    </span>
    </div>
  );
}
