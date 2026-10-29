/**
 * Demo data for the analytics walkthrough. NOT real resident data.
 *
 *   node scripts/seed-demo-data.mjs --dry            print a summary, write nothing
 *   node scripts/seed-demo-data.mjs --dry --out f    also dump the generated docs to f (JSON)
 *   node scripts/seed-demo-data.mjs                  write to the Firestore project in .env.local
 *   node scripts/seed-demo-data.mjs --clear          delete everything this script wrote (admin sign-in)
 *
 * Every document carries `demoSeed: true`, so --clear (or a Firestore Console query) finds exactly
 * these and nothing a resident submitted. Ids are deterministic: running the seed twice does not
 * duplicate anything, the second run reports the docs as already present.
 *
 * --clear needs an active proponent/superadmin account (rules gate deletes):
 *   DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD=... node scripts/seed-demo-data.mjs --clear
 *
 * Answers follow survey/schema.ts (instrument v1). Interview invites live in their own collection
 * and are not linked to a response, matching the app's privacy rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { O1_CATEGORIES } from '../survey/o1.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const CLEAR = args.includes('--clear');
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

// ---- config ----------------------------------------------------------------

const START_DATE = '2026-10-05'; // Monday
const TZ = '+08:00'; // Manila
const INSTRUMENT_VERSION = 'v1';
const EMAIL_DOMAIN = 'example.com'; // reserved domain: no real person can own these addresses

/** phase: [total responses, tenants (A1 = 5 or 6), interview "yes" count] */
const PLAN = {
  'Phase 1': [22, 4, 4],
  'Phase 2': [20, 5, 3],
  'Phase 3': [18, 8, 5],
  'Phase 4 Heights': [19, 2, 2],
  'Phase 5 Highlands': [16, 2, 3],
  'Phase 6 Eastgrove': [17, 3, 2],
};

// ---- seeded random ---------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261005);
const chance = (p) => rnd() < p;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 0.58; // ~N(0,1)
function weighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}
function uuid(prefix) {
  const hex = () => Math.floor(rnd() * 16).toString(16);
  const chunk = (n) => Array.from({ length: n }, hex).join('');
  return `${prefix}${chunk(8)}-${chunk(4)}-4${chunk(3)}-${'89ab'[Math.floor(rnd() * 4)]}${chunk(3)}-${chunk(12)}`;
}

// ---- dates -----------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
};
const weekdayIdx = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const nowMs = Date.now();
const manilaNow = new Date(nowMs + 8 * 3600 * 1000);
const TODAY = toIso(manilaNow);
const manilaHourNow = manilaNow.getUTCHours();

/** Launch spike, steady trickle, weekend bumps; today only counts once it is past 8 AM in Manila. */
function submissionDays() {
  const days = [];
  for (let d = START_DATE; d <= TODAY; d = addDays(d, 1)) days.push(d);
  const launchCurve = [10, 9, 8, 7, 6, 5.5, 5, 4.5, 4, 3.5, 3.2, 3, 2.8, 2.6, 2.4];
  return days.map((d, i) => {
    let w = launchCurve[Math.min(i, launchCurve.length - 1)];
    const wd = weekdayIdx(d);
    if (wd === 6 || wd === 0) w *= 1.5;
    if (d === TODAY) w = manilaHourNow >= 9 ? w * 0.5 : 0;
    return [d, w];
  });
}
const DAY_WEIGHTS = submissionDays();

/** Hour a resident filled the form in: lunch and after-work peaks. */
function submitClock(iso) {
  const maxHour = iso === TODAY ? Math.max(7, manilaHourNow - 1) : 23;
  let hour;
  do {
    hour = weighted([
      [7, 2], [8, 3], [9, 3], [10, 3], [11, 3], [12, 5], [13, 4], [14, 3], [15, 3],
      [16, 3], [17, 4], [18, 7], [19, 9], [20, 9], [21, 7], [22, 3],
    ]);
  } while (hour > maxHour);
  return { hour, minute: between(0, 59), second: between(0, 59) };
}
const stampMs = (iso, { hour, minute, second = 0 }) =>
  new Date(`${iso}T${pad(hour)}:${pad(minute)}:${pad(second)}${TZ}`).getTime();

// ---- answer vocabulary -----------------------------------------------------

