'use client';

import type { SurveyResponse, InterviewContact } from '@/survey/schema';

/**
 * Firestore stubs for survey responses, interview contacts, and inquiries.
 * TODO: wire to Firestore once Firebase project is connected.
 */

export async function submitSurveyResponse(data: SurveyResponse): Promise<void> {
  // TODO: addDoc(collection(getFirestore(), 'responses'), data)
  void data;
}

/**
 * Writes interview contact info to a separate collection so emails never
 * land on the anonymous survey response document.
 */
export async function submitInterviewContact(data: InterviewContact): Promise<void> {
  // TODO: addDoc(collection(getFirestore(), 'interview_contacts'), data)
  void data;
}

export async function submitInquiry(data: {
  name?: string;
  email: string;
  message: string;
}): Promise<void> {
  // TODO: addDoc(collection(getFirestore(), 'inquiries'), data)
  void data;
}

export async function listSurveyResponses(): Promise<SurveyResponse[]> {
  // TODO: getDocs(collection(getFirestore(), 'responses'))
  return [];
}
