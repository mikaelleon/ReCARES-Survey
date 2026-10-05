/** Live instrument id stamped on each submitted response. Bump only when the question set changes. */
export const DEFAULT_INSTRUMENT_VERSION = 'v1';

export type SurveyWindowStatus = 'open' | 'paused' | 'closed';

export interface SurveyConfig {
  status: SurveyWindowStatus;
  instrumentVersion: string;
  /** Shown to residents when the window is not open. Empty → use default copy for the status. */
  residentMessage: string;
  updatedBy?: string;
}

export const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  status: 'open',
  instrumentVersion: DEFAULT_INSTRUMENT_VERSION,
  residentMessage: '',
};

export function surveyAcceptsResponses(status: SurveyWindowStatus): boolean {
  return status === 'open';
}

export function defaultResidentMessage(status: SurveyWindowStatus): string {
  if (status === 'paused') {
    return 'The survey is temporarily paused. You can leave a draft on this device and come back when it reopens.';
  }
  if (status === 'closed') {
    return 'This needs-assessment is closed. Thank you to everyone who took part.';
  }
  return '';
}

export function residentSurveyMessage(config: SurveyConfig): string {
  const custom = config.residentMessage.trim();
  if (custom) return custom;
  return defaultResidentMessage(config.status);
}

export function isSurveyWindowStatus(value: unknown): value is SurveyWindowStatus {
  return value === 'open' || value === 'paused' || value === 'closed';
}

export function normalizeInstrumentVersion(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_INSTRUMENT_VERSION;
  const trimmed = value.trim().slice(0, 40);
  return trimmed || DEFAULT_INSTRUMENT_VERSION;
}
