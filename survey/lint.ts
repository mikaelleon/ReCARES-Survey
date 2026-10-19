import { CORE_QUESTION_CODES } from '@/survey/defaultInstrument';
import {
  conditionRefs,
  findQuestion,
  type Condition,
  type Instrument,
  type QuestionDef,
} from '@/survey/model';

export interface LintIssue {
  level: 'error' | 'warning';
  message: string;
  /** Question code or step id the issue belongs to. */
  target?: string;
}

/** Core codes a specific version has chosen to retire. Draft v2 drops F2 with the closure permit topic. */
const RETIRED_CORE_BY_VERSION: Record<string, string[]> = { v2: ['F2'] };

const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,29}$/;

function leaves(cond: Condition | undefined, out: Array<Exclude<Condition, { args: Condition[] }>> = []) {
  if (!cond) return out;
  if ('args' in cond) cond.args.forEach((c) => leaves(c, out));
  else out.push(cond);
  return out;
}

/** Problems that make an instrument unsafe to publish (errors) or worth a second look (warnings). */
export function lintInstrument(inst: Instrument): LintIssue[] {
  const issues: LintIssue[] = [];
  const add = (level: LintIssue['level'], message: string, target?: string) =>
    issues.push({ level, message, target });

  if (inst.steps.length === 0) add('error', 'The survey has no steps.');

  const stepIds = new Set<string>();
  inst.steps.forEach((step) => {
    if (stepIds.has(step.id)) add('error', `Two steps share the id ${step.id}.`, step.id);
    stepIds.add(step.id);
    if (!step.title.trim()) add('error', `Step ${step.id} needs a title.`, step.id);
  });

  const order = new Map<string, number>();
  inst.questions.forEach((q, index) => order.set(q.code, index));

  const seen = new Set<string>();

  for (const q of inst.questions) {
    if (!CODE_PATTERN.test(q.code)) {
      add('error', `"${q.code}" is not a valid code. Start with a letter, then letters, numbers, or underscores.`, q.code);
    }
    if (seen.has(q.code)) add('error', `Two questions share the code ${q.code}.`, q.code);
    seen.add(q.code);

    if (!stepIds.has(q.stepId)) add('error', `${q.code} sits in a step that does not exist.`, q.code);
    if (!q.text.trim()) add('error', `${q.code} has no question text.`, q.code);

    if (q.type === 'single' || q.type === 'multi') {
      const options = q.options ?? [];
      if (options.length < 2) add('error', `${q.code} needs at least two choices.`, q.code);
      const ids = new Set<string>();
      for (const o of options) {
        if (!String(o.id).trim()) add('error', `${q.code} has a choice with no id.`, q.code);
        if (ids.has(String(o.id))) add('error', `${q.code} repeats the choice id ${o.id}.`, q.code);
        ids.add(String(o.id));
        if (!o.label.trim()) add('error', `${q.code} has a choice with no label.`, q.code);
      }
      if (q.exclusiveId && !ids.has(q.exclusiveId)) {
        add('error', `${q.code}: the "none of these" choice ${q.exclusiveId} is not one of its choices.`, q.code);
      }
      if (q.type === 'multi' && q.maxSelect != null && q.maxSelect < 1) {
        add('error', `${q.code}: the selection limit must be at least 1.`, q.code);
      }
    }
    if (q.type === 'nested_multi' && (q.categories ?? []).length === 0) {
      add('error', `${q.code} needs at least one category.`, q.code);
    }
    if (q.type === 'number' && q.min != null && q.max != null && q.min > q.max) {
      add('error', `${q.code}: the minimum is above the maximum.`, q.code);
    }
    if (q.type === 'text' && (q.maxLength ?? 0) < 1) {
      add('warning', `${q.code} has no length limit set; 300 characters will be used.`, q.code);
    }

    // Every condition may only read questions that appear earlier in the survey.
    const checkRefs = (cond: Condition | undefined, where: string) => {
      for (const ref of Array.from(conditionRefs(cond))) {
        const target = findQuestion(inst, ref);
        if (!target) {
          add('error', `${q.code} ${where} reads ${ref}, which does not exist.`, q.code);
          continue;
        }
        if (ref === q.code && where !== 'hint' && where !== 'follow-up form') {
          add('error', `${q.code} ${where} reads its own answer.`, q.code);
          continue;
        }
        // Questions are kept sorted by step, so a larger index means later in the survey.
        if ((order.get(ref) ?? 0) > (order.get(q.code) ?? 0)) {
          add('error', `${q.code} ${where} depends on ${ref}, which comes later. Move ${ref} before ${q.code}.`, q.code);
        }
      }
      for (const leaf of leaves(cond)) {
        const target = findQuestion(inst, leaf.q);
        if (!target || !target.options?.length) continue;
        const known = new Set(target.options.map((o) => String(o.id)));
        const values =
          leaf.op === 'eq' || leaf.op === 'neq' || leaf.op === 'includes' || leaf.op === 'notIncludes'
            ? [leaf.value]
            : leaf.op === 'in' || leaf.op === 'notIn'
              ? leaf.value
              : [];
        for (const value of values) {
          if (!known.has(String(value))) {
            add('warning', `${q.code} ${where} expects ${leaf.q} = ${value}, which is not one of its choices.`, q.code);
          }
        }
      }
    };

    checkRefs(q.showWhen, 'visibility');
    q.options?.forEach((o) => checkRefs(o.showWhen, `choice ${o.id}`));
    q.textVariants?.forEach((v) => checkRefs(v.when, 'wording'));
    q.hints?.forEach((h) => checkRefs(h.when, 'hint'));
    checkRefs(q.skipCodeWhen, 'skip rule');
    checkRefs(q.attachForm?.when, 'follow-up form');

    if (q.skipCode !== undefined && !q.showWhen) {
      add('warning', `${q.code} has a skip code but is always shown, so it never applies.`, q.code);
    }
  }

  for (const step of inst.steps) {
    const own = inst.questions.filter((q) => q.stepId === step.id);
    if (own.length === 0) add('warning', `Step "${step.title}" has no questions and will never be shown.`, step.id);
    step.notes?.forEach((n) => {
      if (n.after && !findQuestion(inst, n.after)) {
        add('error', `A note in "${step.title}" points at ${n.after}, which does not exist.`, step.id);
      }
    });
  }

  const retired = RETIRED_CORE_BY_VERSION[inst.version] ?? [];
  for (const code of CORE_QUESTION_CODES.filter((c) => !retired.includes(c))) {
    if (!findQuestion(inst, code)) {
      add('error', `${code} is required by the dashboard and cannot be removed.`, code);
    }
  }

  return issues;
}

