'use client';

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  getAdminAccessState,
  type AdminInvite,
  type AdminPermissions,
  type AdminProfile,
  type AdminRole,
  type AdminStatus,
} from '@/lib/admin/access';
import { normalizeSummaryWidgets } from '@/lib/admin/summaryWidgets';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase/config';

export type { AdminProfile, AdminInvite, AdminRole, AdminStatus, AdminPermissions };
export { getAdminAccessState } from '@/lib/admin/access';

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
 * Client-side access-code check. Firestore rules do not test this code.
 * Keep the real code in env, not in source.
 */
export function isValidAccessCode(accessCode: string): boolean {
  const expected = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE?.trim();
  if (!expected) return false;
  return accessCode.trim() === expected;
}

function parsePermissions(raw: unknown): AdminPermissions {
  if (!raw || typeof raw !== 'object') return {};
  const out: AdminPermissions = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'boolean') out[key] = value;
  }
  return out;
}

function parseRole(raw: unknown): AdminRole | null {
  if (raw === 'superadmin' || raw === 'admin') return raw;
  return null;
}

function parseStatus(raw: unknown): AdminStatus {
  if (raw === 'pending' || raw === 'active' || raw === 'removed') return raw;
  // Legacy docs that only had status: 'active' as a free string
  if (raw === 'active' || raw === undefined || raw === '') return 'active';
  return 'pending';
}

export function mapAdminDoc(data: Record<string, unknown>): AdminProfile {
  const legacyRole = typeof data.role === 'string' ? data.role : '';
  const requestedRole =
    typeof data.requestedRole === 'string'
      ? data.requestedRole
      : legacyRole && legacyRole !== 'superadmin' && legacyRole !== 'admin'
        ? legacyRole
        : legacyRole || '';

  const role = parseRole(data.role);
  // Legacy free-text role with status active → treat as admin with empty permissions
  // until a superadmin edits them. Superadmin bootstrap uses role: 'superadmin'.
  let normalizedRole = role;
  let status = parseStatus(data.status);
  if (!normalizedRole && status === 'active' && legacyRole === 'superadmin') {
    normalizedRole = 'superadmin';
  } else if (!normalizedRole && status === 'active' && (legacyRole === 'admin' || legacyRole === 'Proponent' || legacyRole)) {
    // Old profiles were immediately active with a free-text role label.
    normalizedRole = legacyRole === 'superadmin' ? 'superadmin' : 'admin';
  }

  let permissions = parsePermissions(data.permissions);
  // Legacy immediately-active profiles had no permissions map — keep responses usable.
  if (
    status === 'active' &&
    normalizedRole === 'admin' &&
    Object.keys(permissions).length === 0
  ) {
    permissions = { responsesDashboard: true, interviewInvites: false };
  }

  return {
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    email: typeof data.email === 'string' ? data.email : '',
    requestedRole,
    role: normalizedRole,
    status,
    permissions,
    summaryWidgets:
      data.summaryWidgets === undefined
        ? normalizeSummaryWidgets(undefined)
        : normalizeSummaryWidgets(data.summaryWidgets, { allowEmpty: true }),
    createdAt: (data.createdAt as AdminProfile['createdAt']) ?? null,
    approvedAt: (data.approvedAt as AdminProfile['approvedAt']) ?? null,
    approvedBy: typeof data.approvedBy === 'string' ? data.approvedBy : undefined,
    updatedAt: (data.updatedAt as AdminProfile['updatedAt']) ?? null,
    removedAt: (data.removedAt as AdminProfile['removedAt']) ?? null,
    removedBy: typeof data.removedBy === 'string' ? data.removedBy : undefined,
    inviteId: typeof data.inviteId === 'string' ? data.inviteId : undefined,
  };
}

/** Persist per-admin Summary widget pins (self-update; rules allow non-privileged keys). */
export async function saveSummaryWidgets(uid: string, widgetIds: string[]): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error(NOT_CONFIGURED);
  await updateDoc(doc(db, 'admins', uid), {
    summaryWidgets: normalizeSummaryWidgets(widgetIds, { allowEmpty: true }),
  });
}

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const snapshot = await getDoc(doc(db, 'admins', uid));
    if (!snapshot.exists()) return null;
    return mapAdminDoc(snapshot.data() as Record<string, unknown>);
  } catch (error) {
    // Brave Shields / ad blockers often surface as failed Firestore network calls.
    console.warn('getAdminProfile failed', error);
    throw error;
  }
}

const EMAIL_ALREADY_REGISTERED =
  'An account with this email already exists. Please log in with your original sign-in method.';

async function queryAdminsByEmail(
  email: string,
): Promise<{ id: string; profile: AdminProfile }[]> {
  const db = getFirestoreDb();
  if (!db || !email.trim()) return [];
  const normalized = email.trim().toLowerCase();
  const seen = new Set<string>();
  const out: { id: string; profile: AdminProfile }[] = [];
  for (const candidate of Array.from(new Set([email.trim(), normalized]))) {
    const snap = await getDocs(
      query(collection(db, 'admins'), where('email', '==', candidate)),
    );
    for (const item of snap.docs) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push({
        id: item.id,
        profile: mapAdminDoc(item.data() as Record<string, unknown>),
      });
    }
  }
  return out;
}

