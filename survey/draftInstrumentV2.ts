import { DEFAULT_INSTRUMENT } from '@/survey/defaultInstrument';
import { O1_V2_EXTRA_CATEGORIES } from '@/survey/o1';
import {
  conditionRefs,
  sortQuestionsByStep,
  type Condition,
  type Instrument,
  type OptionDef,
  type QuestionDef,
  type StepDef,
} from '@/survey/model';

/**
 * Working draft of instrument v2. It is built from the bundled v1, so every v1 question,
 * code and wording is carried over unchanged unless noted below. The Survey builder lists
 * it as a draft; saving it there writes surveyInstruments/v2. It is never published from here.
 *
 * English only. Tagalog strings are added after the wording is approved.
 *
 * New section prefixes (the older plan codes collided with live ones):
 *   CC community concerns, HR house rules awareness, TO tenant orientation,
 *   OM owner mirror (owners who rent out), CH HOA communication channels.
 *
 * Every question that can be hidden carries skipCode "not_shown". Questions carried over from
 * v1 that had no skip code (AC1, AC1_other, P5, H1 to H4, T1 to T4) gain one in v2, and H3 loses
 * its skipCodeWhen, so tenants who never see H3 are stored as "not_shown" like every other skip.
 */

// ---- conditions ------------------------------------------------------------------------

const HOMEOWNER: Condition = { op: 'in', q: 'A1', value: [1, 2, 3, 4] };
const TENANT: Condition = { op: 'in', q: 'A1', value: [5, 6] };
const HAS_DEVICE: Condition = { op: 'notIncludes', q: 'B1', value: 'none' };
const HAS_P1: Condition = { op: 'notIncludes', q: 'P1', value: 'none_of_these' };
/** Owner (homeowner types 1 to 3) whose unit is currently rented out. Gate for the owner-mirror items. */
const RENTS_OUT: Condition = {
  op: 'and',
  args: [
    { op: 'in', q: 'A1', value: [1, 2, 3] },
    { op: 'eq', q: 'A13', value: 'yes' },
  ],
};
const CONCERN_PICKED: Condition = { op: 'answered', q: 'CC2b' };
const CONCERN_REPORTED: Condition = { op: 'and', args: [CONCERN_PICKED, { op: 'eq', q: 'CC4', value: 'yes' }] };
const CONCERN_NOT_REPORTED: Condition = { op: 'and', args: [CONCERN_PICKED, { op: 'eq', q: 'CC4', value: 'no' }] };

// ---- helpers ---------------------------------------------------------------------------

const NS = 'not_shown' as const;

const opts = (...pairs: Array<[string, string]>): OptionDef[] =>
  pairs.map(([id, label]) => ({ id, label }));

type Extra = Partial<QuestionDef>;

const likert = (
  code: string,
  stepId: string,
  text: string,
  extra: Extra = {},
  scale: 'agreement' | 'likelihood' = 'agreement',
): QuestionDef => ({
  code,
  stepId,
  type: 'likert',
  text,
  scale,
  ...(extra.showWhen && extra.skipCode === undefined ? { skipCode: NS } : {}),
  ...extra,
});

const single = (code: string, stepId: string, text: string, options: OptionDef[], extra: Extra = {}): QuestionDef => ({
  code,
  stepId,
  type: 'single',
  text,
  options,
  ...(extra.showWhen && extra.skipCode === undefined ? { skipCode: NS } : {}),
  ...extra,
});

const multi = (code: string, stepId: string, text: string, options: OptionDef[], extra: Extra = {}): QuestionDef => ({
  code,
  stepId,
  type: 'multi',
  text,
  options,
  ...(extra.showWhen && extra.skipCode === undefined ? { skipCode: NS } : {}),
  ...extra,
});

const FREE_TEXT_HINT = [{ text: 'Please do not write names or addresses.' }];

// ---- ranges reused by the length-of-stay and tenancy questions -------------------------------

const STAY_RANGES = (): OptionDef[] =>
  opts(
    ['under_1', 'Under 1 year'],
    ['1_to_under_3', '1 to under 3 years'],
    ['3_to_under_5', '3 to under 5 years'],
    ['5_to_under_10', '5 to under 10 years'],
    ['10_to_under_15', '10 to under 15 years'],
    ['15_plus', '15 years or more'],
    ['prefer_not_to_say', 'Prefer not to say'],
  );

// ---- identical wording for owners who rent out (OM) and tenants (TO) ---------------------------

export const MIRROR_STATEMENTS: readonly string[] = [
  'The owner and the tenant of a unit can reach each other quickly when something needs to be fixed or signed.',
  'Tenants are told the subdivision rules before or when they move in.',
  'Getting HOA forms, permits, or passes for a rented unit takes a reasonable number of steps.',
  "The owner's signature or documents for HOA forms can be obtained without long delays.",
  'The right person, owner or tenant, is the one who receives the notice when a rule is broken in a rented unit.',
  'Tenants are treated the same as owners by neighbors.',
  'Tenants are treated the same as owners by the HOA.',
  'A standard HOA orientation sheet would make it easier for owners to orient their tenants.',
];

// ---- steps -----------------------------------------------------------------------------------

const ANON_NOTE =
  'Your answers are anonymous and reported in numbers only. Describe what happens, not who does it. Do not name people or addresses.';

