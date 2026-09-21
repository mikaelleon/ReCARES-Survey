'use client';

import { Button } from '@/components/ui/Button';
import {
  SCREENING_FIELDS,
  SECTIONS,
  S2_FIELDS,
  S2_LIKERT,
} from '@/survey/content';

export type ReviewAnswerRow = {
  label: string;
  value: string;
};

export type ReviewSectionCardModel = {
  id: string;
  n: string;
  t: string;
  /** answered = has Q&A; skipped = gated out; pending = shown but items not drafted yet */
  kind: 'answered' | 'skipped' | 'pending';
  answers: ReviewAnswerRow[];
  /** Jump target when this section has a real step in the flow */
  edit?: { stepIndex: number; label: string };
};

type Gates = {
  perimeter: boolean;
  s4: boolean;
  s5: boolean;
  s7a: boolean;
  s7b: boolean;
};

type ReviewContext = {
  sc: Record<string, string>;
  multi: Record<string, Record<string, boolean>>;
  s2: Record<string, string | number>;
  gates: Gates;
  answerLabel: (
    id: string,
    sc: Record<string, string>,
    multi: Record<string, Record<string, boolean>>,
  ) => string;
};

/**
 * Step index + button label for sections that already have a survey step.
 * Add an entry here when a new section step is wired into STEPS.
 */
const EDIT_BY_SECTION_ID: Partial<
  Record<(typeof SECTIONS)[number]['id'], { stepIndex: number; label: string }>
> = {
  screening: { stepIndex: 0, label: 'Edit Screening' },
  s2: { stepIndex: 2, label: 'Edit HOA access and office hours' },
  s4: { stepIndex: 3, label: 'Edit Household and personal safety' },
};

type AnswerBuilder = (ctx: ReviewContext) => ReviewAnswerRow[] | null;

/**
 * Per-section answer extractors. Return rows for drafted sections, or null
 * when the section is shown but its items are not written yet.
 * Adding a new finalized section = add a builder keyed by SECTIONS id.
 */
const ANSWER_BUILDERS: Partial<Record<(typeof SECTIONS)[number]['id'], AnswerBuilder>> = {
  screening: ({ sc, multi, answerLabel }) =>
    SCREENING_FIELDS.filter(
      (field) => !('when' in field) || !field.when || field.when(sc),
    ).map((field) => ({
      label: field.label,
      value: answerLabel(field.id, sc, multi),
    })),

  s2: ({ s2 }) => [
    ...S2_LIKERT.map((item, index) => ({
      label: `Section 2 item ${index + 1} — ${item.labels[0]} to ${item.labels[4]}`,
      value: s2[item.id] ? `${String(s2[item.id])} of 5` : 'Not answered',
    })),
    ...S2_FIELDS.map((field) => ({
      label: field.label,
      value:
        s2[field.id] != null && s2[field.id] !== '' ? String(s2[field.id]) : 'Not answered',
    })),
  ],

  // s4 has a step but no drafted items yet — null keeps the pending card + Edit.
  s4: () => null,
};

function isSectionShown(
  section: (typeof SECTIONS)[number],
  gates: Gates,
): boolean {
  if (section.id === 'screening') return true;
  if ('always' in section && section.always) return true;
  if ('key' in section && section.key) {
    return !!gates[section.key as keyof Gates];
  }
  return false;
}

/** Build one review card model per SECTIONS entry, matching survey-plan numbering. */
export function buildReviewSectionCards(ctx: ReviewContext): ReviewSectionCardModel[] {
  return SECTIONS.map((section) => {
    const shown = isSectionShown(section, ctx.gates);
    const edit = EDIT_BY_SECTION_ID[section.id];

    if (!shown) {
      return {
        id: section.id,
        n: section.n,
        t: section.t,
        kind: 'skipped' as const,
        answers: [],
      };
    }

    const builder = ANSWER_BUILDERS[section.id];
    const answers = builder ? builder(ctx) : null;

    if (answers && answers.length > 0) {
      return {
        id: section.id,
        n: section.n,
        t: section.t,
        kind: 'answered' as const,
        answers,
        edit,
      };
    }

    return {
      id: section.id,
      n: section.n,
      t: section.t,
      kind: 'pending' as const,
      answers: [],
      edit,
    };
  });
}

export interface ReviewSectionCardsProps {
  cards: ReviewSectionCardModel[];
  onEdit: (stepIndex: number) => void;
  onEditScreening: () => void;
}

/**
 * Per-section review cards for the Review and submit step.
 */
export function ReviewSectionCards({
  cards,
  onEdit,
  onEditScreening,
}: ReviewSectionCardsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--text-section-heading)',
        }}
      >
        Your answers
      </div>

      {cards.map((card) => (
        <div
          key={card.id}
          style={{
            background: 'var(--surface-1)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 'clamp(20px, 3vw, 32px)',
            animation: 'riseIn 360ms ease-in-out both',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-body)',
              marginBottom: 12,
              textWrap: 'pretty',
            }}
          >
            {card.n}. {card.t}
          </div>

          {card.kind === 'skipped' ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--text-caption)',
                }}
              >
                Skipped (stored as not_shown).
              </p>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--text-caption)',
                }}
              >
                To change this,{' '}
                <button
                  type="button"
                  onClick={onEditScreening}
                  style={{
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-body)',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: 'var(--font-sans)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  edit your screening answers
                </button>
                .
              </p>
            </>
          ) : null}

          {card.kind === 'pending' ? (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.5,
                color: 'var(--text-caption)',
              }}
            >
              Items for this section are not drafted yet.
            </p>
          ) : null}

          {card.kind === 'answered'
            ? card.answers.map((row) => (
                <div
                  key={`${card.id}-${row.label}`}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      flex: '1 1 220px',
                      minWidth: 0,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: 'var(--text-caption)',
                      textWrap: 'pretty',
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      flex: '1 1 140px',
                      minWidth: 0,
                      fontSize: 16,
                      color: 'var(--text-body)',
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              ))
            : null}

          {card.kind !== 'skipped' && card.edit ? (
            <div style={{ marginTop: 20 }}>
              <Button variant="secondary" onClick={() => onEdit(card.edit!.stepIndex)}>
                {card.edit.label}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
