'use client';

import { collection, deleteDoc, doc, getDocs, updateDoc, type Timestamp } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import { messageForFirestoreWriteError, requireDocumentId } from '@/lib/firebase/writeErrors';
import type { InquiryStatus } from '@/survey/schema';

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  createdMs: number;
}

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

function createdMs(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as Timestamp).toMillis === 'function'
  ) {
    try {
      return (value as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

function normalizeStatus(raw: unknown): InquiryStatus {
  if (raw === 'in_progress' || raw === 'resolved' || raw === 'new') return raw;
  return 'new';
}

export async function listInquiries(): Promise<InquiryRow[]> {
  const db = requireDb();
  const snap = await getDocs(collection(db, 'inquiries'));
  const rows = snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    const ms = createdMs(data.createdAt);
    return {
      id: item.id,
      name: typeof data.name === 'string' ? data.name : '',
      email: typeof data.email === 'string' ? data.email : '',
      message: typeof data.message === 'string' ? data.message : '',
      status: normalizeStatus(data.status),
      createdAt: ms ? new Date(ms).toISOString() : '',
      createdMs: ms,
    };
  });
  rows.sort((a, b) => b.createdMs - a.createdMs);
  return rows;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'inquiries', id), { status });
}

export async function deleteInquiry(id: string): Promise<void> {
  try {
    const db = requireDb();
    const docId = requireDocumentId(id, 'inquiry');
    await deleteDoc(doc(db, 'inquiries', docId));
  } catch (error) {
    throw new Error(
      messageForFirestoreWriteError(error, 'Could not delete that inquiry.', {
        resourceHint: 'inquiries',
      }),
    );
  }
}
