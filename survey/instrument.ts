/** Live instrument id stamped on each submitted response. Bump only when the question set changes. */
export const DEFAULT_INSTRUMENT_VERSION = 'v1';

export type SurveyWindowStatus = 'open' | 'paused' | 'closed';

export interface SurveyConfig {
  status: SurveyWindowStatus;
  instrumentVersion: string;
  /** Shown to residents when the window is not open. Empty → use default copy for the status. */
  residentMessage: string;
  /** Optional schedule (epoch ms). Before `opensAt` or from `closesAt` the survey does not accept responses. */
  opensAt?: number | null;
  closesAt?: number | null;
  updatedBy?: string;
}

export const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  status: 'open',
  instrumentVersion: DEFAULT_INSTRUMENT_VERSION,
  residentMessage: '',
  opensAt: null,
  closesAt: null,
};

/**
 * What residents actually experience right now: the saved status, adjusted by the schedule.
 * Before `opensAt` the survey behaves as paused; from `closesAt` it behaves as closed.
 */
export function effectiveSurveyStatus(
  config: Pick<SurveyConfig, 'status' | 'opensAt' | 'closesAt'>,
  now: number = Date.now(),
): SurveyWindowStatus {
  if (config.status !== 'open') return config.status;
  if (config.opensAt != null && now < config.opensAt) return 'paused';
  if (config.closesAt != null && now >= config.closesAt) return 'closed';
  return 'open';
}

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

export function residentSurveyMessage(config: SurveyConfig, now: number = Date.now()): string {
  const custom = config.residentMessage.trim();
  if (custom) return custom;
  if (config.status === 'paused' && config.opensAt != null && now < config.opensAt) {
    const when = new Date(config.opensAt).toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    return `The survey opens on ${when}. You are welcome to come back then.`;
  }
  return defaultResidentMessage(config.status);
}

/** Suggest the next label: v1 gives v2, v2.1 gives v2.2, anything else gets a "-2" suffix. */
export function nextInstrumentVersion(current: string): string {
  const match = /^(.*?)(\d+)$/.exec(current.trim());
  if (!match) return `${current.trim() || DEFAULT_INSTRUMENT_VERSION}-2`;
  return `${match[1]}${Number(match[2]) + 1}`;
}

export function isSurveyWindowStatus(value: unknown): value is SurveyWindowStatus {
  return value === 'open' || value === 'paused' || value === 'closed';
}

export function normalizeInstrumentVersion(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_INSTRUMENT_VERSION;
  const trimmed = value.trim().slice(0, 40);
  return trimmed || DEFAULT_INSTRUMENT_VERSION;
}