const AC1_OPTIONS = [
  'difficulty_walking_climbing', 'uses_wheelchair_or_aid', 'difficulty_seeing',
  'difficulty_hearing', 'difficulty_reading_forms',
];

const F10_TEXT = [
  'A way to book the clubhouse or court without going to the office.',
  'Reminders about water interruptions and garbage pickup schedule.',
  'Option to report a broken street light with a photo.',
  'Maybe a map of the subdivision and contact numbers of the guards.',
  'Updated list of authorized contractors for renovations.',
  'Sana may Filipino version din para sa mga matatanda.',
  'Vehicle sticker renewal online, pagod na pumila sa office.',
  'Online voting for the HOA board elections.',
  'Announcements from the board so we do not rely on the group chat only.',
];
const H4_TEXT = [
  'Renovation permit for the carport took almost three weeks because of back and forth on the requirements.',
  'Vehicle sticker renewal, the office was closed on the day I could go and I had to return.',
  'Clearance for selling the lot. Needed several signatures from different people.',
  'Tenant registration. They asked for documents twice.',
  'Fence repair approval. Nobody could tell me who to follow up with.',
  'Getting the gate pass for the movers on the day we moved in.',
  'Clearance for the loan application, long wait because the officer was out.',
];
const T4_TEXT = [
  'Needing the owner to sign and send documents. The owner lives abroad so it was slow.',
  'Move-in clearance, they asked for a lot of requirements we did not know about.',
  'Vehicle sticker, because the owner had to be present or give an authorization letter.',
  'Visitor passes for relatives who stayed with us for a week.',
  'Registering as tenants. The forms were not clear about what the landlord should provide.',
  'Hard to reach the office during working hours, I only go on weekends.',
];
const O2_TEXT = [
  'Hard to know who to call when the streetlight on our block is out.',
  'Announcements are posted at the gate only. Many residents never see them.',
  'The guard house phone is always busy during the evening.',
  'Office hours do not match when working people are free.',
  'I would like a clear schedule of the HOA meetings.',
  'Complaints are noted but no update afterwards.',
  'Some staff are very helpful, but the process itself is confusing.',
];
const O3_TEXT = [
  'Flooding on our street every time there is a heavy rain.',
  'Tricycles and motorcycles speed inside the subdivision, dangerous for children.',
  'Stray dogs in the evening near the park.',
  'Late-night videoke on weekends.',
  'Garbage trucks skip our block during the rainy season.',
  'Not enough lights near the back road and the basketball court.',
  'Water pressure is weak in the evenings.',
  'Trees near the electric posts need trimming.',
  'Parking on both sides of the road makes it hard for the ambulance or fire truck to pass.',
  'Walang tamang tapunan ng basura sa may bakanteng lote.',
];

const maybeText = (pool, p) => (chance(p) ? pick(pool) : undefined);

// ---- one respondent --------------------------------------------------------

