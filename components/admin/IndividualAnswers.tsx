'use client';

import { useMemo } from 'react';
import { buildIndividualAnswers } from '@/lib/admin/individualAnswers';
import { useResponseInstrument } from '@/lib/admin/useResponseInstrument';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import type { Answers } from '@/survey/model';

/**
 * What this respondent filled out: each question they were shown, grouped by survey
 * section, with their answer. Sections are native disclosures so they work by keyboard.
 */
export function IndividualAnswers({ record }: { record: SampleRecord }) {
  const { instrument, exact } = useResponseInstrument(record.instrumentVersion);
  const hasAnswers = Boolean(record.answers && Object.keys(record.answers).length > 0);
  const result = useMemo(
    () => (hasAnswers ? buildIndividualAnswers(instrument, (record.answers ?? {}) as Answers) : null),
    [hasAnswers, instrument, record.answers],
  );

  if (!result) {
    return (
      <p className="gf-individual__empty">
        No question-by-question answers are stored for this response.
      </p>
    );
  }

  const answered = result.groups.reduce(
    (n, g) => n + g.rows.filter((r) => r.answer !== null).length,
    0,
  );
  const total = result.groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div className="gf-answers">
      <p className="gf-answers__summary">
        {answered} of {total} questions answered
        {result.notShownCount > 0
          ? ` · ${result.notShownCount} not shown to this respondent`
          : ''}
      </p>
      {!exact && record.instrumentVersion && record.instrumentVersion !== instrument.version ? (
        <p className="gf-answers__note" role="status">
          Showing the original v1 wording, because version {record.instrumentVersion} could not be
          read.
        </p>
      ) : null}

      {result.groups.map((group) => (
        <details key={group.id} className="gf-answers__group" open>
          <summary className="gf-answers__head">
            <span className="gf-answers__title">{group.title}</span>
            <span className="gf-answers__count">
              {group.rows.filter((r) => r.answer !== null).length}/{group.rows.length}
            </span>
          </summary>
          <dl className="gf-answers__list">
            {group.rows.map((row) => (
              <div key={row.code} className="gf-answers__row">
                <dt>
                  <span className="gf-answers__code">{row.code}</span>
                  {row.question}
                </dt>
                <dd className={row.answer === null ? 'is-empty' : ''}>
                  {row.answer ?? 'No answer'}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}
