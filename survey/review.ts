import { isHomeownerBranch, isTenantBranch, showAC1, showDeviceDependentItems, showH3, showP2P3, showP5 } from '@/survey/branching';
import { INCLUDE_SEX_AND_CIVIL_STATUS } from '@/survey/flags';
import { O1_CATEGORIES } from '@/survey/o1';
import type { SurveyAnswers } from '@/survey/schema';

export interface ReviewSection {
  sectionCode: 'A' | 'B' | 'F' | 'S' | 'P' | 'C' | 'R' | 'H' | 'T' | 'AC' | 'O';
  title: string;
  stepNumber: number;
  items: Array<{ code: string; question: string; answer: string }>;
}

const SCORE = ['', 'Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
const LIKELY = ['', 'Very unlikely', 'Unlikely', 'Not sure', 'Likely', 'Very likely'];

function agreement(value: unknown): string {
  return typeof value === 'number' && value >= 1 && value <= 5 ? `${value} — ${SCORE[value]}` : 'Not answered';
}

function likelihood(value: unknown): string {
  return typeof value === 'number' && value >= 1 && value <= 5 ? `${value} — ${LIKELY[value]}` : 'Not answered';
}

function text(value: unknown): string {
  if (value == null || value === '' || value === 'not_shown') return '';
  return String(value);
}

export function buildReviewSections(raw: Partial<SurveyAnswers>): ReviewSection[] {
  const a = raw;
  const sections: ReviewSection[] = [];

  const profile: ReviewSection['items'] = [
    row('A1', 'Which best describes you?', resident(a.A1)),
    row('A2', 'Which phase do you live in?', text(a.A2)),
    row('A3', 'How many people live in the unit?', text(a.A3)),
    row('A4', 'Do you or another member of your household have a disability or mobility limitation?', yesNo(a.A4)),
  ];
  if (showAC1(a)) {
    profile.push(row('AC1', 'What kind of difficulty applies?', list(a.AC1)));
    if (a.AC1_other) profile.push(row('AC1_other', 'Other difficulty', a.AC1_other));
  }
  profile.push(
    row('A5', 'Construction, renovation, or repair work with outside workers in the past 12 months?', yesNo(a.A5)),
    row('A6', 'What is your age range?', age(a.A6)),
  );
  if (INCLUDE_SEX_AND_CIVIL_STATUS) {
    profile.push(row('A7', 'Sex', sex(a.A7)), row('A8', 'Civil status', civil(a.A8)));
  }
  profile.push(
    row('A10', 'Who usually handles HOA transactions for your household?', who(a.A10)),
    row('A11', 'Which channel do you mainly use for HOA transactions?', channel(a.A11)),
  );
  sections.push({ sectionCode: 'A', title: 'About you', stepNumber: 1, items: filled(profile) });

  const digital: ReviewSection['items'] = [
    row('B1', 'Which devices do you use regularly?', devices(a.B1)),
  ];
  if (showDeviceDependentItems(a)) {
    digital.push(row('B2', 'What kind of phone do you mainly use?', phone(a.B2)));
  }
  digital.push(
    row('B3', 'How do you mainly get online?', online(a.B3)),
    row('B4', 'How often do you go online?', often(a.B4)),
    row('B5', 'How often do you do transactions online?', habit(a.B5)),
    row('B6', 'About how much do you spend on mobile data or internet each month, in pesos?', pesos(a.B6)),
    row('B7', 'My internet connection is stable enough to finish an online form without interruption.', agreement(a.B7)),
  );
  if (showDeviceDependentItems(a)) {
    digital.push(
      row('B8', 'I avoid installing new apps because of limited phone storage or mobile data.', agreement(a.B8)),
      row('B9', 'I am comfortable opening a website on my phone browser instead of installing an app.', agreement(a.B9)),
    );
  }
  sections.push({ sectionCode: 'B', title: 'Digital access', stepNumber: 3, items: filled(digital) });

  sections.push({
    sectionCode: 'F',
    title: 'Feature interest',
    stepNumber: 5,
    items: filled([
      row('F1', 'Online pre-registration for visitors and workers, with a temporary pass', likelihood(a.F1)),
      row('F2', 'Online request for street or event closure permits', likelihood(a.F2)),
      row('F3', 'Online tenant and owner forms', likelihood(a.F3)),
      row('F4', 'Online registration with a photo of a valid ID', likelihood(a.F4)),
      row('F5', 'Online channel to send requests and track status', likelihood(a.F5)),
      row('F6', 'Website with adjustable text, higher contrast, and screen reader support', likelihood(a.F6)),
      row('F7', 'A website with these features would solve some of the problems I face as a resident.', agreement(a.F7)),
      row('F8', 'Which of these would you want available first?', list(a.F8)),
      row('F9', 'What might keep you from using this website?', list(a.F9)),
      row('F10', 'Another feature or service', text(a.F10)),
    ]),
  });

  sections.push({
    sectionCode: 'S',
    title: 'Current HOA service access',
    stepNumber: 7,
    items: filled([
      row('S1', 'The HOA office hours make it hard for me to do my transactions.', agreement(a.S1)),
      row('S2', 'I have to visit the HOA office in person even for simple matters.', agreement(a.S2)),
      row('S3', 'I receive a response to my concerns within a reasonable time.', agreement(a.S3)),
    ]),
  });

  const permits: ReviewSection['items'] = [row('P1', 'Who did you need to bring through the gate?', list(a.P1))];
  if (showP2P3(a)) {
    permits.push(
      row('P2', 'Waiting at the gate to get a permit or pass takes too long.', agreement(a.P2)),
      row('P3', 'Leaving an ID at the gate is inconvenient.', agreement(a.P3)),
    );
  }
  if (a.P4 != null) permits.push(row('P4', 'Typical wait at the gate, in minutes', String(a.P4)));
  if (showP5(a)) {
    permits.push(row('P5', 'Getting construction or repair workers approved takes too many steps.', agreement(a.P5)));
  }
  sections.push({ sectionCode: 'P', title: 'Entrance, visitor, and worker permits', stepNumber: 8, items: filled(permits) });

  sections.push({
    sectionCode: 'C',
    title: 'Street and event closure permits',
    stepNumber: 9,
    items: filled([
      row('C1', 'In the past 12 months, which describes you?', text(a.C1)),
      row('C2', 'The process of getting a street or event closure permit is clear.', agreement(a.C2)),
      row('C3', 'Notices about street closures and rerouting reach me in time.', agreement(a.C3)),
    ]),
  });

  sections.push({
    sectionCode: 'R',
    title: 'Registration, ID verification, and data privacy',
    stepNumber: 10,
    items: filled([
      row('R1', 'I am comfortable uploading a photo of my valid ID.', agreement(a.R1)),
      row('R2', 'I trust that only authorized HOA personnel would see my ID.', agreement(a.R2)),
      row('R3', 'After my ID has been verified, how long should it be kept?', text(a.R3)),
    ]),
  });

  if (isHomeownerBranch(a)) {
    const home: ReviewSection['items'] = [
      row('H1', 'Which HOA transactions did your household do?', list(a.H1)),
      row('H2', 'Completing HOA clearances, forms, and permits needs more office visits than it should.', agreement(a.H2)),
    ];
    if (showH3(a)) {
      home.push(row('H3', 'Registering or authorizing a tenant with the HOA is easy.', agreement(a.H3)));
    }
    if (a.H4) home.push(row('H4', 'Describe one HOA transaction that took the longest, and why.', a.H4));
    sections.push({ sectionCode: 'H', title: 'Homeowner', stepNumber: 11, items: filled(home) });
  }

  if (isTenantBranch(a)) {
    sections.push({
      sectionCode: 'T',
      title: 'Tenant and lessee',
      stepNumber: 11,
      items: filled([
        row('T1', 'Which HOA requirements did your household deal with as tenants?', list(a.T1)),
        row('T2', "The HOA's forms and requirements for tenants are clear.", agreement(a.T2)),
        row('T3', 'Completing HOA requirements as a tenant takes more steps than it should.', agreement(a.T3)),
        row('T4', 'Which HOA requirement was hardest?', text(a.T4)),
      ]),
    });
  }

  const access: ReviewSection['items'] = [
    row('AC2', 'Going to the HOA office in person is difficult.', agreement(a.AC2)),
    row('AC3', 'Larger text, higher contrast, or screen reader support would help.', agreement(a.AC3)),
    row('AC4', 'Who would use an online service for the household member who needs help?', text(a.AC4)),
  ];
  sections.push({ sectionCode: 'AC', title: 'Accessibility needs', stepNumber: 12, items: filled(access) });

  sections.push({
    sectionCode: 'O',
    title: 'Open problem discovery',
    stepNumber: 13,
    items: filled([
      row('O1', 'Which HOA-related problems have you experienced?', o1Answer(a)),
      row('O2', 'Any other problem with HOA services?', text(a.O2)),
      row('IV1', 'Would you be open to being contacted for a possible follow-up interview?', yesNo(a.IV1)),
    ]),
  });

  return sections.filter((section) => section.items.length > 0);
}

function o1Answer(a: Partial<SurveyAnswers>): string {
  const selected = a.O1 ?? [];
  if (selected.length === 0) return '';
  const parts = selected.map((id) => {
    const category = O1_CATEGORIES.find((item) => item.id === id);
    if (!category) return id === 'none_of_these' ? 'None of these' : id === 'other' ? `Other${a.O1_other ? `: ${a.O1_other}` : ''}` : id;
    const picks = a.O1Details?.[category.id] ?? [];
    const other = a.O1Details?.[`${category.id}_other`];
    const detail = picks
      .map((pick) => (pick === 'Other' && other ? `Other: ${other}` : pick))
      .join('; ');
    return detail ? `${category.label} (${detail})` : category.label;
  });
  return parts.join('; ');
}

function row(code: string, question: string, answer: string) {
  return { code, question, answer };
}

function filled(items: ReviewSection['items']) {
  return items.filter((item) => item.answer !== '' && item.answer !== 'Not answered');
}

function yesNo(value: unknown): string {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  if (value === 'prefer_not_to_say') return 'Prefer not to say';
  return '';
}

function list(value: string[] | undefined): string {
  return value && value.length ? value.join(', ') : '';
}

function resident(value: SurveyAnswers['A1'] | undefined): string {
  const labels = ['', 'Homeowner living in the unit', 'OFW homeowner', 'Absentee homeowner', 'Family or household member of a homeowner', 'Tenant or lessee', 'Family or household member of a tenant or lessee'];
  return value ? labels[value] ?? '' : '';
}

function age(value: SurveyAnswers['A6'] | undefined): string {
  const map: Record<string, string> = {
    '18-24': '18 to 24',
    '25-34': '25 to 34',
    '35-44': '35 to 44',
    '45-54': '45 to 54',
    '55-64': '55 to 64',
    '65+': '65 and above',
    prefer_not_to_say: 'Prefer not to say',
  };
  return value ? map[value] ?? '' : '';
}

function sex(value: SurveyAnswers['A7'] | undefined): string {
  if (value === 'female') return 'Female';
  if (value === 'male') return 'Male';
  if (value === 'prefer_not_to_say') return 'Prefer not to say';
  return '';
}

function civil(value: SurveyAnswers['A8'] | undefined): string {
  const map: Record<string, string> = {
    single: 'Single',
    married: 'Married',
    living_with_partner: 'Living with a partner',
    widowed: 'Widowed',
    separated: 'Separated',
    prefer_not_to_say: 'Prefer not to say',
  };
  return value ? map[value] ?? '' : '';
}

function who(value: SurveyAnswers['A10'] | undefined): string {
  const map: Record<string, string> = {
    i_do: 'I do',
    household_member: 'Another member of my household',
    caregiver_or_rep: 'A caregiver, helper, or representative',
    owner_or_landlord: 'The property owner or landlord',
    it_varies: 'It varies',
  };
  return value ? map[value] ?? '' : '';
}

function channel(value: SurveyAnswers['A11'] | undefined): string {
  const map: Record<string, string> = {
    walk_in: 'Walk in at the HOA office',
    phone: 'Phone call',
    facebook: 'Facebook page or message',
    email_or_website: 'Email or website',
    through_neighbor_or_officer: 'Through a neighbor or HOA officer',
    no_transaction_yet: 'I have not done any HOA transaction',
  };
  return value ? map[value] ?? '' : '';
}

function devices(value: string[] | undefined): string {
  const map: Record<string, string> = {
    smartphone: 'Smartphone',
    laptop_desktop: 'Laptop or desktop computer',
    tablet: 'Tablet',
    shared_device: 'A shared household device',
    none: 'None of these',
  };
  return (value ?? []).map((id) => map[id] ?? id).join(', ');
}

function phone(value: SurveyAnswers['B2'] | undefined): string {
  const map: Record<string, string> = {
    android: 'Android',
    ios: 'iPhone (iOS)',
    other: 'Other',
    no_smartphone: 'I do not use a smartphone',
  };
  if (value == null || value === 99) return '';
  return map[value] ?? '';
}

function online(value: SurveyAnswers['B3'] | undefined): string {
  const map: Record<string, string> = {
    wifi_broadband: 'Wi-Fi or broadband subscription',
    prepaid_mobile: 'Prepaid mobile data (load or promo)',
    postpaid_mobile: 'Postpaid mobile data',
    both: 'Both Wi-Fi and mobile data',
    no_regular_internet: 'I do not have regular internet access',
  };
  return value ? map[value] ?? '' : '';
}

function often(value: SurveyAnswers['B4'] | undefined): string {
  const map: Record<string, string> = {
    several_times_a_day: 'Several times a day',
    about_once_a_day: 'About once a day',
    few_times_a_week: 'A few times a week',
    about_once_a_week_or_less: 'About once a week or less',
    rarely_or_never: 'Rarely or never',
  };
  return value ? map[value] ?? '' : '';
}

function habit(value: SurveyAnswers['B5'] | undefined): string {
  const map: Record<string, string> = {
    weekly_or_more: 'Weekly or more',
    few_times_a_month: 'A few times a month',
    few_times_a_year: 'A few times a year',
    never: 'Never',
  };
  return value ? map[value] ?? '' : '';
}

function pesos(value: SurveyAnswers['B6'] | undefined): string {
  const map: Record<string, string> = {
    none: 'None',
    under_100: 'Under 100',
    '100_299': '100 to 299',
    '300_499': '300 to 499',
    '500_999': '500 to 999',
    '1000_1999': '1,000 to 1,999',
    '2000_plus': '2,000 or more',
    not_sure: 'Not sure',
  };
  return value ? map[value] ?? '' : '';
}
