/**
 * Data-driven survey instrument.
 *
 * An instrument is plain JSON (steps, questions, and branching conditions) stored in
 * Firestore at `surveyInstruments/{version}`. The resident survey, the validator, the
 * review screen, and the admin branching editor all read this one structure.
 *
 * Answers stay keyed by question code (A1, B2, F3 ...) so stored responses and the
 * dashboard keep working across instrument versions.
 */

export type Primitive = string | number;

/** A branching condition. Evaluated against the answers given so far. */
export type Condition =
  | { op: 'eq' | 'neq'; q: string; value: Primitive }
  | { op: 'in' | 'notIn'; q: string; value: Primitive[] }
  | { op: 'includes' | 'notIncludes'; q: string; value: string }
  | { op: 'answered' | 'unanswered'; q: string }
  | { op: 'and' | 'or'; args: Condition[] };

export type QuestionType = 'single' | 'multi' | 'likert' | 'text' | 'number' | 'nested_multi';

export interface OptionDef {
  id: string;
  label: string;
  /** Small grey line under the label. */
  hint?: string;
  /** Spans both columns in a two-column list. */
  wide?: boolean;
  /** Consecutive options with the same group render under one legend. */
  group?: string;
  /** Option is offered only while this holds. */
  showWhen?: Condition;
}

export interface NestedCategory {
  id: string;
  label: string;
  items: string[];
}

export interface TextVariant {
  when: Condition;
  text: string;
}

export interface QuestionHint {
  when?: Condition;
  text: string;
}

export interface QuestionDef {
  /** Answer key. Never changes after a question is first published. */
  code: string;
  stepId: string;
  type: QuestionType;
  text: string;
  /** First matching variant replaces `text`. */
  textVariants?: TextVariant[];
  /** Defaults to true, except text and number fields. */
  required?: boolean;
  options?: OptionDef[];
  columns?: 1 | 2;
  scale?: 'agreement' | 'likelihood';
  /** multi: choosing this clears every other choice. */
  exclusiveId?: string;
  /** multi: most non-exclusive choices allowed. */
  maxSelect?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  /** single: store the option id as a number (resident type). */
  numericValues?: boolean;
  hints?: QuestionHint[];
  /** Question is asked only while this holds. */
  showWhen?: Condition;
  /** Value written when the question is skipped (for example 99 or "not_shown"). */
  skipCode?: 99 | 'not_shown';
  /** Write the skip code only while this holds; otherwise the answer is dropped. */
  skipCodeWhen?: Condition;
  /** nested_multi: categories with sub-choices. */
  categories?: NestedCategory[];
  /** Wrapper classes used to keep the original card layout. Optional. */
  layout?: string[];
  cardClass?: string;
  /** Renders the interview invitation form under the question while the condition holds. */
  attachForm?: { when: Condition };
  /** Review screen section override. Defaults to the step's section. */
  review?: { code: string; title: string };
}

export interface StepVariant {
  when: Condition;
  title?: string;
  subtitle?: string;
}

export interface StepNote {
  text: string;
  when?: Condition;
  /** Render under this question instead of at the top of the step. */
  after?: string;
  kind?: 'intro' | 'hint';
}

export interface StepDef {
  id: string;
  title: string;
  subtitle?: string;
  variants?: StepVariant[];
  notes?: StepNote[];
  showRequiredNote?: boolean;
  /** Review screen grouping. Steps sharing a code appear as one section. */
  review?: { code: string; title: string };
}

export type InstrumentStatus = 'draft' | 'published' | 'archived';

export interface Instrument {
  version: string;
  status: InstrumentStatus;
  title?: string;
  steps: StepDef[];
  questions: QuestionDef[];
  /** English text to Tagalog text, for wording added in the editor. */
  translations?: Record<string, string>;
  /** Version this one was copied from. */
  baseVersion?: string;
  updatedBy?: string;
  updatedAtMs?: number | null;
  publishedAtMs?: number | null;
}

export type Answers = Record<string, unknown>;

export const CHOOSE_ONE = 'Please choose one answer to continue.';
export const CHOOSE_ANY = 'Please select at least one answer to continue.';
export const WRITE_ANSWER = 'Please write an answer to continue.';

