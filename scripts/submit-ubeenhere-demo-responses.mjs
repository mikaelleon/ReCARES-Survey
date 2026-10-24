#!/usr/bin/env node
/**
 * DEMO DATA ONLY. Submits exactly 40 synthetic responses (28 student, 12 faculty) to the
 * "UBeenHere: Needs Assessment on Classroom Attendance" Google Form so the analytics
 * dashboard has data to show. Delete these rows before real data is collected.
 *
 * Usage:
 *   node scripts/submit-ubeenhere-demo-responses.mjs            # dry run: preview + uniqueness check
 *   node scripts/submit-ubeenhere-demo-responses.mjs --send     # submit (resumes from progress file)
 *   node scripts/submit-ubeenhere-demo-responses.mjs --dump out.json
 *   node scripts/submit-ubeenhere-demo-responses.mjs --send --reset   # forget progress and start over
 *
 * Generation is deterministic (fixed seed), and a progress file in the OS temp dir records
 * how many were accepted, so a rerun after a failure never goes past 40 total.
 * Flags: --send, --seed N, --min-delay ms, --max-delay ms, --dump file, --reset
 */
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FORM_ID = '1FAIpQLSfCmcJ-F4Aq2GWmaR9lxstlHLLs9z1EiXKZWBZb6ilI7TGIxA';
const POST_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
const TOTAL = 40;
const N_STUDENT = 28;
// Page order: 0 consent, 1 profile, 2 student, 3 faculty, 4 open feedback
const PAGES = { student: '0,1,2,4', faculty: '0,1,3,4' };

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const SEND = flag('send');
const SEED = Number(val('seed', 20261020));
const MIN_DELAY = Number(val('min-delay', 2500));
const MAX_DELAY = Number(val('max-delay', 7000));
const DUMP = val('dump', null);
const PROGRESS_FILE = join(tmpdir(), `ubeenhere-demo-progress-${SEED}.txt`);

// ---------- rng ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const chance = (p) => rnd() < p;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) if ((r -= w) <= 0) return v;
  return pairs[0][0];
};
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- entry ids ----------
const E = {
  consent: 222076301, role: 289749328, year: 140885984, program: 1031751836,
  sGrid: [1635593805, 121617650, 584531541, 505008514, 1775382462, 1303147775, 1821050725],
  sMinutes: 1047632927, sProblems: 606618105, sComfort: 758103756, sConcern: 1584013955,
  fGrid: [704255321, 919794137, 1168049934, 1568702210, 1047849104, 2120257026, 1672727752, 891699847],
  fMinutes: 1359323681, fWeekly: 2090332425, fFeatures: 964392647, fExpect: 1231884846,
  feedback: 1352477817,
};
const SCALE = ['1 - Strongly Disagree', '2 - Disagree', '3 - Agree', '4 - Strongly Agree'];
const MINUTES = ['Less than 2', '2-5', '6-10', 'More than 10'];

