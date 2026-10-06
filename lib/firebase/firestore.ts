'use client';

import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import { getSurveyConfig } from '@/lib/firebase/surveyConfig';
import { surveyAcceptsResponses } from '@/survey/instrument';
import type { InterviewInvitation, SurveyResponseDocument } from '@/survey/schema';

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Anonymous survey write. No auth user is attached.
 * No-ops when Firebase env vars are missing so the resident flow can still finish locally.
 */
export async function submitNeedsAssessment(data: SurveyResponseDocument): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const config = await getSurveyConfig();
  if (!surveyAcceptsResponses(config.status)) {
    throw new Error('SURVEY_WINDOW_CLOSED');
  }
  const stamped: SurveyResponseDocument = {
    ...data,
    instrumentVersion: data.instrumentVersion || config.instrumentVersion,
  };
  await setDoc(doc(db, 'needsAssessmentResponses', stamped.responseId), stripUndefined(stamped));
}

/** Active-admin delete of a submitted needs-assessment document. */
export async function deleteNeedsAssessment(responseId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured.');
  const id = responseId.trim();
  if (!id) throw new Error('Missing response id.');
  await deleteDoc(doc(db, 'needsAssessmentResponses', id));
}

/**
 * Separate collection. Must not include a survey response id or any survey answer.
 * New invites start as not_contacted until an admin logs outreach.
 */
export async function submitInterviewInvitation(
  data: Omit<InterviewInvitation, 'submittedAt' | 'contactStatus' | 'confirmedDateTime'>,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await addDoc(collection(db, 'interviewInterest'), {
    ...stripUndefined(data),
    contactStatus: 'not_contacted' satisfies InterviewInvitation['contactStatus'],
    submittedAt: serverTimestamp(),
  });
}

export async function submitInquiry(data: {
  name?: string;
  email: string;
  message: string;
}): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('INQUIRY_UNAVAILABLE');
  }
  await addDoc(collection(db, 'inquiries'), {
    ...stripUndefined(data),
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

