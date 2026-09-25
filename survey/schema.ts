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

/** One stored questionnaire answer. `not_shown` means the item was not offered. */
export type ItemAnswer = number | string | string[] | NotShown | null;

/**
 * Full survey response document shape for a future Firestore write.
 * Gated section fields use `not_shown` when never unlocked; section*Shown
 * booleans record whether each gate was open at submit time.
 * Interview contact details are never stored on this document — only the
 * opt-in boolean. Contact fields go to `interview_contacts` separately.
 */
export interface SurveyResponse {
  submittedAt: string;
  anonymous: true;
  language: 'EN' | 'FIL';

  screening: ScreeningData | Record<string, string | string[] | NotShown | null>;

  /**
   * Every questionnaire item. Shown answers are the value (or null if skipped).
   * Items the respondent never saw are `not_shown` — closed sections and
   * extended-pool items when the core-only path is active.
   */
  answers: Record<string, ItemAnswer>;
  /** True when fewer than three gated sections apply, so extended items were offered. */
  extendedPoolShown: boolean;
  /** How many of s3b, s4, s5, s7a, s7b applied at submit time. */
  gatedSectionCount: number;

  section3ExtendedShown: boolean;
  section4Shown: boolean;
  section5Shown: boolean;
  section7aShown: boolean;
  section7bShown: boolean;

  s3_extended_items: Record<string, ItemAnswer> | NotShown;
  s4_items: Record<string, ItemAnswer> | NotShown;
  s5_items: Record<string, ItemAnswer> | NotShown;
  s7a_items: Record<string, ItemAnswer> | NotShown;
  s7b_items: Record<string, ItemAnswer> | NotShown;

  /** Whether the respondent opted in to possible interview contact. */
  interviewOptIn: boolean;
}

/**
 * Separate Firestore document for interview scheduling contact.
 * Written only when interviewOptIn is true; never linked to a response id.
 */
export interface InterviewContact {
  email: string;
  interviewFormat: 'Online' | 'Face-to-face';
  preferredDays: string[];
  preferredTime: 'Morning' | 'Afternoon' | 'Evening' | 'Other';
  /** Free-text preferred time; only set when preferredTime is Other. */
  preferredTimeOther?: string;
  submittedAt: string;
}