// ---------- text fragments ----------
const S_COMFORT = [
  'The school should clearly explain that the images are used only for attendance.',
  'Face data should be deleted after the semester ends.',
  'I want a written consent form or notice before the camera goes live.',
  'It should keep encrypted face templates, not actual photos.',
  'Only the class adviser and the registrar should be able to see the records.',
  'There should be a manual option, like an ID or QR scan, for students who do not want their faces scanned.',
  'The camera should only work at the door and not inside the classroom.',
  'Proof that it is accurate even with masks, glasses, or bad lighting.',
  'It has to be approved by the university and follow the Data Privacy Act.',
  'Being able to check my own attendance record and report mistakes right away.',
  'A quick scan that does not create a long line outside the room.',
  'A privacy officer we can contact if something goes wrong.',
  'No video recording, just a quick check-in at the door.',
  'The data should stay on the school server and never be shared with outsiders.',
  'It should be optional during the trial period.',
  'Clear information on who owns the data and how long it is kept.',
  'A confirmation on the screen so I know I was marked present.',
  'If my classmates and I are told how it works before it is used on us.',
];
const S_CONCERN = [
  'My face data might leak if the system gets hacked.',
  'It could misidentify me if I change my hairstyle or wear a mask.',
  'Twins or students who look alike might be mixed up.',
  'A line could form at the door and make us late.',
  'I do not want the camera to stay on and watch us the whole time.',
  'The school might share or sell the data without telling us.',
  'What happens if the internet or power goes out during class?',
  'Some students may not be comfortable but will be forced to use it.',
  'It may not work well for darker skin tones or in dim rooms.',
  'I am worried about being tracked outside of class.',
  'The system might be expensive to maintain for the school.',
  'Mistakes might be hard to fix once the system marks you absent.',
  'Glasses, caps, and face masks could make it fail.',
  'I am not sure who can see my records.',
  'Students without a registered face yet may be marked absent.',
  'I do not really have a big concern, as long as the data is protected.',
];
const F_EXPECT = [
  'I expect it to cut the time I spend on roll call so I can start the lesson sooner.',
  'My main concern is accuracy, especially with students who look alike or change hairstyles.',
  'It should work even when the internet is slow.',
  "Students' biometric data must be protected and deleted after use.",
  'I hope reports can be exported to Excel for the registrar.',
  'I worry about what to do when the camera or system is down during class.',
  'The dashboard should be simple enough for faculty who are not good with technology.',
  'I need to be able to override a wrong record in case of errors.',
  'I expect it to reduce proxy attendance.',
  'Training for faculty should be provided before rollout.',
  "I am concerned about student consent and the university's policy on biometrics.",
  'I expect real-time updates so I can see who is late.',
  'Cost and maintenance of the cameras could be a problem for the department.',
  'It should not slow down the start of class.',
  'I would like it to flag students with repeated absences automatically.',
  'I am hopeful, but I want a pilot run before it is used in all sections.',
];
const FEEDBACK = [
  'Please test it with a small group first before applying it to all classes.',
  'Thank you for working on this, attendance really takes time right now.',
  'Make sure there is a backup like manual encoding in case the system fails.',
  'I hope the system will be mobile friendly.',
  'Add notifications for students who are marked late or absent.',
  'Please consider students who cannot show their faces for religious or health reasons.',
  'Good luck with your capstone!',
  'Keep the interface simple.',
  'Consider adding an option for excused absences with a note from the adviser.',
  'It would be nice if the data could connect with the school grading system.',
  'Make the privacy policy easy to read, not just long legal text.',
  'Please explain the system to everyone before implementing it.',
  'None for now, I will wait for the demo.',
  'Hopefully the school can afford it and maintain it properly.',
  'Maybe add a way to scan multiple students at once during busy hours.',
  'More power to your team!',
];
const OPENERS = ['', '', '', '', 'Honestly, ', 'For me, ', 'Personally, ', 'To be honest, '];
const JOINERS = [' ', ' ', ' ', ' Also, ', ' Plus, ', ' Another thing: '];
const OTHER_PROBLEMS = [
  'Teacher sometimes forgets to take attendance',
  'My name is mispronounced so I am not marked',
  'Attendance sheet passed around is hard to track',
  'Late students are not recorded properly',
  'Seatmate signs for me by mistake',
];
const OTHER_FEATURES = [
  'Email alerts for students with many absences',
  'Monthly attendance summary charts',
  'Link with the grading system',
  'Option to add excused absences with notes',
  'Mobile friendly view',
];
const PROGRAMS_STUDENT = [
  'BSIT', 'BS Information Technology', 'BSCS', 'BS Computer Science', 'BSCpE', 'BS Computer Engineering',
  'BSIS', 'BS Information Systems', 'BSECE', 'BSIT - Web Dev', 'IT', 'Computer Science', 'BSEE',
];
const PROGRAMS_FACULTY = [
  'CITEC', 'IT Department', 'Computer Science Dept.', 'College of Computing', 'Engineering Department',
  'CITEC - IT', 'Information Systems', 'Computer Engineering',
];
const YEAR_STUDENT = ['1st year', '2nd year', '3rd year', '4th year', 'First year', 'Second year', 'Third year', 'Fourth year', '3rd Yr', '2nd year college', 'Year 3', '4th yr'];

