/* Branching tests for draft instrument v2. Run: node scripts/test-survey-v2-branching.cjs */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const resolveOrig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('@/')) {
    const base = path.join(root, request.slice(2));
    for (const ext of ['.ts', '.tsx', '/index.ts']) if (fs.existsSync(base + ext)) return base + ext;
  }
  return resolveOrig.call(this, request, ...rest);
};
require.extensions['.ts'] = (mod, file) => {
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: 'commonjs', target: 'es2020', esModuleInterop: true },
  });
  mod._compile(out.outputText, file);
};

const { DRAFT_INSTRUMENT_V2: inst } = require(path.join(root, 'survey/draftInstrumentV2.ts'));
const { normalizeAnswers, questionVisible, findQuestion } = require(path.join(root, 'survey/model.ts'));
const { lintInstrument } = require(path.join(root, 'survey/lint.ts'));

const optId = (code, label) => {
  const o = findQuestion(inst, code).options.find((x) => x.label === label);
  if (!o) throw new Error(`No option "${label}" in ${code}`);
  return o.id;
};

/** Apply answers in order, normalizing after each, the way the survey form does. */
const fill = (...pairs) => {
  let a = {};
  for (const [k, v] of pairs) a = normalizeAnswers(inst, { ...a, [k]: v });
  return a;
};
const shown = (a) => new Set(inst.questions.filter((q) => questionVisible(q, a)).map((q) => q.code));

let pass = 0;
const fails = [];
const check = (name, a, { show = [], hide = [] }) => {
  const s = shown(a);
  const bad = [
    ...show.filter((c) => !s.has(c)).map((c) => `${c} should show`),
    ...hide.filter((c) => s.has(c)).map((c) => `${c} should be hidden`),
  ];
  if (bad.length) fails.push(`${name}: ${bad.join('; ')}`);
  else pass += 1;
};

const none = optId('B1', 'None of these');
const noneP1 = optId('P1', 'None of these');
const phone = optId('B1', 'Smartphone');

// Resident types
const TYPES = { owner: 1, ofw: 2, absentee: 3, ownerMember: 4, tenant: 5, tenantMember: 6 };
for (const [label, v] of Object.entries(TYPES)) {
  const a = fill(['A1', v]);
  if (v <= 4) {
    check(`A1=${label}: homeowner set`, a, {
      show: ['H1', 'H2', 'H4', 'H6', 'H7', 'H10', 'H11'],
      hide: ['T1', 'T2', 'TO1', 'A12', 'CH14', 'CH15'],
    });
  } else {
    check(`A1=${label}: tenant set`, a, {
      show: ['T1', 'T2', 'T3', 'T4', 'T6', 'T11', 'T13', 'TO1', 'TO10', 'TO11', 'TO13', 'TO14', 'TO15', 'TO16', 'TO17', 'CH14', 'CH15', 'A12'],
      hide: ['H1', 'H2', 'H6', 'A13', 'OM1', 'OM3'],
    });
  }
  if (v <= 3) check(`A1=${label}: A13 shown, mirror hidden`, a, { show: ['A13'], hide: ['OM1', 'OM3'] });
  else check(`A1=${label}: no A13`, a, { hide: ['A13', 'OM1'] });
}

// Owner who rents out
for (const v of [1, 2, 3]) {
  check(`owner ${v} A13=yes -> mirror`, fill(['A1', v], ['A13', 'yes']), {
    show: ['OM1', 'OM3', 'OM4', 'OM5', 'OM6', 'OM7'],
    hide: ['OM2', 'OM8', 'OM11', 'OM12'],
  });
  check(`owner ${v} A13=no -> no mirror`, fill(['A1', v], ['A13', 'no']), { hide: ['OM1', 'OM3', 'OM4', 'OM5'] });
}
const om = (...p) => fill(['A1', 1], ['A13', 'yes'], ...p);
check('OM1=Always -> OM2 shown, OM11/12 need signal', om(['OM1', 'always']), { show: ['OM2'], hide: ['OM11', 'OM12'] });
check('OM1=Never -> OM2 hidden, OM11+OM12 shown', om(['OM1', 'never']), { hide: ['OM2'], show: ['OM11', 'OM12'] });
check('OM7=Disagree -> OM8-11', om(['OM1', 'always'], ['OM7', 2]), { show: ['OM8', 'OM9', 'OM10', 'OM11'] });
check('OM4=Neutral -> OM12 + OM8', om(['OM1', 'always'], ['OM4', 3]), { show: ['OM12', 'OM8'] });
check(
  'all OM default Agree -> OM8-12 hidden',
  om(['OM1', 'always'], ...['OM3', 'OM4', 'OM5', 'OM6', 'OM7'].map((c) => [c, 4])),
  { hide: ['OM8', 'OM9', 'OM10', 'OM11', 'OM12'] },
);
check('A13 yes -> no clears OM answers', fill(['A1', 1], ['A13', 'yes'], ['OM3', 4], ['A13', 'no']), { hide: ['OM3'] });

