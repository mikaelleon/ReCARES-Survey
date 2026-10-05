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
  InterviewNote,
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
  if (
    raw === 'pending_confirmation' ||
    raw === 'confirmed' ||
    raw === 'withdrawn' ||
    raw === 'not_contacted'
  ) {
    return raw;
  }
  return 'not_contacted';
}

function mapNote(raw: unknown): InterviewNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const text = typeof item.text === 'string' ? item.text.trim() : '';
  if (!text) return null;
  return {
    id: typeof item.id === 'string' ? item.id : `note-${asTimestampString(item.at) || Date.now()}`,
    text: text.slice(0, 2000),
    at: asTimestampString(item.at) || new Date().toISOString(),
    byUid: typeof item.byUid === 'string' ? item.byUid : '',
    byName: typeof item.byName === 'string' ? item.byName : 'Team',
  };
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

  const notes = Array.isArray(data.notes)
    ? data.notes.map(mapNote).filter((n): n is InterviewNote => Boolean(n))
    : [];

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
    notes,
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

export async function addInterviewNote(
  id: string,
  existing: InterviewNote[],
  note: Omit<InterviewNote, 'id' | 'at'> & { text: string },
): Promise<void> {
  const db = requireDb();
  const next: InterviewNote = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `n-${Date.now()}`,
    text: note.text.trim().slice(0, 2000),
    at: new Date().toISOString(),
    byUid: note.byUid,
    byName: note.byName.trim() || 'Team',
  };
  if (!next.text) return;
  await updateDoc(doc(db, 'interviewInterest', id), {
    notes: [...existing, next],
  });
}

export async function deleteInterviewInvite(id: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, 'interviewInterest', id));
}
