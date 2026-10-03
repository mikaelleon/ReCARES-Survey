'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  type AdminInvite,
  type AdminPermissions,
  type AdminProfile,
  type AdminRole,
} from '@/lib/admin/access';
import { mapAdminDoc } from '@/lib/firebase/auth';
import { getFirestoreDb } from '@/lib/firebase/config';

export type AdminMemberRow = AdminProfile & {
  uid: string;
  linkedFromDocumentId?: string;
};
export type InviteRow = AdminInvite & { id: string };

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

export async function listAdminsByStatus(
  status: 'pending' | 'active' | 'removed',
): Promise<AdminMemberRow[]> {
  const db = requireDb();
  const snap = await getDocs(query(collection(db, 'admins'), where('status', '==', status)));
  const rows = snap.docs.map((item) => ({
    uid: item.id,
    ...mapAdminDoc(item.data() as Record<string, unknown>),
    linkedFromDocumentId:
      typeof (item.data() as Record<string, unknown>).linkedFromDocumentId === 'string'
        ? String((item.data() as Record<string, unknown>).linkedFromDocumentId)
        : undefined,
  }));

  // Prefer the Auth-UID doc when a superseded bootstrap doc still shows as active.
  const superseded = new Set(
    rows
      .map((row) => row.linkedFromDocumentId)
      .filter((id): id is string => Boolean(id)),
  );
  const byEmail = new Map<string, AdminMemberRow>();
  for (const row of rows) {
    if (superseded.has(row.uid)) continue;
    const key = row.email.trim().toLowerCase() || row.uid;
    const prev = byEmail.get(key);
    if (!prev || row.linkedFromDocumentId) {
      byEmail.set(key, row);
    }
  }
  return Array.from(byEmail.values()).sort((a, b) =>
    (a.fullName || a.email).localeCompare(b.fullName || b.email),
  );
}

export async function listInvites(): Promise<InviteRow[]> {
  const db = requireDb();
  const snap = await getDocs(collection(db, 'invites'));
  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      email: typeof data.email === 'string' ? data.email : '',
      role: data.role === 'superadmin' ? 'superadmin' : 'admin',
      permissions: (data.permissions as AdminPermissions) || {},
      createdAt: (data.createdAt as AdminInvite['createdAt']) ?? null,
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
      used: Boolean(data.used),
      usedAt: (data.usedAt as AdminInvite['usedAt']) ?? null,
    };
  });
}

export async function approvePendingAdmin(params: {
  uid: string;
  role: AdminRole;
  permissions: AdminPermissions;
  approvedBy: string;
}): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'admins', params.uid), {
    role: params.role,
    status: 'active',
    permissions: params.permissions,
    approvedAt: serverTimestamp(),
    approvedBy: params.approvedBy,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reject a pending signup: delete the admins document.
 * Auth-account disable needs a Cloud Function (Admin SDK) — not in this pass.
 */
export async function rejectPendingAdmin(uid: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, 'admins', uid));
  // TODO(Section 7): call Cloud Function to admin.auth().updateUser(uid, { disabled: true })
}

export async function updateActiveMember(params: {
  uid: string;
  role: AdminRole;
  permissions: AdminPermissions;
}): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'admins', params.uid), {
    role: params.role,
    permissions: params.permissions,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-remove an active member. Does not hard-delete the document.
 * Auth disable still needs a Cloud Function.
 */
export async function removeActiveMember(params: {
  uid: string;
  removedBy: string;
}): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'admins', params.uid), {
    status: 'removed',
    removedAt: serverTimestamp(),
    removedBy: params.removedBy,
  });
  // TODO(Section 7): call Cloud Function to disable Auth user
}

export async function createInvite(params: {
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  createdBy: string;
}): Promise<InviteRow> {
  const db = requireDb();
  const email = params.email.trim().toLowerCase();
  const ref = await addDoc(collection(db, 'invites'), {
    email,
    role: params.role,
    permissions: params.permissions,
    createdAt: serverTimestamp(),
    createdBy: params.createdBy,
    used: false,
  });
  return {
    id: ref.id,
    email,
    role: params.role,
    permissions: params.permissions,
    createdBy: params.createdBy,
    used: false,
  };
}

export function inviteSignupUrl(inviteId: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/admin/signup?invite=${encodeURIComponent(inviteId)}`;
}

/** Delete an unused invite document (revoke before redemption). */
export async function revokeInvite(inviteId: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, 'invites', inviteId));
}

/**
 * Permanently delete a soft-removed admin document.
 * Rules reject this unless status is already 'removed'.
 */
export async function permanentlyDeleteRemovedAdmin(uid: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, 'admins', uid));
}