function buildAnswers(phase, role) {
  const a = { A1: role, A2: phase };
  const tenant = role === 5 || role === 6;
  const homeowner = !tenant;

  // Age drives how digital the household is; tenants skew a little younger.
  const age = weighted([
    ['18-24', tenant ? 8 : 3], ['25-34', tenant ? 30 : 18], ['35-44', 26], ['45-54', tenant ? 17 : 24],
    ['55-64', tenant ? 12 : 17], ['65+', tenant ? 4 : 10],
  ]);
  const ageIdx = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].indexOf(age);
  const digital = clamp(0.9 - ageIdx * 0.1 + gauss() * 0.14, 0.02, 1);
  // General appetite for an online HOA service, a little noisy per person.
  const interest = clamp(0.3 + digital * 0.5 + gauss() * 0.12, 0, 1);

  a.A3 = role === 2 || role === 3
    ? weighted([['No one lives in the unit right now', 5], ['1', 2], ['2', 2], ['3', 1]])
    : weighted([['1', 6], ['2', 20], ['3', 24], ['4', 26], ['5', 15], ['6+', 9]]);

  const pwdP = age === '65+' ? 0.3 : age === '55-64' ? 0.17 : 0.06;
  a.A4 = weighted([['yes', pwdP * 100], ['no', (1 - pwdP) * 93], ['prefer_not_to_say', 4]]);
  if (a.A4 === 'yes') {
    const picks = sample(AC1_OPTIONS, between(1, 2));
    if (chance(0.15)) picks.push('other');
    a.AC1 = picks;
    if (picks.includes('other')) a.AC1_other = pick(['Chronic back pain', 'Uses a cane after surgery', 'Low vision in one eye']);
  }
  a.A5 = chance(tenant ? 0.12 : 0.34) ? 'yes' : 'no';

  a.A6 = age;
  a.A7 = weighted([['female', 54], ['male', 43], ['prefer_not_to_say', 3]]);
  a.A8 = age === '18-24' ? weighted([['single', 70], ['living_with_partner', 20], ['married', 10]])
    : age === '65+' ? weighted([['married', 55], ['widowed', 33], ['separated', 7], ['single', 5]])
    : weighted([['married', 52], ['single', 24], ['living_with_partner', 14], ['separated', 6], ['widowed', 2], ['prefer_not_to_say', 2]]);
  a.A10 = tenant
    ? weighted([['i_do', 48], ['household_member', 17], ['owner_or_landlord', 28], ['it_varies', 7]])
    : role === 2 || role === 3
      ? weighted([['household_member', 28], ['caregiver_or_rep', 35], ['i_do', 24], ['it_varies', 13]])
      : weighted([['i_do', 62], ['household_member', 24], ['caregiver_or_rep', 4], ['it_varies', 10]]);
  a.A11 = digital > 0.6
    ? weighted([['facebook', 32], ['email_or_website', 15], ['walk_in', 22], ['phone', 12], ['through_neighbor_or_officer', 9], ['no_transaction_yet', 10]])
    : weighted([['walk_in', 40], ['phone', 18], ['through_neighbor_or_officer', 18], ['facebook', 10], ['no_transaction_yet', 14]]);

  // Digital access
  const noDevice = digital < 0.12 && chance(0.55);
  if (noDevice) {
    a.B1 = ['none'];
    a.B2 = 99;
  } else {
    const devices = [];
    if (chance(0.55 + digital * 0.42)) devices.push('smartphone');
    if (chance(0.1 + digital * 0.5)) devices.push('laptop_desktop');
    if (chance(0.06 + digital * 0.2)) devices.push('tablet');
    if (chance(0.12)) devices.push('shared_device');
    if (devices.length === 0) devices.push('smartphone');
    a.B1 = devices;
    a.B2 = !devices.includes('smartphone')
      ? 'no_smartphone'
      : weighted([['android', 66], ['ios', 31], ['other', 3]]);
  }
  a.B3 = noDevice && chance(0.6) ? 'no_regular_internet'
    : digital > 0.55 ? weighted([['wifi_broadband', 38], ['both', 28], ['prepaid_mobile', 24], ['postpaid_mobile', 10]])
    : weighted([['prepaid_mobile', 52], ['wifi_broadband', 18], ['both', 8], ['no_regular_internet', 14], ['postpaid_mobile', 8]]);
  a.B4 = a.B3 === 'no_regular_internet' ? weighted([['rarely_or_never', 70], ['about_once_a_week_or_less', 30]])
    : digital > 0.7 ? weighted([['several_times_a_day', 78], ['about_once_a_day', 18], ['few_times_a_week', 4]])
    : digital > 0.4 ? weighted([['several_times_a_day', 42], ['about_once_a_day', 32], ['few_times_a_week', 22], ['about_once_a_week_or_less', 4]])
    : weighted([['about_once_a_day', 16], ['few_times_a_week', 32], ['about_once_a_week_or_less', 28], ['rarely_or_never', 24]]);
  a.B5 = digital > 0.7 ? weighted([['weekly_or_more', 52], ['few_times_a_month', 36], ['few_times_a_year', 10], ['never', 2]])
    : digital > 0.4 ? weighted([['weekly_or_more', 18], ['few_times_a_month', 38], ['few_times_a_year', 30], ['never', 14]])
    : weighted([['weekly_or_more', 3], ['few_times_a_month', 12], ['few_times_a_year', 30], ['never', 55]]);
  a.B6 = a.B3 === 'no_regular_internet' ? weighted([['none', 60], ['under_100', 25], ['not_sure', 15]])
    : a.B3 === 'wifi_broadband' ? weighted([['1000_1999', 40], ['500_999', 24], ['2000_plus', 14], ['300_499', 8], ['not_sure', 14]])
    : a.B3 === 'both' ? weighted([['1000_1999', 36], ['500_999', 28], ['2000_plus', 18], ['300_499', 10], ['not_sure', 8]])
    : a.B3 === 'postpaid_mobile' ? weighted([['500_999', 44], ['1000_1999', 36], ['300_499', 12], ['not_sure', 8]])
    : weighted([['100_299', 38], ['300_499', 28], ['under_100', 16], ['500_999', 10], ['not_sure', 8]]);
  const agreeFrom = (center, spread = 0.9) => clamp(Math.round(center + gauss() * spread), 1, 5);
  a.B7 = a.B3 === 'no_regular_internet' && chance(0.5) ? 'not_applicable' : agreeFrom(1.8 + digital * 3);
  if (noDevice) {
    a.B8 = 'not_shown';
    a.B9 = 'not_shown';
  } else {
    a.B8 = agreeFrom(4.1 - digital * 1.6);
    a.B9 = agreeFrom(1.9 + digital * 2.4);
  }

  // Feature interest (likelihood). Visitor pre-registration is popular, ID upload is the hesitation.
  const likely = (offset) => clamp(Math.round(1 + 4 * clamp(interest + offset + gauss() * 0.13, 0, 1)), 1, 5);
  a.F1 = likely(0.1);
  a.F2 = likely(0);
  if ([1, 2, 3].includes(a.A1)) a.F3 = likely(0.02);
  a.F4 = likely(-0.14);
  a.F5 = likely(0.06);
  a.F6 = likely(a.A4 === 'yes' ? 0.15 : -0.12);
  a.F7 = clamp(Math.round(2 + interest * 3 + gauss() * 0.7), 1, 5);

  const lowInterest = interest < 0.22;
  a.F8 = lowInterest && chance(0.5)
    ? ['none_of_these']
    : sample(['pre_registration', 'closure', 'forms', 'registration', 'requests', 'accessible'].filter(
        (o) => o !== 'accessible' || a.A4 === 'yes' || chance(0.1)), between(1, 3));
  const barrierP = (p) => chance(clamp(p, 0, 0.95));
  const barriers = [];
  if (barrierP(0.55 - digital * 0.5)) barriers.push('no_reliable_internet');
  if (barrierP(0.62 - digital * 0.55)) barriers.push('not_sure_how');
  if (barrierP(0.22 + (1 - digital) * 0.1)) barriers.push('data_worry');
  if (barrierP(0.3 + (1 - digital) * 0.35)) barriers.push('prefer_office');
  if (barrierP(0.4 - digital * 0.4)) barriers.push('no_device');
  if (chance(0.04)) barriers.push('other');
  a.F9 = barriers.length ? barriers : ['nothing_would_stop_me'];
  const f10 = maybeText(F10_TEXT, 0.28);
  if (f10) a.F10 = f10;

  // Current access to the HOA
  a.S1 = chance(0.04) ? 'not_applicable' : agreeFrom(3.2 + (tenant ? 0.2 : 0) + (a.A10 === 'i_do' ? 0.2 : 0));
  a.S2 = chance(0.04) ? 'not_applicable' : agreeFrom(3.4);
  a.S3 = chance(0.05) ? 'not_applicable' : agreeFrom(2.9);

  // Gate permits
  const p1 = [];
  if (chance(0.7)) p1.push('visitors');
  if (chance(0.38)) p1.push('drivers');
  if (chance(0.62)) p1.push('deliveries');
  a.P1 = p1.length ? p1 : ['none_of_these'];
  if (a.P1.includes('none_of_these')) {
    a.P2 = 'not_shown';
    a.P3 = 'not_shown';
  } else {
    a.P2 = chance(0.04) ? 'not_applicable' : agreeFrom(3.3);
    a.P3 = chance(0.04) ? 'not_applicable' : agreeFrom(3.1);
  }
  const waitMinutes = clamp(Math.round(7 + Math.abs(gauss()) * 9 + (chance(0.15) ? between(10, 25) : 0)), 0, 90);
  a.P4 =
    waitMinutes < 5 ? 'under_5' : waitMinutes <= 10 ? '5_10' : waitMinutes <= 15 ? '11_15' : waitMinutes <= 30 ? '16_30' : waitMinutes <= 60 ? '31_60' : 'over_60';
  if (a.A5 === 'yes') a.P5 = agreeFrom(3.4);

  // Street and event closures
  a.C1 = weighted([['neither', 58], ['affected', 30], ['requested', 7], ['both', 5]]);
  const closureAware = a.C1 !== 'neither';
  a.C2 = closureAware ? agreeFrom(2.8) : chance(0.45) ? 'not_applicable' : agreeFrom(2.9);
  a.C3 = closureAware ? agreeFrom(2.7) : chance(0.35) ? 'not_applicable' : agreeFrom(2.9);

  // Registration, ID, privacy
  a.R1 = agreeFrom(2.2 + digital * 2 - 0.1);
  a.R2 = agreeFrom(3.1 + (interest - 0.5));
  a.R3 = weighted([['deleted_after_verification', 52], ['no_preference', 20], ['not_sure', 18], ['kept_while_resident', 10]]);

  // Homeowner or tenant set
  if (homeowner) {
    const h1 = [];
    if (chance(0.42)) h1.push('clearance');
    if (chance(a.A5 === 'yes' ? 0.7 : 0.15)) h1.push('renovation_permit');
    if (chance(0.38)) h1.push('vehicle_sticker');
    if (chance(0.16)) h1.push('tenant_registration');
    if (chance(0.03)) h1.push('other');
    a.H1 = h1.length ? h1 : ['none'];
    a.H2 = chance(0.05) ? 'not_applicable' : agreeFrom(3.1);
    a.H3 = h1.includes('tenant_registration') ? agreeFrom(3) : 'not_shown';
    const h4 = maybeText(H4_TEXT, 0.35);
    if (h4) a.H4 = h4;
  } else {
    const t1 = [];
    if (chance(0.72)) t1.push('tenant_registration');
    if (chance(0.55)) t1.push('move_in_clearance');
    if (chance(0.4)) t1.push('visitor_worker_passes');
    if (chance(0.3)) t1.push('vehicle_sticker');
    if (chance(0.4)) t1.push('owner_docs_needed');
    a.T1 = t1.length ? t1 : ['none'];
    a.T2 = chance(0.05) ? 'not_applicable' : agreeFrom(2.8);
    a.T3 = chance(0.05) ? 'not_applicable' : agreeFrom(3.5);
    const t4 = maybeText(T4_TEXT, 0.45);
    if (t4) a.T4 = t4;
  }

  // Accessibility
  const pwd = a.A4 === 'yes';
  a.AC2 = chance(pwd ? 0.03 : 0.12) ? 'not_applicable' : agreeFrom(pwd ? 3.9 : 2.3);
  a.AC3 = chance(pwd ? 0.03 : 0.2) ? 'not_applicable' : agreeFrom(pwd ? 4.0 : 2.4);
  a.AC4 = pwd
    ? weighted([['the_person_themselves', 36], ['family_member', 40], ['caregiver_or_rep', 20], ['not_applicable', 4]])
    : weighted([['not_applicable', 82], ['family_member', 12], ['the_person_themselves', 6]]);

  // Open problems (O1 holds category ids, O1Details holds the picked sub-choices)
  if (chance(0.14)) {
    a.O1 = ['none_of_these'];
  } else {
    const cats = sample(O1_CATEGORIES, between(1, 4));
    a.O1 = cats.map((c) => c.id);
    a.O1Details = {};
    for (const c of cats) {
      const items = c.items.filter((i) => i !== 'Other');
      const picks = sample(items, between(1, 3));
      a.O1Details[c.id] = picks;
    }
    if (chance(0.06)) {
      a.O1.push('other');
      a.O1_other = pick(['Dust from the unpaved road nearby', 'Poor mobile signal inside the subdivision']);
    }
  }
  const o2 = maybeText(O2_TEXT, 0.34);
  if (o2) a.O2 = o2;
  const o3 = maybeText(O3_TEXT, 0.4);
  if (o3) a.O3 = o3;

  a._digital = digital; // stripped before write
  return a;
}

