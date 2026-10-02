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
