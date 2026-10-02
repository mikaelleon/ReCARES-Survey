'use client';

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase/config';

export interface AdminProfile {
  fullName: string;
  email: string;
  role: string;
  status: string;
}

const NOT_CONFIGURED = 'Firebase is not configured. Add the project keys to .env.local.';

function requireServices() {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  if (!auth || !db) {
    throw new Error(NOT_CONFIGURED);
  }
  return { auth, db };
}

/**
 * Client-side access-code check. Firestore rules do not currently test this
 * code; anyone who is already signed in can still create their own admins doc
 * by calling Firestore directly. Keep the real code in env, not in source.
 */
export function isValidAccessCode(accessCode: string): boolean {
  const expected = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE?.trim();
  if (!expected) return false;
  return accessCode.trim() === expected;
}

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'admins', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    email: typeof data.email === 'string' ? data.email : '',
    role: typeof data.role === 'string' ? data.role : '',
    status: typeof data.status === 'string' ? data.status : '',
  };
}

/**
 * Email/password registration plus the matching admins profile.
 * Password stays in Firebase Authentication only.
 */
export async function registerAdmin(params: {
  fullName: string;
  email: string;
  password: string;
  role: string;
  accessCode: string;
}): Promise<void> {
  if (!isValidAccessCode(params.accessCode)) {
    throw new Error('Invalid access code.');
  }
  const { auth, db } = requireServices();
  const credential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  await setDoc(doc(db, 'admins', credential.user.uid), {
    fullName: params.fullName.trim(),
    email: params.email.trim(),
    role: params.role.trim() || 'Proponent',
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

/**
 * Finish a Google sign-in that has no admins document yet.
 * Does not set a password.
 */
export async function completeGoogleAdmin(params: {
  role: string;
  accessCode: string;
}): Promise<void> {
  if (!isValidAccessCode(params.accessCode)) {
    throw new Error('Invalid access code.');
  }
  const { auth, db } = requireServices();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in with Google before entering the access code.');
  }
  const existing = await getDoc(doc(db, 'admins', user.uid));
  if (existing.exists()) return;
  await setDoc(doc(db, 'admins', user.uid), {
    fullName: user.displayName?.trim() || 'Proponent',
    email: user.email ?? '',
    role: params.role.trim() || 'Proponent',
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const { auth } = requireServices();
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

/** Returns whether this Google account already has an admins profile. */
export async function loginWithGoogle(): Promise<'authorized' | 'needs-access-code'> {
  const { auth } = requireServices();
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const profile = await getAdminProfile(credential.user.uid);
  return profile ? 'authorized' : 'needs-access-code';
}

export async function logoutAdmin(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function currentAuthUser(): User | null {
  return getFirebaseAuth()?.currentUser ?? null;
}

/** Handout mapping: providerData[0].providerId is password or google.com. */
export function signInMethodLabel(providerId: string | undefined): string {
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'password') return 'Email and Password';
  return 'Unknown';
}

export function loginErrorMessage(error: unknown): string {
  const code = firebaseCode(error);
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The browser blocked the Google sign-in window.';
  }
  if (error instanceof Error && error.message === NOT_CONFIGURED) {
    return error.message;
  }
  if (error instanceof Error && error.message === 'Invalid access code.') {
    return error.message;
  }
  return 'Sign-in failed. Check your email and password and try again.';
}

export function signupErrorMessage(error: unknown): string {
  const code = firebaseCode(error);
  if (error instanceof Error && error.message === 'Invalid access code.') {
    return 'Invalid access code.';
  }
  if (error instanceof Error && error.message === NOT_CONFIGURED) {
    return error.message;
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with that email already exists.';
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  return 'Could not create the account. Try again.';
}

function firebaseCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}
