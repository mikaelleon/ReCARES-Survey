/**
 * Needs-assessment schema, specification v2.
 * Block, lot, street, exact age, and any respondent identifier are not fields.
 */

export type AgreementScore = 1 | 2 | 3 | 4 | 5 | 99;
export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;

export interface SurveyAnswers {
  A1: 1 | 2 | 3 | 4 | 5 | 6;
  A2:
    | 'Phase 1'
    | 'Phase 2'
    | 'Phase 3'
    | 'Phase 4 Heights'
    | 'Phase 5 Highlands'
    | 'Phase 6 Eastgrove'
    | 'Not sure';
  A3: '1' | '2' | '3' | '4' | '5' | '6+' | 'No one lives in the unit right now';
  A4: 'yes' | 'no' | 'prefer_not_to_say';
  /** Shown on Screen 2, under A4, only when A4 is yes. */
  AC1?: string[];
  AC1_other?: string;
  A5: 'yes' | 'no';
  A6: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'prefer_not_to_say';
  A7: 'female' | 'male' | 'prefer_not_to_say';
  A8: 'single' | 'married' | 'living_with_partner' | 'widowed' | 'separated' | 'prefer_not_to_say';
  A10: 'i_do' | 'household_member' | 'caregiver_or_rep' | 'owner_or_landlord' | 'it_varies';
  A11: 'walk_in' | 'phone' | 'facebook' | 'email_or_website' | 'through_neighbor_or_officer' | 'no_transaction_yet';

  B1: string[];
  /** 99 when R-B1 skips the item because B1 is "None of these". */
  B2?: 'android' | 'ios' | 'other' | 'no_smartphone' | 99;
  B3: 'wifi_broadband' | 'prepaid_mobile' | 'postpaid_mobile' | 'both' | 'no_regular_internet';
  B4: 'several_times_a_day' | 'about_once_a_day' | 'few_times_a_week' | 'about_once_a_week_or_less' | 'rarely_or_never';
  B5: 'weekly_or_more' | 'few_times_a_month' | 'few_times_a_year' | 'never';
  B6?: number;
  B7: AgreementScore;
  B8: AgreementScore;
  B9: AgreementScore;

  F1: LikelihoodScore;
  F2: LikelihoodScore;
  F3: LikelihoodScore;
  F4: LikelihoodScore;
  F5: LikelihoodScore;
  F6: LikelihoodScore;
  F7: AgreementScore;
  F8: string[];
  F9: string[];
  F10?: string;

  S1: AgreementScore;
  S2: AgreementScore;
  S3: AgreementScore;

  P1: string[];
  P2: AgreementScore;
  P3: AgreementScore;
  P4?: number;
  P5?: AgreementScore;

  C1: 'requested' | 'affected' | 'both' | 'neither';
  C2: AgreementScore;
  C3: AgreementScore;

  R1: AgreementScore;
  R2: AgreementScore;
  R3: 'deleted_after_verification' | 'kept_while_resident' | 'no_preference' | 'not_sure';

  H1?: string[];
  H2?: AgreementScore;
  H3?: AgreementScore;
  H4?: string;

  T1?: string[];
  T2?: AgreementScore;
  T3?: AgreementScore;
  T4?: string;

  AC2: AgreementScore;
  AC3: AgreementScore;
  AC4: 'the_person_themselves' | 'family_member' | 'caregiver_or_rep' | 'not_applicable';

  O1: string[];
  O1_other?: string;
  O2?: string;
}

export interface SurveyResponseDocument {
  responseId: string;
  submittedDate: string;
  status: 'complete' | 'partial';
  lastStepReached: number;
  deviceClass: 'phone' | 'computer';
  answers: Partial<SurveyAnswers>;
}

export interface InterviewInvitation {
  preferredName?: string;
  contactMethod: string;
  contactDetail: string;
  residentType: 'homeowner' | 'tenant' | 'household_member' | 'caregiver';
  consent: boolean;
}