function roleFor(tenantSlot) {
  if (tenantSlot) return chance(0.72) ? 5 : 6;
  return weighted([[1, 55], [2, 9], [3, 12], [4, 24]]);
}

// ---- generate responses ----------------------------------------------------

const responses = [];
const dayPool = [];
for (const [phase, [total, tenants]] of Object.entries(PLAN)) {
  const roles = shuffle([...Array(tenants).fill(true), ...Array(total - tenants).fill(false)]);
  for (const isTenant of roles) {
    const date = weighted(DAY_WEIGHTS);
    const clock = submitClock(date);
    const answers = buildAnswers(phase, roleFor(isTenant));
    const digital = answers._digital;
    delete answers._digital;
    const hasPhone = answers.B1.includes('smartphone') && !answers.B1.includes('laptop_desktop');
    responses.push({
      phase,
      digital,
      clock,
      doc: {
        responseId: '', // set after ordering
        submittedDate: date,
        status: 'complete',
        lastStepReached: 13,
        deviceClass: hasPhone || answers.B1.includes('none') ? 'phone' : chance(0.55) ? 'computer' : 'phone',
        answers,
        instrumentVersion: INSTRUMENT_VERSION,
        demoSeed: true,
      },
    });
  }
  dayPool.push(phase);
}

// Chronological order so ids and the dashboard's submission numbers line up.
responses.sort((x, y) => stampMs(x.doc.submittedDate, x.clock) - stampMs(y.doc.submittedDate, y.clock));
responses.forEach((r) => {
  r.doc.responseId = uuid('');
});

