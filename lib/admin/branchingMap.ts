import { O1_CATEGORIES } from '@/survey/o1';

/** Chip keys matching GatedSectionChips on Individual / table rows. */
export type BranchChipKey = 'H' | 'T' | 'AC' | 'P+' | 'B+';

export interface BranchQuestion {
  code: string;
  question: string;
  /** Optional nested checklist (O1 categories). */
  nested?: { id: string; label: string; items: readonly string[] }[];
  /** Extra note when the item itself is gated inside a section. */
  gateNote?: string;
}

export interface BranchSection {
  id: string;
  code: string;
  title: string;
  /** Shown on the core trunk vs as a gated side branch. */
  path: 'core' | 'gated';
  chip?: BranchChipKey;
  gateSummary?: string;
  questions: BranchQuestion[];
}

export interface BranchLegendItem {
  chip: BranchChipKey;
  title: string;
  /** Plain language for non-technical readers. */
  plainRule: string;
  /** Field-code oriented rule for the detailed view. */
  rule: string;
}

/** Legend aligned with Individual gated-branch chips. */
export const BRANCH_LEGEND: BranchLegendItem[] = [
  {
    chip: 'H',
    title: 'Homeowner',
    plainRule:
      'Shown to people who say they are a homeowner (or live with / represent one).',
    rule: 'Shown when A1 is a homeowner type (living in unit, OFW, absentee, or household member of a homeowner).',
  },
  {
    chip: 'T',
    title: 'Tenant / lessee',
    plainRule: 'Shown to people who say they are a tenant or lessee (or live with one).',
    rule: 'Shown when A1 is tenant/lessee or household member of a tenant/lessee.',
  },
  {
    chip: 'AC',
    title: 'Accessibility',
    plainRule:
      'Extra questions if someone in the household has a disability or mobility limitation.',
    rule: 'AC1 unlocks when A4 = Yes. AC2–AC4 follow on the accessibility step.',
  },
  {
    chip: 'P+',
    title: 'Permit follow-ups',
    plainRule:
      'Extra gate/visitor questions if they bring people through the gate, or had outside workers.',
    rule: 'P2/P3 when P1 is not “none of these”; P5 when A5 = Yes (outside workers).',
  },
  {
    chip: 'B+',
    title: 'Device-dependent digital',
    plainRule: 'Extra phone/app questions if they regularly use a phone or computer.',
    rule: 'B2, B8, and B9 when B1 is not “none” (respondent uses a device).',
  },
];

/** Screening answers that decide later gates (always asked early). */
export const BRANCH_SCREENING = [
  {
    code: 'A1',
    plainLabel: 'Are you a homeowner or a tenant?',
    question: 'Which best describes you? (homeowner vs tenant branch)',
  },
  {
    code: 'A4',
    plainLabel: 'Does anyone in the household have a disability or mobility need?',
    question: 'Disability or mobility limitation in the household? (unlocks AC1)',
  },
  {
    code: 'A5',
    plainLabel: 'Did you have outside workers in the past year?',
    question: 'Outside workers in the past 12 months? (unlocks P5)',
  },
  {
    code: 'B1',
    plainLabel: 'What devices do you use regularly?',
    question: 'Devices used regularly? (unlocks B2 / B8 / B9)',
  },
  {
    code: 'P1',
    plainLabel: 'Who do you bring through the gate?',
    question: 'Who through the gate? (unlocks P2 / P3 when not “none”)',
  },
] as const;

/** Simple story steps for the non-technical overview. */
export const BRANCH_PLAIN_STORY = [
  {
    id: 'everyone',
    title: 'Everyone answers the same main topics',
    body: 'Household background, digital access, website features, HOA service quality, gate permits, street closures, ID privacy, and open problems.',
  },
  {
    id: 'decide',
    title: 'A few early answers decide what else appears',
    body: 'Resident type, accessibility need, devices, gate visitors, and outside workers each unlock a short extra set of questions.',
  },
  {
    id: 'split',
    title: 'Homeowners and tenants see different follow-ups',
    body: 'Only one of those two paths is shown — never both — based on how the person describes themselves.',
  },
] as const;

