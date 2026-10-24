/** Small statistics helpers for the written report. No external library is used. */

export function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Sample standard deviation (n minus 1). */
export function sd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1));
}

// ---- Student t distribution (for Welch's test) --------------------------------

function logGamma(x: number): number {
  const coefficients = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const c of coefficients) ser += c / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const MAX_ITER = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta function I_x(a, b). */
function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(a, b, x)) / a
    : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** Two-sided p value for a t statistic with `df` degrees of freedom. */
export function tTwoSidedP(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return 1;
  return incompleteBeta(df / 2, 0.5, df / (df + t * t));
}

export interface WelchResult {
  meanA: number;
  meanB: number;
  nA: number;
  nB: number;
  t: number;
  df: number;
  p: number;
  /** Cohen's d with a pooled standard deviation. */
  d: number;
}

/** Welch's t test for two independent groups, or null when it cannot be computed. */
export function welch(a: number[], b: number[]): WelchResult | null {
  if (a.length < 2 || b.length < 2) return null;
  const mA = mean(a);
  const mB = mean(b);
  const vA = sd(a) ** 2;
  const vB = sd(b) ** 2;
  const seA = vA / a.length;
  const seB = vB / b.length;
  const se = Math.sqrt(seA + seB);
  if (se === 0) return null;
  const t = (mA - mB) / se;
  const df = (seA + seB) ** 2 / (seA ** 2 / (a.length - 1) + seB ** 2 / (b.length - 1));
  const pooled = Math.sqrt(((a.length - 1) * vA + (b.length - 1) * vB) / (a.length + b.length - 2));
  return {
    meanA: mA,
    meanB: mB,
    nA: a.length,
    nB: b.length,
    t,
    df,
    p: tTwoSidedP(t, df),
    d: pooled === 0 ? 0 : (mA - mB) / pooled,
  };
}

export function effectLabel(d: number): string {
  const size = Math.abs(d);
  if (size < 0.2) return 'negligible';
  if (size < 0.5) return 'small';
  if (size < 0.8) return 'medium';
  return 'large';
}

// ---- Interpretation scale -----------------------------------------------------

const AGREEMENT = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const LIKELIHOOD = ['Very Unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very Likely'];

/** Verbal interpretation of a weighted mean on the five-point scale used in the study. */
export function verbal(meanValue: number, kind: 'agreement' | 'likelihood'): string {
  const labels = kind === 'agreement' ? AGREEMENT : LIKELIHOOD;
  if (meanValue < 1.81) return labels[0]!;
  if (meanValue < 2.61) return labels[1]!;
  if (meanValue < 3.41) return labels[2]!;
  if (meanValue < 4.21) return labels[3]!;
  return labels[4]!;
}

export const SCALE_RANGES: Array<[string, number]> = [
  ['4.21 to 5.00', 4],
  ['3.41 to 4.20', 3],
  ['2.61 to 3.40', 2],
  ['1.81 to 2.60', 1],
  ['1.00 to 1.80', 0],
];

export const SCALE_LABELS = { agreement: AGREEMENT, likelihood: LIKELIHOOD };

export function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function fmtP(p: number): string {
  if (p < 0.001) return 'p < .001';
  return `p = ${p.toFixed(3).replace(/^0/, '')}`;
}
