import {
  isHomeownerBranch,
  isOwnerLivingElsewhere,
  isTenantBranch,
  showAC1,
  showDeviceDependentItems,
  showH3,
  showOwnerLandlordOption,
  showP2P3,
  showP5,
} from '@/survey/branching';
import type { O1Details, SurveyAnswers } from '@/survey/schema';

const O1_CATEGORIES = [
  'water_supply',
  'electricity_power',
  'garbage_collection',
  'street_lights',
  'roads_drainage',
  'noise_curfew',
  'parking',
  'security_patrol',
  'billing_dues',
  'renovation_permits',
  'pet_animal',
  'facilities_amenities',
  'neighbor_disputes',
] as const;

const VACANT = 'No one lives in the unit right now';

/** Drop answers that a later branch change makes invalid, and auto-code R-B1 skips as 99. */
export function normalizeAnswers(input: Partial<SurveyAnswers>): Partial<SurveyAnswers> {
  const next: Partial<SurveyAnswers> = { ...input };

  if (!isOwnerLivingElsewhere(next) && next.A3 === VACANT) delete next.A3;
  if (!showOwnerLandlordOption(next) && next.A10 === 'owner_or_landlord') delete next.A10;

  if (!showDeviceDependentItems(next)) {
    next.B2 = 99;
    next.B8 = 'not_shown';
    next.B9 = 'not_shown';
  } else {
    if (next.B2 === 99) delete next.B2;
    if (next.B8 === 'not_shown') delete next.B8;
    if (next.B9 === 'not_shown') delete next.B9;
  }

  if (typeof (next.B6 as unknown) === 'number') delete next.B6;
  for (const code of ['B7', 'S1', 'S2', 'S3', 'C2', 'C3', 'R1', 'R2', 'H2', 'T2', 'T3', 'AC2', 'AC3', 'P5', 'F7'] as const) {
    if ((next[code] as unknown) === 99) delete next[code];
  }
  if (!showP5(next)) delete next.P5;
  if (!showP2P3(next)) {
    next.P2 = 'not_shown';
    next.P3 = 'not_shown';
  } else {
    if (next.P2 === 'not_shown' || (next.P2 as unknown) === 99) delete next.P2;
    if (next.P3 === 'not_shown' || (next.P3 as unknown) === 99) delete next.P3;
  }
  if (!showAC1(next)) {
    delete next.AC1;
    delete next.AC1_other;
  } else if (!(next.AC1 ?? []).includes('other')) {
    delete next.AC1_other;
  }
  if (!(next.O1 ?? []).includes('other')) delete next.O1_other;
  next.O1Details = pruneO1Details(next.O1, next.O1Details);

  if (isTenantBranch(next)) {
    delete next.H1;
    delete next.H2;
    delete next.H3;
    delete next.H4;
  } else if (isHomeownerBranch(next)) {
    delete next.T1;
    delete next.T2;
    delete next.T3;
    delete next.T4;
    if (!showH3(next)) next.H3 = 'not_shown';
    else if (next.H3 === 'not_shown' || (next.H3 as unknown) === 99) delete next.H3;
  }

  return next;
}

function pruneO1Details(selected: string[] | undefined, details: O1Details | undefined): O1Details | undefined {
  if (!selected || selected.includes('none_of_these')) return undefined;
  const next: O1Details = { ...(details ?? {}) };
  for (const category of O1_CATEGORIES) {
    const otherKey = `${category}_other` as const;
    if (!selected.includes(category)) {
      delete next[category];
      delete next[otherKey];
      continue;
    }
    if (!(next[category] ?? []).includes('Other')) delete next[otherKey];
  }
  return next;
}