/**
 * Full instrument map for the Responses branching guide.
 * Question copy mirrors survey/review.ts (static catalog — not answer-dependent).
 */
export const BRANCH_SECTIONS: BranchSection[] = [
  {
    id: 'about',
    code: 'A',
    title: 'About you',
    path: 'core',
    questions: [
      { code: 'A1', question: 'Which best describes you?' },
      { code: 'A2', question: 'Which phase do you live in?' },
      { code: 'A3', question: 'How many people live in the unit?' },
      { code: 'A4', question: 'Do you or another member of your household have a disability or mobility limitation?' },
      {
        code: 'AC1',
        question: 'What kind of difficulty applies?',
        gateNote: 'Only when A4 = Yes (chip AC)',
      },
      {
        code: 'A5',
        question: 'Construction, renovation, or repair work with outside workers in the past 12 months?',
      },
      { code: 'A6', question: 'What is your age range?' },
      { code: 'A10', question: 'Who usually handles HOA transactions for your household?' },
      { code: 'A11', question: 'Which channel do you mainly use for HOA transactions?' },
    ],
  },
  {
    id: 'digital',
    code: 'B',
    title: 'Digital access',
    path: 'core',
    questions: [
      { code: 'B1', question: 'Which devices do you use regularly?' },
      {
        code: 'B2',
        question: 'What kind of phone do you mainly use?',
        gateNote: 'Only when B1 is not “none” (chip B+)',
      },
      { code: 'B3', question: 'How do you mainly get online?' },
      { code: 'B4', question: 'How often do you go online?' },
      { code: 'B5', question: 'How often do you do transactions online?' },
      {
        code: 'B6',
        question: 'About how much do you spend on mobile data or internet each month, in pesos?',
      },
      {
        code: 'B7',
        question: 'My internet connection is stable enough to finish an online form without interruption.',
      },
      {
        code: 'B8',
        question: 'I avoid installing new apps because of limited phone storage or mobile data.',
        gateNote: 'Only when B1 is not “none” (chip B+)',
      },
      {
        code: 'B9',
        question: 'I am comfortable opening a website on my phone browser instead of installing an app.',
        gateNote: 'Only when B1 is not “none” (chip B+)',
      },
    ],
  },
  {
    id: 'features',
    code: 'F',
    title: 'Feature interest',
    path: 'core',
    questions: [
      { code: 'F1', question: 'Online pre-registration for visitors and workers, with a temporary pass' },
      { code: 'F2', question: 'Online request for street or event closure permits' },
      { code: 'F3', question: 'Online tenant and owner forms' },
      { code: 'F4', question: 'Online registration with a photo of a valid ID' },
      { code: 'F5', question: 'Online channel to send requests and track status' },
      {
        code: 'F6',
        question: 'Website with adjustable text, higher contrast, and screen reader support',
      },
      {
        code: 'F7',
        question: 'A website with these features would solve some of the problems I face as a resident.',
      },
      { code: 'F8', question: 'Which of these would you want available first?' },
      { code: 'F9', question: 'What might keep you from using this website?' },
      { code: 'F10', question: 'Another feature or service' },
    ],
  },
  {
    id: 'service',
    code: 'S',
    title: 'Current HOA service access',
    path: 'core',
    questions: [
      { code: 'S1', question: 'The HOA office hours make it hard for me to do my transactions.' },
      { code: 'S2', question: 'I have to visit the HOA office in person even for simple matters.' },
      { code: 'S3', question: 'I receive a response to my concerns within a reasonable time.' },
    ],
  },
  {
    id: 'permits',
    code: 'P',
    title: 'Entrance, visitor, and worker permits',
    path: 'core',
    questions: [
      { code: 'P1', question: 'Who did you need to bring through the gate?' },
      {
        code: 'P2',
        question: 'Waiting at the gate to get a permit or pass takes too long.',
        gateNote: 'Only when P1 is not “none of these” (chip P+)',
      },
      {
        code: 'P3',
        question: 'Leaving an ID at the gate is inconvenient.',
        gateNote: 'Only when P1 is not “none of these” (chip P+)',
      },
      { code: 'P4', question: 'Typical wait at the gate, in minutes (optional)' },
      {
        code: 'P5',
        question: 'Getting construction or repair workers approved takes too many steps.',
        gateNote: 'Only when A5 = Yes (chip P+)',
      },
    ],
  },
  {
    id: 'closures',
    code: 'C',
    title: 'Street and event closure permits',
    path: 'core',
    questions: [
      { code: 'C1', question: 'In the past 12 months, which describes you?' },
      { code: 'C2', question: 'The process of getting a street or event closure permit is clear.' },
      { code: 'C3', question: 'Notices about street closures and rerouting reach me in time.' },
    ],
  },
  {
    id: 'registration',
    code: 'R',
    title: 'Registration, ID verification, and data privacy',
    path: 'core',
    questions: [
      { code: 'R1', question: 'I am comfortable uploading a photo of my valid ID.' },
      { code: 'R2', question: 'I trust that only authorized HOA personnel would see my ID.' },
      { code: 'R3', question: 'After my ID has been verified, how long should it be kept?' },
    ],
  },
  {
    id: 'homeowner',
    code: 'H',
    title: 'Homeowner',
    path: 'gated',
    chip: 'H',
    gateSummary: 'A1 is a homeowner type (1–4)',
    questions: [
      { code: 'H1', question: 'Which HOA transactions did your household do?' },
      {
        code: 'H2',
        question:
          'Completing HOA clearances, forms, and permits needs more office visits than it should.',
      },
      {
        code: 'H3',
        question: 'Registering or authorizing a tenant with the HOA is easy.',
        gateNote: 'Only when H1 includes tenant registration',
      },
      {
        code: 'H4',
        question: 'Describe one HOA transaction that took the longest, and why.',
      },
    ],
  },
  {
    id: 'tenant',
    code: 'T',
    title: 'Tenant and lessee',
    path: 'gated',
    chip: 'T',
    gateSummary: 'A1 is a tenant / lessee type (5–6)',
    questions: [
      { code: 'T1', question: 'Which HOA requirements did your household deal with as tenants?' },
      { code: 'T2', question: "The HOA's forms and requirements for tenants are clear." },
      {
        code: 'T3',
        question: 'Completing HOA requirements as a tenant takes more steps than it should.',
      },
      { code: 'T4', question: 'Which HOA requirement was hardest?' },
    ],
  },
  {
    id: 'accessibility',
    code: 'AC',
    title: 'Accessibility needs',
    path: 'gated',
    chip: 'AC',
    gateSummary: 'A4 = Yes unlocks AC1; AC2–AC4 follow on this step',
    questions: [
      {
        code: 'AC1',
        question: 'What kind of difficulty applies?',
        gateNote: 'Asked under About you when A4 = Yes',
      },
      { code: 'AC2', question: 'Going to the HOA office in person is difficult.' },
      {
        code: 'AC3',
        question: 'Larger text, higher contrast, or screen reader support would help.',
      },
      {
        code: 'AC4',
        question: 'Who would use an online service for the household member who needs help?',
      },
    ],
  },
  {
    id: 'open',
    code: 'O',
    title: 'Open problem discovery',
    path: 'core',
    questions: [
      {
        code: 'O1',
        question: 'Which HOA-related problems have you experienced?',
        nested: O1_CATEGORIES.map((category) => ({
          id: category.id,
          label: category.label,
          items: category.items,
        })),
      },
      { code: 'O2', question: 'Any other problem with HOA services?' },
      {
        code: 'IV1',
        question: 'Would you be open to being contacted for a possible follow-up interview?',
      },
    ],
  },
];

export const BRANCH_CORE_SECTIONS = BRANCH_SECTIONS.filter((s) => s.path === 'core');
export const BRANCH_GATED_SECTIONS = BRANCH_SECTIONS.filter((s) => s.path === 'gated');