// Disability and workers
check('A4=yes -> AC1', fill(['A4', 'yes']), { show: ['AC1'], hide: ['AC1_other'] });
check('A4=no -> no AC1', fill(['A4', 'no']), { hide: ['AC1'] });
check('AC1 other -> AC1_other', fill(['A4', 'yes'], ['AC1', [optId('AC1', 'Other')]]), { show: ['AC1_other'] });
check('AC1 seeing -> AC7/8/9', fill(['A4', 'yes'], ['AC1', [optId('AC1', 'Difficulty seeing')]]), { show: ['AC7', 'AC8', 'AC9'] });
check(
  'AC1 reading -> AC7 only',
  fill(['A4', 'yes'], ['AC1', [optId('AC1', 'Difficulty reading or understanding forms')]]),
  { show: ['AC7'], hide: ['AC8', 'AC9'] },
);
check('AC3 Agree -> AC7/8/9', fill(['AC3', 4]), { show: ['AC7', 'AC8', 'AC9'] });
check('AC3 Neutral -> AC7/8/9 hidden', fill(['AC3', 3]), { hide: ['AC7', 'AC8', 'AC9'] });
check('AC6 Disagree -> AC11', fill(['AC6', 2]), { show: ['AC11'] });
check('AC5 Neutral -> AC13', fill(['AC5', 3]), { show: ['AC13'] });
check('AC5 Agree -> AC13 hidden', fill(['AC5', 4]), { hide: ['AC13'] });
check('A5=yes -> P5', fill(['A5', 'yes']), { show: ['P5'], hide: ['P12'] });
check('A5=no -> P5/P12 hidden', fill(['A5', 'no']), { hide: ['P5', 'P12'] });
check('A5=yes, P5 Agree -> P12', fill(['A5', 'yes'], ['P5', 4]), { show: ['P12'] });
check('A5=yes, P5 Disagree -> P12 hidden', fill(['A5', 'yes'], ['P5', 2]), { hide: ['P12'] });

// Digital access
check('B1 none -> device Qs hidden', fill(['B1', [none]]), { hide: ['B2', 'B8', 'B9', 'B10', 'B11', 'B13'] });
check(
  'B1 phone, strong answers -> optionals hidden',
  fill(['B1', [phone]], ['B14', 4], ['B7', 4], ['B15', 4], ['B16', 4], ['B18', 4]),
  { show: ['B2'], hide: ['B8', 'B9', 'B10', 'B11', 'B13'] },
);
check('B14 Disagree + device -> B10 B11 B13 B9', fill(['B1', [phone]], ['B14', 2]), { show: ['B10', 'B11', 'B13', 'B9'] });
check('B14 Disagree + no device -> hidden', fill(['B1', [none]], ['B14', 2]), { hide: ['B10', 'B11', 'B13', 'B9'] });
check('B15 Neutral + device -> B8', fill(['B1', [phone]], ['B15', 3]), { show: ['B8'] });
check('B7 Neutral + device -> B10 and B8', fill(['B1', [phone]], ['B7', 3]), { show: ['B10', 'B8'] });
check('B16 Disagree + device -> B11', fill(['B1', [phone]], ['B16', 2]), { show: ['B11'] });
check('B18 Disagree + device -> B13 B9', fill(['B1', [phone]], ['B18', 2]), { show: ['B13', 'B9'] });

