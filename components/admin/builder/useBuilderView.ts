'use client';

import { useCallback, useEffect, useState } from 'react';

export type BuilderView = 'comfortable' | 'compact' | 'list' | 'table';

export const BUILDER_VIEWS: BuilderView[] = ['comfortable', 'compact', 'list', 'table'];

const STORAGE_KEY = 'recares-survey-builder-view';

function isView(value: unknown): value is BuilderView {
  return typeof value === 'string' && (BUILDER_VIEWS as string[]).includes(value);
}

/**
 * The chosen view, remembered in this browser. Falls back to Comfortable (or List on a phone)
 * when nothing is stored or storage is blocked.
 */
export function useBuilderView(): [BuilderView, (next: BuilderView) => void] {
  const [view, setView] = useState<BuilderView>('comfortable');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isView(stored)) {
        setView(stored);
        return;
      }
    } catch {
      /* storage unavailable: use the defaults below */
    }
    if (window.matchMedia('(max-width: 640px)').matches) setView('list');
  }, []);

  const choose = useCallback((next: BuilderView) => {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice still applies for this visit */
    }
  }, []);

  return [view, choose];
}
