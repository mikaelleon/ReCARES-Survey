'use client';

import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
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
  await setDoc(doc(db, 'needsAssessmentResponses', data.responseId), stripUndefined(data));
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
  // inquiries is not in the deployed rules yet, so this stays a no-op.
  void data;
}

