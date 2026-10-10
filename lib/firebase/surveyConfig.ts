'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import { messageForFirestoreWriteError } from '@/lib/firebase/writeErrors';
import {
  DEFAULT_SURVEY_CONFIG,
  effectiveSurveyStatus,
  isSurveyWindowStatus,
  normalizeInstrumentVersion,
  type SurveyConfig,
  type SurveyWindowStatus,
} from '@/survey/instrument';

const CONFIG_DOC = ['appConfig', 'survey'] as const;

export type SurveyConfigRecord = {
  config: SurveyConfig;
  /** False when `appConfig/survey` is absent (defaults apply). */
  exists: boolean;
  updatedAtMs: number | null;
};

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured. Add the project keys to .env.local.');
  return db;
}

function tsToMs(value: unknown): number | null {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    const ms = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

export function mapSurveyConfig(data: Record<string, unknown> | undefined): SurveyConfig {
  if (!data) return { ...DEFAULT_SURVEY_CONFIG };
  return {
    status: isSurveyWindowStatus(data.status) ? data.status : 'open',
    instrumentVersion: normalizeInstrumentVersion(data.instrumentVersion),
    residentMessage: typeof data.residentMessage === 'string' ? data.residentMessage : '',
    opensAt: tsToMs(data.opensAt),
    closesAt: tsToMs(data.closesAt),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
  };
}

function messageForWriteError(error: unknown, action: 'save' | 'reset'): string {
  return messageForFirestoreWriteError(
    error,
    action === 'reset' ? 'Could not reset survey settings.' : 'Could not save survey settings.',
    { resourceHint: 'appConfig/survey' },
  );
}

/**
 * Public read with existence metadata for admin CRUD.
 * Missing doc means the survey is open (existing deployments stay live).
 */
export async function getSurveyConfigRecord(): Promise<SurveyConfigRecord> {
  try {
    const db = getFirestoreDb();
    if (!db) {
      return { config: { ...DEFAULT_SURVEY_CONFIG }, exists: false, updatedAtMs: null };
    }
    const snap = await getDoc(doc(db, CONFIG_DOC[0], CONFIG_DOC[1]));
    if (!snap.exists()) {
      return { config: { ...DEFAULT_SURVEY_CONFIG }, exists: false, updatedAtMs: null };
    }
    const data = snap.data() as Record<string, unknown>;
    return {
      config: mapSurveyConfig(data),
      exists: true,
      updatedAtMs: tsToMs(data.updatedAt),
    };
  } catch {
    return { config: { ...DEFAULT_SURVEY_CONFIG }, exists: false, updatedAtMs: null };
  }
}

/**
 * Public read for residents. `status` is the *effective* status (schedule applied).
 * Missing doc means the survey is open (existing deployments stay live).
 */
export async function getSurveyConfig(): Promise<SurveyConfig> {
  const { config } = await getSurveyConfigRecord();
  return { ...config, status: effectiveSurveyStatus(config) };
}

export interface SurveyHistoryEntry {
  id: string;
  atMs: number | null;
  byName: string;
  summary: string;
}

const HISTORY_COLLECTION = 'surveyConfigHistory';

/** Best-effort audit trail; never blocks a save. */
async function logHistory(byUid: string, byName: string, summary: string): Promise<void> {
  try {
    const db = requireDb();
    await addDoc(collection(db, HISTORY_COLLECTION), {
      byUid,
      byName,
      summary: summary.slice(0, 300),
      at: serverTimestamp(),
    });
  } catch {
    /* history is optional */
  }
}

export async function listSurveyHistory(max = 8): Promise<SurveyHistoryEntry[]> {
  try {
    const db = requireDb();
    const snap = await getDocs(
      query(collection(db, HISTORY_COLLECTION), orderBy('at', 'desc'), limit(max)),
    );
    return snap.docs.map((item) => {
      const data = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        atMs: tsToMs(data.at),
        byName: typeof data.byName === 'string' ? data.byName : 'Superadmin',
        summary: typeof data.summary === 'string' ? data.summary : '',
      };
    });
  } catch {
    return [];
  }
}

/** Superadmin create/update of `appConfig/survey`. */
export async function saveSurveyConfig(
  next: {
    status: SurveyWindowStatus;
    instrumentVersion: string;
    residentMessage: string;
    opensAt?: number | null;
    closesAt?: number | null;
  },
  updatedBy: string,
  summary?: { byName: string; text: string },
): Promise<SurveyConfigRecord> {
  try {
    const db = requireDb();
    const payload: SurveyConfig = {
      status: next.status,
      instrumentVersion: normalizeInstrumentVersion(next.instrumentVersion),
      residentMessage: next.residentMessage.trim().slice(0, 500),
      opensAt: next.opensAt ?? null,
      closesAt: next.closesAt ?? null,
      updatedBy,
    };
    await setDoc(
      doc(db, CONFIG_DOC[0], CONFIG_DOC[1]),
      {
        status: payload.status,
        instrumentVersion: payload.instrumentVersion,
        residentMessage: payload.residentMessage,
        opensAt: payload.opensAt != null ? Timestamp.fromMillis(payload.opensAt) : null,
        closesAt: payload.closesAt != null ? Timestamp.fromMillis(payload.closesAt) : null,
        updatedBy,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    if (summary) await logHistory(updatedBy, summary.byName, summary.text);
    return {
      config: payload,
      exists: true,
      updatedAtMs: Date.now(),
    };
  } catch (error) {
    throw new Error(messageForWriteError(error, 'save'));
  }
}

/**
 * Superadmin delete of `appConfig/survey`.
 * After delete, the app falls back to open + default instrument version.
 */
export async function resetSurveyConfig(by?: { uid: string; name: string }): Promise<void> {
  try {
    const db = requireDb();
    await deleteDoc(doc(db, CONFIG_DOC[0], CONFIG_DOC[1]));
    if (by) await logHistory(by.uid, by.name, 'Reset to defaults (open, instrument v1).');
  } catch (error) {
    throw new Error(messageForWriteError(error, 'reset'));
  }
}
