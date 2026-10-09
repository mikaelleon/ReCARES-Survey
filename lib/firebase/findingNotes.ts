'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import { messageForFirestoreWriteError, requireDocumentId } from '@/lib/firebase/writeErrors';
import { isKnownQuestionId } from '@/lib/admin/responseQuestions';

export const FINDING_TAGS = ['barrier', 'theme', 'anomaly', 'recommendation'] as const;
export type FindingTag = (typeof FINDING_TAGS)[number];

export const FINDING_STATUSES = ['draft', 'reviewed', 'final'] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const FINDING_TAG_LABELS: Record<FindingTag, string> = {
  barrier: 'Barrier',
  theme: 'Theme',
  anomaly: 'Anomaly',
  recommendation: 'Recommendation',
};

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  final: 'Final',
};

export const MAX_NOTES_PER_AUTHOR = 100;

export interface FindingNoteInput {
  title: string;
  body: string;
  tag: string;
  status: string;
  questionId: string;
}

export interface FindingNoteFieldErrors {
  title?: string;
  body?: string;
  tag?: string;
  status?: string;
  questionId?: string;
  form?: string;
}

export interface FindingNoteRow {
  id: string;
  title: string;
  body: string;
  tag: FindingTag;
  status: FindingStatus;
  questionId: string;
  authorUid: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  createdMs: number;
  updatedMs: number;
}

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

function tsToMs(value: unknown): number {
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
  return 0;
}

export function isFindingTag(value: unknown): value is FindingTag {
  return typeof value === 'string' && (FINDING_TAGS as readonly string[]).includes(value);
}

export function isFindingStatus(value: unknown): value is FindingStatus {
  return typeof value === 'string' && (FINDING_STATUSES as readonly string[]).includes(value);
}

/**
 * Pure validation for create/update forms. Returns field errors; empty object when valid.
 */
export function validateNoteInput(
  input: FindingNoteInput,
  options?: { requireDraftStatus?: boolean },
): FindingNoteFieldErrors {
  const errors: FindingNoteFieldErrors = {};
  const title = input.title.trim();
  const body = input.body.trim();
  const questionId = input.questionId.trim();

  if (title.length < 3 || title.length > 100) {
    errors.title = 'Title must be 3–100 characters.';
  }
  if (body.length < 10 || body.length > 2000) {
    errors.body = 'Body must be 10–2000 characters.';
  }
  if (!isFindingTag(input.tag)) {
    errors.tag = 'Choose a valid tag.';
  }
  if (!isFindingStatus(input.status)) {
    errors.status = 'Choose a valid status.';
  } else if (options?.requireDraftStatus && input.status !== 'draft') {
    errors.status = 'New notes must start as draft.';
  }
  if (!questionId || !isKnownQuestionId(questionId)) {
    errors.questionId = 'Choose a known survey question.';
  }
  return errors;
}

export function mapFindingNote(
  id: string,
  data: Record<string, unknown>,
): FindingNoteRow | null {
  if (!isFindingTag(data.tag) || !isFindingStatus(data.status)) return null;
  const title = typeof data.title === 'string' ? data.title : '';
  const body = typeof data.body === 'string' ? data.body : '';
  const questionId = typeof data.questionId === 'string' ? data.questionId : '';
  const authorUid = typeof data.authorUid === 'string' ? data.authorUid : '';
  if (!title || !body || !questionId || !authorUid) return null;
  const createdMs = tsToMs(data.createdAt);
  const updatedMs = tsToMs(data.updatedAt) || createdMs;
  return {
    id,
    title,
    body,
    tag: data.tag,
    status: data.status,
    questionId,
    authorUid,
    authorName: typeof data.authorName === 'string' ? data.authorName : 'Team',
    createdAt: createdMs ? new Date(createdMs).toISOString() : '',
    updatedAt: updatedMs ? new Date(updatedMs).toISOString() : '',
    createdMs,
    updatedMs,
  };
}

/** Live query — newest updates first. */
export function subscribeNotes(
  onRows: (rows: FindingNoteRow[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onError('Firebase is not configured. Add the project keys to .env.local.');
    return () => undefined;
  }
  const q = query(collection(db, 'findingNotes'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((item) => mapFindingNote(item.id, item.data() as Record<string, unknown>))
        .filter((row): row is FindingNoteRow => Boolean(row));
      onRows(rows);
    },
    (error) => {
      onError(
        messageForFirestoreWriteError(error, 'Could not load finding notes.', {
          resourceHint: 'findingNotes',
        }),
      );
    },
  );
}

export async function listNotesByAuthor(authorUid: string): Promise<FindingNoteRow[]> {
  const db = requireDb();
  const q = query(collection(db, 'findingNotes'), where('authorUid', '==', authorUid));
  const snap = await getDocs(q);
  return snap.docs
    .map((item) => mapFindingNote(item.id, item.data() as Record<string, unknown>))
    .filter((row): row is FindingNoteRow => Boolean(row));
}

function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase();
}

