'use client';

import { FirebaseError } from 'firebase/app';

/**
 * User-facing message for Firestore create/update/delete failures.
 */
export function messageForFirestoreWriteError(
  error: unknown,
  fallback: string,
  options?: { resourceHint?: string },
): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      const hint = options?.resourceHint
        ? ` Confirm you are an active admin and Firestore rules for ${options.resourceHint} are deployed.`
        : ' Confirm you are signed in as an active admin and Firestore rules are deployed.';
      return `Permission denied.${hint}`;
    }
    if (error.code === 'unavailable') {
      return 'Could not reach Firestore. Check your connection and allow trackers for this site.';
    }
    if (error.code === 'not-found') {
      return 'That record was already deleted or could not be found.';
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function requireDocumentId(id: string, label = 'document'): string {
  const trimmed = id.trim();
  if (!trimmed) throw new Error(`Missing ${label} id.`);
  return trimmed;
}
