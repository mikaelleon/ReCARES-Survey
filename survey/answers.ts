import { showAC1, showDeviceDependentItems, showOwnerLandlordOption, showP5, isOwnerLivingElsewhere } from '@/survey/branching';
import type { SurveyAnswers } from '@/survey/schema';

const VACANT = 'No one lives in the unit right now';

/** Drop answers that a later branch change makes invalid, and auto-code R-B1 skips as 99. */
export function normalizeAnswers(input: Partial<SurveyAnswers>): Partial<SurveyAnswers> {
  const next: Partial<SurveyAnswers> = { ...input };

  if (!isOwnerLivingElsewhere(next) && next.A3 === VACANT) delete next.A3;
  if (!showOwnerLandlordOption(next) && next.A10 === 'owner_or_landlord') delete next.A10;

  if (!showDeviceDependentItems(next)) {
    next.B2 = 99;
    next.B8 = 99;
    next.B9 = 99;
  } else {
    if (next.B2 === 99) delete next.B2;
    if (next.B8 === 99) delete next.B8;
    if (next.B9 === 99) delete next.B9;
  }

  if (!showP5(next)) delete next.P5;
  if (!showAC1(next)) delete next.AC1;
  if (!(next.O1 ?? []).includes('other')) delete next.O1_other;

  return next;
}
