import type { SurveyAnswers } from '@/survey/schema';

export function isHomeownerBranch(a: Partial<SurveyAnswers>): boolean {
  return [1, 2, 3, 4].includes(a.A1 as number);
}

export function isTenantBranch(a: Partial<SurveyAnswers>): boolean {
  return [5, 6].includes(a.A1 as number);
}

export function showOwnerLandlordOption(a: Partial<SurveyAnswers>): boolean {
  return isTenantBranch(a);
}

export function isOwnerLivingElsewhere(a: Partial<SurveyAnswers>): boolean {
  return a.A1 === 2 || a.A1 === 3;
}

export function showP5(a: Partial<SurveyAnswers>): boolean {
  return a.A5 === 'yes';
}

/** Skip P2 and P3 when the respondent brought no one through the gate. */
export function showP2P3(a: Partial<SurveyAnswers>): boolean {
  return !(a.P1 ?? []).includes('none_of_these');
}

/** H3 only when H1 shows a tenant registration or authorization. */
export function showH3(a: Partial<SurveyAnswers>): boolean {
  return (a.H1 ?? []).includes('tenant_registration');
}

export function showAC1(a: Partial<SurveyAnswers>): boolean {
  return a.A4 === 'yes';
}

export function showDeviceDependentItems(a: Partial<SurveyAnswers>): boolean {
  return !(a.B1 ?? []).includes('none');
}

export function getF3Wording(a: Partial<SurveyAnswers>): string {
  return isHomeownerBranch(a)
    ? 'How likely are you to use online forms to register or authorize your tenant with the HOA?'
    : 'How likely are you to use online tenant and lessee forms that you can submit from home?';
}
