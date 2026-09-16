'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

/**
 * Lazily initializes Firebase only when real credentials exist.
 * Missing env vars must not crash build or runtime.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!hasFirebaseConfig()) {
    return null;
  }

  try {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch {
    // TODO: surface a non-fatal init error once logging is wired
    return null;
  }
}

/** Convenience export — may be null until `.env.local` is configured. */
export const app = typeof window !== 'undefined' ? getFirebaseApp() : null;
