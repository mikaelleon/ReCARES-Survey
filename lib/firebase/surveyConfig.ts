'use client';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import {
  DEFAULT_SURVEY_CONFIG,
  isSurveyWindowStatus,
  normalizeInstrumentVersion,
  type SurveyConfig,
  type SurveyWindowStatus,
} from '@/survey/instrument';

const CONFIG_DOC = ['appConfig', 'survey'] as const;

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

export function mapSurveyConfig(data: Record<string, unknown> | undefined): SurveyConfig {
  if (!data) return { ...DEFAULT_SURVEY_CONFIG };
  return {
    status: isSurveyWindowStatus(data.status) ? data.status : 'open',
    instrumentVersion: normalizeInstrumentVersion(data.instrumentVersion),
    residentMessage: typeof data.residentMessage === 'string' ? data.residentMessage : '',
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
  };
}

/**
 * Public read. Missing doc means the survey is open (existing deployments stay live).
 */
export async function getSurveyConfig(): Promise<SurveyConfig> {
  try {
    const db = getFirestoreDb();
    if (!db) return { ...DEFAULT_SURVEY_CONFIG };
    const snap = await getDoc(doc(db, CONFIG_DOC[0], CONFIG_DOC[1]));
    if (!snap.exists()) return { ...DEFAULT_SURVEY_CONFIG };
    return mapSurveyConfig(snap.data() as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_SURVEY_CONFIG };
  }
}

/** Superadmin-only write. */
export async function saveSurveyConfig(
  next: {
    status: SurveyWindowStatus;
    instrumentVersion: string;
    residentMessage: string;
  },
  updatedBy: string,
): Promise<SurveyConfig> {
  const db = requireDb();
  const payload: SurveyConfig = {
    status: next.status,
    instrumentVersion: normalizeInstrumentVersion(next.instrumentVersion),
    residentMessage: next.residentMessage.trim().slice(0, 500),
    updatedBy,
  };
  await setDoc(
    doc(db, CONFIG_DOC[0], CONFIG_DOC[1]),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return payload;
}