// Feature interest
check('F all Not sure -> F11-14, F6 hidden', fill(['F1', 3], ['F3', 3], ['F4', 3], ['F5', 3]), { hide: ['F11', 'F12', 'F13', 'F14', 'F6'] });
check('F1 Likely -> F11 F12 F13 F14 F6', fill(['F1', 4]), { show: ['F11', 'F12', 'F13', 'F14', 'F6'] });
check('F5 Very likely -> all follow-ups', fill(['F5', 5]), { show: ['F11', 'F12', 'F13', 'F14', 'F6'] });
check('F3 Likely only -> F11 F14 F6, not F12 F13', fill(['F3', 4]), { show: ['F11', 'F14', 'F6'], hide: ['F12', 'F13'] });
check('A4=yes -> F6 even if unlikely', fill(['A4', 'yes'], ['F1', 1]), { show: ['F6'], hide: ['F11'] });

// S
check('S3 Disagree -> S6 S8 S10', fill(['S3', 2]), { show: ['S6', 'S8', 'S10'] });
check('S5 Neutral -> S6 S8 S10', fill(['S5', 3]), { show: ['S6', 'S8', 'S10'] });
check('S1 Agree -> S9 S10', fill(['S1', 4]), { show: ['S9', 'S10'] });
check('S1 Disagree (favorable) -> S9 hidden', fill(['S1', 2]), { hide: ['S9'] });
check('S2 Agree -> S7 S9 S10', fill(['S2', 5]), { show: ['S7', 'S9', 'S10'] });
check('S4 Disagree -> S7 S10', fill(['S4', 1]), { show: ['S7', 'S10'] });
check(
  'S all favorable -> S6-S10 hidden',
  fill(['S1', 1], ['S2', 1], ['S3', 5], ['S4', 5], ['S5', 5]),
  { hide: ['S6', 'S7', 'S8', 'S9', 'S10'] },
);

// P
check('P1 none -> P2 P3 P8 hidden even with signal', fill(['P1', [noneP1]], ['P6', 2]), { hide: ['P2', 'P3', 'P8'] });
check('P1 visitors + P6 Disagree -> P2 P3', fill(['P1', [optId('P1', 'Visitors')]], ['P6', 2]), { show: ['P2', 'P3'], hide: ['P8'] });
check('P1 visitors + P7 Neutral -> P2 P3, no P8', fill(['P1', [optId('P1', 'Visitors')]], ['P7', 3]), { show: ['P2', 'P3'], hide: ['P8'] });
check('P1 deliveries + P7 Disagree -> P8', fill(['P1', [optId('P1', 'Deliveries')]], ['P7', 2]), { show: ['P8'] });
check('P1 drivers + P7 Strongly disagree -> P8', fill(['P1', [optId('P1', 'Ride-hailing or special-trip drivers')]], ['P7', 1]), { show: ['P8'] });
check('P1 deliveries + P7 Agree -> P8 hidden', fill(['P1', [optId('P1', 'Deliveries')]], ['P7', 4]), { hide: ['P8'] });
check('P1 visitors only + P7 Disagree -> P8 hidden', fill(['P1', [optId('P1', 'Visitors')]], ['P7', 2]), { hide: ['P8'] });

// R
check('R1 Agree -> R8 R13; R9 hidden', fill(['R1', 4]), { show: ['R8', 'R13'], hide: ['R9'] });
check('R1 Neutral -> R9; R8 hidden', fill(['R1', 3]), { show: ['R9'], hide: ['R8'] });
check('R1 Strongly disagree -> R9', fill(['R1', 1]), { show: ['R9'], hide: ['R8'] });
check('R6 Disagree -> R7 R12', fill(['R6', 2]), { show: ['R7', 'R12'] });
check('R2 Neutral -> R7 R12', fill(['R2', 3]), { show: ['R7', 'R12'] });
check('R6+R2 Agree -> R7 R12 hidden', fill(['R6', 4], ['R2', 4]), { hide: ['R7', 'R12'] });
check('R5 Agree -> R13', fill(['R5', 4]), { show: ['R13'] });
check('R1 + R5 Disagree -> R13 hidden', fill(['R1', 2], ['R5', 2]), { hide: ['R13'] });

