/** Survey copy and field definitions taken verbatim from the layout export. */

export const SCREENING_FIELDS = [
  {
    id: 'addr_phase',
    label: 'Phase',
    type: 'select' as const,
    options: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'],
    hint: 'Some phases may unlock additional security questions later in the survey, depending on where you live.',
    required: true,
  },
  { id: 'addr_block', label: 'Block', type: 'text' as const, placeholder: 'Optional' },
  { id: 'addr_lot', label: 'Lot', type: 'text' as const, placeholder: 'Optional' },
  {
    id: 'household_size',
    label: 'Household size',
    type: 'select' as const,
    options: ['1', '2', '3', '4', '5', '6 or more'],
    required: true,
  },
  {
    id: 'civil_status',
    label: 'Civil status',
    type: 'select' as const,
    options: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
    required: true,
  },
  {
    id: 'children_yn',
    label: 'Are there any minors (menor de edad) in your household?',
    type: 'radio' as const,
    options: ['Yes', 'No'],
    hint: 'This means any household member under 18 years old.',
    required: true,
  },
  {
    id: 'children_count',
    label: 'Number of children',
    type: 'select' as const,
    options: ['1', '2', '3', '4 or more'],
    required: true,
    when: (s: Record<string, string>) => s.children_yn === 'Yes',
  },
  {
    id: 'pwd_household',
    label: 'Household member has a disability or mobility limitation',
    type: 'radio' as const,
    options: ['Yes', 'No'],
    required: true,
  },
  { id: 'sex', label: 'Sex', type: 'radio' as const, options: ['Female', 'Male'], required: true },
  {
    id: 'age_range',
    label: 'Age range',
    type: 'select' as const,
    options: ['18–25', '26–35', '36–45', '46–55', '56 and above'],
    required: true,
  },
  {
    id: 'pwd_self',
    label: 'Person with disability (PWD)',
    type: 'radio' as const,
    options: ['Yes', 'No'],
    required: true,
  },
  {
    id: 'disability_type',
    label: 'Type of disability',
    type: 'multi' as const,
    wide: true,
    required: true,
    when: (s: Record<string, string>) => s.pwd_self === 'Yes',
    options: [
      'Physical or mobility',
      'Visual',
      'Hearing or communication',
      'Intellectual or developmental',
      'Psychosocial or mental health',
      'Chronic illness affecting mobility',
      'Multiple',
      'Prefer not to say',
    ],
  },
  {
    id: 'resident_type',
    label: 'Resident type',
    type: 'select' as const,
    options: [
      'Homeowner',
      'Renter or lessee',
      'Household member of a homeowner',
      'Live-in household staff',
    ],
    wide: true,
    required: true,
  },
  {
    id: 'primary_channel',
    label: 'Primary channel currently used for HOA transactions',
    type: 'select' as const,
    wide: true,
    required: true,
    options: [
      'In person',
      'Online forms downloaded and printed',
      'Through a household member or representative',
      'Do not currently transact with the HOA',
    ],
  },
] as const;

export const S2_LIKERT = [
  {
    id: 's2_adequacy',
    q: 'How adequate are the current ways you can reach the HOA office when you have a concern or request?',
    sub: 'Think about the ways you can currently contact the Homeowners Association today, such as dropping by the office, calling, or sending a message on Facebook.',
    labels: ['Very inadequate', 'Inadequate', 'Neutral', 'Adequate', 'Very adequate'],
  },
  {
    id: 's2_frequency',
    q: "How often have you had to wait several days before your request or form got processed because of the HOA office's limited hours?",
    sub: 'The HOA office is currently open Monday to Saturday, 8:00 AM to 5:00 PM only. This asks how often that schedule has made you wait longer than you expected.',
    labels: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'],
  },
  {
    id: 's2_satisfaction',
    q: 'How satisfied are you with how the HOA currently handles your requests, such as document requests or reports?',
    sub: "This includes anything you've submitted in person, by phone, or through Facebook, whether it was a form, a complaint, or a general concern.",
    labels: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'],
  },
  {
    id: 's2_effectiveness',
    q: "How effective is the HOA's Facebook page in keeping you updated about important announcements?",
    sub: 'This is about the personal Facebook profile the HOA currently uses to post updates and receive messages, not a mobile app or a website.',
    labels: [
      'Not effective at all',
      'Slightly effective',
      'Moderately effective',
      'Very effective',
      'Extremely effective',
    ],
  },
  {
    id: 's2_agreement',
    q: 'I would prefer to submit HOA forms and requests through my phone or computer instead of printing and dropping them off in person.',
    sub: 'This means filling out a form on a screen and sending it electronically, without needing to print it out or travel to the office.',
    labels: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  },
] as const;

export const S2_FIELDS = [
  {
    id: 's2_printer_access',
    label: 'How do you currently produce a physical copy of a downloaded HOA form?',
    type: 'select' as const,
    wide: true,
    options: [
      'I print it at home',
      'I print it at a computer shop or printing service',
      'A household member or neighbour prints it for me',
      'I ask for a printed copy at the HOA office',
      'I do not download forms at all',
    ],
  },
  {
    id: 's2_delay_days',
    label: 'On average, how many days pass between downloading a form and submitting it?',
    type: 'number' as const,
    placeholder: 'Number of days',
  },
  {
    id: 's2_abandonment',
    label:
      'Has submitting forms in person ever made you delay or give up on a request, or on updating your 201 file?',
    type: 'radio' as const,
    options: ['Yes', 'No'],
  },
] as const;

