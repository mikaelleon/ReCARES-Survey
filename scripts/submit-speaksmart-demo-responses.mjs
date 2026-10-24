#!/usr/bin/env node
/**
 * DEMO DATA ONLY. Submits exactly 40 synthetic responses to the "SpeakSmart AI" Google Form
 * so the analytics dashboard has data to show. Delete these rows before real data is collected.
 *
 * Usage:
 *   node scripts/submit-speaksmart-demo-responses.mjs            # dry run: preview + uniqueness check
 *   node scripts/submit-speaksmart-demo-responses.mjs --send     # submit (resumes from progress file)
 *   node scripts/submit-speaksmart-demo-responses.mjs --dump out.json
 *   node scripts/submit-speaksmart-demo-responses.mjs --send --reset   # forget progress, start over
 *
 * Generation is deterministic (fixed seed) and a progress file in the OS temp dir records how many
 * were accepted, so a rerun after a failure never goes past 40 total.
 * Flags: --send, --seed N, --min-delay ms, --max-delay ms, --dump file, --reset
 */
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FORM_ID = '1FAIpQLSeXD1pAJEEB2Exi1dAkxflVH2V3OCHgHIdFSVQnJ4oTQ5UqPw';
const POST_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
const TOTAL = 40;

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const SEND = flag('send');
const SEED = Number(val('seed', 20261021));
const MIN_DELAY = Number(val('min-delay', 2500));
const MAX_DELAY = Number(val('max-delay', 7000));
const DUMP = val('dump', null);
const PROGRESS_FILE = join(tmpdir(), `speaksmart-demo-progress-${SEED}.txt`);

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
  employment: 704556384, interviews: 658185757, questions: 972646315, feelings: 2057687094, challenge: 2123675519,
  likert: [843929958, 901796266, 571973735, 359315932, 1330233427, 1651390147, 1494980938, 1682649084, 2137981830, 199296627],
};

// ---------- option pools ----------
const EMPLOYMENT = [
  ['Currently employed', 38], ['Unemployed', 30], ['Self-employed', 8], ['Currently working as an intern or trainee', 24],
];
const INTERVIEWS = ['1 interview', '2–3 interviews', '4–5 interviews', 'More than 5 interviews'];
const QUESTIONS = [
  'Tell me about yourself', 'What are your strengths and weaknesses?', 'Why do you want to work for our company?',
  'What are your career goals?', 'What skills or experiences can you contribute?', 'How do you handle challenges or pressure?',
  'Situational or problem-solving questions',
];
const FEELINGS_NEG = ['Nervous or anxious', 'Afraid of giving the wrong answer', 'Worried about my English grammar', 'Uncomfortable speaking in English', 'Confused about how to answer some questions'];
const FEELINGS_POS = ['Confident', 'Calm and prepared'];
const CHALLENGES = [
  'Answering questions clearly', 'Using correct English grammar', 'Speaking fluently', 'Managing nervousness',
  'Maintaining eye contact and proper facial expressions', 'Organizing my thoughts', 'Answering unexpected questions',
];
const OTHER_QUESTIONS = [
  'Expected salary', 'Where do you see yourself in five years?', 'Why did you leave your previous job?',
  'Are you willing to work overtime or on shifts?', 'Do you have any questions for us?', 'Are you comfortable with a night shift schedule?',
  'Describe a time you worked in a team', 'Why should we hire you?', 'How long can you stay with the company?',
  'What do you know about our company?', 'Are you willing to relocate?', 'Tell me about your thesis',
];
const OTHER_FEELINGS = [
  'Excited but also tense', 'Overwhelmed at first, then okay', 'Hopeful', 'Pressured because I needed the job',
  'Shy at the start', 'Intimidated by the panel', 'Awkward when silent', 'Determined to do my best',
  'Embarrassed when I stumbled on words', 'Tired after waiting so long', 'Curious about the company',
];
const OTHER_CHALLENGES = [
  'Staying calm when the interviewer was serious', 'Explaining my lack of experience', 'Answering the salary question',
  'Not knowing what the interviewer wanted to hear', 'Thinking in Filipino then translating to English', 'Panel interviews with many people',
  'Online interview connection problems', 'Explaining gaps in my resume', 'Speaking too fast when nervous',
  'Keeping my answers short and not rambling',
];

// ---------- persona + answers ----------
const likert = (base, noise = 0.2) => String(1 + Math.round(clamp(base + (rnd() - 0.5) * 2 * noise) * 4));

const usedOther = { q: new Set(), f: new Set(), c: new Set() };
function uniqueOther(kind, pool) {
  const free = pool.filter((x) => !usedOther[kind].has(x));
  if (!free.length) return null;
  const v = pick(free);
  usedOther[kind].add(v);
  return v;
}