export function isCoreCode(code: string): boolean {
  return CORE_QUESTION_CODES.includes(code);
}

export function nextQuestionCode(inst: Instrument, prefix = 'Q'): string {
  const used = new Set(inst.questions.map((q) => q.code));
  let n = 1;
  while (used.has(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

export function nextStepId(inst: Instrument): string {
  const used = new Set(inst.steps.map((s) => s.id));
  let n = inst.steps.length + 1;
  while (used.has(`s${n}`)) n += 1;
  return `s${n}`;
}

export function blankQuestion(code: string, stepId: string, type: QuestionDef['type'] = 'single'): QuestionDef {
  const base: QuestionDef = { code, stepId, type, text: 'New question' };
  if (type === 'single' || type === 'multi') {
    return {
      ...base,
      options: [
        { id: 'option_1', label: 'Option 1' },
        { id: 'option_2', label: 'Option 2' },
      ],
    };
  }
  if (type === 'likert') return { ...base, scale: 'agreement' };
  if (type === 'text') return { ...base, maxLength: 300 };
  if (type === 'number') return { ...base, min: 0, max: 100 };
  return {
    ...base,
    exclusiveId: 'none_of_these',
    categories: [{ id: 'category_1', label: 'Category 1', items: ['Item 1', 'Other'] }],
    options: [
      { id: 'none_of_these', label: 'None of these' },
      { id: 'other', label: 'Other' },
    ],
  };
}
