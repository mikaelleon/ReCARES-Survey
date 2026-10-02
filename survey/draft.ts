import type { SurveyAnswers } from '@/survey/schema';

const DRAFT_KEY = 'recares-na-draft';
const SUBMITTED_KEY = 'recares-na-submitted';

export interface SurveyDraft {
  answers: Partial<SurveyAnswers>;
  /** Step the respondent was on, 1–13, or 14 for review. */
  currentStep: number;
  lastStepReached: number;
  /** Milliseconds when consent was passed. Used only as a local bot check. Never stored on the response. */
  consentedAt: number;
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
