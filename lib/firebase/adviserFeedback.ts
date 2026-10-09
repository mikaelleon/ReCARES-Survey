'use client';

import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Query,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { AdminRole } from '@/lib/admin/access';
import { isKnownQuestionId } from '@/lib/admin/responseQuestions';
import { getFirestoreDb } from '@/lib/firebase/config';
import { messageForFirestoreWriteError, requireDocumentId } from '@/lib/firebase/writeErrors';

export const ADVISER_FEEDBACK_COLLECTION = 'adviserFeedback';

export const FEEDBACK_TARGET_TYPES = ['note', 'question', 'instrument'] as const;
export type FeedbackTargetType = (typeof FEEDBACK_TARGET_TYPES)[number];

export const FEEDBACK_SEVERITIES = ['suggestion', 'required_fix', 'approved'] as const;
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number];

export const FEEDBACK_STATUSES = ['open', 'addressed', 'resolved'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
  suggestion: 'Suggestion',
  required_fix: 'Required fix',
  approved: 'Approved',
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  addressed: 'Addressed',
  resolved: 'Resolved',
};

export const TARGET_LABELS: Record<FeedbackTargetType, string> = {
  note: 'Note',
  question: 'Question',
  instrument: 'Instrument',
};

/** required_fix sorts first. */
export const SEVERITY_RANK: Record<FeedbackSeverity, number> = {
  required_fix: 0,
  suggestion: 1,
  approved: 2,
};

const COMMENT_MIN = 5;
const COMMENT_MAX = 1000;

export interface FeedbackAuthor {
  uid: string;
  name: string;
  role: AdminRole;
}

export interface FeedbackComment {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  comment: string;
  severity: FeedbackSeverity | null;
  status: FeedbackStatus | null;
  parentId: string | null;
  authorUid: string;
  authorName: string;
  authorRole: string;
  createdAtMs: number;
  updatedAtMs: number;
  resolvedAtMs: number | null;
  replyCount: number;
  edited: boolean;
}

export interface CommentFieldErrors {
  comment?: string;
  severity?: string;
  targetType?: string;
  targetId?: string;
}

