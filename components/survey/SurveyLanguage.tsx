'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
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

  const setLang = useCallback((next: SurveyLang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

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
  return (
    <div className="survey-lang" role="group" aria-label="Language / Wika">
      <LanguageToggle value={lang} onChange={setLang} labels={{ EN: 'English', FIL: 'Tagalog' }} />
    </div>
  );
}
