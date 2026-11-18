'use client';

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
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
  isSignInAllowed,
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
 * Sync env fallback. Prefer `validateSignupAccessCode` (Firestore + env).
 * Keep NEXT_PUBLIC_* only as bootstrap until a superadmin generates a live code.
 */
export function isValidAccessCode(accessCode: string): boolean {
  const expected = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE?.trim().toUpperCase();
  if (!expected) return false;
  return accessCode.trim().toUpperCase() === expected;
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
  if (raw === 'superadmin' || raw === 'admin' || raw === 'adviser') return raw;
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
  } else if (
    !normalizedRole &&
    status === 'active' &&
    (legacyRole === 'adviser' || legacyRole === 'advisor')
  ) {
    normalizedRole = 'adviser';
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
    permissions = { responsesDashboard: true, interviewInvites: false, findingNotes: true };
  }
  // Advisers with an empty map get read-only Findings Log by default.
  if (
    status === 'active' &&
    normalizedRole === 'adviser' &&
    Object.keys(permissions).length === 0
  ) {
    permissions = { responsesDashboard: false, interviewInvites: false, findingNotes: true };
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
    let snap;
    try {
      snap = await getDocs(query(collection(db, 'admins'), where('email', '==', candidate)));
    } catch (error) {
      // Rules only allow reading admins by the signed-in user's own (lowercase) email.
      // A denied candidate simply has no visible matches; do not abort sign-up over it.
      if (firebaseCode(error) === 'permission-denied') continue;
      throw error;
    }
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
        (item.profile.role === 'admin' ||
          item.profile.role === 'adviser' ||
          item.profile.role === 'superadmin'),
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
    (byEmail.profile.role === 'admin' ||
      byEmail.profile.role === 'adviser' ||
      byEmail.profile.role === 'superadmin')
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
    role: parseRole(data.role) ?? 'admin',
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
    role: parseRole(data.role) ?? 'admin',
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
  const { validateSignupAccessCode } = await import('@/lib/firebase/accessCode');
  if (!(await validateSignupAccessCode(params.accessCode))) {
    throw new Error('Invalid access code.');
  }
  const { auth, db } = requireServices();
  // Create the Auth account first: the admins collection is only readable when
  // signed in, so the duplicate-email check must run authenticated.
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password,
  );
  const email = (credential.user.email ?? params.email).trim().toLowerCase();
  try {
    await assertEmailFreeForNewAdmin(email, credential.user.uid);
    await setDoc(doc(db, 'admins', credential.user.uid), {
      fullName: params.fullName.trim(),
      email,
      requestedRole: params.requestedRole.trim() || 'Proponent',
      role: null,
      status: 'pending',
      permissions: {},
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    await credential.user.delete().catch(() => undefined);
    throw error;
  }
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
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password,
  );
  const email = (credential.user.email ?? params.email).trim().toLowerCase();

  try {
    await assertEmailFreeForNewAdmin(email, credential.user.uid);
  } catch (error) {
    await credential.user.delete().catch(() => undefined);
    throw error;
  }

  const invite = await getInvite(params.inviteId);
  if (!invite || invite.used) {
    await credential.user.delete().catch(() => undefined);
    throw new Error('This invite link is no longer valid.');
  }
  if (invite.permissions?.signInPassword === false) {
    await credential.user.delete().catch(() => undefined);
    throw new Error(SIGN_IN_BLOCKED.password);
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
  const { validateSignupAccessCode } = await import('@/lib/firebase/accessCode');
  if (!(await validateSignupAccessCode(params.accessCode))) {
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

/** Shown when a superadmin has switched a sign-in method off for this member. */
export const SIGN_IN_BLOCKED = {
  password: 'Email and password sign-in is turned off for your account. Use Continue with Google, or ask a superadmin.',
  google: 'Google sign-in is turned off for your account. Use your email and password, or ask a superadmin.',
  changePassword: 'Changing your password is turned off for your account. Ask a superadmin.',
} as const;

const BLOCKED_MESSAGES: string[] = Object.values(SIGN_IN_BLOCKED);

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const { auth } = requireServices();
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  let profile: AdminProfile | null = null;
  try {
    profile = await resolveAdminProfile(credential.user.uid, credential.user.email ?? '');
  } catch {
    // Profile problems are reported by the caller's own lookup; only an explicit "off" blocks here.
  }
  if (!isSignInAllowed(profile, 'signInPassword')) {
    await signOut(auth);
    throw new Error(SIGN_IN_BLOCKED.password);
  }
}

/**
 * Sends a password reset link. Firebase answers the same way whether or not the address has
 * an account, so the caller must not say which.
 */
export async function sendAdminPasswordReset(email: string): Promise<void> {
  const { auth } = requireServices();
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
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
  return resolveGoogleUser(credential.user);
}

export const GOOGLE_EMAIL_MISMATCH = 'The Google account is not the one for that email.';

/**
 * Lets one account use both methods. Proves ownership with Google first, then attaches the
 * typed password to that same account, so email and password works from then on.
 */
export async function addPasswordWithGoogle(email: string, password: string): Promise<GoogleLoginResult> {
  const { auth } = requireServices();
  const wanted = email.trim().toLowerCase();
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  const user = credential.user;
  if ((user.email ?? '').trim().toLowerCase() !== wanted) {
    await signOut(auth);
    throw new Error(GOOGLE_EMAIL_MISMATCH);
  }
  const hasPassword = user.providerData.some((p) => p.providerId === 'password');
  let existing: AdminProfile | null = null;
  try {
    existing = await resolveAdminProfile(user.uid, user.email ?? '');
  } catch {
    // Without a readable profile nothing is switched off for this person.
  }
  if (!isSignInAllowed(existing, 'changePassword') || !isSignInAllowed(existing, 'signInGoogle')) {
    await signOut(auth);
    throw new Error(
      !isSignInAllowed(existing, 'signInGoogle') ? SIGN_IN_BLOCKED.google : SIGN_IN_BLOCKED.changePassword,
    );
  }
  if (!hasPassword) {
    await linkWithCredential(user, EmailAuthProvider.credential(wanted, password));
  }
  return resolveGoogleUser(user);
}

/** True when the signed-in account already has an email and password attached. */
export function currentUserHasPassword(): boolean {
  const user = getFirebaseAuth()?.currentUser;
  return Boolean(user?.providerData.some((p) => p.providerId === 'password'));
}

/**
 * Self-service password change. Re-checks who is asking first (current password, or Google
 * for an account that has none), then updates it. A Google-only account gets a password
 * attached instead, so it can use both methods afterwards.
 * Returns what happened so the caller can say it plainly.
 */
export async function changeOwnPassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<'changed' | 'added'> {
  const { auth } = requireServices();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Sign in again to change your password.');
  const hasPassword = user.providerData.some((p) => p.providerId === 'password');

  if (hasPassword) {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, params.currentPassword),
    );
    await updatePassword(user, params.newPassword);
    return 'changed';
  }

  await reauthenticateWithPopup(user, new GoogleAuthProvider());
  await linkWithCredential(user, EmailAuthProvider.credential(user.email, params.newPassword));
  return 'added';
}

