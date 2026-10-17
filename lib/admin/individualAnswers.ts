import {
  buildReviewSections,
  resolveText,
  visibleQuestions,
  type Answers,
  type Instrument,
} from '@/survey/model';

export interface AnswerRow {
  code: string;
  question: string;
  /** null = the respondent saw the question but gave no answer. */
  answer: string | null;
}

export interface AnswerGroup {
  id: string;
  title: string;
  rows: AnswerRow[];
}

export interface IndividualAnswers {
  groups: AnswerGroup[];
  /** Questions this respondent never saw because of branching. */
  notShownCount: number;
}

/**
 * Every question the respondent was shown, in survey order and grouped by section, with
 * their answer in the wording they saw. Read-only view over the same rules the survey uses.
 */
export function buildIndividualAnswers(inst: Instrument, answers: Answers): IndividualAnswers {
  const answered = new Map<string, string>();
  for (const section of buildReviewSections(inst, answers)) {
    for (const item of section.items) answered.set(item.code, item.answer);
  }

  const groups: AnswerGroup[] = [];
  const byId = new Map<string, AnswerGroup>();
  let shown = 0;

  for (const step of inst.steps) {
    const questions = visibleQuestions(inst, step.id, answers);
    if (questions.length === 0) continue;
    for (const q of questions) {
      const meta = q.review ?? step.review ?? { code: step.id, title: step.title };
      let group = byId.get(meta.code);
      if (!group) {
        group = { id: meta.code, title: meta.title, rows: [] };
        byId.set(meta.code, group);
        groups.push(group);
      }
      group.rows.push({
        code: q.code,
        question: resolveText(q, answers),
        answer: answered.get(q.code) ?? null,
      });
      shown += 1;
    }
  }

  return { groups, notShownCount: Math.max(0, inst.questions.length - shown) };
}