// Homeowner set
const h = (...p) => fill(['A1', 1], ...p);
check('H1 tenant registration -> H3', h(['H1', [optId('H1', 'Tenant registration or authorization')]]), { show: ['H3'] });
check('H1 clearance only -> H3 H9 hidden', h(['H1', [optId('H1', 'Clearance')]]), { hide: ['H3', 'H9'] });
check('H1 vehicle sticker -> H9', h(['H1', [optId('H1', 'Vehicle sticker')]]), { show: ['H9'] });
check('H6 Disagree -> H8 H13', h(['H6', 2]), { show: ['H8', 'H13'] });
check('H7 Neutral -> H8', h(['H7', 3]), { show: ['H8'] });
check('H6/H7 Agree -> H8 hidden', h(['H6', 4], ['H7', 4]), { hide: ['H8'] });
check('H2 Agree (unfavorable) -> H13', h(['H2', 4]), { show: ['H13'] });
check('H2 Disagree + H6 Agree -> H13 hidden', h(['H2', 2], ['H6', 4]), { hide: ['H13'] });
check('H10 Disagree -> H14', h(['H10', 2]), { show: ['H14'] });
check('H11 Neutral -> H14', h(['H11', 3]), { show: ['H14'] });
check('H10/H11 Agree -> H14 hidden', h(['H10', 5], ['H11', 5]), { hide: ['H14'] });

// Tenant set
const t = (...p) => fill(['A1', 5], ...p);
check('T1 move-in clearance -> T12', t(['T1', [optId('T1', 'Move-in clearance')]]), { show: ['T12'] });
check('T1 tenant registration -> T12 T16 hidden', t(['T1', [optId('T1', 'Tenant registration')]]), { hide: ['T12', 'T16'] });
check("T1 owner's forms -> T16", t(['T1', [optId('T1', "Forms needing the owner's signature or documents")]]), { show: ['T16'] });
check('T6 Disagree -> T10 T14', t(['T6', 2]), { show: ['T10', 'T14'] });
check('T13 Neutral -> T10', t(['T13', 3]), { show: ['T10'] });
check('T3 Agree -> T14 T16', t(['T3', 4]), { show: ['T14', 'T16'] });
check('T2 Disagree -> T15', t(['T2', 2]), { show: ['T15'] });
check('T2 Agree -> T15 hidden', t(['T2', 4]), { hide: ['T15'] });

// CC
check(
  'CC1 none -> CC2.. hidden',
  fill(['CC1', [optId('CC1', 'None of these')]]),
  { hide: ['CC2', 'CC2b', 'CC3', 'CC4', 'CC5', 'CC6'] },
);
check('CC1 noise -> CC2; CC2b needs CC2', fill(['CC1', [optId('CC1', 'Noise')]]), { show: ['CC2'], hide: ['CC2b', 'CC3', 'CC4'] });
const cc = (...p) =>
  fill(
    ['CC1', [optId('CC1', 'Noise'), optId('CC1', 'Pets')]],
    ['CC2', [optId('CC2', 'Noise')]],
    ['CC2b', optId('CC2b', 'Noise')],
    ...p,
  );
