'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import type {
  InterviewContactStatus,
  InterviewInvitation,
} from '@/survey/schema';

export type InterviewInviteRow = InterviewInvitation & { id: string };

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

function asTimestampString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  ) {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

function normalizeStatus(raw: unknown): InterviewContactStatus {
  if (raw === 'pending_confirmation' || raw === 'confirmed') return raw;
  return 'not_contacted';
}

function mapDoc(id: string, data: Record<string, unknown>): InterviewInviteRow {
  const preferredTime = data.preferredTime;
  const timeOk =
    preferredTime === 'Morning' ||
    preferredTime === 'Afternoon' ||
    preferredTime === 'Evening' ||
    preferredTime === 'Other'
      ? preferredTime
      : 'Other';

  return {
    id,
    email: typeof data.email === 'string' ? data.email : '',
    interviewFormat: data.interviewFormat === 'Face-to-face' ? 'Face-to-face' : 'Online',
    preferredDays: Array.isArray(data.preferredDays)
      ? data.preferredDays.filter((d): d is string => typeof d === 'string')
      : [],
    preferredTime: timeOk,
    preferredTimeOther:
      typeof data.preferredTimeOther === 'string' ? data.preferredTimeOther : undefined,
    submittedAt: asTimestampString(data.submittedAt),
    contactStatus: normalizeStatus(data.contactStatus),
    confirmedDateTime:
      typeof data.confirmedDateTime === 'string' ? data.confirmedDateTime : undefined,
  };
}

/** List interviewInterest docs — contact fields only, never survey answers. */
export async function listInterviewInvites(): Promise<InterviewInviteRow[]> {
  const db = requireDb();
  const snap = await getDocs(collection(db, 'interviewInterest'));
  const rows = snap.docs.map((item) => mapDoc(item.id, item.data() as Record<string, unknown>));
  rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return rows;
}

export async function updateInterviewContactStatus(
  id: string,
  contactStatus: InterviewContactStatus,
): Promise<void> {
  const db = requireDb();
  const payload: Record<string, unknown> = { contactStatus };
  if (contactStatus === 'confirmed') {
    payload.confirmedDateTime = new Date().toISOString();
  }
  await updateDoc(doc(db, 'interviewInterest', id), payload);
}

export async function deleteInterviewInvite(id: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, 'interviewInterest', id));
}