async function findAdminProfileByEmail(
  email: string,
): Promise<{ id: string; profile: AdminProfile } | null> {
  const matches = await queryAdminsByEmail(email);
  if (matches.length === 0) return null;
  return (
    matches.find(
      (item) =>
        item.profile.status === 'active' &&
        (item.profile.role === 'admin' || item.profile.role === 'superadmin'),
    ) ?? matches[0]
  );
}

/** Block a second admins doc for the same email (different Auth UID). */
export async function assertEmailFreeForNewAdmin(
  email: string,
  exceptUid?: string,
): Promise<void> {
  const matches = await queryAdminsByEmail(email);
  const conflict = matches.find((item) => item.id !== exceptUid);
  if (conflict) {
    throw new Error(EMAIL_ALREADY_REGISTERED);
  }
}

/** Soft-remove other active admins docs that share this email (wrong bootstrap IDs). */
async function retireDuplicateEmailDocs(uid: string, email: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !email.trim()) return;
  const matches = await queryAdminsByEmail(email);
  for (const match of matches) {
    if (match.id === uid || match.profile.status !== 'active') continue;
    try {
      await updateDoc(doc(db, 'admins', match.id), {
        status: 'removed',
        removedAt: serverTimestamp(),
        removedBy: uid,
        supersededByUid: uid,
      });
    } catch (error) {
      console.warn('Could not retire duplicate admin doc', match.id, error);
    }
  }
}

/**
 * Load admins/{uid}. If missing (common Console bootstrap mistake: wrong document ID),
 * find an active profile by email and copy it onto admins/{uid}.
 */
export async function resolveAdminProfile(
  uid: string,
  email: string,
): Promise<AdminProfile | null> {
  const byUid = await getAdminProfile(uid);
  if (byUid) {
    if (byUid.status === 'active') {
      await retireDuplicateEmailDocs(uid, email || byUid.email);
    }
    return byUid;
  }

  const byEmail = await findAdminProfileByEmail(email);
  if (!byEmail) return null;

  if (byEmail.id === uid) return byEmail.profile;

  // Relink onto the Auth UID so security rules (isActiveAdmin / isSuperadmin) work.
  if (
    byEmail.profile.status === 'active' &&
    (byEmail.profile.role === 'admin' || byEmail.profile.role === 'superadmin')
  ) {
    const db = getFirestoreDb();
    if (!db) return byEmail.profile;
    await setDoc(doc(db, 'admins', uid), {
      fullName: byEmail.profile.fullName,
      email: (email.trim() || byEmail.profile.email).toLowerCase(),
      requestedRole: byEmail.profile.requestedRole || byEmail.profile.role || 'Proponent',
      role: byEmail.profile.role,
      status: 'active',
      permissions: byEmail.profile.permissions || {},
      createdAt: byEmail.profile.createdAt ?? serverTimestamp(),
      approvedAt: byEmail.profile.approvedAt ?? serverTimestamp(),
      approvedBy: byEmail.profile.approvedBy ?? byEmail.id,
      linkedFromDocumentId: byEmail.id,
    });
    await retireDuplicateEmailDocs(uid, email || byEmail.profile.email);
    return (await getAdminProfile(uid)) ?? byEmail.profile;
  }

  return byEmail.profile;
}

export async function getInvite(inviteId: string): Promise<(AdminInvite & { id: string }) | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'invites', inviteId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Record<string, unknown>;
  return {
    id: snapshot.id,
    email: typeof data.email === 'string' ? data.email : '',
    role: data.role === 'superadmin' ? 'superadmin' : 'admin',
    permissions: parsePermissions(data.permissions),
    createdAt: (data.createdAt as AdminInvite['createdAt']) ?? null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    used: Boolean(data.used),
    usedAt: (data.usedAt as AdminInvite['usedAt']) ?? null,
  };
}

async function findUnusedInviteByEmail(email: string): Promise<(AdminInvite & { id: string }) | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const q = query(
    collection(db, 'invites'),
    where('email', '==', email.trim().toLowerCase()),
    where('used', '==', false),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const first = snap.docs[0];
  const data = first.data() as Record<string, unknown>;
  return {
    id: first.id,
    email: typeof data.email === 'string' ? data.email : '',
    role: data.role === 'superadmin' ? 'superadmin' : 'admin',
    permissions: parsePermissions(data.permissions),
    createdAt: (data.createdAt as AdminInvite['createdAt']) ?? null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    used: Boolean(data.used),
    usedAt: (data.usedAt as AdminInvite['usedAt']) ?? null,
  };
}