/** Average seconds to read and answer one item, including subtext. */
export const SECONDS_PER_ITEM = 15;

/** Rounded minutes for a section's items (minimum 1). */
export function estimateMinutes(itemCount: number): number {
  return Math.max(1, Math.round((itemCount * SECONDS_PER_ITEM) / 60));
}

export const SECTIONS = [
  {
    id: 'screening',
    n: '1',
    t: 'Screening',
    always: true as const,
    itemCount: 14,
    itemCountConfirmed: true,
  },
  {
    id: 's2',
    n: '2',
    t: 'HOA access and office hours',
    always: true as const,
    itemCount: 8,
    itemCountConfirmed: true,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's3a',
    n: '3a',
    t: 'Perimeter and security — base items',
    always: true as const,
    itemCount: 6,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's3b',
    n: '3b',
    t: 'Perimeter and security — extended tier',
    key: 'perimeter' as const,
    why: 'Your phase is perimeter-adjacent.',
    whyNot: 'Your phase is not perimeter-adjacent.',
    itemCount: 4,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's4',
    n: '4',
    t: 'Household and personal safety',
    key: 's4' as const,
    why: 'Opened by your civil status, or by your own opt-in.',
    whyNot: 'Skipped — you declined it, or have not opted in yet.',
    itemCount: 6,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's5',
    n: '5',
    t: 'Children and youth safety',
    key: 's5' as const,
    why: 'You reported children in the household.',
    whyNot: 'No children reported in the household.',
    itemCount: 5,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's6',
    n: '6',
    t: 'Reporting channels',
    always: true as const,
    itemCount: 5,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's7a',
    n: '7a',
    t: 'Accessibility — your own needs',
    key: 's7a' as const,
    why: 'You identified as a person with a disability.',
    whyNot: 'Not applicable from your screening answers.',
    itemCount: 5,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's7b',
    n: '7b',
    t: 'Accessibility — household member',
    key: 's7b' as const,
    why: 'You reported a household member with a disability or mobility limitation.',
    whyNot: 'Not applicable from your screening answers.',
    itemCount: 4,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's7c',
    n: '7c',
    t: 'Accessibility — general',
    always: true as const,
    itemCount: 3,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's8',
    n: '8',
    t: 'Emergency response expectations',
    always: true as const,
    itemCount: 5,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's9',
    n: '9',
    t: 'Technology access and digital literacy',
    always: true as const,
    itemCount: 5,
    itemCountConfirmed: false,
  },
  // TODO: placeholder count, update once this section's items are finalized
  {
    id: 's10',
    n: '10',
    t: 'Final comments',
    always: true as const,
    itemCount: 2,
    itemCountConfirmed: false,
  },
];

export const FAQ = [
  {
    question: 'Who is running this survey?',
    answer:
      "This survey is part of a capstone research project by fourth-year Information Technology students at the University of Batangas, Lipa Campus. We're exploring a possible collaboration with the Camella Homes Tibig Homeowners Association, and this survey is one of the ways we're finding out whether residents here would actually benefit from a system like this.",
  },
  {
    question: 'Do I have to answer every question?',
    answer:
      'No. Every question is optional, and some sections only appear if they apply to your household. You can skip anything you would rather not answer and still submit.',
  },
  {
    question: "Why did I see a question that my neighbor didn't?",
    answer:
      'The survey only shows the sections that apply to you. Your answers about your phase, household, and accessibility needs decide which sections open, so two residents can be asked different things.',
  },
  {
    question: 'Will my answers be kept private?',
    answer:
      'Yes. We never ask for your name, and responses are reported together rather than individually. Nothing you write is shown to the HOA with a household attached to it.',
  },
  {
    question: 'How long will this take?',
    answer:
      'Around 10 to 15 minutes. You can move back to an earlier section and change an answer at any point before you submit.',
  },
  {
    question: 'What happens after I submit the survey?',
    answer:
      "Your answers are combined with everyone else's and compiled into a report for our academic adviser. If the results show this kind of system would genuinely help the community, we plan to bring that report to the Homeowners Association as part of proposing it formally.",
  },
  {
    question: 'Will answering honestly affect my standing with the HOA in any way?',
    answer:
      'No. The HOA does not receive individual responses. Only combined results appear in our report, and honest answers are the only thing that makes that report worth reading.',
  },
  {
    question: "Is this the actual reporting system I'll use later?",
    answer:
      'No. This is only the needs assessment survey. Nothing you submit here reaches security or the HOA office as a report.',
  },
  {
    question: 'Who can I contact if I have questions or concerns about the survey?',
    answer:
      'Use the inquiry form on this page to message the team, or chat with RAGbot for quick survey questions. Direct contact details for our academic adviser are pending and will be added before the survey goes live.',
  },
];

export const STEPS = [
  {
    key: 'screening',
    title: 'About your household',
    intro:
      'These answers decide which sections of the survey you are asked to fill in. Nothing here asks for your name.',
  },
  {
    key: 'plan',
    title: 'Your survey plan',
    intro:
      'Based on what you just told us, here is what the rest of the survey will and will not ask you.',
  },
  {
    key: 's2',
    title: 'Section 2 — HOA access and office hours',
    intro: 'Five scaled items and three short questions about reaching the HOA today.',
  },
  {
    key: 's4',
    title: 'Section 4 — Household and personal safety',
    intro:
      'This section is gated, and every gated section can be declined in full before its questions appear.',
  },
  {
    key: 'review',
    title: 'Review and submit',
    intro: 'Check anything you want to change. You can still go back to an earlier section.',
  },
] as const;
