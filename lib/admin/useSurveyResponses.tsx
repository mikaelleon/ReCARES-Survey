'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { mapSurveyDocToSample } from '@/lib/admin/mapSurveyResponse';
import { SAMPLE_RESPONSES, type SampleRecord } from '@/lib/admin/sampleResponses';
import { getFirestoreDb } from '@/lib/firebase/config';
import type { SurveyResponseDocument } from '@/survey/schema';

export type SurveyResponseSource = 'firestore' | 'unavailable' | 'error';

export interface UseSurveyResponsesResult {
  records: SampleRecord[];
  setRecords: Dispatch<SetStateAction<SampleRecord[]>>;
  status: 'loading' | 'ready' | 'error';
  /** Live query only — never 'sample'. Demo stub is opt-in via ?demo=sample. */
  source: SurveyResponseSource;
  /** True only when intentionally using SAMPLE_RESPONSES (?demo=sample). */
  usingDemoSample: boolean;
  reload: () => Promise<void>;
}

function mapDocs(
  docs: { id: string; data: () => SurveyResponseDocument | Record<string, unknown> }[],
): SampleRecord[] {
  return docs
    .map((item) => {
      const data = item.data() as SurveyResponseDocument;
      return mapSurveyDocToSample({
        responseId: data.responseId || item.id,
        submittedDate: data.submittedDate || '',
        status: data.status || 'complete',
        lastStepReached: data.lastStepReached ?? 0,
        deviceClass: data.deviceClass || 'phone',
        answers: data.answers || {},
      });
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 500);
}

function wantsDemoSample(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('demo') === 'sample';
  } catch {
    return false;
  }
}

const SurveyResponsesContext = createContext<UseSurveyResponsesResult | null>(null);

/**
 * Shared provider — Dashboard + Responses read the same in-memory set.
 * Live path: Firestore `needsAssessmentResponses` only. No silent SAMPLE inject.
 */
export function SurveyResponsesProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<SampleRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [source, setSource] = useState<SurveyResponseSource>('unavailable');
  const [usingDemoSample, setUsingDemoSample] = useState(false);

  const reload = useCallback(async () => {
    setStatus('loading');

    if (wantsDemoSample()) {
      setRecords(SAMPLE_RESPONSES);
      setSource('unavailable');
      setUsingDemoSample(true);
      setStatus('ready');
      return;
    }

    setUsingDemoSample(false);
    const db = getFirestoreDb();
    if (!db) {
      setRecords([]);
      setSource('unavailable');
      setStatus('error');
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'needsAssessmentResponses'));
      setRecords(mapDocs(snap.docs));
      setSource('firestore');
      setStatus('ready');
    } catch (error) {
      console.warn('useSurveyResponses: Firestore read failed', error);
      setRecords([]);
      setSource('error');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ records, setRecords, status, source, usingDemoSample, reload }),
    [records, status, source, usingDemoSample, reload],
  );

  return (
    <SurveyResponsesContext.Provider value={value}>{children}</SurveyResponsesContext.Provider>
  );
}

/**
 * Single source of truth for Dashboard + Responses (must be under SurveyResponsesProvider).
 */
export function useSurveyResponses(): UseSurveyResponsesResult {
  const ctx = useContext(SurveyResponsesContext);
  if (!ctx) {
    throw new Error('useSurveyResponses must be used within SurveyResponsesProvider');
  }
  return ctx;
}