check('CC2b picked -> CC3 CC4 CC10', cc(), { show: ['CC3', 'CC4', 'CC10'], hide: ['CC5', 'CC6', 'CC7', 'CC8', 'CC9'] });
check('CC4=yes -> CC5 CC7 CC8 CC9', cc(['CC4', 'yes']), { show: ['CC5', 'CC7', 'CC8', 'CC9'], hide: ['CC6'] });
check('CC4=no -> CC6 only', cc(['CC4', 'no']), { show: ['CC6'], hide: ['CC5', 'CC7', 'CC8', 'CC9'] });
check('CC4=prefer not -> none', cc(['CC4', 'prefer_not_to_say']), { hide: ['CC5', 'CC6', 'CC7', 'CC8', 'CC9'] });
check('CC4 yes then no clears CC5', cc(['CC4', 'yes'], ['CC5', [optId('CC5', 'HOA office')]], ['CC4', 'no']), { hide: ['CC5'] });
check('CC1 Pets -> CC17', cc(), { show: ['CC17'] });
check('CC1 Construction -> CC18 only', fill(['CC1', [optId('CC1', 'Construction or renovation')]]), { show: ['CC18'], hide: ['CC17', 'CC19'] });
check('CC1 Visitors -> CC19', fill(['CC1', [optId('CC1', 'Visitors or loitering')]]), { show: ['CC19'] });
check('CC16 Neutral -> CC17', fill(['CC16', 3]), { show: ['CC17'] });
check('CC14 Disagree -> CC18', fill(['CC14', 2]), { show: ['CC18'] });
check('CC15 Strongly disagree -> CC19', fill(['CC15', 1]), { show: ['CC19'] });
check(
  'CC14-16 Agree, CC1 none -> CC17-19 hidden',
  fill(['CC1', [optId('CC1', 'None of these')]], ['CC14', 4], ['CC15', 4], ['CC16', 4]),
  { hide: ['CC17', 'CC18', 'CC19'] },
);

// HR
const quiet = [['P1', [noneP1]], ['A5', 'no']];
check('HR1 Agree, no triggers -> HR2a-e hidden', fill(['HR1', 4], ...quiet), { hide: ['HR2a', 'HR2b', 'HR2c', 'HR2d', 'HR2e'] });
check('HR1 Neutral -> all HR2', fill(['HR1', 3]), { show: ['HR2a', 'HR2b', 'HR2c', 'HR2d', 'HR2e'] });
check('HR1 Agree + CC1 noise -> HR2a only', fill(['HR1', 4], ...quiet, ['CC1', [optId('CC1', 'Noise')]]), { show: ['HR2a'], hide: ['HR2b', 'HR2c', 'HR2d', 'HR2e'] });
check('HR1 Agree + A5 yes -> HR2c', fill(['HR1', 4], ['P1', [noneP1]], ['A5', 'yes']), { show: ['HR2c'], hide: ['HR2a', 'HR2b'] });
check('HR1 Agree + P1 visitors -> HR2d', fill(['HR1', 4], ['A5', 'no'], ['P1', [optId('P1', 'Visitors')]]), { show: ['HR2d'], hide: ['HR2c'] });
check('HR1 Agree + CC1 pets -> HR2e', fill(['HR1', 4], ...quiet, ['CC1', [optId('CC1', 'Pets')]]), { show: ['HR2e'] });

// TO
check('TO1 yes fully -> TO2-4; TO5-9 hidden', t(['TO1', optId('TO1', 'Yes, fully')]), { show: ['TO2', 'TO3', 'TO4'], hide: ['TO5', 'TO6', 'TO7', 'TO8', 'TO9', 'TO12'] });
check('TO1 yes partly -> TO2-9 + TO12', t(['TO1', optId('TO1', 'Yes, partly')]), { show: ['TO2', 'TO3', 'TO4', 'TO5', 'TO6', 'TO7', 'TO8', 'TO9', 'TO12'] });
check('TO1 no -> TO5-9 + TO12; TO2-4 hidden', t(['TO1', optId('TO1', 'No')]), { show: ['TO5', 'TO6', 'TO7', 'TO8', 'TO9', 'TO12'], hide: ['TO2', 'TO3', 'TO4'] });
check('TO1 not sure -> TO5 TO9; TO2 hidden', t(['TO1', optId('TO1', 'Not sure')]), { show: ['TO5', 'TO9'], hide: ['TO2'] });
check('TO14 Disagree (fully oriented) -> TO12', t(['TO1', optId('TO1', 'Yes, fully')], ['TO14', 2]), { show: ['TO12'] });
check('TO13 Disagree -> TO18 TO19 TO20', t(['TO13', 2]), { show: ['TO18', 'TO19', 'TO20'] });
check('TO mirror all Agree -> TO18-20 hidden', t(...['TO13', 'TO14', 'TO15', 'TO16', 'TO17'].map((c) => [c, 4])), { hide: ['TO18', 'TO19', 'TO20'] });
check('owner never sees TO', fill(['A1', 1]), { hide: ['TO1', 'TO13', 'TO18'] });