export interface RootCommentInput {
  targetType: string;
  targetId: string;
  comment: string;
  severity: string;
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

export function isFeedbackTargetType(value: unknown): value is FeedbackTargetType {
  return typeof value === 'string' && (FEEDBACK_TARGET_TYPES as readonly string[]).includes(value);
}

export function isFeedbackSeverity(value: unknown): value is FeedbackSeverity {
  return typeof value === 'string' && (FEEDBACK_SEVERITIES as readonly string[]).includes(value);
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === 'string' && (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export function isAllowedStatusTransition(
  from: FeedbackStatus,
  to: FeedbackStatus,
  role: AdminRole | null | undefined,
): boolean {
  if (from === 'open' && to === 'addressed') {
    return role === 'admin' || role === 'adviser' || role === 'superadmin';
  }
  if (from === 'addressed' && to === 'resolved') {
    return role === 'adviser' || role === 'superadmin';
  }
  if (from === 'resolved' && to === 'open') {
    return role === 'adviser' || role === 'superadmin';
  }
  return false;
}

/**
 * Pure validation shared by the comment form and write helpers.
 * `noteIds` when provided checks that a note target is in the loaded set.
 */
export function validateCommentInput(
  input: {
    comment: string;
    targetType?: string;
    targetId?: string;
    severity?: string | null;
  },
  options: { mode: 'root' | 'reply'; noteIds?: readonly string[] },
): CommentFieldErrors {
  const errors: CommentFieldErrors = {};
  const comment = input.comment.trim();
  if (comment.length < COMMENT_MIN || comment.length > COMMENT_MAX) {
    errors.comment = `Comment must be ${COMMENT_MIN}–${COMMENT_MAX} characters.`;
  }

  if (options.mode === 'reply') return errors;

  if (!isFeedbackTargetType(input.targetType)) {
    errors.targetType = 'Choose a note, question, or instrument.';
  }
  const targetId = (input.targetId || '').trim();
  if (!targetId || targetId.length > 200 || targetId.includes('/')) {
    errors.targetId = 'Choose a valid target.';
  } else if (input.targetType === 'note' && options.noteIds && !options.noteIds.includes(targetId)) {
    errors.targetId = options.noteIds.length
      ? 'That finding note does not exist.'
      : 'No finding notes yet. Save a note before reviewing it.';
  } else if (input.targetType === 'question' && !isKnownQuestionId(targetId)) {
    errors.targetId = 'Choose a known survey question.';
  } else if (input.targetType === 'instrument' && !/^[\w.-]{1,40}$/.test(targetId)) {
    errors.targetId = 'Instrument id must be a short version label such as v1.';
  }
  if (!isFeedbackSeverity(input.severity)) {
    errors.severity = 'Choose a severity.';
  }
  return errors;
}

export function commentInputHasErrors(errors: CommentFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function mapComment(id: string, data: Record<string, unknown>): FeedbackComment | null {
  if (!isFeedbackTargetType(data.targetType)) return null;
  const targetId = typeof data.targetId === 'string' ? data.targetId : '';
  const comment = typeof data.comment === 'string' ? data.comment : '';
  const authorUid = typeof data.authorUid === 'string' ? data.authorUid : '';
  if (!targetId || !comment || !authorUid) return null;
  const parentId = typeof data.parentId === 'string' && data.parentId ? data.parentId : null;
  const severity = isFeedbackSeverity(data.severity) ? data.severity : null;
  const status = isFeedbackStatus(data.status) ? data.status : null;
  if (!parentId && (!severity || !status)) return null;
  const createdAtMs = tsToMs(data.createdAt);
  const updatedAtMs = tsToMs(data.updatedAt) || createdAtMs;
  const replyCountRaw = data.replyCount;
  const replyCount =
    typeof replyCountRaw === 'number' && Number.isFinite(replyCountRaw) ? replyCountRaw : 0;
  return {
    id,
    targetType: data.targetType,
    targetId,
    comment,
    severity,
    status,
    parentId,
    authorUid,
    authorName: typeof data.authorName === 'string' ? data.authorName : 'Staff',
    authorRole: typeof data.authorRole === 'string' ? data.authorRole : '',
    createdAtMs,
    updatedAtMs,
    resolvedAtMs: tsToMs(data.resolvedAt) || null,
    replyCount,
    edited: data.edited === true,
  };
}

function rowsFromSnap(
  docs: { id: string; data: () => Record<string, unknown> }[],
): FeedbackComment[] {
  return docs
    .map((item) => mapComment(item.id, item.data()))
    .filter((row): row is FeedbackComment => Boolean(row));
}

function wrapWriteError(error: unknown, fallback: string): Error {
  if (error instanceof FirebaseError && error.code === 'failed-precondition') {
    return new Error(
      'Firestore needs a composite index for this review query. Deploy firestore.indexes.json and wait until the index finishes building.',
    );
  }
  if (error instanceof Error && !(error instanceof FirebaseError) && error.message.trim()) {
    return error;
  }
  return new Error(
    messageForFirestoreWriteError(error, fallback, { resourceHint: 'adviserFeedback' }),
  );
}

function authorFields(author: FeedbackAuthor) {
  const name = author.name.trim().slice(0, 120);
  return {
    authorUid: author.uid,
    authorName: name || 'Staff',
    authorRole: author.role,
  };
}

/** Live list of every comment (roots and replies). */
export function subscribeFeedback(
  onRows: (rows: FeedbackComment[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onError('Firebase is not configured. Add the project keys to .env.local.');
    return () => undefined;
  }
  return onSnapshot(
    collection(db, ADVISER_FEEDBACK_COLLECTION),
    (snap) => onRows(rowsFromSnap(snap.docs)),
    (error) => onError(wrapWriteError(error, 'Could not load review comments.').message),
  );
}

/** Live comments for one target, oldest first. Uses the targetId + createdAt index. */
export function subscribeFeedbackForTarget(
  targetId: string,
  onRows: (rows: FeedbackComment[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onError('Firebase is not configured. Add the project keys to .env.local.');
    return () => undefined;
  }
  const trimmed = targetId.trim();
  if (!trimmed) {
    onError('Missing target id.');
    return () => undefined;
  }
  return onSnapshot(
    feedbackByTargetQuery(db, trimmed),
    (snap) => onRows(rowsFromSnap(snap.docs)),
    (error) => onError(wrapWriteError(error, 'Could not load review comments.').message),
  );
}

export function feedbackByTargetQuery(db: ReturnType<typeof requireDb>, targetId: string): Query {
  return query(
    collection(db, ADVISER_FEEDBACK_COLLECTION),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'asc'),
  );
}

export async function queryFeedbackByTarget(targetId: string): Promise<FeedbackComment[]> {
  try {
    const db = requireDb();
    const snap = await getDocs(feedbackByTargetQuery(db, requireDocumentId(targetId, 'target')));
    return rowsFromSnap(snap.docs);
  } catch (error) {
    throw wrapWriteError(error, 'Could not load comments for that target.');
  }
}

export async function queryFeedbackByAuthor(authorUid: string): Promise<FeedbackComment[]> {
  try {
    const db = requireDb();
    const q = query(
      collection(db, ADVISER_FEEDBACK_COLLECTION),
      where('authorUid', '==', requireDocumentId(authorUid, 'author')),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return rowsFromSnap(snap.docs);
  } catch (error) {
    throw wrapWriteError(error, 'Could not load comments for that author.');
  }
}

export async function queryFeedbackByStatus(status: FeedbackStatus): Promise<FeedbackComment[]> {
  try {
    const db = requireDb();
    const q = query(
      collection(db, ADVISER_FEEDBACK_COLLECTION),
      where('status', '==', status),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return rowsFromSnap(snap.docs);
  } catch (error) {
    throw wrapWriteError(error, 'Could not load comments for that status.');
  }
}

export async function queryFeedbackBySeverity(
  severity: FeedbackSeverity,
): Promise<FeedbackComment[]> {
  try {
    const db = requireDb();
    const q = query(
      collection(db, ADVISER_FEEDBACK_COLLECTION),
      where('severity', '==', severity),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return rowsFromSnap(snap.docs);
  } catch (error) {
    throw wrapWriteError(error, 'Could not load comments for that severity.');
  }
}

async function assertNoteTarget(targetId: string): Promise<void> {
  const db = requireDb();
  const snap = await getDoc(doc(db, 'findingNotes', targetId));
  if (!snap.exists()) {
    throw new Error('That finding note does not exist.');
  }
}

/** Adviser or superadmin starts a thread. Status is always open. */
export async function createComment(
  input: RootCommentInput,
  author: FeedbackAuthor,
  options?: { noteIds?: readonly string[] },
): Promise<string> {
  if (author.role !== 'adviser' && author.role !== 'superadmin') {
    throw new Error('Only an adviser or superadmin can start a review.');
  }
  const errors = validateCommentInput(input, { mode: 'root', noteIds: options?.noteIds });
  if (commentInputHasErrors(errors)) {
    throw new Error(errors.comment || errors.targetId || errors.severity || errors.targetType || 'Fix the highlighted fields.');
  }
  const targetType = input.targetType as FeedbackTargetType;
  const targetId = input.targetId.trim();
  const comment = input.comment.trim();
  const severity = input.severity as FeedbackSeverity;
  try {
    if (targetType === 'note') await assertNoteTarget(targetId);
    const db = requireDb();
    const ref = await addDoc(collection(db, ADVISER_FEEDBACK_COLLECTION), {
      targetType,
      targetId,
      comment,
      severity,
      status: 'open',
      parentId: null,
      ...authorFields(author),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
      replyCount: 0,
      edited: false,
    });
    return ref.id;
  } catch (error) {
    throw wrapWriteError(error, 'Could not save that review comment.');
  }
}

/** One reply level. Blocked while the root is resolved. */
export async function createReply(
  parentId: string,
  commentText: string,
  author: FeedbackAuthor,
): Promise<string> {
  if (author.role !== 'admin' && author.role !== 'adviser' && author.role !== 'superadmin') {
    throw new Error('Only active staff can reply.');
  }
  const errors = validateCommentInput({ comment: commentText }, { mode: 'reply' });
  if (commentInputHasErrors(errors)) {
    throw new Error(errors.comment || 'Fix the highlighted fields.');
  }
  const comment = commentText.trim();
  try {
    const db = requireDb();
    const parentRef = doc(db, ADVISER_FEEDBACK_COLLECTION, requireDocumentId(parentId, 'thread'));
    const replyRef = doc(collection(db, ADVISER_FEEDBACK_COLLECTION));
    await runTransaction(db, async (tx) => {
      const parentSnap = await tx.get(parentRef);
      if (!parentSnap.exists()) throw new Error('That thread no longer exists.');
      const parent = parentSnap.data() as Record<string, unknown>;
      if (parent.parentId != null) {
        throw new Error('Replies can only be added to the original comment.');
      }
      if (parent.status === 'resolved') {
        throw new Error('Reopen this thread before replying.');
      }
      if (!isFeedbackTargetType(parent.targetType) || typeof parent.targetId !== 'string') {
        throw new Error('That thread is missing its target.');
      }
      const current = typeof parent.replyCount === 'number' ? parent.replyCount : 0;
      tx.set(replyRef, {
        targetType: parent.targetType,
        targetId: parent.targetId,
        comment,
        parentId: parentRef.id,
        ...authorFields(author),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        edited: false,
      });
      tx.update(parentRef, { replyCount: current + 1 });
    });
    return replyRef.id;
  } catch (error) {
    throw wrapWriteError(error, 'Could not save that reply.');
  }
}

/** Author-only text edit. Marks the comment edited. */
export async function updateComment(id: string, commentText: string): Promise<void> {
  const errors = validateCommentInput({ comment: commentText }, { mode: 'reply' });
  if (commentInputHasErrors(errors)) {
    throw new Error(errors.comment || 'Fix the highlighted fields.');
  }
  try {
    const db = requireDb();
    await updateDoc(doc(db, ADVISER_FEEDBACK_COLLECTION, requireDocumentId(id, 'comment')), {
      comment: commentText.trim(),
      edited: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw wrapWriteError(error, 'Could not update that comment.');
  }
}

export async function setThreadStatus(
  id: string,
  next: FeedbackStatus,
  role: AdminRole | null | undefined,
): Promise<void> {
  try {
    const db = requireDb();
    const ref = doc(db, ADVISER_FEEDBACK_COLLECTION, requireDocumentId(id, 'thread'));
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('That thread was already deleted or could not be found.');
    const data = snap.data() as Record<string, unknown>;
    if (data.parentId != null) throw new Error('Only the original comment has a status.');
    if (!isFeedbackStatus(data.status)) throw new Error('That thread has no status.');
    if (!isAllowedStatusTransition(data.status, next, role)) {
      throw new Error('That status change is not allowed for your role.');
    }
    await updateDoc(ref, {
      status: next,
      updatedAt: serverTimestamp(),
      resolvedAt: next === 'resolved' ? serverTimestamp() : null,
    });
  } catch (error) {
    throw wrapWriteError(error, 'Could not update that thread.');
  }
}

/**
 * Author or superadmin may delete. A root that still has replies is blocked
 * so the thread is not removed out from under those replies. Delete replies first.
 */
export async function deleteComment(id: string): Promise<void> {
  try {
    const db = requireDb();
    const ref = doc(db, ADVISER_FEEDBACK_COLLECTION, requireDocumentId(id, 'comment'));
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('That comment was already deleted or could not be found.');
      const data = snap.data() as Record<string, unknown>;
      const parentId = typeof data.parentId === 'string' ? data.parentId : null;
      if (!parentId) {
        const count = typeof data.replyCount === 'number' ? data.replyCount : 0;
        if (count > 0) {
          throw new Error('Delete the replies before deleting this review. A thread with replies cannot be removed.');
        }
        tx.delete(ref);
        return;
      }
      const parentRef = doc(db, ADVISER_FEEDBACK_COLLECTION, parentId);
      const parentSnap = await tx.get(parentRef);
      tx.delete(ref);
      if (parentSnap.exists()) {
        const current = parentSnap.data().replyCount;
        const count = typeof current === 'number' ? current : 0;
        if (count > 0) tx.update(parentRef, { replyCount: count - 1 });
      }
    });
  } catch (error) {
    throw wrapWriteError(error, 'Could not delete that comment.');
  }
}
