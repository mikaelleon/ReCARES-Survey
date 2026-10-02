import { showAC1, showDeviceDependentItems, showP5, isHomeownerBranch, isTenantBranch, isOwnerLivingElsewhere } from '@/survey/branching';
import { INCLUDE_SEX_AND_CIVIL_STATUS } from '@/survey/flags';
import type { SurveyAnswers } from '@/survey/schema';

export const CHOOSE_ONE = 'Please choose one answer to continue.';
export const CHOOSE_ANY = 'Please select at least one answer to continue.';

const VACANT = 'No one lives in the unit right now';

function missingChoice(value: unknown): boolean {
  return value == null || value === '';
}

export function validateStep(step: number, a: Partial<SurveyAnswers>): Record<string, string> {
  const errors: Record<string, string> = {};

  const need = (code: string, empty: boolean, message = CHOOSE_ONE) => {
    if (empty) errors[code] = message;
  };

  if (step === 1) {
    need('A1', missingChoice(a.A1));
    need('A2', missingChoice(a.A2));
    need('A3', missingChoice(a.A3));
    if (!isOwnerLivingElsewhere(a) && a.A3 === VACANT) need('A3', true);
    need('A4', missingChoice(a.A4));
    if (showAC1(a)) need('AC1', !a.AC1 || a.AC1.length === 0, CHOOSE_ANY);
    if (a.AC1_other != null && a.AC1_other.length > 200) {
      errors.AC1_other = 'Please use 200 characters or fewer.';
    }
    need('A5', missingChoice(a.A5));
  }

  if (step === 2) {
    need('A6', missingChoice(a.A6));
    if (INCLUDE_SEX_AND_CIVIL_STATUS) {
      need('A7', missingChoice(a.A7));
      need('A8', missingChoice(a.A8));
    }
    need('A10', missingChoice(a.A10));
    need('A11', missingChoice(a.A11));
  }

  if (step === 3) {
    need('B1', !a.B1 || a.B1.length === 0, CHOOSE_ANY);
    if (showDeviceDependentItems(a)) need('B2', missingChoice(a.B2) || a.B2 === 99);
    need('B3', missingChoice(a.B3));
    need('B4', missingChoice(a.B4));
    need('B5', missingChoice(a.B5));
  }

  if (step === 4) {
    if (a.B6 != null && (typeof a.B6 !== 'number' || !Number.isInteger(a.B6) || a.B6 < 0 || a.B6 > 10000)) {
      errors.B6 = 'Please enter a whole number from 0 to 10,000.';
    }
    need('B7', missingChoice(a.B7));
    if (showDeviceDependentItems(a)) {
      need('B8', missingChoice(a.B8));
      need('B9', missingChoice(a.B9));
    }
  }

  if (step === 5) {
    need('F1', missingChoice(a.F1));
    need('F2', missingChoice(a.F2));
    need('F3', missingChoice(a.F3));
    need('F4', missingChoice(a.F4));
    need('F5', missingChoice(a.F5));
  }

  if (step === 6) {
    need('F6', missingChoice(a.F6));
    need('F7', missingChoice(a.F7));
    need('F8', !a.F8 || a.F8.length === 0, CHOOSE_ANY);
    const f8Others = (a.F8 ?? []).filter((id) => id !== 'none_of_these');
    if (f8Others.length > 3) errors.F8 = 'Please select at most 3.';
    need('F9', !a.F9 || a.F9.length === 0, CHOOSE_ANY);
    if (a.F10 != null && a.F10.length > 300) errors.F10 = 'Please use 300 characters or fewer.';
  }

  if (step === 7) {
    need('S1', missingChoice(a.S1));
    need('S2', missingChoice(a.S2));
    need('S3', missingChoice(a.S3));
  }

  if (step === 8) {
    need('P1', !a.P1 || a.P1.length === 0, CHOOSE_ANY);
    need('P2', missingChoice(a.P2));
    need('P3', missingChoice(a.P3));
    if (a.P4 != null && (typeof a.P4 !== 'number' || !Number.isInteger(a.P4) || a.P4 < 0 || a.P4 > 180)) {
      errors.P4 = 'Please enter a whole number from 0 to 180.';
    }
    if (showP5(a)) need('P5', missingChoice(a.P5));
  }

  if (step === 9) {
    need('C1', missingChoice(a.C1));
    need('C2', missingChoice(a.C2));
    need('C3', missingChoice(a.C3));
  }

  if (step === 10) {
    need('R1', missingChoice(a.R1));
    need('R2', missingChoice(a.R2));
    need('R3', missingChoice(a.R3));
  }

  if (step === 11 && isHomeownerBranch(a)) {
    need('H1', !a.H1 || a.H1.length === 0, CHOOSE_ANY);
    need('H2', missingChoice(a.H2));
    need('H3', missingChoice(a.H3));
    if (a.H4 != null && a.H4.length > 300) errors.H4 = 'Please use 300 characters or fewer.';
  }

  if (step === 11 && isTenantBranch(a)) {
    need('T1', !a.T1 || a.T1.length === 0, CHOOSE_ANY);
    need('T2', missingChoice(a.T2));
    need('T3', missingChoice(a.T3));
    if (a.T4 != null && a.T4.length > 300) errors.T4 = 'Please use 300 characters or fewer.';
  }

  if (step === 11 && !isHomeownerBranch(a) && !isTenantBranch(a)) {
    errors.A1 = CHOOSE_ONE;
  }

  if (step === 12) {
    need('AC2', missingChoice(a.AC2));
    need('AC3', missingChoice(a.AC3));
    need('AC4', missingChoice(a.AC4));
  }

  if (step === 13) {
    need('O1', !a.O1 || a.O1.length === 0, CHOOSE_ANY);
    if (a.O2 != null && a.O2.length > 500) errors.O2 = 'Please use 500 characters or fewer.';
    if (a.O1_other != null && a.O1_other.length > 200) {
      errors.O1_other = 'Please use 200 characters or fewer.';
    }
  }

  return errors;
}
