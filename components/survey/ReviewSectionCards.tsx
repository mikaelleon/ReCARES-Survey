'use client';

import { Button } from '@/components/ui/Button';
import { SCREENING_FIELDS, SECTIONS } from '@/survey/content';
import {
  formatItemAnswer,
  sectionContentShown,
  sectionItems,
  type SectionGateFlags,
} from '@/survey/questionnaire';
import type { AnswerValue } from '@/components/survey/SectionItems';

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
  edit?: { stepKey: string; label: string };
};

type ReviewContext = {
  sc: Record<string, string>;
  multi: Record<string, Record<string, boolean>>;
  answers: Record<string, AnswerValue>;
  gates: SectionGateFlags;
  extended: boolean;
  answerLabel: (
    id: string,
    sc: Record<string, string>,
    multi: Record<string, Record<string, boolean>>,
  ) => string;
};

function isSectionShown(section: (typeof SECTIONS)[number], gates: SectionGateFlags): boolean {
  if (section.id === 'screening') return true;
  return sectionContentShown(section.id, gates);
}

/** Build one review card model per SECTIONS entry, matching survey-plan numbering. */
export function buildReviewSectionCards(ctx: ReviewContext): ReviewSectionCardModel[] {
  return SECTIONS.map((section) => {
    const shown = isSectionShown(section, ctx.gates);
    const edit =
      section.id === 'screening'
        ? { stepKey: 'screening', label: 'Edit Screening' }
        : { stepKey: section.id, label: `Edit ${section.t}` };

    if (!shown) {
      return {
        id: section.id,
        n: section.n,
        t: section.t,
        kind: 'skipped' as const,
        answers: [],
      };
    }

    const answers =
      section.id === 'screening'
        ? SCREENING_FIELDS.filter(
            (field) => !('when' in field) || !field.when || field.when(ctx.sc),
          ).map((field) => ({
            label: field.label,
            value: ctx.answerLabel(field.id, ctx.sc, ctx.multi),
          }))
        : sectionItems(section.id, ctx.extended).map((item) => ({
            label: item.q,
            value: formatItemAnswer(item, ctx.answers[item.id]),
          }));

    if (answers.length > 0) {
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
  onEdit: (stepKey: string) => void;
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
              <Button variant="secondary" onClick={() => onEdit(card.edit!.stepKey)}>
                {card.edit.label}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
