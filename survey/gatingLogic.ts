import type { ScreeningData } from './schema';

export function isPerimeterAdjacent(phase: string, perimeterPhases: string[]): boolean {
  return perimeterPhases.includes(phase);
}

export function showSection4(data: ScreeningData, optInAnswer?: 'yes' | 'no'): boolean {
  if (optInAnswer === 'no') return false;
  const partnered = ['married', 'widowed', 'separated', 'divorced'].includes(data.civilStatus);
  if (partnered) return true;
  return optInAnswer === 'yes';
}

export function showSection5(data: ScreeningData): boolean {
  return data.childrenYn === 'yes';
}

export function showSection7a(data: ScreeningData): boolean {
  return data.pwdSelf === 'yes';
}

export function showSection7b(data: ScreeningData): boolean {
  return data.pwdHousehold === 'yes';
}

/** Display-label civil statuses that open Section 4 without opt-in. */
export const PARTNERED_CIVIL_STATUSES = ['Married', 'Widowed', 'Separated', 'Divorced'] as const;

export function isPartneredCivilStatus(label: string): boolean {
  return (PARTNERED_CIVIL_STATUSES as readonly string[]).includes(label);
}