const newSteps: Record<string, StepDef> = {
  s14: {
    id: 's14',
    title: 'Community concerns',
    subtitle: 'Tell us about everyday concerns in your neighborhood and what happened when they came up.',
    notes: [{ kind: 'intro', text: ANON_NOTE }],
    review: { code: 'CC', title: 'Community concerns' },
  },
  s15: {
    id: 's15',
    title: 'House rules awareness',
    subtitle: 'How well you know the subdivision rules, and where you learned them.',
    notes: [
      {
        kind: 'intro',
        text: 'These questions are not a test. They help us see where residents need clearer information.',
      },
    ],
    review: { code: 'HR', title: 'House rules awareness' },
  },
  s16: {
    id: 's16',
    title: 'Moving in as a tenant',
    subtitle: 'How you learned about the subdivision rules when you moved in, and how owners and tenants work together.',
    notes: [{ kind: 'intro', text: ANON_NOTE }],
    review: { code: 'TO', title: 'Tenant orientation' },
  },
  s17: {
    id: 's17',
    title: 'Renting out your unit',
    subtitle: 'How you prepare your tenant for life in the subdivision, and how owners and tenants work together.',
    notes: [{ kind: 'intro', text: ANON_NOTE }],
    review: { code: 'OM', title: 'Owner mirror' },
  },
  s18: {
    id: 's18',
    title: 'HOA announcements and channels',
    subtitle: 'How you get news from the HOA, and how well it reaches you.',
    notes: [
      {
        kind: 'intro',
        text: "These questions are about the HOA's Facebook account, its website, and other ways you hear from the HOA.",
      },
    ],
    review: { code: 'CH', title: 'HOA communication channels' },
  },
};

// ---- new and changed questions ---------------------------------------------------------------

const CONCERNS: Array<[string, string]> = [
  ['noise', 'Noise'],
  ['parking', 'Parking or blocked driveways'],
  ['garbage', 'Garbage or sanitation'],
  ['pets', 'Pets'],
  ['speeding', 'Speeding or traffic'],
  ['construction', 'Construction or renovation'],
  ['home_business', 'Home business activity'],
  ['visitors', 'Visitors or loitering'],
  ['upkeep', 'Property upkeep'],
  ['unpaid_dues', 'Unpaid dues or fees'],
];

const concernOptionsFrom = (source: string): OptionDef[] => [
  ...CONCERNS.map(([id, label]) => ({ id, label, showWhen: { op: 'includes', q: source, value: id } as Condition })),
  { id: 'other', label: 'Other', showWhen: { op: 'includes', q: source, value: 'other' } as Condition },
];

const AREAS: Array<[string, string]> = [
  ['noise', 'noise'],
  ['parking', 'parking'],
  ['construction', 'construction and renovation'],
  ['visitors_gate', 'visitors and gate entry'],
  ['pets', 'pets'],
];

const LEARN_SOURCES = (): OptionDef[] =>
  opts(
    ['hoa_orientation', 'HOA orientation'],
    ['documents', 'Printed or online documents'],
    ['hoa_website', 'HOA website'],
    ['facebook', 'Facebook'],
    ['neighbors', 'Neighbors'],
    ['guards', 'Guards'],
    ['owner_or_tenant', 'The owner or tenant of my unit'],
    ['never_learned', 'I have not learned them'],
  );

const CHANNELS = (): OptionDef[] =>
  opts(
    ['facebook', 'Facebook'],
    ['website', 'HOA website'],
    ['group_chat', 'Group chat'],
    ['guards', 'Guards'],
    ['neighbors', 'Neighbors'],
    ['hoa_office', 'HOA office'],
    ['none', 'None of these'],
  );

const HEARD_BEFORE_MOVE = { op: 'in', q: 'TO1', value: ['yes_fully', 'yes_partly'] } as Condition;
const NOT_FULLY_ORIENTED = { op: 'in', q: 'TO1', value: ['yes_partly', 'no', 'not_sure'] } as Condition;

