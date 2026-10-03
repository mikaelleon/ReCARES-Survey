'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { mapSurveyDocToSample } from '@/lib/admin/mapSurveyResponse';
import { SAMPLE_RESPONSES, type SampleRecord } from '@/lib/admin/sampleResponses';
import { getFirestoreDb } from '@/lib/firebase/config';
import type { SurveyResponseDocument } from '@/survey/schema';

export type SurveyResponseSource = 'firestore' | 'sample';

export interface UseSurveyResponsesResult {
  records: SampleRecord[];
  setRecords: React.Dispatch<React.SetStateAction<SampleRecord[]>>;
  status: 'loading' | 'ready' | 'error';
  source: SurveyResponseSource;
  reload: () => Promise<void>;
}

/**
 * Single source of truth for Dashboard + Responses.
 * Prefers Firestore `needsAssessmentResponses`; falls back to SAMPLE_RESPONSES when empty/blocked.
 */
export function useSurveyResponses(): UseSurveyResponsesResult {
  const [records, setRecords] = useState<SampleRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [source, setSource] = useState<SurveyResponseSource>('sample');

  const reload = useCallback(async () => {
    setStatus('loading');
    const db = getFirestoreDb();
    if (!db) {
      setRecords(SAMPLE_RESPONSES);
      setSource('sample');
      setStatus('ready');
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'needsAssessmentResponses'));
      if (snap.empty) {
        setRecords(SAMPLE_RESPONSES);
        setSource('sample');
        setStatus('ready');
        return;
      }

      const mapped = snap.docs
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
      setRecords(mapped);
      setSource('firestore');
      setStatus('ready');
    } catch (error) {
      console.warn('useSurveyResponses: Firestore read failed, using sample', error);
      setRecords(SAMPLE_RESPONSES);
      setSource('sample');
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { records, setRecords, status, source, reload };
}