// CH
check('CH7 never -> CH8 CH9 hidden', fill(['CH7', 'never']), { hide: ['CH8', 'CH9'] });
check('CH7 once -> CH8 CH9', fill(['CH7', 'once']), { show: ['CH8', 'CH9'] });
check('CH7 several -> CH8 CH9', fill(['CH7', 'several_times']), { show: ['CH8', 'CH9'] });
check('CH11 never -> CH12 hidden', fill(['CH11', 'never']), { hide: ['CH12'] });
check('CH11 once -> CH12', fill(['CH11', 'once']), { show: ['CH12'] });
check('CH13 yes -> CH13b', fill(['CH13', 'yes']), { show: ['CH13b'] });
check('CH13 no -> CH13b hidden', fill(['CH13', 'no']), { hide: ['CH13b'] });
check('CH1 follow -> CH19', fill(['CH1', optId('CH1', 'Yes, and I follow it')]), { show: ['CH19'] });
check('CH1 aware not following -> CH19', fill(['CH1', optId('CH1', 'Yes, but I do not follow it')]), { show: ['CH19'] });
check('CH1 No -> CH19 hidden', fill(['CH1', optId('CH1', 'No')]), { hide: ['CH19'] });
check('CH2 visited -> CH20', fill(['CH2', optId('CH2', 'Yes, and I have visited it')]), { show: ['CH20'] });
check('CH2 never visited -> CH20 hidden', fill(['CH2', optId('CH2', 'Yes, but I have never visited it')]), { hide: ['CH20'] });
check('CH6 Disagree -> CH21', fill(['CH6', 2]), { show: ['CH21'] });
check('CH16 Neutral -> CH21', fill(['CH16', 3]), { show: ['CH21'] });
check('CH10 Disagree -> CH22 CH23', fill(['CH10', 2]), { show: ['CH22', 'CH23'] });
check('CH18 Neutral -> CH22', fill(['CH18', 3]), { show: ['CH22'] });
check('CH17 Strongly disagree -> CH23', fill(['CH17', 1]), { show: ['CH23'] });
check('CH all Agree -> CH21-23 hidden', fill(['CH6', 4], ['CH16', 4], ['CH10', 4], ['CH18', 4], ['CH17', 4]), { hide: ['CH21', 'CH22', 'CH23'] });

// Switching resident type clears stale branch answers
check('tenant -> owner clears T/TO answers', fill(['A1', 5], ['T2', 4], ['TO1', optId('TO1', 'No')], ['A1', 1]), { hide: ['T2', 'TO1', 'TO5'] });

// Per-type invariant: with no answers, five Likert items per rated category are visible.
const likertByPrefix = (a) => {
  const out = {};
  for (const q of inst.questions) {
    if (q.type !== 'likert' || !questionVisible(q, a)) continue;
    const p = q.code.replace(/\d.*$/, '');
    out[p] = (out[p] || 0) + 1;
  }
  return out;
};
for (const v of [1, 2, 3, 4, 5, 6]) {
  const counts = likertByPrefix(fill(['A1', v], ['P1', [noneP1]], ['A5', 'no'], ...(v <= 3 ? [['A13', 'yes']] : [])));
  const expected = { B: 5, F: 5, S: 5, P: 5, R: 5, CC: 5, HR: 5, CH: 5, AC: 5 };
  if (v <= 4) expected.H = 5;
  else {
    expected.T = 5;
    expected.TO = 5;
  }
  if (v <= 3) expected.OM = 5;
  const bad = Object.entries(expected)
    .filter(([k, n]) => counts[k] !== n)
    .map(([k, n]) => `${k}: ${counts[k] ?? 0} != ${n}`);
  if (v >= 4 && counts.OM) bad.push('OM visible');
  if (bad.length) fails.push(`A1=${v} default Likert counts: ${bad.join(', ')}`);
  else pass += 1;
}

const errors = lintInstrument(inst).filter((i) => i.level === 'error');
if (errors.length) fails.push('lint errors: ' + errors.map((e) => e.message).join(' | '));
else pass += 1;

console.log(`${pass} passed, ${fails.length} failed`);
fails.forEach((f) => console.log('FAIL ' + f));
process.exit(fails.length ? 1 : 0);