const additions: Record<string, QuestionDef[]> = {
  // ---- step 1: screening --------------------------------------------------------------------
  s1: [
    single('A9', 's1', 'About how long have you been living in the subdivision?', STAY_RANGES(), { columns: 2 }),
    single('A12', 's1', 'How long have you been renting or leasing your current unit?', STAY_RANGES(), {
      showWhen: TENANT,
      columns: 2,
    }),
    single(
      'A13',
      's1',
      'Is your unit currently rented out to a tenant or lessee?',
      opts(['yes', 'Yes'], ['no', 'No'], ['prefer_not_to_say', 'Prefer not to say']),
      { showWhen: { op: 'in', q: 'A1', value: [1, 2, 3] }, layout: ['bento-pair'] },
    ),
  ],

  // ---- step 4: more digital access ----------------------------------------------------------
  s4: [
    likert('B10', 's4', 'I am comfortable filling out a form on my phone.', { showWhen: HAS_DEVICE }),
    likert('B11', 's4', 'I can read text on my phone screen without difficulty.', { showWhen: HAS_DEVICE }),
    likert('B13', 's4', 'I know how to upload a file or photo to a website.', { showWhen: HAS_DEVICE }),
    likert('B14', 's4', 'I can use a website without asking someone for help.'),
    likert('B15', 's4', 'I can afford enough mobile data or Wi-Fi to use online services.'),
    likert('B16', 's4', 'I feel safe doing transactions online.'),
    likert('B18', 's4', 'I check my phone or email often enough to see important notices.', { allowNA: true }),
  ],

  // ---- step 5: more feature interest --------------------------------------------------------
  s5: [
    likert('F11', 's5', 'How likely are you to use a website to view your HOA dues and pay them?', {}, 'likelihood'),
    likert('F12', 's5', 'How likely are you to use a website to read HOA announcements and notices?', {}, 'likelihood'),
    likert('F13', 's5', 'How likely are you to use phone reminders about HOA rules and notices?', {}, 'likelihood'),
    likert(
      'F14',
      's5',
      'How likely are you to use a website to apply for a clearance, renovation permit, or vehicle sticker?',
      {},
      'likelihood',
    ),
  ],

  // ---- step 7: more service access ----------------------------------------------------------
  s7: [
    likert('S4', 's7', 'I know which HOA office or officer to contact for each type of concern.', { allowNA: true }),
    likert('S5', 's7', 'The HOA office is easy to reach by phone or message.', { allowNA: true }),
    likert('S6', 's7', 'HOA staff and officers are courteous when I deal with them.', { allowNA: true }),
    likert('S7', 's7', 'I get clear instructions on the documents and steps I need.', { allowNA: true }),
    likert('S8', 's7', 'I can find out what happened to a request I made.', { allowNA: true }),
    likert('S9', 's7', 'Reaching the HOA does not cost me much time or money.', { allowNA: true }),
    likert('S10', 's7', 'I am satisfied with how the HOA handles my transactions today.', { allowNA: true }),
  ],

  // ---- step 8: more permits ----------------------------------------------------------------
  s8: [
    likert('P6', 's8', 'The steps for letting visitors into the subdivision are clear to me.', {
      allowNA: true,
      showWhen: HAS_P1,
    }),
    likert('P7', 's8', 'My visitors can enter without being turned away because of missing paperwork.', {
      allowNA: true,
      showWhen: HAS_P1,
    }),
    likert('P8', 's8', 'Deliveries and ride-hailing drivers can enter without trouble.', {
      allowNA: true,
      showWhen: {
        op: 'or',
        args: [
          { op: 'includes', q: 'P1', value: 'deliveries' },
          { op: 'includes', q: 'P1', value: 'drivers' },
        ],
      },
    }),
    likert('P9', 's8', 'I would rather register my visitors before they arrive.', { showWhen: HAS_P1 }),
    likert('P10', 's8', 'Gate guards check visitors consistently.', { allowNA: true }),
    likert('P11', 's8', 'I feel secure about who enters the subdivision.', { allowNA: true }),
    likert('P12', 's8', 'The documents required for worker permits are reasonable.', {
      allowNA: true,
      showWhen: { op: 'eq', q: 'A5', value: 'yes' },
    }),
  ],

  // ---- step 10: more registration and privacy -----------------------------------------------
  s10: [
    likert('R4', 's10', 'I understand why the HOA needs to verify my ID.'),
    likert('R5', 's10', 'I am comfortable giving my name and contact details to register online.'),
    likert('R6', 's10', 'I am confident my personal data would be handled safely.'),
    likert('R7', 's10', 'I would feel safer if the HOA explained how my data is protected.'),
    likert('R8', 's10', 'I am willing to wait for the HOA Board to verify my registration.'),
    likert('R9', 's10', 'I prefer showing my ID in person instead of uploading it.'),
    likert('R12', 's10', 'I understand what happens to my ID photo after it is checked.'),
    likert('R13', 's10', 'I am comfortable receiving the result of my verification by text message or email.'),
  ],

  // ---- step 11: homeowner and tenant sets ---------------------------------------------------
  s11: [
    likert('H6', 's11', 'Getting a clearance or certificate from the HOA is easy.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H7', 's11', 'Renovation permits are processed in a reasonable time.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H8', 's11', 'The requirements for a renovation permit are clear.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H9', 's11', 'Applying for a vehicle sticker is simple.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H10', 's11', 'I understand my billing or dues statement.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H11', 's11', 'Paying HOA dues is convenient for me.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H13', 's11', 'I know how long a clearance or permit will take before I apply.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('H14', 's11', 'I can easily get a receipt or proof of payment from the HOA.', {
      allowNA: true,
      showWhen: HOMEOWNER,
      review: { code: 'H', title: 'Homeowner' },
    }),
    likert('T6', 's11', 'Registering as a tenant with the HOA is easy.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T10', 's11', 'Vehicle stickers and visitor passes are easy to get as a tenant.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T11', 's11', 'I know who to contact at the HOA about tenant concerns.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T12', 's11', 'Move-in clearance is processed in a reasonable time.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T13', 's11', 'I can find the list of HOA requirements for tenants without asking someone.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T14', 's11', 'I can finish my tenant registration without many trips to the HOA office.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T15', 's11', "I understand which HOA requirements are mine as a tenant and which are the owner's.", {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
    likert('T16', 's11', 'The documents the HOA asks tenants to provide are reasonable.', {
      allowNA: true,
      showWhen: TENANT,
      review: { code: 'T', title: 'Tenant and lessee' },
    }),
  ],

  // ---- step 12: more accessibility (shown to everyone, as in v1) ----------------------------
  s12: [
    likert('AC5', 's12', 'HOA forms are easy to read and understand.', { allowNA: true }),
    likert('AC6', 's12', 'People in my household who need help can use a website on their own.', { allowNA: true }),
    likert('AC7', 's12', 'A text size option would help me or someone in my household use an online form.', {
      allowNA: true,
    }),
    likert('AC8', 's12', 'A high-contrast option would help me or someone in my household use an online form.', {
      allowNA: true,
    }),
    likert('AC9', 's12', 'A screen reader option would help me or someone in my household use an online form.', {
      allowNA: true,
    }),
    likert('AC10', 's12', 'The HOA office and common areas are easy to enter and move around in.', { allowNA: true }),
    likert('AC11', 's12', 'I would trust a family member or representative to submit forms for me online.', {
      allowNA: true,
    }),
    likert(
      'AC13',
      's12',
      'Instructions in simple words and short steps would help me or someone in my household use an online service.',
      { allowNA: true },
    ),
  ],

  // ---- step 14: community concerns (CC) -----------------------------------------------------
  s14: [
    multi(
      'CC1',
      's14',
      'In the past 12 months, which of these concerns have you experienced in your neighborhood? Select all that apply.',
      [...opts(...CONCERNS), { id: 'other', label: 'Other' }, { id: 'none', label: 'None of these' }],
      { exclusiveId: 'none' },
    ),
    multi(
      'CC2',
      's14',
      'Which of these are the most serious for you? Select up to 3.',
      concernOptionsFrom('CC1'),
      { maxSelect: 3, showWhen: { op: 'notIncludes', q: 'CC1', value: 'none' } },
    ),
    single('CC2b', 's14', 'Which one is the most serious? The next questions are about this one.', concernOptionsFrom('CC2'), {
      showWhen: { op: 'answered', q: 'CC2' },
    }),
    single(
      'CC3',
      's14',
      'How often has this concern happened in the past 12 months?',
      opts(['once', 'Once'], ['several_times', 'Several times'], ['ongoing', 'It is ongoing'], ['prefer_not_to_say', 'Prefer not to say']),
      { showWhen: CONCERN_PICKED },
    ),
    single(
      'CC4',
      's14',
      'Did you report this concern to anyone?',
      opts(['yes', 'Yes'], ['no', 'No'], ['prefer_not_to_say', 'Prefer not to say']),
      { showWhen: CONCERN_PICKED },
    ),
    multi(
      'CC5',
      's14',
      'Who did you report it to? Select all that apply.',
      opts(
        ['hoa_office', 'HOA office'],
        ['guard', 'Guard'],
        ['facebook', 'Facebook page or message'],
        ['neighbor_directly', 'The neighbor directly'],
        ['other', 'Other'],
      ),
      { showWhen: CONCERN_REPORTED },
    ),
    multi(
      'CC6',
      's14',
      'Why did you not report it? Select all that apply.',
      opts(
        ['did_not_know_where', 'I did not know where to report'],
        ['expected_no_result', 'I expected nothing would happen'],
        ['feared_conflict', 'I did not want conflict with a neighbor'],
        ['no_time', 'I did not have time'],
        ['other', 'Other'],
        ['prefer_not_to_say', 'Prefer not to say'],
      ),
      { showWhen: CONCERN_NOT_REPORTED, exclusiveId: 'prefer_not_to_say' },
    ),
    single(
      'CC7',
      's14',
      'How long did it take to get a response?',
      opts(
        ['same_day', 'The same day'],
        ['1_2_days', '1 to 2 days'],
        ['3_7_days', '3 to 7 days'],
        ['over_a_week', 'More than a week'],
        ['no_response', 'I have not had a response'],
      ),
      { showWhen: CONCERN_REPORTED },
    ),
    single(
      'CC8',
      's14',
      'Was the concern resolved?',
      opts(['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No'], ['too_early', 'It is too early to say']),
      { showWhen: CONCERN_REPORTED },
    ),
    likert('CC9', 's14', 'I am satisfied with how my report was handled.', { showWhen: CONCERN_REPORTED }),
    likert('CC10', 's14', 'An advance notice or reminder would have prevented this concern.', { showWhen: CONCERN_PICKED }),
    {
      code: 'CC11',
      stepId: 's14',
      type: 'text',
      text: 'Is there any other concern about the HOA or the neighborhood that was not on the list?',
      maxLength: 300,
      hints: FREE_TEXT_HINT,
    },
    likert('CC12', 's14', 'I feel comfortable reporting a concern to the HOA.', { allowNA: true }),
    likert('CC13', 's14', 'Concerns reported to the HOA are taken seriously.', { allowNA: true }),
    likert('CC14', 's14', 'Noise in my neighborhood is kept at a reasonable level.'),
    likert('CC15', 's14', 'Parking in my neighborhood is orderly.'),
    likert('CC16', 's14', 'Garbage and sanitation in my neighborhood are well managed.'),
    likert('CC17', 's14', 'Pets in my neighborhood are kept under control.'),
    likert('CC18', 's14', 'Construction and repair work near my home is done at reasonable hours.'),
    likert('CC19', 's14', 'Visitors to my neighborhood behave respectfully.'),
  ],

  // ---- step 15: house rules awareness (HR) --------------------------------------------------
  s15: [
    likert('HR1', 's15', "I am familiar with the subdivision's house rules."),
    ...AREAS.map(([id, label], i) =>
      likert(`HR2${String.fromCharCode(97 + i)}`, 's15', `I know what is expected of residents about ${label}.`),
    ),
    likert('HR3a', 's15', 'I know what counts as a violation of the house rules.'),
    likert('HR3b', 's15', 'I know how to report a violation.'),
    likert('HR3c', 's15', 'I know what happens after a violation is reported.'),
    multi('HR4', 's15', 'Where did you learn the house rules? Select all that apply.', LEARN_SOURCES(), {
      exclusiveId: 'never_learned',
    }),
    likert('HR6', 's15', 'I can find the house rules easily when I need them.'),
  ],

  // ---- step 16: tenant orientation (TO), tenants only ---------------------------------------
  s16: [
    single(
      'TO1',
      's16',
      "Before you moved in, did the owner of your unit orient you on the subdivision's rules?",
      opts(
        ['yes_fully', 'Yes, fully'],
        ['yes_partly', 'Yes, partly'],
        ['no', 'No'],
        ['not_sure', 'Not sure'],
      ),
      { showWhen: TENANT },
    ),
    multi(
      'TO2',
      's16',
      'How was it done? Select all that apply.',
      opts(
        ['verbal', 'Told to me in person or by phone'],
        ['written_copy', 'Given a written copy'],
        ['lease_clause', 'Included in the lease'],
        ['hoa_documents', 'Shown HOA documents'],
      ),
      { showWhen: { op: 'and', args: [TENANT, HEARD_BEFORE_MOVE] } },
    ),
    multi(
      'TO3',
      's16',
      'Which areas were covered? Select all that apply.',
      opts(...AREAS.map(([id, label]) => [id, label.charAt(0).toUpperCase() + label.slice(1)] as [string, string])),
      { showWhen: { op: 'and', args: [TENANT, HEARD_BEFORE_MOVE] } },
    ),
    likert('TO4', 's16', 'The orientation I received was clear.', {
      showWhen: { op: 'and', args: [TENANT, HEARD_BEFORE_MOVE] },
    }),
    multi(
      'TO5',
      's16',
      'Did anyone else orient you? Select all that apply.',
      opts(['hoa', 'The HOA'], ['guard', 'A guard'], ['neighbor', 'A neighbor'], ['nobody', 'Nobody']),
      { showWhen: { op: 'and', args: [TENANT, NOT_FULLY_ORIENTED] }, exclusiveId: 'nobody' },
    ),
    multi('TO6', 's16', 'How did you learn the rules? Select all that apply.', LEARN_SOURCES(), {
      showWhen: { op: 'and', args: [TENANT, NOT_FULLY_ORIENTED] },
      exclusiveId: 'never_learned',
    }),
    single(
      'TO7',
      's16',
      'Did you learn a rule only after a warning, notice, or complaint?',
      opts(['yes', 'Yes'], ['no', 'No'], ['prefer_not_to_say', 'Prefer not to say']),
      { showWhen: { op: 'and', args: [TENANT, NOT_FULLY_ORIENTED] } },
    ),
    single(
      'TO8',
      's16',
      'Did you ever break a rule without knowing it?',
      opts(['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure'], ['prefer_not_to_say', 'Prefer not to say']),
      { showWhen: { op: 'and', args: [TENANT, NOT_FULLY_ORIENTED] } },
    ),
    multi(
      'TO9',
      's16',
      'What would have helped? Select all that apply.',
      opts(
        ['online_guide', 'A short online guide at move-in'],
        ['printed_sheet', 'A printed sheet'],
        ['hoa_meeting', 'A meeting with the HOA'],
        ['owner_orientation', 'Orientation from the owner'],
      ),
      { showWhen: { op: 'and', args: [TENANT, NOT_FULLY_ORIENTED] } },
    ),
    single(
      'TO10',
      's16',
      'Has the HOA ever given you the rules directly or asked you to acknowledge them?',
      opts(['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']),
      { showWhen: TENANT },
    ),
    single(
      'TO11',
      's16',
      'Whose job should it be to inform tenants of the rules?',
      opts(['owner', 'The owner'], ['hoa', 'The HOA'], ['both', 'Both']),
      { showWhen: TENANT },
    ),
    likert('TO12', 's16', 'I feel prepared to follow the subdivision rules.', { showWhen: TENANT }),
    ...MIRROR_STATEMENTS.map((text, i) => likert(`TO${13 + i}`, 's16', text, { allowNA: true, showWhen: TENANT })),
  ],

  // ---- step 17: owner mirror (OM), owners who rent out ---------------------------------------
  s17: [
    single(
      'OM1',
      's17',
      "Do you orient your tenants on the subdivision's rules?",
      opts(['always', 'Always'], ['sometimes', 'Sometimes'], ['never', 'Never']),
      { showWhen: RENTS_OUT },
    ),
    multi(
      'OM2',
      's17',
      'How do you orient them? Select all that apply.',
      opts(
        ['verbal', 'Tell them in person or by phone'],
        ['written_copy', 'Give a written copy'],
        ['lease_clause', 'Include it in the lease'],
        ['hoa_documents', 'Show HOA documents'],
      ),
      { showWhen: { op: 'and', args: [RENTS_OUT, { op: 'in', q: 'OM1', value: ['always', 'sometimes'] }] } },
    ),
    ...MIRROR_STATEMENTS.map((text, i) => likert(`OM${3 + i}`, 's17', text, { allowNA: true, showWhen: RENTS_OUT })),
    likert('OM11', 's17', 'I understand my responsibilities as the owner of a rented unit.', {
      allowNA: true,
      showWhen: RENTS_OUT,
    }),
    likert('OM12', 's17', 'I am confident my tenant knows the subdivision rules.', {
      allowNA: true,
      showWhen: RENTS_OUT,
    }),
  ],

  // ---- step 18: HOA communication channels (CH) --------------------------------------------
  s18: [
    single(
      'CH1',
      's18',
      "Are you aware that the HOA has a Facebook account?",
      opts(
        ['yes_follow', 'Yes, and I follow it'],
        ['yes_not_follow', 'Yes, but I do not follow it'],
        ['no', 'No'],
        ['not_sure', 'Not sure'],
      ),
    ),
    single(
      'CH2',
      's18',
      'Are you aware that the HOA has a website?',
      opts(
        ['yes_visited', 'Yes, and I have visited it'],
        ['yes_never_visited', 'Yes, but I have never visited it'],
        ['no', 'No'],
        ['not_sure', 'Not sure'],
      ),
    ),
    multi('CH3', 's18', 'Which do you use to get HOA information? Select all that apply.', CHANNELS(), {
      exclusiveId: 'none',
    }),
    single('CH4', 's18', 'Which one do you rely on most?', CHANNELS()),
    single(
      'CH5',
      's18',
      'How often do you check HOA announcements?',
      opts(
        ['daily', 'Daily'],
        ['weekly', 'Weekly'],
        ['monthly', 'Monthly'],
        ['rarely', 'Rarely'],
        ['never', 'Never'],
      ),
    ),
    likert('CH6', 's18', 'I feel up to date with HOA announcements.'),
    single(
      'CH7',
      's18',
      'In the past 12 months, did you miss an announcement you later wished you had seen?',
      opts(['never', 'Never'], ['once', 'Once'], ['several_times', 'Several times']),
    ),
    multi(
      'CH8',
      's18',
      'What did you miss? Select all that apply.',
      opts(
        ['schedule_or_closure', 'A schedule or closure notice'],
        ['rule_change', 'A rule change'],
        ['payment_or_fee', 'A payment or fee notice'],
        ['meeting', 'A meeting'],
        ['event', 'An event'],
        ['other', 'Other'],
      ),
      { showWhen: { op: 'in', q: 'CH7', value: ['once', 'several_times'] } },
    ),
    single(
      'CH9',
      's18',
      'How did you find out you had missed it?',
      opts(
        ['neighbor', 'A neighbor told me'],
        ['guard', 'A guard told me'],
        ['hoa_notice_late', 'A later notice from the HOA'],
        ['other', 'Other'],
        ['prefer_not_to_say', 'Prefer not to say'],
      ),
      { showWhen: { op: 'in', q: 'CH7', value: ['once', 'several_times'] } },
    ),
    likert('CH10', 's18', 'I am confident I can tell whether a message that claims to be from the HOA is real.'),
    single(
      'CH11',
      's18',
      'Have you ever been unsure whether an announcement was official?',
      opts(['never', 'Never'], ['once', 'Once'], ['several_times', 'Several times']),
    ),
    single(
      'CH12',
      's18',
      'How would you check?',
      opts(
        ['ask_neighbor', 'Ask a neighbor'],
        ['ask_guard', 'Ask a guard'],
        ['visit_office', 'Visit the office'],
        ['check_website', 'Look at the website'],
        ['would_not_check', 'I would not check'],
      ),
      { showWhen: { op: 'in', q: 'CH11', value: ['once', 'several_times'] } },
    ),
    single(
      'CH13',
      's18',
      'Have you sent a message to the HOA and gotten no reply?',
      opts(
        ['yes', 'Yes'],
        ['no', 'No'],
        ['never_sent', 'I have never sent one'],
      ),
    ),
    single(
      'CH13b',
      's18',
      'How long did you wait?',
      opts(
        ['up_to_3_days', 'Up to 3 days'],
        ['4_7_days', '4 to 7 days'],
        ['8_14_days', '8 to 14 days'],
        ['over_14_days', 'More than 14 days'],
      ),
      { showWhen: { op: 'eq', q: 'CH13', value: 'yes' } },
    ),
    single(
      'CH14',
      's18',
      'Were you told how to get HOA announcements when you moved in?',
      opts(['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']),
      { showWhen: TENANT },
    ),
    single(
      'CH15',
      's18',
      'Do you receive HOA announcements directly or through someone else?',
      opts(
        ['directly', 'Directly'],
        ['through_owner', 'Through the owner'],
        ['through_neighbors', 'Through neighbors'],
        ['not_at_all', 'Not at all'],
      ),
      { showWhen: TENANT },
    ),
    likert('CH16', 's18', 'HOA announcements are easy to find.'),
    likert('CH17', 's18', 'HOA announcements are posted early enough for me to act on them.'),
    likert('CH18', 's18', 'HOA announcements are written in a way that is easy to understand.'),
    likert('CH19', 's18', "The HOA's Facebook account is easy to use for getting information.", {
      allowNA: true,
      showWhen: { op: 'in', q: 'CH1', value: ['yes_follow', 'yes_not_follow'] },
    }),
    likert('CH20', 's18', 'The HOA website is easy to use for finding information.', {
      allowNA: true,
      showWhen: { op: 'eq', q: 'CH2', value: 'yes_visited' },
    }),
    likert('CH21', 's18', 'HOA announcements reach tenants as well as owners.', { allowNA: true }),
    likert('CH22', 's18', 'I can ask a question about an announcement and get an answer.', { allowNA: true }),
    likert('CH23', 's18', 'The information on one HOA channel matches the information on the others.', {
      allowNA: true,
    }),
  ],
};

// ---- default and optional Likert items ---------------------------------------------------------
//
// Every rated category shows 5 Likert questions by default (6 in F, because F7 is a core code
// that must stay visible). The other Likert questions are optional: each appears only after an
// earlier answer signals a reason to ask. A "signal" is an answer that is not clearly favorable:
//   favorable-worded statement: Neutral, Disagree or Strongly disagree (3, 2, 1)
//   unfavorable-worded statement (the REVERSE_CODED ones): Neutral, Agree or Strongly agree (3, 4, 5)
// Not applicable never signals. Likelihood items in F signal on interest (Likely or Very likely).

const UNFAVORABLE_WORDING = new Set(['S1', 'S2', 'B8', 'P2', 'P3', 'P5', 'H2', 'T3', 'AC2']);

const weak = (code: string): Condition =>
  UNFAVORABLE_WORDING.has(code)
    ? { op: 'in', q: code, value: [3, 4, 5] }
    : { op: 'in', q: code, value: [1, 2, 3] };
const strong = (code: string): Condition => ({ op: 'in', q: code, value: [4, 5] });
const anyOf = (...parts: Condition[]): Condition => (parts.length === 1 ? parts[0]! : { op: 'or', args: parts });
const allOf = (...parts: Condition[]): Condition => ({ op: 'and', args: parts });
const anyWeak = (...codes: string[]): Condition => anyOf(...codes.map(weak));
const anyStrong = (...codes: string[]): Condition => anyOf(...codes.map(strong));
const picked = (q: string, value: string): Condition => ({ op: 'includes', q, value });

const MIRROR_BASE = ['TO13', 'TO14', 'TO15', 'TO16', 'TO17'];
const OM_BASE = ['OM3', 'OM4', 'OM5', 'OM6', 'OM7'];
const F_CORE = ['F1', 'F3', 'F4', 'F5'];

/** Default (always shown to the category's audience) Likert codes per category. */
export const DEFAULT_LIKERT: Readonly<Record<string, readonly string[]>> = {
  B: ['B7', 'B14', 'B15', 'B16', 'B18'],
  F: ['F1', 'F3', 'F4', 'F5', 'F7'],
  S: ['S1', 'S2', 'S3', 'S4', 'S5'],
  P: ['P6', 'P7', 'P9', 'P10', 'P11'],
  R: ['R1', 'R2', 'R4', 'R5', 'R6'],
  H: ['H2', 'H6', 'H7', 'H10', 'H11'],
  T: ['T2', 'T3', 'T6', 'T11', 'T13'],
  CC: ['CC12', 'CC13', 'CC14', 'CC15', 'CC16'],
  HR: ['HR1', 'HR3a', 'HR3b', 'HR3c', 'HR6'],
  TO: MIRROR_BASE,
  OM: OM_BASE,
  CH: ['CH6', 'CH10', 'CH16', 'CH17', 'CH18'],
  AC: ['AC2', 'AC3', 'AC5', 'AC6', 'AC10'],
};

/** Base items that v1 or the first pass gated, now shown by default with a Not applicable choice. */
const UNGATE = ['P6', 'P7', 'P9'];

/** Extra condition added to an optional item, on top of any gate it already has. */
const OPTIONAL_TRIGGERS: Record<string, Condition> = {
  // B digital access
  B8: allOf(HAS_DEVICE, anyWeak('B15', 'B7')),
  B9: allOf(HAS_DEVICE, anyWeak('B14', 'B18')),
  B10: allOf(HAS_DEVICE, anyWeak('B14', 'B7')),
  B11: allOf(HAS_DEVICE, anyWeak('B14', 'B16')),
  B13: allOf(HAS_DEVICE, anyWeak('B14', 'B18')),
  // F feature interest: extra features are asked of residents interested in at least one core feature
  F6: anyOf({ op: 'eq', q: 'A4', value: 'yes' }, anyStrong(...F_CORE)),
  F11: anyStrong(...F_CORE),
  F12: anyStrong('F1', 'F5'),
  F13: anyStrong('F1', 'F5'),
  F14: anyStrong(...F_CORE),
  // S service access
  S6: anyWeak('S3', 'S5'),
  S7: anyWeak('S2', 'S4'),
  S8: anyWeak('S3', 'S5'),
  S9: anyWeak('S1', 'S2'),
  S10: anyWeak('S1', 'S2', 'S3', 'S4', 'S5'),
  // P permits
  P2: allOf(HAS_P1, anyWeak('P6', 'P7')),
  P3: allOf(HAS_P1, anyWeak('P6', 'P7')),
  P8: allOf(
    anyOf(picked('P1', 'deliveries'), picked('P1', 'drivers')),
    anyWeak('P7'),
  ),
  P12: allOf({ op: 'eq', q: 'A5', value: 'yes' }, anyWeak('P5')),
  // R privacy
  R7: anyWeak('R6', 'R2'),
  R8: anyStrong('R1'),
  R9: anyWeak('R1'),
  R12: anyWeak('R2', 'R6'),
  R13: anyStrong('R1', 'R5'),
  // H homeowner set
  H8: allOf(HOMEOWNER, anyWeak('H6', 'H7')),
  H9: allOf(HOMEOWNER, picked('H1', 'vehicle_sticker')),
  H13: allOf(HOMEOWNER, anyWeak('H2', 'H6')),
  H14: allOf(HOMEOWNER, anyWeak('H10', 'H11')),
  // T tenant set
  T10: allOf(TENANT, anyWeak('T6', 'T13')),
  T12: allOf(TENANT, picked('T1', 'move_in_clearance')),
  T14: allOf(TENANT, anyWeak('T3', 'T6')),
  T15: allOf(TENANT, anyWeak('T2')),
  T16: allOf(TENANT, anyOf(weak('T3'), picked('T1', 'owner_docs_needed'))),
  // CC community concerns
  CC17: anyOf(picked('CC1', 'pets'), weak('CC16')),
  CC18: anyOf(picked('CC1', 'construction'), weak('CC14')),
  CC19: anyOf(picked('CC1', 'visitors'), weak('CC15')),
  // HR house rules, by area
  HR2a: anyOf(weak('HR1'), picked('CC1', 'noise')),
  HR2b: anyOf(weak('HR1'), picked('CC1', 'parking')),
  HR2c: anyOf(weak('HR1'), picked('CC1', 'construction'), { op: 'eq', q: 'A5', value: 'yes' }),
  HR2d: anyOf(weak('HR1'), HAS_P1, picked('CC1', 'visitors')),
  HR2e: anyOf(weak('HR1'), picked('CC1', 'pets')),
  // TO and OM: the three optional shared statements use the same rule for both groups
  TO12: allOf(TENANT, anyOf(NOT_FULLY_ORIENTED, weak('TO14'))),
  TO18: allOf(TENANT, anyWeak(...MIRROR_BASE)),
  TO19: allOf(TENANT, anyWeak(...MIRROR_BASE)),
  TO20: allOf(TENANT, anyWeak(...MIRROR_BASE)),
  OM8: allOf(RENTS_OUT, anyWeak(...OM_BASE)),
  OM9: allOf(RENTS_OUT, anyWeak(...OM_BASE)),
  OM10: allOf(RENTS_OUT, anyWeak(...OM_BASE)),
  OM11: allOf(RENTS_OUT, anyOf({ op: 'in', q: 'OM1', value: ['sometimes', 'never'] }, weak('OM7'))),
  OM12: allOf(RENTS_OUT, anyOf({ op: 'in', q: 'OM1', value: ['sometimes', 'never'] }, weak('OM4'))),
  // CH channels
  CH21: anyWeak('CH6', 'CH16'),
  CH22: anyWeak('CH10', 'CH18'),
  CH23: anyWeak('CH10', 'CH17'),
  // AC accessibility
  AC7: anyOf(strong('AC3'), picked('AC1', 'difficulty_seeing'), picked('AC1', 'difficulty_reading_forms')),
  AC8: anyOf(strong('AC3'), picked('AC1', 'difficulty_seeing')),
  AC9: anyOf(strong('AC3'), picked('AC1', 'difficulty_seeing')),
  AC11: anyWeak('AC6'),
  AC13: anyWeak('AC5'),
};

/** Optional items that keep only their own earlier gate (the gate already depends on an earlier answer). */
const OPTIONAL_BY_EXISTING_GATE = ['H3', 'P5', 'TO4', 'CC9', 'CC10', 'CH19', 'CH20'];
export const OPTIONAL_LIKERT: readonly string[] = [...Object.keys(OPTIONAL_TRIGGERS), ...OPTIONAL_BY_EXISTING_GATE];

function applyDefaultAndOptional(questions: QuestionDef[]): QuestionDef[] {
  const out = questions.map((q) => {
    const copy: QuestionDef = { ...q };
    if (UNGATE.includes(copy.code)) {
      delete copy.showWhen;
      delete copy.skipCode;
      copy.allowNA = true;
    }
    const trigger = OPTIONAL_TRIGGERS[copy.code];
    if (trigger) {
      const sameGate =
        copy.showWhen && trigger.op === 'and' && JSON.stringify(trigger.args[0]) === JSON.stringify(copy.showWhen);
      copy.showWhen = copy.showWhen && !sameGate ? allOf(copy.showWhen, trigger) : trigger;
      copy.skipCode = NS;
    }
    return copy;
  });

  // A condition may only read earlier questions. Move an optional item to just after the last
  // question it reads, within its own step.
  for (let pass = 0; pass < out.length; pass += 1) {
    let moved = false;
    for (let i = 0; i < out.length; i += 1) {
      const q = out[i]!;
      const refs = Array.from(conditionRefs(q.showWhen));
      let last = -1;
      for (const ref of refs) {
        const at = out.findIndex((x) => x.code === ref);
        if (at > last) last = at;
      }
      if (last > i && out[last]!.stepId === q.stepId) {
        out.splice(i, 1);
        out.splice(last, 0, q);
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  return out;
}

// ---- build -----------------------------------------------------------------------------------

/** Fix up v1 questions that need a skip code so every hidden question stores a value. */
function carryOver(q: QuestionDef): QuestionDef {
  const copy: QuestionDef = structuredClone(q);
  if (copy.code === 'F8') copy.options = copy.options?.filter((o) => o.id !== 'closure');
  if (copy.code === 'O1') {
    copy.categories = [
      ...(copy.categories ?? []),
      ...O1_V2_EXTRA_CATEGORIES.map((c) => ({ id: c.id, label: c.label, items: [...c.items] })),
    ];
  }
  if (copy.showWhen && copy.skipCode === undefined) copy.skipCode = NS;
  if (copy.code === 'H3') delete copy.skipCodeWhen;
  return copy;
}

function build(): Instrument {
  const base = structuredClone(DEFAULT_INSTRUMENT);

  const questions: QuestionDef[] = [];
  // Street and event closure permits (step 9) are not asked in v2. The topic lives in O1 only.
  base.steps = base.steps.filter((step) => step.id !== 's9');
  base.questions = base.questions.filter((q) => q.stepId !== 's9' && q.code !== 'F2');
  const stepOrder = base.steps.map((s) => s.id);
  // New steps sit between the homeowner/tenant step and the accessibility step.
  const at = stepOrder.indexOf('s12');
  const order = [...stepOrder.slice(0, at), 's14', 's15', 's16', 's17', 's18', ...stepOrder.slice(at)];

  const steps: StepDef[] = order.map((id) => newSteps[id] ?? base.steps.find((s) => s.id === id)!);

  // A7 and A8 are feature flagged in v1; both are carried over as they are.
  for (const q of base.questions) {
    questions.push(carryOver(q));
    if (q.code === 'AC1_other') questions.push(...additions.s1!);
  }
  const insertAfter: Record<string, string> = {
    s4: 'B9',
    s5: 'F5',
    s7: 'S3',
    s8: 'P5',
    s10: 'R3',
    s11: 'T4',
    s12: 'AC4',
  };
  for (const [stepId, afterCode] of Object.entries(insertAfter)) {
    const index = questions.findIndex((q) => q.code === afterCode);
    questions.splice(index + 1, 0, ...additions[stepId]!);
  }
  for (const stepId of ['s14', 's15', 's16', 's17', 's18']) questions.push(...additions[stepId]!);

  const instrument: Instrument = {
    version: 'v2',
    status: 'draft',
    title: 'Resident Needs Assessment (draft v2)',
    steps,
    questions: applyDefaultAndOptional(questions),
    baseVersion: base.version,
  };
  return sortQuestionsByStep(instrument);
}

export const DRAFT_INSTRUMENT_V2: Instrument = build();
export const DRAFT_VERSION = 'v2';

// ---- analysis notes that travel with the draft ------------------------------------------------

/**
 * Statements where a higher score is the less favorable answer. Flip these before combining them
 * with positively worded items. All but R9 are carried over from v1 unchanged. R9 is a preference
 * for in-person ID checks, so it runs against online adoption.
 */
export const REVERSE_CODED: readonly string[] = [
  'B8',
  'S1',
  'S2',
  'P2',
  'P3',
  'P5',
  'H2',
  'T3',
  'AC2',
  'R9',
];

/** Written in the plan but not built, and why. */
export const BLOCKED_ITEMS: ReadonlyArray<{ code: string; reason: string }> = [
  {
    code: 'HR5',
    reason: 'Three scenario knowledge checks must be written from the actual house rules document, which has not been supplied.',
  },
  {
    code: 'CH9b',
    reason: 'Needs a real announcement posted in the past month, confirmed by a proponent who lives in the subdivision.',
  },
];

/** Items from docs/draft-likert-items.md that were merged away or dropped, and why. */
export const DROPPED_ITEMS: ReadonlyArray<{ code: string; reason: string }> = [
  { code: 'B12', reason: 'Removed as unnecessary. R1 and F4 already cover comfort with uploading an ID photo.' },
  { code: 'B17', reason: 'Removed as unnecessary. Replaced by B18, which asks whether the resident sees important notices.' },
  { code: 'F2', reason: 'Removed with the closure permit topic. F2 was a core code. The dashboard now skips it when absent, and the v2 lint list retires it.' },
  { code: 'C1 to C14 (step 9)', reason: 'Street and event closure permits are not asked as a step. The topic is covered only by the new closure category in O1. The F8 choice for closure permits is removed too.' },
  { code: 'H5', reason: 'Same construct as HR1 and HR2 (knowing the rules).' },
  { code: 'T5', reason: 'Same construct as TO1 to TO4 (orientation).' },
  { code: 'T7', reason: 'Covered by the shared mirror statement on forms and permits for a rented unit (TO15, OM5).' },
  { code: 'T8', reason: 'Covered by the shared mirror statements on reaching each other and on signatures (TO13, TO16).' },
  { code: 'T9', reason: 'Covered by the shared mirror statements on equal treatment (TO18, TO19).' },
  { code: 'H12', reason: 'Duplicates the resolved and satisfied follow-ups in CC.' },
  { code: 'R10', reason: 'Duplicates R2 (trust that only authorized people see the ID) and has no distinct feature.' },
  { code: 'R11', reason: 'No concrete feature yet. Revisit if a data deletion request feature is adopted.' },
  { code: 'AC12', reason: 'No concrete feature; covered by AC3 and AC7 to AC9.' },
  { code: 'F13 (recommend)', reason: 'Recommendation intent does not lead to a feature. The F13 code is reused for phone reminders.' },
];