const SENTINELS: unknown[] = [99, 'not_shown'];

// ---- conditions -----------------------------------------------------------

function same(a: unknown, b: Primitive): boolean {
  return a != null && typeof a !== 'object' && String(a) === String(b);
}

export function isAnswered(value: unknown): boolean {
  if (value == null || value === '' || value === 'not_shown' || value === 99) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function evalCondition(cond: Condition | undefined, a: Answers): boolean {
  if (!cond) return true;
  switch (cond.op) {
    case 'eq':
      return same(a[cond.q], cond.value);
    case 'neq':
      return !same(a[cond.q], cond.value);
    case 'in':
      return cond.value.some((v) => same(a[cond.q], v));
    case 'notIn':
      return !cond.value.some((v) => same(a[cond.q], v));
    case 'includes': {
      const list = a[cond.q];
      return Array.isArray(list) && list.includes(cond.value);
    }
    case 'notIncludes': {
      const list = a[cond.q];
      return !(Array.isArray(list) && list.includes(cond.value));
    }
    case 'answered':
      return isAnswered(a[cond.q]);
    case 'unanswered':
      return !isAnswered(a[cond.q]);
    case 'and':
      return cond.args.every((c) => evalCondition(c, a));
    case 'or':
      return cond.args.some((c) => evalCondition(c, a));
    default:
      return true;
  }
}

/** Every question code a condition reads. */
export function conditionRefs(cond: Condition | undefined, into: Set<string> = new Set()): Set<string> {
  if (!cond) return into;
  if ('args' in cond) {
    cond.args.forEach((c) => conditionRefs(c, into));
  } else {
    into.add(cond.q);
  }
  return into;
}

/** Remove every leaf that reads `code`. Returns undefined when nothing is left. */
export function dropConditionRef(cond: Condition | undefined, code: string): Condition | undefined {
  if (!cond) return undefined;
  if ('args' in cond) {
    const args = cond.args
      .map((c) => dropConditionRef(c, code))
      .filter((c): c is Condition => Boolean(c));
    if (args.length === 0) return undefined;
    if (args.length === 1) return args[0];
    return { ...cond, args };
  }
  return cond.q === code ? undefined : cond;
}

/** Rename a question code inside a condition. */
export function renameConditionRef(
  cond: Condition | undefined,
  from: string,
  to: string,
): Condition | undefined {
  if (!cond) return undefined;
  if ('args' in cond) {
    return { ...cond, args: cond.args.map((c) => renameConditionRef(c, from, to) as Condition) };
  }
  return cond.q === from ? { ...cond, q: to } : cond;
}

// ---- lookups ---------------------------------------------------------------

export function questionsOfStep(inst: Instrument, stepId: string): QuestionDef[] {
  return inst.questions.filter((q) => q.stepId === stepId);
}

export function findQuestion(inst: Instrument, code: string): QuestionDef | undefined {
  return inst.questions.find((q) => q.code === code);
}

export function isRequired(q: QuestionDef): boolean {
  return q.required ?? !(q.type === 'text' || q.type === 'number');
}

export function questionVisible(q: QuestionDef, a: Answers): boolean {
  return evalCondition(q.showWhen, a);
}

export function visibleQuestions(inst: Instrument, stepId: string, a: Answers): QuestionDef[] {
  return questionsOfStep(inst, stepId).filter((q) => questionVisible(q, a));
}

export function visibleOptions(q: QuestionDef, a: Answers): OptionDef[] {
  return (q.options ?? []).filter((o) => evalCondition(o.showWhen, a));
}

export function resolveText(q: QuestionDef, a: Answers): string {
  const hit = q.textVariants?.find((v) => evalCondition(v.when, a));
  return hit ? hit.text : q.text;
}

export function resolveStepTitle(step: StepDef, a: Answers): string {
  const hit = step.variants?.find((v) => v.title && evalCondition(v.when, a));
  return hit?.title ?? step.title;
}

export function resolveStepSubtitle(step: StepDef, a: Answers): string {
  const hit = step.variants?.find((v) => v.subtitle && evalCondition(v.when, a));
  return hit?.subtitle ?? step.subtitle ?? '';
}

/** 1-based positions (in the full step list) of steps with at least one visible question. */
export function activeStepNumbers(inst: Instrument, a: Answers): number[] {
  const out: number[] = [];
  inst.steps.forEach((step, index) => {
    if (visibleQuestions(inst, step.id, a).length > 0) out.push(index + 1);
  });
  return out;
}

/** Next active step after `current` (1-based), or null when the survey is finished. */
export function nextStepNumber(inst: Instrument, a: Answers, current: number): number | null {
  return activeStepNumbers(inst, a).find((n) => n > current) ?? null;
}

export function previousStepNumber(inst: Instrument, a: Answers, current: number): number | null {
  const before = activeStepNumbers(inst, a).filter((n) => n < current);
  return before.length ? before[before.length - 1]! : null;
}

/**
 * Where the respondent is in the survey, for the progress bar. Later steps count when they
 * are shown already, or when what decides them has not been answered yet, so the total
 * does not jump around while the respondent moves through the early steps.
 */
export function stepProgress(
  inst: Instrument,
  a: Answers,
  current: number,
): { position: number; total: number } {
  const stepOf = new Map<string, number>();
  inst.questions.forEach((q) => stepOf.set(q.code, inst.steps.findIndex((st) => st.id === q.stepId) + 1));
  let position = 0;
  let total = 0;
  inst.steps.forEach((step, index) => {
    const n = index + 1;
    const own = questionsOfStep(inst, step.id);
    const shown = own.some((q) => questionVisible(q, a));
    const undecided =
      n > current &&
      own.some((q) =>
        Array.from(conditionRefs(q.showWhen)).some((ref) => (stepOf.get(ref) ?? 0) >= current),
      );
    if (shown || undecided) total += 1;
    if (n <= current && shown) position += 1;
  });
  return { position: Math.max(1, position), total: Math.max(1, total, position) };
}

export function firstStepNumber(inst: Instrument, a: Answers): number {
  return activeStepNumbers(inst, a)[0] ?? 1;
}

// ---- normalization ---------------------------------------------------------

function pruneNested(q: QuestionDef, next: Answers): void {
  const detailsCode = `${q.code}Details`;
  const otherCode = `${q.code}_other`;
  const selected = Array.isArray(next[q.code]) ? (next[q.code] as string[]) : [];
  if (!selected.includes('other')) delete next[otherCode];
  if (selected.length === 0 || selected.includes('none_of_these')) {
    delete next[detailsCode];
    return;
  }
  const details: Record<string, unknown> = {
    ...((next[detailsCode] as Record<string, unknown> | undefined) ?? {}),
  };
  for (const category of q.categories ?? []) {
    const otherKey = `${category.id}_other`;
    if (!selected.includes(category.id)) {
      delete details[category.id];
      delete details[otherKey];
      continue;
    }
    const picks = Array.isArray(details[category.id]) ? (details[category.id] as string[]) : [];
    if (!picks.includes('Other')) delete details[otherKey];
  }
  next[detailsCode] = details;
}

/** Drop answers a branch change made invalid, and write skip codes for skipped items. */
export function normalizeAnswers<T extends Answers>(inst: Instrument, input: T): T {
  const next: Answers = { ...input };

  for (let pass = 0; pass < 6; pass += 1) {
    const before = JSON.stringify(next);

    for (const q of inst.questions) {
      const shown = questionVisible(q, next);

      if (!shown) {
        if (q.skipCode !== undefined && evalCondition(q.skipCodeWhen, next)) {
          next[q.code] = q.skipCode;
        } else {
          delete next[q.code];
        }
        if (q.type === 'nested_multi') {
          delete next[`${q.code}Details`];
          delete next[`${q.code}_other`];
        }
        continue;
      }

      const value = next[q.code];
      if (SENTINELS.includes(value)) {
        delete next[q.code];
        continue;
      }
      if (value === undefined) {
        if (q.type === 'nested_multi') pruneNested(q, next);
        continue;
      }

      if (q.type === 'single') {
        const allowed = visibleOptions(q, next);
        const wrongType = q.numericValues ? typeof value !== 'number' : typeof value !== 'string';
        if (wrongType || !allowed.some((o) => String(o.id) === String(value))) delete next[q.code];
      } else if (q.type === 'likert') {
        if (typeof value !== 'number' || value < 1 || value > 5) delete next[q.code];
      } else if (q.type === 'multi') {
        if (!Array.isArray(value)) {
          delete next[q.code];
        } else {
          const allowed = new Set(visibleOptions(q, next).map((o) => o.id));
          next[q.code] = value.filter((id) => allowed.has(String(id)));
        }
      } else if (q.type === 'nested_multi') {
        pruneNested(q, next);
      }
    }

    if (JSON.stringify(next) === before) break;
  }

  return next as T;
}

// ---- validation ------------------------------------------------------------

function missing(value: unknown): boolean {
  return value == null || value === '' || SENTINELS.includes(value);
}

export function validateStep(inst: Instrument, stepNumber: number, a: Answers): Record<string, string> {
  const errors: Record<string, string> = {};
  const step = inst.steps[stepNumber - 1];
  if (!step) return errors;

  for (const q of visibleQuestions(inst, step.id, a)) {
    const value = a[q.code];
    const required = isRequired(q);

    if (q.type === 'single') {
      const allowed = visibleOptions(q, a).some((o) => String(o.id) === String(value));
      if (required && (missing(value) || !allowed)) errors[q.code] = CHOOSE_ONE;
    } else if (q.type === 'likert') {
      const ok = typeof value === 'number' && value >= 1 && value <= 5;
      if (required && !ok) errors[q.code] = CHOOSE_ONE;
    } else if (q.type === 'multi') {
      const list = Array.isArray(value) ? (value as string[]) : [];
      if (required && list.length === 0) errors[q.code] = CHOOSE_ANY;
      else if (q.maxSelect != null) {
        const others = list.filter((id) => id !== q.exclusiveId);
        if (others.length > q.maxSelect) errors[q.code] = `Please select at most ${q.maxSelect}.`;
      }
    } else if (q.type === 'text') {
      const text = typeof value === 'string' ? value : '';
      if (required && text.trim() === '') errors[q.code] = WRITE_ANSWER;
      else if (q.maxLength != null && text.length > q.maxLength) {
        errors[q.code] = `Please use ${q.maxLength} characters or fewer.`;
      }
    } else if (q.type === 'number') {
      const min = q.min ?? 0;
      const max = q.max ?? 1_000_000;
      if (value == null || value === '') {
        if (required) errors[q.code] = `Please enter a whole number from ${min} to ${max}.`;
      } else if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
        errors[q.code] = `Please enter a whole number from ${min} to ${max}.`;
      }
    } else if (q.type === 'nested_multi') {
      const list = Array.isArray(value) ? (value as string[]) : [];
      if (required && list.length === 0) errors[q.code] = CHOOSE_ANY;
      const other = a[`${q.code}_other`];
      if (typeof other === 'string' && other.length > 200) {
        errors[`${q.code}_other`] = 'Please use 200 characters or fewer.';
      }
    }
  }

  return errors;
}

