import { INCLUDE_SEX_AND_CIVIL_STATUS } from '@/survey/flags';
import type { Condition, Instrument, OptionDef, QuestionDef, StepDef } from '@/survey/model';
import { gateByTransaction } from '@/survey/gating';
import { O1_CATEGORIES } from '@/survey/o1';

/**
 * Bundled copy of instrument v1. Residents see this whenever no published
 * instrument document exists in Firestore, and the editor starts new drafts from it.
 */

const HOMEOWNER: Condition = { op: 'in', q: 'A1', value: [1, 2, 3, 4] };
const TENANT: Condition = { op: 'in', q: 'A1', value: [5, 6] };
/** Homeowner types only (not a family or household member of the owner). */
const OWNER_ONLY: Condition = { op: 'in', q: 'A1', value: [1, 2, 3] };
const OWNER_ELSEWHERE: Condition = { op: 'in', q: 'A1', value: [2, 3] };
const NO_DEVICE: Condition = { op: 'includes', q: 'B1', value: 'none' };
const HAS_DEVICE: Condition = { op: 'notIncludes', q: 'B1', value: 'none' };

const OWNER_NOTE =
  'Answer for your unit, including what your representative or caretaker experiences.';
const A10_NOTE =
  "If you do not handle HOA transactions yourself, answer the later questions using what you know about your household's experience, or choose Not applicable.";
const ASSISTED_NOTE =
  'You can finish this survey with help. Someone you trust can read the questions and enter the answers you choose.';

const opts = (...pairs: Array<[string, string]>): OptionDef[] =>
  pairs.map(([id, label]) => ({ id, label }));

const likert = (
  code: string,
  stepId: string,
  text: string,
  scale: 'agreement' | 'likelihood' = 'agreement',
  extra: Partial<QuestionDef> = {},
): QuestionDef => ({ code, stepId, type: 'likert', text, scale, ...extra });

