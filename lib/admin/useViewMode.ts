'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A view-mode preference that survives refresh. Storage is optional: if it is
 * unavailable (private window, blocked site data) the default is used and the
 * choice simply lasts for the session.
 *
 * `narrowDefault` applies only when nothing is saved and the viewport is phone-sized.
 */
export function useViewMode<T extends string>(
  storageKey: string,
  allowed: readonly T[],
  defaultMode: T,
  narrowDefault?: T,
): [T, (next: T) => void] {
  const [mode, setMode] = useState<T>(defaultMode);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(storageKey);
    } catch {
      saved = null;
    }
    if (saved && (allowed as readonly string[]).includes(saved)) {
      setMode(saved as T);
      return;
    }
    if (narrowDefault && window.matchMedia?.('(max-width: 640px)').matches) {
      setMode(narrowDefault);
    }
  }, [storageKey, allowed, narrowDefault]);

  const update = useCallback(
    (next: T) => {
      setMode(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* storage unavailable: keep the choice for this session only */
      }
    },
    [storageKey],
  );

  return [mode, update];
}
