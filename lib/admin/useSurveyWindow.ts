'use client';

import { useEffect, useState } from 'react';
import { getSurveyConfig } from '@/lib/firebase/surveyConfig';
import {
  DEFAULT_SURVEY_CONFIG,
  residentSurveyMessage,
  surveyAcceptsResponses,
  type SurveyConfig,
} from '@/survey/instrument';

export function useSurveyWindow() {
  const [config, setConfig] = useState<SurveyConfig>(DEFAULT_SURVEY_CONFIG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSurveyConfig()
      .then((next) => {
        if (!cancelled) setConfig(next);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    config,
    ready,
    acceptsResponses: surveyAcceptsResponses(config.status),
    message: residentSurveyMessage(config),
  };
}
