'use client';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';

const CONFIG_DOC = ['appConfig', 'signup'] as const;

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

function envAccessCode(): string | null {
  const value = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE?.trim();
  return value || null;
}

/** Random 8-char code (no ambiguous 0/O/1/I). */
export function createAccessCodeValue(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * Live signup code: Firestore override, else env bootstrap.
 * Doc is world-readable by design (same exposure as NEXT_PUBLIC_*).
 */
export async function getSignupAccessCode(): Promise<string | null> {
  try {
    const db = getFirestoreDb();
    if (db) {
      const snap = await getDoc(doc(db, CONFIG_DOC[0], CONFIG_DOC[1]));
      const code = snap.data()?.accessCode;
      if (typeof code === 'string' && code.trim()) return code.trim();
    }
  } catch {
    /* fall through to env */
  }
  return envAccessCode();
}

export async function validateSignupAccessCode(accessCode: string): Promise<boolean> {
  const expected = await getSignupAccessCode();
  if (!expected) return false;
  return accessCode.trim() === expected;
}

/** Superadmin-only write. Returns the new code (also persisted). */
export async function generateSignupAccessCode(updatedBy: string): Promise<string> {
  const db = requireDb();
  const code = createAccessCodeValue();
  await setDoc(
    doc(db, CONFIG_DOC[0], CONFIG_DOC[1]),
    {
      accessCode: code,
      updatedAt: serverTimestamp(),
      updatedBy,
    },
    { merge: true },
  );
  return code;
}
