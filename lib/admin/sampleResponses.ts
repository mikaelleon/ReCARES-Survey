/**
 * Sample proponent dashboard records (opt-in demo via ?demo=sample only).
 * Live path maps Firestore docs into this shape, including raw `answers`.
 */

import type { SurveyAnswers } from '@/survey/schema';

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export interface SampleSection2 {
  s2_adequacy: LikertValue;
  s2_frequency: LikertValue;
  s2_satisfaction: LikertValue;
  s2_effectiveness: LikertValue;
  s2_agreement: LikertValue;
}

export interface SampleRecord {
  id: string;
  /**
   * Stable 1-based index in chronological order (oldest = 1 → label "001").
   * Assigned when the response set is loaded or locally mutated.
   */
  submissionNumber?: number;
  /** ISO timestamp for sorting / “last 7 days” */
  submittedAt: string;
  /** Display string */
  ts: string;
  phase: string;
  resident: string;
  pwd: 'Yes' | 'No';
  /** Homeowner branch (H) shown */
  homeowner: boolean;
  /** Tenant/lessee branch (T) shown */
  tenant: boolean;
  /** Accessibility items unlocked (A4 yes / AC) */
  accessibility: boolean;
  /** Permit follow-ups shown (P2/P3) */
  permitsExtended: boolean;
  /** Device-dependent digital items shown (B8/B9) */
  deviceDependent: boolean;
  language: 'EN' | 'FIL';
  section2: SampleSection2;
  /** Screening / gate notes for detail drawer */
  screeningNotes: string[];
  /** Live survey answers — required for extended Summary widgets. */
  answers?: Partial<SurveyAnswers>;
  deviceClass?: 'phone' | 'computer';
  /** Server status. Partials are not written today (drafts are localStorage-only). */
  status?: 'complete' | 'partial';
  /** Instrument id at submit time, when stored. */
  instrumentVersion?: string;
}