async function resolveGoogleUser(user: User): Promise<GoogleLoginResult> {
  const email = user.email ?? '';
  try {
    const profile = await resolveAdminProfile(user.uid, email);
    if (profile) {
      if (!isSignInAllowed(profile, 'signInGoogle')) {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
        throw new Error(SIGN_IN_BLOCKED.google);
      }
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
      if (invite.permissions?.signInGoogle === false) {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
        throw new Error(SIGN_IN_BLOCKED.google);
      }
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
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return 'That email and password do not match. If you signed up with Google, use the button below to add this password to your Google account.';
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (error instanceof Error && (error.message === GOOGLE_EMAIL_MISMATCH || BLOCKED_MESSAGES.includes(error.message))) {
    return error.message;
  }
  if (code === 'auth/weak-password') {
    return 'Use a password of at least 6 characters.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'For safety, log in again and then change your password.';
  }
  if (code === 'auth/provider-already-linked' || code === 'auth/credential-already-in-use') {
    return 'This account already has a password. Use Forgot password if you do not remember it.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email and password sign-in is turned off for this project. Use Continue with Google, or ask a superadmin to turn it on in Firebase.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Ask a superadmin for help.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a few minutes, or reset your password.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Could not reach the sign-in service. Check your connection and try again.';
  }
  return 'Sign-in failed. Check your email and password and try again.';
}

export function signupErrorMessage(error: unknown): string {
  const code = firebaseCode(error);
  if (error instanceof Error) {
    if (
      BLOCKED_MESSAGES.includes(error.message) ||
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
  if (code === 'permission-denied') {
    return 'Sign-up was blocked by the database access rules. Ask a superadmin to check that your invite is unused and issued for this exact email.';
  }
  if (code === 'unavailable') {
    return 'Could not reach Firestore. Check your connection, or disable Brave Shields / ad blockers for this site, and try again.';
  }
  return 'Could not create the account. Try again.';
}

function firebaseCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}