// ---- review ---------------------------------------------------------------

export interface ReviewSection {
  sectionCode: string;
  title: string;
  stepNumber: number;
  items: Array<{ code: string; question: string; answer: string }>;
}

export const AGREEMENT_LABELS = ['', 'Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
export const LIKELIHOOD_LABELS = ['', 'Very unlikely', 'Unlikely', 'Not sure', 'Likely', 'Very likely'];

function answerText(q: QuestionDef, a: Answers): string {
  const value = a[q.code];
  if (missing(value)) return '';
  const label = (id: unknown) => {
    const hit = (q.options ?? []).find((o) => String(o.id) === String(id));
    return hit ? hit.label : String(id);
  };

  switch (q.type) {
    case 'single':
      return label(value);
    case 'likert': {
      const scale = q.scale === 'likelihood' ? LIKELIHOOD_LABELS : AGREEMENT_LABELS;
      return typeof value === 'number' && value >= 1 && value <= 5 ? `${value} — ${scale[value]}` : '';
    }
    case 'multi':
      return Array.isArray(value) ? value.map(label).join(', ') : '';
    case 'text':
    case 'number':
      return String(value);
    case 'nested_multi': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const details = (a[`${q.code}Details`] as Record<string, unknown> | undefined) ?? {};
      const otherText = a[`${q.code}_other`];
      return selected
        .map((id) => {
          const category = (q.categories ?? []).find((c) => c.id === id);
          if (!category) {
            if (id === 'none_of_these') return 'None of these';
            if (id === 'other') return `Other${otherText ? `: ${String(otherText)}` : ''}`;
            return id;
          }
          const picks = Array.isArray(details[category.id]) ? (details[category.id] as string[]) : [];
          const other = details[`${category.id}_other`];
          const detail = picks
            .map((pick) => (pick === 'Other' && other ? `Other: ${String(other)}` : pick))
            .join('; ');
          return detail ? `${category.label} (${detail})` : category.label;
        })
        .join('; ');
    }
    default:
      return '';
  }
}

