'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/config';
import { messageForFirestoreWriteError } from '@/lib/firebase/writeErrors';
import { DEFAULT_INSTRUMENT } from '@/survey/defaultInstrument';
import { DEFAULT_INSTRUMENT_VERSION, nextInstrumentVersion, type SurveyConfig } from '@/survey/instrument';
import type { Instrument, InstrumentStatus, QuestionDef, StepDef } from '@/survey/model';

const COLLECTION = 'surveyInstruments';

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

function isStatus(value: unknown): value is InstrumentStatus {
  return value === 'draft' || value === 'published' || value === 'archived';
}

/** Firestore cannot hold undefined, so strip it. Translations are stored as a list of pairs. */
function toDocument(inst: Instrument): Record<string, unknown> {
  const translations = Object.entries(inst.translations ?? {})
    .filter(([en, fil]) => en.trim() && fil.trim())
    .map(([en, fil]) => ({ en, fil }));
  const body = {
    version: inst.version,
    status: inst.status,
    title: inst.title ?? '',
    steps: inst.steps,
    questions: inst.questions,
    translations,
    baseVersion: inst.baseVersion ?? null,
  };
  return JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
}

export function fromDocument(id: string, data: Record<string, unknown>): Instrument | null {
  if (!Array.isArray(data.steps) || !Array.isArray(data.questions)) return null;
  const translations: Record<string, string> = {};
  if (Array.isArray(data.translations)) {
    for (const row of data.translations as Array<{ en?: unknown; fil?: unknown }>) {
      if (typeof row?.en === 'string' && typeof row?.fil === 'string') translations[row.en] = row.fil;
    }
  }
  return {
    version: typeof data.version === 'string' ? data.version : id,
    status: isStatus(data.status) ? data.status : 'draft',
    title: typeof data.title === 'string' ? data.title : undefined,
    steps: data.steps as StepDef[],
    questions: data.questions as QuestionDef[],
    translations,
    baseVersion: typeof data.baseVersion === 'string' ? data.baseVersion : undefined,
    updatedBy: typeof data.updatedByName === 'string' ? data.updatedByName : undefined,
    updatedAtMs: tsToMs(data.updatedAt),
    publishedAtMs: tsToMs(data.publishedAt),
  };
}

/**
 * Instrument residents should see. Falls back to the bundled v1 when no published
 * document exists for the configured version (older deployments, or a label-only version).
 */
export async function loadLiveInstrument(config: SurveyConfig): Promise<Instrument> {
  const label = config.instrumentVersion || DEFAULT_INSTRUMENT_VERSION;
  try {
    const db = getFirestoreDb();
    if (db) {
      const snap = await getDoc(doc(db, COLLECTION, label));
      if (snap.exists()) {
        const inst = fromDocument(snap.id, snap.data() as Record<string, unknown>);
        if (inst && inst.status === 'published' && inst.steps.length > 0) return inst;
      }
    }
  } catch {
    /* fall through to the bundled copy */
  }
  return { ...DEFAULT_INSTRUMENT, version: label };
}

export interface InstrumentSummary {
  version: string;
  status: InstrumentStatus;
  title?: string;
  questionCount: number;
  stepCount: number;
  updatedAtMs: number | null;
  publishedAtMs: number | null;
  updatedBy?: string;
  /** True for the copy that ships with the app, shown when Firestore has no v1 document. */
  bundled?: boolean;
}

export interface InstrumentList {
  rows: InstrumentSummary[];
  /** Set when saved versions could not be read; the bundled v1 is still listed. */
  warning?: string;
}

export async function listInstruments(): Promise<InstrumentList> {
  const rows: InstrumentSummary[] = [];
  let warning: string | undefined;
  try {
    const db = requireDb();
    const snap = await getDocs(collection(db, COLLECTION));
    for (const item of snap.docs) {
      const inst = fromDocument(item.id, item.data() as Record<string, unknown>);
      if (!inst) continue;
      rows.push({
        version: inst.version,
        status: inst.status,
        title: inst.title,
        questionCount: inst.questions.length,
        stepCount: inst.steps.length,
        updatedAtMs: inst.updatedAtMs ?? null,
        publishedAtMs: inst.publishedAtMs ?? null,
        updatedBy: inst.updatedBy,
      });
    }
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
    warning =
      code === 'permission-denied'
        ? 'Saved survey versions could not be read: Firestore is refusing access. Deploy the updated firestore.rules (firebase deploy --only firestore:rules), then reload. Until then only the built-in v1 is shown and nothing can be saved.'
        : 'Saved survey versions could not be loaded. Showing the built-in v1 only.';
  }
  if (!rows.some((row) => row.version === DEFAULT_INSTRUMENT.version)) {
    rows.push({
      version: DEFAULT_INSTRUMENT.version,
      status: 'published',
      title: DEFAULT_INSTRUMENT.title,
      questionCount: DEFAULT_INSTRUMENT.questions.length,
      stepCount: DEFAULT_INSTRUMENT.steps.length,
      updatedAtMs: null,
      publishedAtMs: null,
      bundled: true,
    });
  }
  rows.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
  return { rows, warning };
}

