import { conditionRefs, type Condition, type QuestionDef } from '@/survey/model';

/**
 * Residents who say they have never done an HOA transaction (A11) have nothing to report about
 * how HOA service access, ID registration, or the homeowner and tenant experience works for
 * them, so those sections are not shown at all.
 */
export const NO_TRANSACTION_YET = 'no_transaction_yet';

export const HAS_DONE_TRANSACTION: Condition = { op: 'neq', q: 'A11', value: NO_TRANSACTION_YET };

/**
 * Current HOA service access (s7), Registration, ID verification and data privacy (s10),
 * and the Homeowner / Tenant step (s11).
 */
export const TRANSACTION_GATED_STEPS: readonly string[] = ['s7', 's10', 's11'];

/**
 * Add the "has done an HOA transaction" rule to a question in one of the gated steps.
 * Safe to call twice: a question that already reads A11 is returned as it is.
 * `skipCode` is only filled in for instruments that store a value for hidden questions.
 */
export function gateByTransaction(q: QuestionDef, skipCode?: QuestionDef['skipCode']): QuestionDef {
  if (!TRANSACTION_GATED_STEPS.includes(q.stepId)) return q;
  if (q.showWhen && conditionRefs(q.showWhen).has('A11')) return q;
  const gated: QuestionDef = {
    ...q,
    showWhen: q.showWhen ? { op: 'and', args: [q.showWhen, HAS_DONE_TRANSACTION] } : HAS_DONE_TRANSACTION,
  };
  if (skipCode !== undefined && gated.skipCode === undefined) gated.skipCode = skipCode;
  return gated;
}