const steps: StepDef[] = [
  {
    id: 's1',
    title: 'About your household',
    subtitle: 'A few quick questions about your home. Your answers decide which questions come next.',
    showRequiredNote: true,
    notes: [
      {
        kind: 'intro',
        text:
          'Your answers in this pre-screening form decides which sets of questions would be shown to you.\n' +
          "You may choose 'Prefer not to say' for personal questions.",
      },
    ],
    review: { code: 'A', title: 'About you' },
  },
  {
    id: 's2',
    title: 'About you and how you use HOA services',
    subtitle: 'Tell us a little about yourself and how you deal with the HOA today.',
    review: { code: 'A', title: 'About you' },
  },
  {
    id: 's3',
    title: 'Digital access',
    subtitle: 'The devices and internet you use help us design something that works for everyone.',
    notes: [
      { kind: 'intro', text: 'These questions help us understand what kind of online service would work for residents.' },
      { kind: 'hint', text: ASSISTED_NOTE, when: NO_DEVICE, after: 'B1' },
    ],
    review: { code: 'B', title: 'Digital access' },
  },
  {
    id: 's4',
    title: 'Digital access',
    subtitle: 'Tell us about your internet cost and connection. Pick the answer that fits best.',
    notes: [{ kind: 'hint', text: ASSISTED_NOTE, when: NO_DEVICE }],
    review: { code: 'B', title: 'Digital access' },
  },
  {
    id: 's5',
    title: 'Feature interest',
    subtitle: 'Imagine an HOA website. Tell us how likely you would be to use each feature.',
    notes: [
      {
        kind: 'intro',
        text:
          'Imagine a website that Camella Homes Tibig residents could open on a phone or computer to do some HOA transactions from home. The following questions describe some things this website could do. Please tell us how likely you would be to use each one. There are no right or wrong answers.',
      },
    ],
    review: { code: 'F', title: 'Feature interest' },
  },
  {
    id: 's6',
    title: 'Feature interest',
    subtitle: 'More about the website: what you would want first, and what might hold you back.',
    review: { code: 'F', title: 'Feature interest' },
  },
  {
    id: 's7',
    title: 'Current HOA service access',
    subtitle: 'How easy is it to reach the HOA today? Say how much you agree with each statement.',
    notes: [
      { kind: 'intro', text: 'These questions are about how you reach the HOA today.' },
      { kind: 'hint', text: OWNER_NOTE, when: OWNER_ELSEWHERE },
    ],
    review: { code: 'S', title: 'Current HOA service access' },
  },
  {
    id: 's8',
    title: 'Entrance, visitor, and worker permits',
    subtitle: 'About bringing visitors, workers, and deliveries through the gate.',
    notes: [{ kind: 'hint', text: OWNER_NOTE, when: OWNER_ELSEWHERE }],
    review: { code: 'P', title: 'Entrance, visitor, and worker permits' },
  },
  {
    id: 's9',
    title: 'Street and event closure permits',
    subtitle: 'About street and event closures, and the permits they need.',
    notes: [{ kind: 'hint', text: OWNER_NOTE, when: OWNER_ELSEWHERE }],
    review: { code: 'C', title: 'Street and event closure permits' },
  },
  {
    id: 's10',
    title: 'Registration, ID verification, and data privacy',
    subtitle: 'How you feel about registering online and showing a valid ID.',
    notes: [
      {
        kind: 'intro',
        text: 'Some online services need you to register and show a valid ID. These questions are about how you feel about that.',
      },
    ],
    review: { code: 'R', title: 'Registration, ID verification, and data privacy' },
  },
  {
    id: 's11',
    title: 'Tenant and lessee',
    subtitle: 'Your experience as a tenant dealing with the HOA.',
    variants: [
      {
        when: HOMEOWNER,
        title: 'Homeowner',
        subtitle: 'Your experience as a homeowner dealing with the HOA.',
      },
    ],
  },
  {
    id: 's12',
    title: 'Accessibility needs',
    subtitle: 'Optional questions about access needs. You can choose Prefer not to say.',
    notes: [
      { kind: 'intro', text: 'These questions are voluntary. You may choose Prefer not to say for any of them.' },
    ],
    review: { code: 'AC', title: 'Accessibility needs' },
  },
  {
    id: 's13',
    title: 'Open problem discovery',
    subtitle: 'The last step: tell us about any problems we may have missed.',
    notes: [{ kind: 'intro', text: 'This last part helps us find problems we may have missed.' }],
    review: { code: 'O', title: 'Open problem discovery' },
  },
];