export async function getInstrument(version: string): Promise<Instrument | null> {
  try {
    const db = requireDb();
    const snap = await getDoc(doc(db, COLLECTION, version));
    if (snap.exists()) return fromDocument(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    if (version !== DEFAULT_INSTRUMENT.version) throw error;
  }
  if (version === DEFAULT_INSTRUMENT.version) return structuredClone(DEFAULT_INSTRUMENT);
  return null;
}

function writeMessage(error: unknown, fallback: string, version: string): Error {
  return new Error(messageForFirestoreWriteError(error, fallback, { resourceHint: `${COLLECTION}/${version}` }));
}

/** Smallest unused label after the highest existing one. */
export async function suggestNextVersion(): Promise<string> {
  const { rows } = await listInstruments();
  let candidate = rows[0]?.version ?? DEFAULT_INSTRUMENT_VERSION;
  const taken = new Set(rows.map((row) => row.version));
  do {
    candidate = nextInstrumentVersion(candidate);
  } while (taken.has(candidate));
  return candidate;
}

/** Copy `base` into a new draft under `version`. */
export async function createDraft(
  base: Instrument,
  version: string,
  by: { uid: string; name: string },
): Promise<Instrument> {
  const label = version.trim().slice(0, 40);
  if (!label) throw new Error('Give the new draft a version label.');
  try {
    const db = requireDb();
    const existing = await getDoc(doc(db, COLLECTION, label));
    if (existing.exists()) throw new Error(`Version ${label} already exists.`);
    const draft: Instrument = {
      ...structuredClone(base),
      version: label,
      status: 'draft',
      baseVersion: base.version,
    };
    await setDoc(doc(db, COLLECTION, label), {
      ...toDocument(draft),
      updatedBy: by.uid,
      updatedByName: by.name,
      updatedAt: serverTimestamp(),
    });
    return draft;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Version ')) throw error;
    throw writeMessage(error, 'Could not create the draft.', label);
  }
}

/** Save edits to a draft. Published and archived versions are read-only. */
export async function saveDraft(inst: Instrument, by: { uid: string; name: string }): Promise<void> {
  if (inst.status !== 'draft') throw new Error('Only drafts can be edited. Copy this version to a new draft first.');
  try {
    const db = requireDb();
    await setDoc(doc(db, COLLECTION, inst.version), {
      ...toDocument(inst),
      updatedBy: by.uid,
      updatedByName: by.name,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw writeMessage(error, 'Could not save the draft.', inst.version);
  }
}

export async function deleteDraft(version: string): Promise<void> {
  try {
    const db = requireDb();
    await deleteDoc(doc(db, COLLECTION, version));
  } catch (error) {
    throw writeMessage(error, 'Could not delete the draft.', version);
  }
}

/**
 * Publish a draft and make it the live instrument.
 * The previous live version is archived. Its responses keep their version stamp.
 */
export async function publishDraft(
  inst: Instrument,
  previousLive: string | null,
  by: { uid: string; name: string },
): Promise<void> {
  if (inst.status !== 'draft') throw new Error('Only a draft can be published.');
  try {
    const db = requireDb();
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTION, inst.version), {
      ...toDocument({ ...inst, status: 'published' }),
      updatedBy: by.uid,
      updatedByName: by.name,
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      publishedBy: by.uid,
    });
    if (previousLive && previousLive !== inst.version) {
      const previous = await getDoc(doc(db, COLLECTION, previousLive));
      if (previous.exists() && (previous.data() as { status?: string }).status === 'published') {
        batch.update(doc(db, COLLECTION, previousLive), {
          status: 'archived',
          updatedBy: by.uid,
          updatedByName: by.name,
          updatedAt: serverTimestamp(),
        });
      }
    }
    // A missing survey config means "open with defaults"; keep that true when this write creates the doc.
    const configSnap = await getDoc(doc(db, 'appConfig', 'survey'));
    const base = configSnap.exists()
      ? {}
      : { status: 'open', residentMessage: '', opensAt: null, closesAt: null };
    batch.set(
      doc(db, 'appConfig', 'survey'),
      { ...base, instrumentVersion: inst.version, updatedBy: by.uid, updatedAt: serverTimestamp() },
      { merge: true },
    );
    await batch.commit();
  } catch (error) {
    throw writeMessage(error, 'Could not publish this version.', inst.version);
  }
}