async function writeActiveFromInvite(
  uid: string,
  fullName: string,
  email: string,
  invite: AdminInvite & { id: string },
): Promise<void> {
  const { db } = requireServices();
  // Persist the Auth email so rules can match request.auth.token.email.
  await setDoc(doc(db, 'admins', uid), {
    fullName: fullName.trim(),
    email: email.trim(),
    requestedRole: invite.role,
    role: invite.role,
    status: 'active',
    permissions: invite.permissions,
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    approvedBy: invite.createdBy,
    inviteId: invite.id,
  });
  await updateDoc(doc(db, 'invites', invite.id), {
    used: true,
    usedAt: serverTimestamp(),
  });
}

/**
 * Self-registration without invite → pending until a superadmin approves.
 */
export async function registerAdmin(params: {
  fullName: string;
  email: string;
  password: string;
  requestedRole: string;
  accessCode: string;
}): Promise<void> {
  if (!isValidAccessCode(params.accessCode)) {
    throw new Error('Invalid access code.');
  }
  const { auth, db } = requireServices();
  await assertEmailFreeForNewAdmin(params.email);
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password,
  );
  const email = (credential.user.email ?? params.email).trim().toLowerCase();
  await setDoc(doc(db, 'admins', credential.user.uid), {
    fullName: params.fullName.trim(),
    email,
    requestedRole: params.requestedRole.trim() || 'Proponent',
    role: null,
    status: 'pending',
    permissions: {},
    createdAt: serverTimestamp(),
  });
}

/**
 * Signup via invite link. Auth account is created first so invite read rules
 * can match request.auth.token.email (see docs/ADMIN_ACCESS_DECISIONS.md).
 */
export async function registerAdminFromInvite(params: {
  fullName: string;
  email: string;
  password: string;
  inviteId: string;
}): Promise<void> {
  const { auth } = requireServices();
  await assertEmailFreeForNewAdmin(params.email);
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password,
  );
  const email = (credential.user.email ?? params.email).trim().toLowerCase();

  const invite = await getInvite(params.inviteId);
  if (!invite || invite.used) {
    await credential.user.delete().catch(() => undefined);
    throw new Error('This invite link is no longer valid.');
  }
  if (invite.email.trim().toLowerCase() !== email.toLowerCase()) {
    await credential.user.delete().catch(() => undefined);
    throw new Error('This invite was issued for a different email address.');
  }

  try {
    await writeActiveFromInvite(credential.user.uid, params.fullName, email, invite);
  } catch (error) {
    await credential.user.delete().catch(() => undefined);
    throw error;
  }
}

/**
 * Finish a Google sign-in that has no admins document yet (access-code path).
 * Creates a pending profile — not immediately active.
 */
export async function completeGoogleAdmin(params: {
  requestedRole: string;
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
  await assertEmailFreeForNewAdmin(user.email ?? '', user.uid);
  await setDoc(doc(db, 'admins', user.uid), {
    fullName: user.displayName?.trim() || 'Proponent',
    email: (user.email ?? '').toLowerCase(),
    requestedRole: params.requestedRole.trim() || 'Proponent',
    role: null,
    status: 'pending',
    permissions: {},
    createdAt: serverTimestamp(),
  });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const { auth } = requireServices();
  await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export type GoogleLoginResult =
  | 'active'
  | 'pending'
  | 'removed'
  | 'needs-access-code'
  | 'unauthenticated';

/**
 * Google sign-in. If no admins doc, try matching unused invite by email;
 * otherwise send the user to the access-code completion screen.
 */
export async function loginWithGoogle(): Promise<GoogleLoginResult> {
  const { auth } = requireServices();
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  const email = user.email ?? '';
  try {
    const profile = await resolveAdminProfile(user.uid, email);
    if (profile) {
      return getAdminAccessState(profile);
    }
  } catch (error) {
    console.warn('loginWithGoogle profile resolve failed', error);
    throw error;
  }

  const emailKey = email.trim().toLowerCase();
  if (emailKey) {
    const invite = await findUnusedInviteByEmail(emailKey);
    if (invite) {
      await assertEmailFreeForNewAdmin(email, user.uid);
      await writeActiveFromInvite(
        user.uid,
        user.displayName?.trim() || 'Proponent',
        email,
        invite,
      );
      return 'active';
    }
  }
  return 'needs-access-code';
}

export async function logoutAdmin(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

/** Full navigation reset after logout (static export + trailingSlash). */
export function goToAdminLogin(): void {
  window.location.assign('/admin/login/');
}

export function goToAdminPath(path: string): void {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  window.location.assign(withSlash);
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
  if (error instanceof Error) {
    if (
      error.message === 'Invalid access code.' ||
      error.message === 'This invite link is no longer valid.' ||
      error.message === 'This invite was issued for a different email address.' ||
      error.message === EMAIL_ALREADY_REGISTERED ||
      error.message === NOT_CONFIGURED
    ) {
      return error.message;
    }
  }
  if (code === 'auth/email-already-in-use') {
    return EMAIL_ALREADY_REGISTERED;
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'permission-denied' || code === 'unavailable') {
    return 'Could not reach Firestore. Disable Brave Shields / ad blockers for this site and try again.';
  }
  return 'Could not create the account. Try again.';
}

function firebaseCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}
