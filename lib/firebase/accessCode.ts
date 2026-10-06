'use client';

import { FirebaseError } from 'firebase/app';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';

const CONFIG_DOC = ['appConfig', 'signup'] as const;

/** Normalize for compare/store — case-insensitive, no surrounding spaces. */
export function normalizeAccessCode(value: string): string {
  return value.trim().toUpperCase();
}

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

function envAccessCode(): string | null {
  const value = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE;
  if (typeof value !== 'string') return null;
  const normalized = normalizeAccessCode(value);
  return normalized || null;
}

function messageForGenerateError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return 'Could not save. Confirm you are a superadmin and Firestore rules for appConfig/signup are deployed.';
    }
    if (error.code === 'unavailable') {
      return 'Could not reach Firestore. Check your connection and allow trackers for this site.';
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not generate access code.';
}

/** Random 8-char code (no ambiguous 0/O/1/I). Always uppercase. */
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
      if (typeof code === 'string') {
        const normalized = normalizeAccessCode(code);
        if (normalized) return normalized;
      }
    }
  } catch {
    /* fall through to env */
  }
  return envAccessCode();
}

export async function validateSignupAccessCode(accessCode: string): Promise<boolean> {
  const expected = await getSignupAccessCode();
  if (!expected) return false;
  return normalizeAccessCode(accessCode) === expected;
}

/** Superadmin-only write. Returns the new code (also persisted). */
export async function generateSignupAccessCode(updatedBy: string): Promise<string> {
  try {
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
  } catch (error) {
    throw new Error(messageForGenerateError(error));
  }
}