export const SAMPLE_RESPONSES: SampleRecord[] = [
  {
    id: 'RC-0141',
    submittedAt: '2026-09-14T09:12:00+08:00',
    ts: '14 Sep 2026, 09:12',
    phase: 'Phase 1',
    resident: 'Homeowner living in the unit',
    pwd: 'No',
    homeowner: true,
    tenant: false,
    accessibility: false,
    permitsExtended: true,
    deviceDependent: true,
    language: 'EN',
    section2: {
      s2_adequacy: 4,
      s2_frequency: 3,
      s2_satisfaction: 4,
      s2_effectiveness: 3,
      s2_agreement: 4,
    },
    screeningNotes: [
      'Homeowner branch → H shown',
      'Permit follow-ups unlocked',
      'Smartphone in B1 → device-dependent items shown',
    ],
  },
  {
    id: 'RC-0142',
    submittedAt: '2026-09-14T11:40:00+08:00',
    ts: '14 Sep 2026, 11:40',
    phase: 'Phase 3',
    resident: 'Tenant or lessee',
    pwd: 'No',
    homeowner: false,
    tenant: true,
    accessibility: false,
    permitsExtended: false,
    deviceDependent: true,
    language: 'EN',
    section2: {
      s2_adequacy: 3,
      s2_frequency: 2,
      s2_satisfaction: 3,
      s2_effectiveness: 2,
      s2_agreement: 3,
    },
    screeningNotes: ['Tenant branch → T shown', 'Core digital + privacy sections'],
  },
  {
    id: 'RC-0143',
    submittedAt: '2026-09-14T16:05:00+08:00',
    ts: '14 Sep 2026, 16:05',
    phase: 'Phase 4 Heights',
    resident: 'Homeowner living in the unit',
    pwd: 'Yes',
    homeowner: true,
    tenant: false,
    accessibility: true,
    permitsExtended: true,
    deviceDependent: true,
    language: 'FIL',
    section2: {
      s2_adequacy: 5,
      s2_frequency: 4,
      s2_satisfaction: 5,
      s2_effectiveness: 4,
      s2_agreement: 5,
    },
    screeningNotes: [
      'A4 yes → accessibility items shown',
      'Homeowner branch',
      'Street closures + AI ID-validation + data privacy in core flow',
    ],
  },
  {
    id: 'RC-0144',
    submittedAt: '2026-09-15T08:22:00+08:00',
    ts: '15 Sep 2026, 08:22',
    phase: 'Phase 2',
    resident: 'Family or household member of a homeowner',
    pwd: 'No',
    homeowner: true,
    tenant: false,
    accessibility: true,
    permitsExtended: false,
    deviceDependent: false,
    language: 'EN',
    section2: {
      s2_adequacy: 3,
      s2_frequency: 3,
      s2_satisfaction: 2,
      s2_effectiveness: 3,
      s2_agreement: 3,
    },
    screeningNotes: [
      'Homeowner-related branch',
      'B1 none → device-dependent items not_shown',
      'Accessibility unlocked for household needs',
    ],
  },
  {
    id: 'RC-0145',
    submittedAt: '2026-09-15T13:58:00+08:00',
    ts: '15 Sep 2026, 13:58',
    phase: 'Phase 5 Highlands',
    resident: 'OFW homeowner',
    pwd: 'No',
    homeowner: true,
    tenant: false,
    accessibility: false,
    permitsExtended: false,
    deviceDependent: true,
    language: 'EN',
    section2: {
      s2_adequacy: 2,
      s2_frequency: 2,
      s2_satisfaction: 2,
      s2_effectiveness: 2,
      s2_agreement: 3,
    },
    screeningNotes: ['OFW homeowner → H shown', 'Minimal permit follow-ups'],
  },
  {
    id: 'RC-0146',
    submittedAt: '2026-09-16T10:05:00+08:00',
    ts: '16 Sep 2026, 10:05',
    phase: 'Phase 1',
    resident: 'Family or household member of a tenant or lessee',
    pwd: 'No',
    homeowner: false,
    tenant: true,
    accessibility: false,
    permitsExtended: true,
    deviceDependent: true,
    language: 'EN',
    section2: {
      s2_adequacy: 4,
      s2_frequency: 4,
      s2_satisfaction: 3,
      s2_effectiveness: 4,
      s2_agreement: 4,
    },
    screeningNotes: ['Tenant-related branch → T shown', 'Entrance/visitor permits extended'],
  },
  {
    id: 'RC-0147',
    submittedAt: '2026-09-16T18:40:00+08:00',
    ts: '16 Sep 2026, 18:40',
    phase: 'Phase 2',
    resident: 'Tenant or lessee',
    pwd: 'Yes',
    homeowner: false,
    tenant: true,
    accessibility: true,
    permitsExtended: false,
    deviceDependent: true,
    language: 'FIL',
    section2: {
      s2_adequacy: 3,
      s2_frequency: 3,
      s2_satisfaction: 4,
      s2_effectiveness: 3,
      s2_agreement: 3,
    },
    screeningNotes: ['Tenant branch', 'PWD / accessibility path'],
  },
  {
    id: 'RC-0148',
    submittedAt: '2026-09-17T07:15:00+08:00',
    ts: '17 Sep 2026, 07:15',
    phase: 'Phase 3',
    resident: 'Absentee homeowner',
    pwd: 'No',
    homeowner: true,
    tenant: false,
    accessibility: false,
    permitsExtended: true,
    deviceDependent: true,
    language: 'EN',
    section2: {
      s2_adequacy: 5,
      s2_frequency: 4,
      s2_satisfaction: 4,
      s2_effectiveness: 5,
      s2_agreement: 4,
    },
    screeningNotes: [
      'Absentee homeowner → H shown',
      'Street closures, AI ID-validation, data privacy always in core path',
    ],
  },
];

export const PHASE_OPTIONS = [
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4 Heights',
  'Phase 5 Highlands',
  'Phase 6 Eastgrove',
] as const;

export const RESIDENT_OPTIONS = [
  'Homeowner living in the unit',
  'OFW homeowner',
  'Absentee homeowner',
  'Family or household member of a homeowner',
  'Tenant or lessee',
  'Family or household member of a tenant or lessee',
] as const;

export const LIKERT_LABELS: { key: keyof SampleSection2; label: string }[] = [
  { key: 's2_adequacy', label: 'Adequacy' },
  { key: 's2_frequency', label: 'Frequency' },
  { key: 's2_satisfaction', label: 'Satisfaction' },
  { key: 's2_effectiveness', label: 'Effectiveness' },
  { key: 's2_agreement', label: 'Agreement' },
];