// ---- interview "yes" -------------------------------------------------------

for (const [phase, [, , yes]] of Object.entries(PLAN)) {
  const inPhase = responses.filter((r) => r.phase === phase);
  // Open-ended, engaged respondents say yes more often.
  const scored = inPhase
    .map((r) => ({ r, s: r.digital * 0.4 + (r.doc.answers.O2 ? 0.35 : 0) + (r.doc.answers.O3 ? 0.2 : 0) + rnd() * 0.5 }))
    .sort((p, q) => q.s - p.s)
    .slice(0, yes);
  const yesSet = new Set(scored.map((x) => x.r));
  for (const r of inPhase) r.doc.answers.IV1 = yesSet.has(r) ? 'yes' : 'no';
}

// ---- interview invitations -------------------------------------------------

const FIRST = [
  'maria', 'jose', 'ana', 'juan', 'liza', 'mark', 'grace', 'carlo', 'joy', 'ramon', 'bea', 'paolo',
  'cathy', 'jerome', 'nina', 'rico', 'tess', 'noel', 'pia', 'ben', 'lyn', 'dante', 'rina', 'arnel',
];
const LAST = [
  'santos', 'reyes', 'cruz', 'bautista', 'garcia', 'mendoza', 'torres', 'ramos', 'aquino', 'dela.cruz',
  'villanueva', 'flores', 'castillo', 'navarro', 'domingo', 'salazar', 'pascual', 'lim', 'tan', 'magno',
];
const usedEmails = new Set();
function fakeEmail() {
  for (;;) {
    const f = pick(FIRST);
    const l = pick(LAST);
    const style = between(0, 3);
    const base = style === 0 ? `${f}.${l}` : style === 1 ? `${f}${l}${between(1, 99)}` : style === 2 ? `${f[0]}${l}${between(80, 99)}` : `${f}_${l}`;
    const email = `${base.replace(/\.+/g, '.')}@${EMAIL_DOMAIN}`;
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }
}

