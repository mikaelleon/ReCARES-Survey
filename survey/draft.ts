
const DRAFT_KEY = 'recares-na-draft';
const SUBMITTED_KEY = 'recares-na-submitted';

export interface SurveyDraft {
  answers: Record<string, unknown>;
  /** Step the respondent was on (1-based), or one past the last step for review. */
  currentStep: number;
  lastStepReached: number;
  /** Milliseconds when consent was passed. Used only as a local bot check. Never stored on the response. */
  consentedAt: number;
  /** Instrument the answers belong to. A draft from another version is discarded. */
  instrumentVersion?: string;
}

export function readDraft(): SurveyDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SurveyDraft;
    if (!parsed || typeof parsed.currentStep !== 'number' || !parsed.answers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDraft(draft: SurveyDraft): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage may be blocked. The survey still runs for this visit.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function markSubmittedOnDevice(): void {
  try {
    window.localStorage.setItem(SUBMITTED_KEY, '1');
  } catch {
    // ignore
  }
}

export function deviceAlreadySubmitted(): boolean {
  try {
    return window.localStorage.getItem(SUBMITTED_KEY) === '1';
  } catch {
    return false;
  }
}
