/**
 * Sample proponent dashboard records (stub until Firestore).
 */

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
  /** ISO timestamp for sorting / “last 7 days” */
  submittedAt: string;
  /** Display string */
  ts: string;
  phase: string;
  resident: string;
  pwd: 'Yes' | 'No';
  s4: boolean;
  s5: boolean;
  s7a: boolean;
  s7b: boolean;
  ext: boolean;
  language: 'EN' | 'FIL';
  section2: SampleSection2;
  /** Screening / gate notes for detail drawer */
  screeningNotes: string[];
}

export const SAMPLE_RESPONSES: SampleRecord[] = [
  {
    id: 'RC-0141',
    submittedAt: '2026-09-14T09:12:00+08:00',
    ts: '14 Sep 2026, 09:12',
    phase: 'Phase 1',
    resident: 'Homeowner',
    pwd: 'No',
    s4: true,
    s5: true,
    s7a: false,
    s7b: true,
    ext: true,
    language: 'EN',
    section2: {
      s2_adequacy: 4,
      s2_frequency: 3,
      s2_satisfaction: 4,
      s2_effectiveness: 3,
      s2_agreement: 4,
    },
    screeningNotes: [
      'Household size 4 · children yes',
      'Civil status married → Section 4 opened',
      'PWD household member → Section 7b shown',
      'Section 3 extended unlocked',
    ],
  },
  {
    id: 'RC-0142',
    submittedAt: '2026-09-14T11:40:00+08:00',
    ts: '14 Sep 2026, 11:40',
    phase: 'Phase 3',
    resident: 'Renter or lessee',
    pwd: 'No',
    s4: false,
    s5: false,
    s7a: false,
    s7b: false,
    ext: false,
    language: 'EN',
    section2: {
      s2_adequacy: 3,
      s2_frequency: 2,
      s2_satisfaction: 3,
      s2_effectiveness: 2,
      s2_agreement: 3,
    },
    screeningNotes: [
      'Household size 2 · children no',
      'Civil status single · declined Section 4 opt-in',
      'Gated sections stored as not_shown',
    ],
  },
  {
    id: 'RC-0143',
    submittedAt: '2026-09-14T16:05:00+08:00',
    ts: '14 Sep 2026, 16:05',
    phase: 'Phase 4',
    resident: 'Homeowner',
    pwd: 'Yes',
    s4: true,
    s5: true,
    s7a: true,
    s7b: false,
    ext: true,
    language: 'FIL',
    section2: {
      s2_adequacy: 5,
      s2_frequency: 4,
      s2_satisfaction: 5,
      s2_effectiveness: 4,
      s2_agreement: 5,
    },
    screeningNotes: [
      'Self-identified PWD → Section 7a shown',
      'Children in household → Section 5 shown',
      'Section 4 answered',
    ],
  },
  {
    id: 'RC-0144',
    submittedAt: '2026-09-15T08:22:00+08:00',
    ts: '15 Sep 2026, 08:22',
    phase: 'Phase 2',
    resident: 'Household member of a homeowner',
    pwd: 'No',
    s4: true,
    s5: false,
    s7a: false,
    s7b: true,
    ext: false,
    language: 'EN',
    section2: {
      s2_adequacy: 3,
      s2_frequency: 3,
      s2_satisfaction: 2,
      s2_effectiveness: 3,
      s2_agreement: 3,
    },
    screeningNotes: [
      'Opted into Section 4',
      'PWD household member → Section 7b',
      'No children → Section 5 not_shown',
    ],
  },
  {
    id: 'RC-0145',
    submittedAt: '2026-09-15T13:58:00+08:00',
    ts: '15 Sep 2026, 13:58',
    phase: 'Phase 5',
    resident: 'Live-in household staff',
    pwd: 'No',
    s4: false,
    s5: false,
    s7a: false,
    s7b: false,
    ext: false,
    language: 'EN',
    section2: {
      s2_adequacy: 2,
      s2_frequency: 2,
      s2_satisfaction: 2,
      s2_effectiveness: 2,
      s2_agreement: 3,
    },
    screeningNotes: [
      'Minimal gated unlocks',
      'Core sections only',
    ],
  },
  {
    id: 'RC-0146',
    submittedAt: '2026-09-16T10:05:00+08:00',
    ts: '16 Sep 2026, 10:05',
    phase: 'Phase 1',
    resident: 'Homeowner',
    pwd: 'No',
    s4: true,
    s5: true,
    s7a: false,
    s7b: false,
    ext: true,
    language: 'EN',
    section2: {
      s2_adequacy: 4,
      s2_frequency: 4,
      s2_satisfaction: 3,
      s2_effectiveness: 4,
      s2_agreement: 4,
    },
    screeningNotes: [
      'Phase 1 homeowner',
      'Children yes → Section 5',
      'Section 4 via civil status',
    ],
  },
  {
    id: 'RC-0147',
    submittedAt: '2026-09-16T18:40:00+08:00',
    ts: '16 Sep 2026, 18:40',
    phase: 'Phase 2',
    resident: 'Renter or lessee',
    pwd: 'Yes',
    s4: false,
    s5: false,
    s7a: true,
    s7b: true,
    ext: false,
    language: 'FIL',
    section2: {
      s2_adequacy: 3,
      s2_frequency: 3,
      s2_satisfaction: 4,
      s2_effectiveness: 3,
      s2_agreement: 3,
    },
    screeningNotes: [
      'Self + household PWD flags',
      'Declined Section 4 opt-in',
    ],
  },
  {
    id: 'RC-0148',
    submittedAt: '2026-09-17T07:15:00+08:00',
    ts: '17 Sep 2026, 07:15',
    phase: 'Phase 3',
    resident: 'Homeowner',
    pwd: 'No',
    s4: true,
    s5: true,
    s7a: false,
    s7b: false,
    ext: true,
    language: 'EN',
    section2: {
      s2_adequacy: 5,
      s2_frequency: 4,
      s2_satisfaction: 4,
      s2_effectiveness: 5,
      s2_agreement: 4,
    },
    screeningNotes: [
      'Recent submission',
      'Extended Section 3 + safety sections',
    ],
  },
];

export const PHASE_OPTIONS = [
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4',
  'Phase 5',
] as const;

export const LIKERT_LABELS: { key: keyof SampleSection2; label: string }[] = [
  { key: 's2_adequacy', label: 'Adequacy' },
  { key: 's2_frequency', label: 'Frequency' },
  { key: 's2_satisfaction', label: 'Satisfaction' },
  { key: 's2_effectiveness', label: 'Effectiveness' },
  { key: 's2_agreement', label: 'Agreement' },
];