function generate() {
  const emp = weighted(EMPLOYMENT);
  const anx = clamp(rnd() * 0.9 + 0.05);
  const gram = clamp(anx * 0.5 + rnd() * 0.6 - 0.05);
  const expr = clamp(rnd() * 0.7 + anx * 0.3);
  const open = clamp(0.55 + rnd() * 0.4 - (rnd() < 0.1 ? 0.35 : 0));

  // Q2: interviews roughly tied to employment
  const iw = emp === 'Unemployed'
    ? weighted([[0, 28], [1, 30], [2, 22], [3, 20]])
    : emp === 'Currently working as an intern or trainee'
      ? weighted([[0, 40], [1, 40], [2, 15], [3, 5]])
      : weighted([[0, 18], [1, 36], [2, 26], [3, 20]]);

  // Q3 common questions (checkbox, required)
  let qs = shuffle(QUESTIONS.slice(1)).slice(0, 1 + Math.floor(rnd() * 4));
  if (chance(0.88)) qs = ['Tell me about yourself', ...qs];
  const qAnswers = qs.map((v) => [v]);
  let qOther = null;
  if (chance(0.15) && (qOther = uniqueOther('q', OTHER_QUESTIONS))) qAnswers.push(['__other_option__', qOther]);

  // Q4 feelings (checkbox, required), coherent with anxiety
  const fl = [];
  if (anx > 0.5) {
    fl.push(...shuffle(FEELINGS_NEG).slice(0, 1 + Math.floor(rnd() * 3 * anx) + (anx > 0.8 ? 1 : 0)));
    if (anx < 0.65 && chance(0.4)) fl.push('Calm and prepared');
  } else if (anx > 0.28) {
    fl.push(pick(FEELINGS_NEG), pick(FEELINGS_POS));
    if (chance(0.3)) fl.push(pick(FEELINGS_NEG));
  } else {
    fl.push(...FEELINGS_POS.filter(() => chance(0.85)));
    if (!fl.length) fl.push('Confident');
    if (chance(0.3)) fl.push(pick(FEELINGS_NEG));
  }
  if (gram > 0.6 && !fl.includes('Worried about my English grammar') && chance(0.5)) fl.push('Worried about my English grammar');
  const fAnswers = [...new Set(fl)].map((v) => [v]);
  let fOther = null;
  if (chance(0.13) && (fOther = uniqueOther('f', OTHER_FEELINGS))) fAnswers.push(['__other_option__', fOther]);

  // Q5 biggest challenge (radio)
  let challenge;
  let cOther = null;
  if (chance(0.1) && (cOther = uniqueOther('c', OTHER_CHALLENGES))) challenge = ['__other_option__', cOther];
  else {
    const w = [
      ['Answering questions clearly', 12 + (1 - anx) * 6],
      ['Using correct English grammar', 6 + gram * 22],
      ['Speaking fluently', 8 + gram * 12],
      ['Managing nervousness', 6 + anx * 28],
      ['Maintaining eye contact and proper facial expressions', 4 + expr * 20],
      ['Organizing my thoughts', 10 + anx * 6],
      ['Answering unexpected questions', 10],
    ];
    challenge = [weighted(w)];
  }

  const L = [
    anx, // 6 nervous
    gram, // 7 grammar difficulty
    clamp(anx * 0.5 + gram * 0.5), // 8 express thoughts
    clamp(0.55 + anx * 0.35), // 9 needed more practice
    expr, // 10 unsure about expression
    0.82, // 11 practice helps
    open, // 12 AI useful
    clamp(open * 0.8 + gram * 0.25), // 13 grammar corrections helpful
    clamp(open * 0.8 + expr * 0.25), // 14 facial feedback useful
    clamp(open - 0.05), // 15 willing to use
  ].map((b) => likert(b));

  const answers = [
    [E.employment, [[emp]]],
    [E.interviews, [[INTERVIEWS[iw]]]],
    [E.questions, qAnswers],
    [E.feelings, fAnswers],
    [E.challenge, [challenge]],
    ...E.likert.map((id, i) => [id, [[L[i]]]]),
  ];
  return { persona: { emp, anx: +anx.toFixed(2), gram: +gram.toFixed(2), open: +open.toFixed(2) }, answers };
}

// Canonical signature used to guarantee no two responses are identical.
const sig = (r) => JSON.stringify(r.answers.map(([id, vals]) => [id, vals.map((v) => v.join('|')).sort()]));

const responses = [];
const seen = new Set();
while (responses.length < TOTAL) {
  const r = generate();
  const s = sig(r);
  if (seen.has(s)) continue;
  seen.add(s);
  responses.push(r);
}

function toBody(r) {
  const body = new URLSearchParams();
  for (const [id, vals] of r.answers) {
    for (const [v, other] of vals) {
      body.append(`entry.${id}`, v);
      if (v === '__other_option__') body.append(`entry.${id}.other_option_response`, other);
    }
  }
  body.append('pageHistory', '0');
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
  // The confirmation page does not re-render the form's pageHistory input; a validation failure does.
  const ok = res.status === 200 && !/name="pageHistory"/.test(html);
  if (!ok && process.env.DEBUG_HTML) writeFileSync(process.env.DEBUG_HTML, html);
  return { ok, status: res.status };
}

// ---------- main ----------
if (DUMP) {
  writeFileSync(DUMP, JSON.stringify(responses, null, 2));
  console.log(`wrote ${responses.length} generated responses to ${DUMP}`);
}

const flat = (r) => r.answers.map(([id, vals]) => `${id}: ${vals.map((v) => (v[1] ? `[other: ${v[1]}]` : v[0])).join(' | ')}`);

if (!SEND) {
  const count = (k) => responses.reduce((m, r) => ((m[r.persona[k]] = (m[r.persona[k]] || 0) + 1), m), {});
  console.log(`DRY RUN. Nothing submitted. ${TOTAL} responses generated, all distinct.`);
  console.log('employment:', count('emp'));
  console.log('with "Other" text:', responses.filter((r) => r.answers.some(([, v]) => v.some((x) => x[1]))).length);
  for (const r of responses.slice(0, 3)) {
    console.log('\n' + JSON.stringify(r.persona));
    flat(r).forEach((l) => console.log('  ' + l));
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
  console.log(`#${i + 1}/${TOTAL} ok`);
  if (i < TOTAL - 1) await sleep(MIN_DELAY + rnd() * (MAX_DELAY - MIN_DELAY));
}
console.log(`Done. ${done}/${TOTAL} responses submitted.`);