// ---------- personas ----------
const STYLES = [['plain', 30], ['formal', 18], ['casual', 28], ['terse', 12], ['verbose', 12]];
function makePersona(role) {
  const style = weighted(STYLES);
  const taglish = role === 'student' ? chance(style === 'formal' ? 0.05 : 0.4) : chance(0.08);
  return {
    role, style, taglish,
    pain: rnd(), // how much current attendance hurts
    privacy: rnd(), // privacy concern
    open: rnd(), // openness to facial recognition
  };
}

// ---------- style transforms ----------
const TYPOS = [
  [/\bbecause\b/i, 'becuase'], [/\bstudents\b/i, 'studens'], [/\battendance\b/i, 'attendence'],
  [/\bdefinitely\b/i, 'definately'], [/\bthe\b/, 'teh'], [/\bwith\b/, 'wiht'], [/\bprivacy\b/i, 'privacey'],
  [/\bsystem\b/i, 'sytem'], [/\bshould\b/i, 'shoud'],
];
const TAGLISH = [
  [/\bsometimes\b/gi, 'minsan'], [/\bbut\b/g, 'pero'], [/\bbecause\b/g, 'kasi'], [/\balso\b/gi, 'din'],
  [/\bvery\b/g, 'sobrang'], [/\bI think\b/g, 'sa tingin ko'], [/\bhopefully\b/gi, 'sana'],
];
const lcFirst = (s) => (/^(I[ ']|[A-Z]{2})/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

function compose(pool, p, { min = 1, max = 2 } = {}) {
  let n = min + Math.floor(rnd() * (max - min + 1));
  if (p.style === 'terse') n = 1;
  if (p.style === 'verbose') n = Math.min(pool.length, max + 1);
  const parts = shuffle(pool).slice(0, n);
  const opener = p.style === 'terse' || p.style === 'formal' ? '' : pick(OPENERS);
  let t = '';
  parts.forEach((s, i) => {
    if (i === 0) t += opener ? opener + lcFirst(s) : s;
    else {
      const j = pick(JOINERS);
      t += j === ' ' ? ` ${s}` : `${j.trimEnd()} ${lcFirst(s)}`;
    }
  });
  return t.replace(/\s+/g, ' ').trim();
}

function styleText(text, p) {
  let t = text;
  if (p.taglish) for (const [re, rep] of TAGLISH) if (chance(0.5)) t = t.replace(re, rep);
  if (p.taglish && chance(0.4)) t += chance(0.5) ? ' po' : ' naman';
  if (p.style === 'casual') {
    if (chance(0.7)) t = t.charAt(0).toLowerCase() + t.slice(1);
    if (chance(0.6)) t = t.replace(/\.$/, '');
    t = t.replace(/\bI am\b/g, chance(0.5) ? "I'm" : 'Im').replace(/\bdo not\b/g, chance(0.5) ? "don't" : 'dont').replace(/\bcannot\b/g, "can't");
    if (chance(0.3)) { const [re, rep] = pick(TYPOS); t = t.replace(re, rep); }
  } else if (p.style === 'formal') {
    t = t.replace(/\bdon't\b/g, 'do not').replace(/\bcan't\b/g, 'cannot').replace(/\bI'm\b/g, 'I am');
  }
  return t;
}

// Per-field uniqueness: retry until this exact string has not been used for that field.
const used = {};
function unique(field, make) {
  used[field] ??= new Set();
  for (let i = 0; i < 300; i++) {
    const t = make();
    const key = t.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!used[field].has(key)) { used[field].add(key); return t; }
  }
  throw new Error(`could not generate a unique answer for ${field}`);
}

// ---------- answer builders ----------
const rate = (base, noise = 0.22) => SCALE[Math.round(clamp(base + (rnd() - 0.5) * 2 * noise) * 3)];

function weeklyTime(pain) {
  const hours = Math.max(1, Math.round(pain * 5 + rnd() * 1.5));
  const mins = pick([20, 30, 40, 45, 50, 60, 90]);
  const opts = [
    `${hours} hours`, `about ${hours} hours`, `${hours} hrs a week`, `roughly ${hours} hrs`,
    `${hours}-${hours + 1} hours`, `around ${mins} minutes`, `${mins} mins`, `${mins} minutes per week`,
    `less than an hour`, `${hours} hour${hours > 1 ? 's' : ''} or so`, `about ${hours}.5 hours`,
    `~${hours} hrs`, `${mins} to ${mins + 30} minutes`,
  ];
  return pain < 0.2 ? pick(['less than an hour', `${mins} mins`, 'about 30 minutes', '20 minutes or less', `${mins} minutes per week`]) : pick(opts);
}

function minutesFor(pain) {
  const x = clamp(pain + (rnd() - 0.5) * 0.35);
  return MINUTES[Math.min(3, Math.floor(x * 4))];
}

function problemsFor(p) {
  const all = ['Wrongly recorded', 'Lost or misplaced sheets', 'Proxy attendance', 'Arguments over attendance', 'Delays in updating records'];
  if (p.pain < 0.18 && chance(0.7)) return { vals: ['None'] };
  const n = Math.max(1, Math.round(p.pain * 3 + rnd() * 1.5));
  const vals = shuffle(all).slice(0, Math.min(5, n));
  if (chance(0.12)) return { vals: [...vals, '__other_option__'], other: unique('sOther', () => pick(OTHER_PROBLEMS)) };
  return { vals };
}

function featuresFor() {
  const all = ['Real-time roster', 'Filter by date or subject', 'Export reports (PDF/Excel)', 'Late/absent flags'];
  const vals = shuffle(all).slice(0, 2 + Math.floor(rnd() * 3));
  if (chance(0.15)) return { vals: [...vals, '__other_option__'], other: unique('fOther', () => pick(OTHER_FEATURES)) };
  return { vals };
}

function generate(role) {
  const p = makePersona(role);
  const a = []; // [entryId, value | string[], otherText?]
  a.push([E.consent, 'I agree to participate']);
  a.push([E.role, role === 'student' ? 'Student' : 'Faculty']);
  if (role === 'student') {
    a.push([E.year, pick(YEAR_STUDENT)]);
    if (chance(0.8)) a.push([E.program, pick(PROGRAMS_STUDENT)]);
    const g = [0.82, p.pain, p.pain * 0.75, p.pain * 0.7, p.open, p.privacy, 0.82];
    E.sGrid.forEach((id, i) => a.push([id, rate(g[i])]));
    a.push([E.sMinutes, minutesFor(p.pain)]);
    if (chance(0.92)) { const r = problemsFor(p); a.push([E.sProblems, r.vals, r.other]); }
    if (chance(0.9)) a.push([E.sComfort, unique('sComfort', () => styleText(compose(S_COMFORT, p, { min: 1, max: 3 }), p))]);
    if (chance(0.9)) a.push([E.sConcern, unique('sConcern', () => styleText(compose(S_CONCERN, p, { min: 1, max: 3 }), p))]);
  } else {
    a.push([E.year, pick(['1 year', '2 years', '3 years', '4 years', '5 years', '6 yrs', '8 years', '10 years', '12 years', '15 years', 'Less than a year', '7 years', '20 yrs'])]);
    if (chance(0.85)) a.push([E.program, pick(PROGRAMS_FACULTY)]);
    const g = [0.82, p.pain, p.pain * 0.7, p.pain * 0.7, p.pain, 0.5 + p.open * 0.4, p.open * 0.8, p.privacy];
    E.fGrid.forEach((id, i) => a.push([id, rate(g[i])]));
    a.push([E.fMinutes, minutesFor(p.pain)]);
    if (chance(0.9)) a.push([E.fWeekly, unique('fWeekly', () => weeklyTime(p.pain))]);
    if (chance(0.92)) { const r = featuresFor(); a.push([E.fFeatures, r.vals, r.other]); }
    if (chance(0.92)) a.push([E.fExpect, unique('fExpect', () => styleText(compose(F_EXPECT, p, { min: 1, max: 3 }), p))]);
  }
  if (chance(0.55)) a.push([E.feedback, unique('feedback', () => styleText(compose(FEEDBACK, p, { min: 1, max: 2 }), p))]);
  return { persona: p, answers: a };
}

// ---------- build all 40 ----------
const roles = shuffle([...Array(N_STUDENT).fill('student'), ...Array(TOTAL - N_STUDENT).fill('faculty')]);
const responses = roles.map(generate);

// whole-response uniqueness check
const sigs = new Set(responses.map((r) => JSON.stringify(r.answers)));
if (sigs.size !== TOTAL) { console.error('duplicate full responses generated'); process.exit(1); }

function toBody(r) {
  const body = new URLSearchParams();
  for (const [id, v, other] of r.answers) {
    if (Array.isArray(v)) {
      for (const x of v) body.append(`entry.${id}`, x);
      if (other) body.append(`entry.${id}.other_option_response`, other);
    } else body.append(`entry.${id}`, v);
  }
  body.append('pageHistory', PAGES[r.persona.role]);
  body.append('fvv', '1');
  body.append('fbzx', String(Math.floor(rnd() * 2 ** 53)));
  return body;
}

async function submit(r) {
  const res = await fetch(POST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    body: toBody(r).toString(),
  });
  const html = await res.text();
  const ok = res.status === 200 && /Thank you for your response|response has been recorded|Submit another response|Magsumite ng iba pang tugon/i.test(html);
  if (!ok && process.env.DEBUG_HTML) writeFileSync(process.env.DEBUG_HTML, html);
  return { ok, status: res.status };
}

// ---------- main ----------
if (DUMP) {
  writeFileSync(DUMP, JSON.stringify(responses, null, 2));
  console.log(`wrote ${responses.length} generated responses to ${DUMP}`);
}

if (!SEND) {
  const roleCount = responses.reduce((m, r) => ((m[r.persona.role] = (m[r.persona.role] || 0) + 1), m), {});
  const styleCount = responses.reduce((m, r) => ((m[r.persona.style] = (m[r.persona.style] || 0) + 1), m), {});
  console.log(`DRY RUN. Nothing submitted. ${TOTAL} responses generated, all unique.`);
  console.log('roles:', roleCount, 'styles:', styleCount);
  for (const r of responses.slice(0, 3)) {
    console.log('\n' + JSON.stringify(r.persona));
    for (const [id, v, o] of r.answers) console.log(`  ${id}: ${Array.isArray(v) ? v.join(' | ') + (o ? ` [other: ${o}]` : '') : v}`);
  }
  process.exit(0);
}

if (flag('reset') && existsSync(PROGRESS_FILE)) unlinkSync(PROGRESS_FILE);
let done = existsSync(PROGRESS_FILE) ? Number(readFileSync(PROGRESS_FILE, 'utf8')) || 0 : 0;
if (done >= TOTAL) { console.log(`Already submitted ${done}/${TOTAL}. Use --reset to start over.`); process.exit(0); }
console.log(`Submitting ${TOTAL - done} more (already done: ${done}/${TOTAL})...`);

for (let i = done; i < TOTAL; i++) {
  const { ok, status } = await submit(responses[i]);
  if (!ok) {
    console.error(`#${i + 1} FAILED (HTTP ${status}). Stopped at ${done}/${TOTAL}. Rerun to resume. (Set DEBUG_HTML=file to save the page.)`);
    process.exit(1);
  }
  done++;
  writeFileSync(PROGRESS_FILE, String(done));
  console.log(`#${i + 1}/${TOTAL} ok (${responses[i].persona.role})`);
  if (i < TOTAL - 1) await sleep(MIN_DELAY + rnd() * (MAX_DELAY - MIN_DELAY));
}
console.log(`Done. ${done}/${TOTAL} responses submitted.`);