async function assertAuthorLimits(
  authorUid: string,
  title: string,
  questionId: string,
  excludeId?: string,
): Promise<void> {
  const mine = await listNotesByAuthor(authorUid);
  const others = excludeId ? mine.filter((n) => n.id !== excludeId) : mine;
  if (others.length >= MAX_NOTES_PER_AUTHOR) {
    throw new Error(`You can save at most ${MAX_NOTES_PER_AUTHOR} finding notes.`);
  }
  const key = normalizeTitleKey(title);
  const dup = others.find(
    (n) => n.questionId === questionId && normalizeTitleKey(n.title) === key,
  );
  if (dup) {
    throw new Error('You already have a note with this title for that question.');
  }
}

export async function createNote(
  input: FindingNoteInput,
  author: { uid: string; name: string },
): Promise<string> {
  const errors = validateNoteInput(input, { requireDraftStatus: true });
  if (Object.keys(errors).length > 0) {
    throw new Error(errors.form || errors.title || errors.body || 'Fix the highlighted fields.');
  }
  try {
    const db = requireDb();
    const title = input.title.trim();
    const body = input.body.trim();
    const questionId = input.questionId.trim();
    await assertAuthorLimits(author.uid, title, questionId);
    const ref = await addDoc(collection(db, 'findingNotes'), {
      title,
      body,
      tag: input.tag,
      status: 'draft',
      questionId,
      authorUid: author.uid,
      authorName: author.name.trim() || 'Team',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    throw new Error(
      messageForFirestoreWriteError(error, 'Could not create that finding note.', {
        resourceHint: 'findingNotes',
      }),
    );
  }
}

export async function updateNote(
  id: string,
  input: FindingNoteInput,
  existing: FindingNoteRow,
  editorUid: string,
  isSuperadmin: boolean,
): Promise<void> {
  if (existing.authorUid !== editorUid && !isSuperadmin) {
    throw new Error('You can only edit your own finding notes.');
  }
  if (existing.status === 'final') {
    const onlyUnlock =
      input.status === 'draft' &&
      input.title.trim() === existing.title &&
      input.body.trim() === existing.body &&
      input.tag === existing.tag &&
      input.questionId.trim() === existing.questionId;
    if (!onlyUnlock) {
      throw new Error('Final notes are locked. Revert status to draft before editing.');
    }
  }

  const errors = validateNoteInput(input);
  if (Object.keys(errors).length > 0) {
    throw new Error(errors.form || errors.title || errors.body || 'Fix the highlighted fields.');
  }

  try {
    const db = requireDb();
    const docId = requireDocumentId(id, 'finding note');
    const title = input.title.trim();
    const body = input.body.trim();
    const questionId = input.questionId.trim();
    await assertAuthorLimits(existing.authorUid, title, questionId, docId);

    if (existing.status === 'final' && input.status === 'draft') {
      await updateDoc(doc(db, 'findingNotes', docId), {
        status: 'draft',
        updatedAt: serverTimestamp(),
      });
      return;
    }

    await updateDoc(doc(db, 'findingNotes', docId), {
      title,
      body,
      tag: input.tag,
      status: input.status,
      questionId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(
      messageForFirestoreWriteError(error, 'Could not update that finding note.', {
        resourceHint: 'findingNotes',
      }),
    );
  }
}

export async function deleteNote(
  id: string,
  existing: FindingNoteRow,
  editorUid: string,
  isSuperadmin: boolean,
): Promise<void> {
  if (existing.authorUid !== editorUid && !isSuperadmin) {
    throw new Error('You can only delete your own finding notes.');
  }
  if (existing.status === 'final') {
    throw new Error('Final notes cannot be deleted. Revert status to draft first.');
  }
  try {
    const db = requireDb();
    const docId = requireDocumentId(id, 'finding note');
    await deleteDoc(doc(db, 'findingNotes', docId));
  } catch (error) {
    throw new Error(
      messageForFirestoreWriteError(error, 'Could not delete that finding note.', {
        resourceHint: 'findingNotes',
      }),
    );
  }
}