export function buildReviewSections(inst: Instrument, a: Answers): ReviewSection[] {
  const sections: ReviewSection[] = [];
  const byCode = new Map<string, ReviewSection>();

  inst.steps.forEach((step, index) => {
    for (const q of visibleQuestions(inst, step.id, a)) {
      const answer = answerText(q, a);
      if (!answer) continue;
      const meta = q.review ?? step.review ?? { code: step.id, title: step.title };
      let section = byCode.get(meta.code);
      if (!section) {
        section = { sectionCode: meta.code, title: meta.title, stepNumber: index + 1, items: [] };
        byCode.set(meta.code, section);
        sections.push(section);
      }
      section.items.push({ code: q.code, question: resolveText(q, a), answer });
    }
  });

  return sections;
}

// ---- helpers for the editor -------------------------------------------------

export function cloneInstrument(inst: Instrument): Instrument {
  return JSON.parse(JSON.stringify(inst)) as Instrument;
}

/** Keep the question array grouped in step order, preserving order inside each step. */
export function sortQuestionsByStep(inst: Instrument): Instrument {
  const order = new Map(inst.steps.map((s, i) => [s.id, i]));
  const questions = inst.questions
    .map((q, i) => ({ q, i }))
    .sort((x, y) => (order.get(x.q.stepId) ?? 0) - (order.get(y.q.stepId) ?? 0) || x.i - y.i)
    .map((x) => x.q);
  return { ...inst, questions };
}

