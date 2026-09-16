'use client';

import type { SurveyResponse } from '@/survey/schema';

/**
 * Firestore stubs for survey responses and inquiry messages.
 * TODO: wire to Firestore once Firebase project is connected.
 */

export async function submitSurveyResponse(data: SurveyResponse): Promise<void> {
  // TODO: addDoc(collection(getFirestore(), 'responses'), data)
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
