/**
 * Screening field IDs and typed survey payload shapes for Firestore.
 */

export interface ScreeningData {
  addrPhase: string;
  addrBlock?: string;
  addrLot?: string;
  householdSize: '1' | '2' | '3' | '4' | '5' | '6+';
  childrenYn: 'yes' | 'no';
  childrenCount?: '1' | '2' | '3' | '4+';
  civilStatus: 'single' | 'married' | 'widowed' | 'separated' | 'divorced';
  sex: 'female' | 'male';
  ageRange: '18-25' | '26-35' | '36-45' | '46-55' | '56+';
  residentType: 'homeowner' | 'renter' | 'household_member' | 'live_in_staff';
  pwdSelf: 'yes' | 'no';
  disabilityType?: string;
  pwdHousehold: 'yes' | 'no';
  primaryChannel: 'in_person' | 'online_print' | 'representative' | 'none';
}

/** Partial screening while the respondent is still filling the form. */
export type ScreeningDraft = Partial<ScreeningData> & {
  disabilityTypes?: string[];
};

/** Marker for gated fields the respondent's conditions never unlocked. */
export type NotShown = 'not_shown';

export type LikertValue = 1 | 2 | 3 | 4 | 5 | null;

export interface Section2Answers {
  s2_adequacy: LikertValue;
  s2_frequency: LikertValue;
  s2_satisfaction: LikertValue;
  s2_effectiveness: LikertValue;
  s2_agreement: LikertValue;
  s2_printer_access: string | null;
  s2_delay_days: string | null;
  s2_abandonment: string | null;
}

/**
 * Full survey response document shape for a future Firestore write.
 * Gated section fields use `not_shown` when never unlocked; section*Shown
 * booleans record whether each gate was open at submit time.
 */
export interface SurveyResponse {
  submittedAt: string;
  anonymous: true;
  language: 'EN' | 'FIL';

  screening: ScreeningData | Record<string, string | string[] | NotShown | null>;
  section2: Section2Answers;

  section3ExtendedShown: boolean;
  section4Shown: boolean;
  section5Shown: boolean;
  section7aShown: boolean;
  section7bShown: boolean;

  s3_extended_items: unknown | NotShown;
  s4_items: unknown | NotShown;
  s5_items: unknown | NotShown;
  s7a_items: unknown | NotShown;
  s7b_items: unknown | NotShown;
}