function choiceText(q: QuestionDef | undefined, id: Primitive): string {
  if (!q) return String(id);
  if (q.type === 'likert') {
    const labels = q.scale === 'likelihood' ? LIKELIHOOD_LABELS : AGREEMENT_LABELS;
    const label = labels[Number(id)];
    return label ? `${id} (${label})` : String(id);
  }
  const category = q.categories?.find((c) => c.id === String(id));
  if (category) return category.label;
  const option = q.options?.find((o) => String(o.id) === String(id));
  return option ? option.label : String(id);
}

/** A rule as a plain sentence, using the answer wording respondents see. */
export function describeConditionPlain(cond: Condition | undefined, inst: Instrument, top = true): string {
  if (!cond) return 'always';
  if ('args' in cond) {
    const parts = cond.args.map((c) => describeConditionPlain(c, inst, false));
    const joined = parts.join(cond.op === 'and' ? ' and ' : ' or ');
    return !top && parts.length > 1 ? `(${joined})` : joined;
  }
  const source = findQuestion(inst, cond.q);
  const name = cond.q;
  const label = (v: Primitive) => choiceText(source, v);
  switch (cond.op) {
    case 'eq':
      return `${name} is “${label(cond.value)}”`;
    case 'neq':
      return `${name} is not “${label(cond.value)}”`;
    case 'in':
      return `${name} is one of ${cond.value.map((v) => `“${label(v)}”`).join(', ')}`;
    case 'notIn':
      return `${name} is none of ${cond.value.map((v) => `“${label(v)}”`).join(', ')}`;
    case 'includes':
      return `${name} includes “${label(cond.value)}”`;
    case 'notIncludes':
      return `${name} does not include “${label(cond.value)}”`;
    case 'answered':
      return `${name} has an answer`;
    case 'unanswered':
      return `${name} is left blank`;
    default:
      return '';
  }
}