const bundledQuestions: QuestionDef[] = [
  // ---- Step 1 ----
  {
    code: 'A1',
    stepId: 's1',
    type: 'single',
    numericValues: true,
    text: 'Which best describes you?',
    cardClass: 'bento-tall',
    layout: ['survey-bento'],
    options: [
      { id: '1', label: 'Homeowner living in the unit' },
      { id: '2', label: 'OFW homeowner', hint: '(the owner works abroad)', group: 'Homeowner who does not live in the unit' },
      {
        id: '3',
        label: 'Absentee homeowner',
        hint: '(the owner lives elsewhere in the Philippines)',
        group: 'Homeowner who does not live in the unit',
      },
      { id: '4', label: 'Family or household member of a homeowner' },
      { id: '5', label: 'Tenant or lessee' },
      { id: '6', label: 'Family or household member of a tenant or lessee' },
    ],
  },
  {
    code: 'A3',
    stepId: 's1',
    type: 'single',
    text: 'How many people live in the unit?',
    columns: 2,
    layout: ['survey-bento', 'bento-col'],
    options: [
      ...opts(['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6+', '6 or more']),
      {
        id: 'No one lives in the unit right now',
        label: 'No one lives in the unit right now',
        wide: true,
        showWhen: OWNER_ELSEWHERE,
      },
    ],
  },
  {
    code: 'A2',
    stepId: 's1',
    type: 'single',
    text: 'Which phase do you live in?',
    columns: 2,
    layout: ['survey-bento', 'bento-col'],
    options: opts(
      ['Phase 1', 'Phase 1'],
      ['Phase 2', 'Phase 2'],
      ['Phase 3', 'Phase 3'],
      ['Phase 4 Heights', 'Phase 4 Heights'],
      ['Phase 5 Highlands', 'Phase 5 Highlands'],
      ['Phase 6 Eastgrove', 'Phase 6 Eastgrove'],
    ),
  },
  {
    code: 'A4',
    stepId: 's1',
    type: 'single',
    text: 'Do you or another member of your household have a disability or mobility limitation?',
    layout: ['bento-pair'],
    options: opts(['yes', 'Yes'], ['no', 'No'], ['prefer_not_to_say', 'Prefer not to say']),
  },
  {
    code: 'A5',
    stepId: 's1',
    type: 'single',
    text: 'In the past 12 months, did you have construction, renovation, or repair work done that needed outside workers to enter the subdivision?',
    layout: ['bento-pair'],
    options: opts(['yes', 'Yes'], ['no', 'No']),
  },
  {
    code: 'AC1',
    stepId: 's1',
    type: 'multi',
    text: 'What kind of difficulty applies to you or the household member? Select all that apply.',
    showWhen: { op: 'eq', q: 'A4', value: 'yes' },
    exclusiveId: 'prefer_not_to_say',
    options: opts(
      ['difficulty_walking_climbing', 'Difficulty walking or climbing stairs'],
      ['uses_wheelchair_or_aid', 'Uses a wheelchair or mobility aid'],
      ['difficulty_seeing', 'Difficulty seeing'],
      ['difficulty_hearing', 'Difficulty hearing'],
      ['difficulty_reading_forms', 'Difficulty reading or understanding forms'],
      ['other', 'Other'],
      ['prefer_not_to_say', 'Prefer not to say'],
    ),
  },
  {
    code: 'AC1_other',
    stepId: 's1',
    type: 'text',
    text: 'Other',
    maxLength: 200,
    showWhen: { op: 'includes', q: 'AC1', value: 'other' },
  },

  // ---- Step 2 ----
  {
    code: 'A6',
    stepId: 's2',
    type: 'single',
    text: 'What is your age range?',
    columns: 2,
    layout: ['survey-bento'],
    options: [
      ...opts(
        ['18-24', '18 to 24'],
        ['25-34', '25 to 34'],
        ['35-44', '35 to 44'],
        ['45-54', '45 to 54'],
        ['55-64', '55 to 64'],
        ['65+', '65 and above'],
      ),
      { id: 'prefer_not_to_say', label: 'Prefer not to say', wide: true },
    ],
  },
  ...(INCLUDE_SEX_AND_CIVIL_STATUS
    ? ([
        {
          code: 'A7',
          stepId: 's2',
          type: 'single',
          text: 'Sex',
          layout: ['survey-bento'],
          options: opts(['female', 'Female'], ['male', 'Male'], ['prefer_not_to_say', 'Prefer not to say']),
        },
        {
          code: 'A8',
          stepId: 's2',
          type: 'single',
          text: 'Civil status',
          columns: 2,
          options: opts(
            ['single', 'Single'],
            ['married', 'Married'],
            ['living_with_partner', 'Living with a partner'],
            ['widowed', 'Widowed'],
            ['separated', 'Separated'],
            ['prefer_not_to_say', 'Prefer not to say'],
          ),
        },
      ] satisfies QuestionDef[])
    : []),
  {
    code: 'A10',
    stepId: 's2',
    type: 'single',
    text: 'Who usually handles HOA transactions for your household?',
    hints: [
      {
        text: A10_NOTE,
        when: { op: 'and', args: [{ op: 'answered', q: 'A10' }, { op: 'neq', q: 'A10', value: 'i_do' }] },
      },
    ],
    options: [
      { id: 'i_do', label: 'I do' },
      { id: 'household_member', label: 'Another member of my household' },
      { id: 'caregiver_or_rep', label: 'A caregiver, helper, or representative' },
      { id: 'owner_or_landlord', label: 'The property owner or landlord', showWhen: TENANT },
      { id: 'it_varies', label: 'It varies' },
    ],
  },
  {
    code: 'A11',
    stepId: 's2',
    type: 'single',
    text: 'Which channel do you mainly use for HOA transactions?',
    columns: 2,
    options: opts(
      ['walk_in', 'Walk in at the HOA office'],
      ['phone', 'Phone call'],
      ['facebook', 'Facebook page or message'],
      ['email_or_website', 'Email or website'],
      ['through_neighbor_or_officer', 'Through a neighbor or HOA officer'],
      ['no_transaction_yet', 'I have not done any HOA transaction'],
    ),
  },

  // ---- Step 3 ----
  {
    code: 'B1',
    stepId: 's3',
    type: 'multi',
    text: 'Which devices do you use regularly? Select all that apply.',
    exclusiveId: 'none',
    options: opts(
      ['smartphone', 'Smartphone'],
      ['laptop_desktop', 'Laptop or desktop computer'],
      ['tablet', 'Tablet'],
      ['shared_device', 'A shared household device'],
      ['none', 'None of these'],
    ),
  },
  {
    code: 'B2',
    stepId: 's3',
    type: 'single',
    text: 'What kind of phone do you mainly use?',
    showWhen: HAS_DEVICE,
    skipCode: 99,
    options: opts(
      ['android', 'Android'],
      ['ios', 'iPhone (iOS)'],
      ['other', 'Other'],
      ['no_smartphone', 'I do not use a smartphone'],
    ),
  },
  {
    code: 'B3',
    stepId: 's3',
    type: 'single',
    text: 'How do you mainly get online?',
    options: opts(
      ['wifi_broadband', 'Wi-Fi or broadband subscription'],
      ['prepaid_mobile', 'Prepaid mobile data (load or promo)'],
      ['postpaid_mobile', 'Postpaid mobile data'],
      ['both', 'Both Wi-Fi and mobile data'],
      ['no_regular_internet', 'I do not have regular internet access'],
    ),
  },
  {
    code: 'B4',
    stepId: 's3',
    type: 'single',
    text: 'How often do you go online?',
    options: opts(
      ['several_times_a_day', 'Several times a day'],
      ['about_once_a_day', 'About once a day'],
      ['few_times_a_week', 'A few times a week'],
      ['about_once_a_week_or_less', 'About once a week or less'],
      ['rarely_or_never', 'Rarely or never'],
    ),
  },
  {
    code: 'B5',
    stepId: 's3',
    type: 'single',
    text: 'How often do you do transactions online, such as submitting forms, booking, or ordering?',
    options: opts(
      ['weekly_or_more', 'Weekly or more'],
      ['few_times_a_month', 'A few times a month'],
      ['few_times_a_year', 'A few times a year'],
      ['never', 'Never'],
    ),
  },

  // ---- Step 4 ----
  {
    code: 'B6',
    stepId: 's4',
    type: 'single',
    text: 'About how much do you spend on mobile data or internet each month, in pesos?',
    columns: 2,
    options: opts(
      ['none', 'None'],
      ['under_100', 'Under 100'],
      ['100_299', '100 to 299'],
      ['300_499', '300 to 499'],
      ['500_999', '500 to 999'],
      ['1000_1999', '1,000 to 1,999'],
      ['2000_plus', '2,000 or more'],
      ['not_sure', 'Not sure'],
    ),
  },
  likert('B7', 's4', 'My internet connection is stable enough to finish an online form without interruption.', 'agreement', { allowNA: true }),
  likert('B8', 's4', 'I avoid installing new apps because of limited phone storage or mobile data.', 'agreement', {
    showWhen: HAS_DEVICE,
    skipCode: 'not_shown',
  }),
  likert('B9', 's4', 'I am comfortable opening a website on my phone browser instead of installing an app.', 'agreement', {
    showWhen: HAS_DEVICE,
    skipCode: 'not_shown',
  }),

  // ---- Step 5 ----
  likert('F1', 's5', 'How likely are you to use online pre-registration for visitors and workers, with a temporary pass?', 'likelihood'),
  likert(
    'F2',
    's5',
    'How likely are you to use an online request for street or event closure permits, with notices sent to residents of the affected phase?',
    'likelihood',
  ),
  likert('F3', 's5', 'How likely are you to use online forms to register or authorize your tenant with the HOA?', 'likelihood', {
    showWhen: OWNER_ONLY,
  }),
  likert(
    'F4',
    's5',
    'How likely are you to use online registration where you upload a photo of a valid ID and the HOA Board verifies it?',
    'likelihood',
  ),
  likert(
    'F5',
    's5',
    'How likely are you to use an online channel to send requests or concerns to the HOA and track their status?',
    'likelihood',
  ),

  // ---- Step 6 ----
  likert(
    'F6',
    's6',
    'How likely are you to use a version of the website with adjustable text size, higher contrast, and screen reader support?',
    'likelihood',
  ),
  likert('F7', 's6', 'A website with these features would solve some of the problems I face as a resident.'),
  {
    code: 'F8',
    stepId: 's6',
    type: 'multi',
    text: 'Which of these would you want available first? Select up to 3.',
    exclusiveId: 'none_of_these',
    maxSelect: 3,
    options: [
      { id: 'pre_registration', label: 'Pre-registration of visitors and workers' },
      { id: 'closure', label: 'Online closure permits and notices' },
      { id: 'forms', label: 'Online forms to register or authorize a tenant', showWhen: OWNER_ONLY },
      { id: 'registration', label: 'Online registration with ID verification' },
      { id: 'requests', label: 'Online requests with status tracking' },
      { id: 'accessible', label: 'Accessible version of the website' },
      { id: 'none_of_these', label: 'None of these' },
    ],
  },
  {
    code: 'F9',
    stepId: 's6',
    type: 'multi',
    text: 'What might keep you from using this website? Select all that apply.',
    exclusiveId: 'nothing_would_stop_me',
    options: opts(
      ['no_reliable_internet', 'No reliable internet'],
      ['not_sure_how', 'Not sure how to use it'],
      ['data_worry', 'Worried about my personal data'],
      ['prefer_office', 'Prefer going to the office'],
      ['no_device', 'Do not have a suitable device'],
      ['nothing_would_stop_me', 'Nothing would stop me'],
      ['other', 'Other'],
    ),
  },
  {
    code: 'F10',
    stepId: 's6',
    type: 'text',
    text: 'Is there another feature or service you would want from this kind of website?',
    maxLength: 300,
  },

  // ---- Step 7 ----
  likert('S1', 's7', 'The HOA office hours make it hard for me to do my transactions.', 'agreement', { allowNA: true }),
  likert('S2', 's7', 'I have to visit the HOA office in person even for simple matters.', 'agreement', { allowNA: true }),
  likert('S3', 's7', 'I receive a response to my concerns within a reasonable time.', 'agreement', { allowNA: true }),

  // ---- Step 8 ----
  {
    code: 'P1',
    stepId: 's8',
    type: 'multi',
    text: 'In the past 3 months, who did you or your household need to bring through the gate? Select all that apply.',
    exclusiveId: 'none_of_these',
    options: opts(
      ['visitors', 'Visitors'],
      ['drivers', 'Ride-hailing or special-trip drivers'],
      ['deliveries', 'Deliveries'],
      ['none_of_these', 'None of these'],
    ),
  },
  likert('P2', 's8', 'Waiting at the gate to get a permit or pass takes too long for my visitors, workers, or drivers.', 'agreement', {
    allowNA: true,
    showWhen: { op: 'notIncludes', q: 'P1', value: 'none_of_these' },
    skipCode: 'not_shown',
  }),
  likert('P3', 's8', 'Leaving an ID at the gate is inconvenient for my household or guests.', 'agreement', {
    allowNA: true,
    showWhen: { op: 'notIncludes', q: 'P1', value: 'none_of_these' },
    skipCode: 'not_shown',
  }),
  {
    code: 'P4',
    stepId: 's8',
    type: 'single',
    required: false,
    text: 'About how many minutes does a typical wait at the gate take?',
    options: opts(
      ['under_5', 'Less than 5 minutes'],
      ['5_10', '5 to 10 minutes'],
      ['11_15', '11 to 15 minutes'],
      ['16_30', '16 to 30 minutes'],
      ['31_60', '31 to 60 minutes'],
      ['over_60', 'More than 1 hour'],
      ['not_sure', 'I am not sure'],
    ),
  },
  likert('P5', 's8', 'Getting my construction or repair workers approved to enter takes too many steps.', 'agreement', {
    showWhen: { op: 'eq', q: 'A5', value: 'yes' },
  }),

  // ---- Step 9 ----
  {
    code: 'C1',
    stepId: 's9',
    type: 'single',
    text: 'In the past 12 months, which describes you?',
    options: opts(
      ['requested', 'I requested a street or event closure'],
      ['affected', 'My household was affected by a closure someone else requested'],
      ['both', 'Both'],
      ['neither', 'Neither'],
    ),
  },
  likert('C2', 's9', 'The process of getting a street or event closure permit is clear.', 'agreement', { allowNA: true }),
  likert('C3', 's9', 'Notices about street closures and rerouting reach me in time.', 'agreement', { allowNA: true }),

  // ---- Step 10 ----
  likert('R1', 's10', 'I am comfortable uploading a photo of my valid ID to a secure online form.'),
  likert('R2', 's10', 'I trust that only authorized HOA personnel would be able to see my ID.'),
  {
    code: 'R3',
    stepId: 's10',
    type: 'single',
    text: 'After my ID has been verified, how long should it be kept?',
    options: opts(
      ['deleted_after_verification', 'Deleted right after verification'],
      ['kept_while_resident', 'Kept for as long as I live in the subdivision'],
      ['no_preference', 'No preference'],
      ['not_sure', 'Not sure'],
    ),
  },

  // ---- Step 11: homeowner set ----
  {
    code: 'H1',
    stepId: 's11',
    type: 'multi',
    text: 'Which HOA transactions did your household do in the past 12 months? Select all that apply.',
    showWhen: HOMEOWNER,
    review: { code: 'H', title: 'Homeowner' },
    exclusiveId: 'none',
    options: [
      { id: 'clearance', label: 'Clearance' },
      { id: 'renovation_permit', label: 'Renovation permit' },
      { id: 'vehicle_sticker', label: 'Vehicle sticker' },
      { id: 'tenant_registration', label: 'Tenant registration or authorization', showWhen: OWNER_ONLY },
      { id: 'none', label: 'None' },
      { id: 'other', label: 'Other' },
    ],
  },
  likert('H2', 's11', 'Completing HOA clearances, forms, and permits needs more office visits than it should.', 'agreement', {
    allowNA: true,
    showWhen: HOMEOWNER,
    review: { code: 'H', title: 'Homeowner' },
  }),
  likert('H3', 's11', 'Registering or authorizing a tenant with the HOA is easy.', 'agreement', {
    showWhen: { op: 'and', args: [OWNER_ONLY, { op: 'includes', q: 'H1', value: 'tenant_registration' }] },
    skipCode: 'not_shown',
    skipCodeWhen: HOMEOWNER,
    review: { code: 'H', title: 'Homeowner' },
  }),
  {
    code: 'H4',
    stepId: 's11',
    type: 'text',
    text: 'Describe one HOA transaction that took the longest, and why.',
    maxLength: 300,
    showWhen: HOMEOWNER,
    review: { code: 'H', title: 'Homeowner' },
  },

  // ---- Step 11: tenant set ----
  {
    code: 'T1',
    stepId: 's11',
    type: 'multi',
    text: 'Which HOA requirements did your household deal with as tenants in the past 12 months? Select all that apply.',
    showWhen: TENANT,
    review: { code: 'T', title: 'Tenant and lessee' },
    exclusiveId: 'none',
    options: opts(
      ['tenant_registration', 'Tenant registration'],
      ['move_in_clearance', 'Move-in clearance'],
      ['visitor_worker_passes', 'Visitor or worker passes'],
      ['vehicle_sticker', 'Vehicle sticker'],
      ['owner_docs_needed', "Forms needing the owner's signature or documents"],
      ['none', 'None'],
      ['other', 'Other'],
    ),
  },
  likert('T2', 's11', "The HOA's forms and requirements for tenants are clear.", 'agreement', {
    allowNA: true,
    showWhen: TENANT,
    review: { code: 'T', title: 'Tenant and lessee' },
  }),
  likert(
    'T3',
    's11',
    "Completing HOA requirements as a tenant takes more steps than it should, such as needing the owner's documents or signature.",
    'agreement',
    { allowNA: true, showWhen: TENANT, review: { code: 'T', title: 'Tenant and lessee' } },
  ),
  {
    code: 'T4',
    stepId: 's11',
    type: 'text',
    text: 'Which HOA requirement was hardest for your household as a tenant?',
    maxLength: 300,
    showWhen: TENANT,
    review: { code: 'T', title: 'Tenant and lessee' },
  },

  // ---- Step 12 ----
  likert('AC2', 's12', 'Going to the HOA office in person is difficult for me or for someone in my household.', 'agreement', { allowNA: true }),
  likert(
    'AC3',
    's12',
    'Larger text, higher contrast, or screen reader support would help me or someone in my household use an online form.', 'agreement', { allowNA: true }),
  {
    code: 'AC4',
    stepId: 's12',
    type: 'single',
    text: 'If an online service were available, who would use it for the household member who needs help?',
    options: opts(
      ['the_person_themselves', 'The person themselves'],
      ['family_member', 'A family member'],
      ['caregiver_or_rep', 'A caregiver or authorized representative'],
      ['not_applicable', 'Not applicable'],
    ),
  },

  // ---- Step 13 ----
  {
    code: 'O1',
    stepId: 's13',
    type: 'nested_multi',
    text: 'Besides what was asked, which of these HOA-related problems have you experienced? Select all that apply.',
    exclusiveId: 'none_of_these',
    categories: O1_CATEGORIES.map((c) => ({ id: c.id, label: c.label, items: [...c.items] })),
    options: opts(['none_of_these', 'None of these'], ['other', 'Other']),
  },
  {
    code: 'O2',
    stepId: 's13',
    type: 'text',
    text: 'Is there any other problem with HOA services that you would like us to know about?',
    maxLength: 500,
    hints: [{ text: 'Please do not write names.' }],
  },
  {
    code: 'O3',
    stepId: 's13',
    type: 'text',
    text: 'What other problems do you and your household face in the community, even if they have nothing to do with the HOA?',
    maxLength: 500,
    hints: [{ text: 'Please do not write names.' }],
  },
  {
    code: 'IV1',
    stepId: 's13',
    type: 'single',
    text: 'Would you be open to being contacted for a possible follow-up interview?',
    options: opts(['yes', 'Yes'], ['no', 'No']),
    attachForm: { when: { op: 'eq', q: 'IV1', value: 'yes' } },
  },
];

/** Sections that only make sense for someone who has dealt with the HOA are hidden for everyone else. */
const questions = bundledQuestions.map((q) => gateByTransaction(q));

export const DEFAULT_INSTRUMENT: Instrument = {
  version: 'v1',
  status: 'published',
  title: 'Resident Needs Assessment',
  steps,
  questions,
};

/** Question codes the dashboard and admin mapping read directly. They cannot be removed or renamed. */
export const CORE_QUESTION_CODES: readonly string[] = [
  'A1',
  'A2',
  'A4',
  'B1',
  'P1',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F7',
];
