'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getQueryParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

/**
 * Read a query param without next/navigation `useSearchParams`.
 * Avoids Suspense CSR bailout that can throw React #318 on static Firebase Hosting.
 */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getQueryParam(name),
    () => null,
  );
}