function clockStr(h, m) {
  return `${pad(h)}:${pad(m)}`;
}
const partOfDay = (h) => (h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening');

function pickSlot(format, dateIso) {
  const wd = weekdayIdx(dateIso);
  const weekend = wd === 0 || wd === 6;
  let hour;
  if (format === 'Online') {
    hour = weekend
      ? weighted([[10, 2], [11, 2], [13, 3], [14, 3], [15, 3], [16, 3], [19, 3], [20, 3]])
      : weighted([[12, 2], [13, 1], [19, 8], [20, 9], [21, 5]]);
  } else {
    hour = weekend
      ? weighted([[9, 4], [10, 6], [11, 4], [13, 4], [14, 6], [15, 5], [16, 3]])
      : weighted([[9, 2], [10, 3], [14, 3], [15, 3], [16, 3], [17, 4], [18, 3]]);
  }
  const minute = weighted([[0, 7], [30, 6], [15, 3], [45, 3], [10, 1], [20, 1], [40, 1], [50, 1]]);
  return { hour, minute };
}

const NOTE_TEXT = [
  'Called the number on file, will confirm the schedule by email.',
  'Sent an email with two possible slots, waiting for reply.',
  'Resident asked to move the interview one day later.',
  'Confirmed by email. Reminder to be sent the day before.',
  'No answer on the first attempt, will try again in the evening.',
];

const invites = [];
const yesResponses = shuffle(responses.filter((r) => r.doc.answers.IV1 === 'yes'));
yesResponses.sort((x, y) => stampMs(x.doc.submittedDate, x.clock) - stampMs(y.doc.submittedDate, y.clock));
let inviteNo = 0;
for (const r of yesResponses) {
  inviteNo += 1;
  const format = chance(r.digital > 0.55 ? 0.68 : 0.42) ? 'Online' : 'Face-to-face';
  // The form shows after the survey is submitted, usually within a few minutes.
  const submitMs = stampMs(r.doc.submittedDate, r.clock) + between(2, 8) * 60 * 1000 + between(0, 59) * 1000;
  const submittedIso = new Date(submitMs).toISOString();
  // Earliest pick is tomorrow (the form enforces this). Most pick within two weeks.
  const submittedLocalDate = toIso(new Date(submitMs + 8 * 3600 * 1000));
  const dayOffset = weighted([[1, 3], [2, 5], [3, 6], [4, 6], [5, 6], [6, 5], [7, 6], [8, 4], [9, 3], [10, 3], [12, 2], [14, 2]]);
  const preferredDate = addDays(submittedLocalDate, dayOffset);
  const { hour, minute } = pickSlot(format, preferredDate);
  const ageDays = (nowMs - submitMs) / 86400000;

  // Outreach lags behind recent invites; once the preferred day has passed, most have been handled.
  const contactStatus = ageDays < 2 ? 'not_contacted'
    : preferredDate <= TODAY
      ? weighted([['confirmed', 50], ['pending_confirmation', 18], ['withdrawn', 17], ['not_contacted', 15]])
      : weighted([['not_contacted', 38], ['pending_confirmation', 30], ['confirmed', 24], ['withdrawn', 8]]);
  const inv = {
    email: fakeEmail(),
    interviewFormat: format,
    preferredDate,
    preferredClock: clockStr(hour, minute),
    preferredDays: [WEEKDAYS[weekdayIdx(preferredDate)]],
    preferredTime: partOfDay(hour),
    submittedAt: Timestamp.fromMillis(submitMs),
    contactStatus,
    demoSeed: true,
  };
  if (contactStatus === 'confirmed') {
    const lo = submitMs + 6 * 3600 * 1000;
    const hi = Math.min(nowMs - 30 * 60 * 1000, submitMs + 3 * 86400000);
    inv.confirmedDateTime = new Date(lo + rnd() * Math.max(0, hi - lo)).toISOString();
  }
  if (contactStatus !== 'not_contacted') {
    const atMs = inv.confirmedDateTime ? Date.parse(inv.confirmedDateTime) : submitMs + between(4, 30) * 3600 * 1000;
    if (atMs < nowMs) {
      inv.notes = [{
        id: uuid('n-'),
        text: contactStatus === 'confirmed' ? NOTE_TEXT[3]
          : contactStatus === 'withdrawn' ? 'Resident replied that they can no longer join.'
          : pick([NOTE_TEXT[0], NOTE_TEXT[1], NOTE_TEXT[2], NOTE_TEXT[4]]),
        at: new Date(atMs).toISOString(),
        byUid: 'demo-seed',
        byName: 'Team',
      }];
    }
  }
  invites.push({ id: `demo-invite-${pad(inviteNo)}`, doc: inv, submitMs });
}
invites.sort((x, y) => x.submitMs - y.submitMs);

// ---- summary ---------------------------------------------------------------

function summary() {
  const lines = [];
  lines.push(`Responses: ${responses.length}   Invites: ${invites.length}   (window ${START_DATE} to ${TODAY})`);
  lines.push('');
  lines.push('Phase                 total  tenant  PWD  IV1=yes');
  for (const phase of Object.keys(PLAN)) {
    const rs = responses.filter((r) => r.phase === phase);
    const tenants = rs.filter((r) => [5, 6].includes(r.doc.answers.A1)).length;
    const pwd = rs.filter((r) => r.doc.answers.A4 === 'yes').length;
    const yes = rs.filter((r) => r.doc.answers.IV1 === 'yes').length;
    lines.push(`${phase.padEnd(22)}${String(rs.length).padStart(4)}${String(tenants).padStart(8)}${String(pwd).padStart(6)}${String(yes).padStart(8)}`);
  }
  lines.push('');
  lines.push('Responses per day:');
  const perDay = {};
  for (const r of responses) perDay[r.doc.submittedDate] = (perDay[r.doc.submittedDate] || 0) + 1;
  for (const d of Object.keys(perDay).sort()) lines.push(`  ${d} ${WEEKDAYS[weekdayIdx(d)].slice(0, 3)}  ${'#'.repeat(perDay[d])} ${perDay[d]}`);
  lines.push('');
  const fmt = (f) => invites.filter((i) => i.doc.interviewFormat === f).length;
  lines.push(`Invites: Online ${fmt('Online')}, Face-to-face ${fmt('Face-to-face')}`);
  const st = {};
  for (const i of invites) st[i.doc.contactStatus] = (st[i.doc.contactStatus] || 0) + 1;
  lines.push(`Status: ${JSON.stringify(st)}`);
  lines.push('');
  lines.push('Invite schedule (submitted -> preferred):');
  for (const i of invites) {
    const s = new Date(i.submitMs + 8 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
    lines.push(`  ${s}  ->  ${i.doc.preferredDate} ${WEEKDAYS[weekdayIdx(i.doc.preferredDate)].slice(0, 3)} ${i.doc.preferredClock}  ${i.doc.interviewFormat.padEnd(12)} ${i.doc.contactStatus}`);
  }
  return lines.join('\n');
}

// ---- firebase --------------------------------------------------------------

function loadEnv() {
  const file = path.join(ROOT, '.env.local');
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.includes('=') || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

function connect() {
  const env = loadEnv();
  const app = initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return { app, db: getFirestore(app), projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
}

async function writeAll() {
  const { db, projectId } = connect();
  console.log(`Writing to Firestore project "${projectId}"...`);
  let ok = 0;
  let existing = 0;
  const failures = [];
  const put = async (col, id, data) => {
    try {
      await setDoc(doc(db, col, id), data);
      ok += 1;
    } catch (e) {
      // A doc that already exists needs an admin update, which an anonymous run is not allowed to do.
      if (e.code === 'permission-denied') existing += 1;
      else failures.push(`${col}/${id}: ${e.code || e.message}`);
    }
  };
  for (const r of responses) await put('needsAssessmentResponses', r.doc.responseId, r.doc);
  for (const i of invites) await put('interviewInterest', i.id, i.doc);
  console.log(`Written ${ok}, already present or blocked ${existing}, failed ${failures.length}.`);
  failures.slice(0, 10).forEach((f) => console.log('  ' + f));
  if (existing > 0 && ok === 0) {
    console.log('Nothing new written. Either the demo data is already there, or the survey window is closed (Survey control).');
  }
  process.exit(failures.length ? 1 : 0);
}

async function clearAll() {
  const email = process.env.DEMO_ADMIN_EMAIL;
  const password = process.env.DEMO_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD (an active proponent or superadmin) to use --clear.');
    process.exit(1);
  }
  const { app, db, projectId } = connect();
  await signInWithEmailAndPassword(getAuth(app), email, password);
  console.log(`Clearing demo docs in "${projectId}"...`);
  for (const col of ['needsAssessmentResponses', 'interviewInterest']) {
    const snap = await getDocs(query(collection(db, col), where('demoSeed', '==', true)));
    for (const d of snap.docs) await deleteDoc(d.ref);
    console.log(`  ${col}: deleted ${snap.size}`);
  }
  process.exit(0);
}

// ---- main ------------------------------------------------------------------

if (CLEAR) {
  await clearAll();
} else {
  console.log(summary());
  if (OUT) {
    const dump = {
      responses: responses.map((r) => r.doc),
      invites: invites.map((i) => ({ id: i.id, ...i.doc, submittedAt: new Date(i.submitMs).toISOString() })),
    };
    fs.writeFileSync(OUT, JSON.stringify(dump, null, 2));
    console.log(`\nDump written to ${OUT}`);
  }
  if (!DRY) {
    console.log('');
    await writeAll();
  }
}
