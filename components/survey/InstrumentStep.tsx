'use client';

import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { InterviewInvitationForm } from '@/components/survey/InterviewInvitationForm';
import {
  GroupedSingleChoice,
  QuestionSubtitle,
  LikertChoice,
  MultiChoice,
  NumberField,
  REQUIRED_NOTE,
  SingleChoice,
  TextField,
} from '@/components/survey/SurveyFields';
import { optionIcon } from '@/components/survey/optionIcons';
import { useT } from '@/components/survey/SurveyLanguage';
import { optionDisabled, toggleMulti } from '@/survey/exclusive';
import { o1CategoryNote, o1ItemNote } from '@/survey/o1Notes';
import { optionNote } from '@/survey/optionNotes';
import { questionSubtitle } from '@/survey/subtitles';
import {
  NOT_APPLICABLE,
  evalCondition,
  resolveText,
  visibleOptions,
  visibleQuestions,
  type Answers,
  type Instrument,
  type QuestionDef,
  type StepDef,
} from '@/survey/model';

type Patch = Record<string, unknown>;

function hintFor(q: QuestionDef, a: Answers): string | undefined {
  const texts = (q.hints ?? []).filter((h) => evalCondition(h.when, a)).map((h) => h.text);
  return texts.length ? texts.join(' ') : undefined;
}

function Note({ text, kind }: { text: string; kind: 'intro' | 'hint' }) {
  const t = useT();
  const lines = text.split('\n');
  return (
    <p className={kind === 'hint' ? 'na-hint' : 'na-intro'}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? <br /> : null}
          {t(line)}
        </Fragment>
      ))}
    </p>
  );
}

/** Red asterisk inside the required-field sentence, so it matches the one on each question. */
function WithStar({ text }: { text: string }) {
  const parts = text.split('*');
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className="survey-guide__star" aria-hidden="true">
              *
            </span>
          ) : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/**
 * The "how this step works" lines, grouped into one panel instead of several loose
 * paragraphs. Each sentence is its own list item, so it can be scanned.
 */
function StepGuide({ items }: { items: ReactNode[] }) {
  if (items.length === 0) return null;
  return (
    <div className="survey-guide" role="note">
      <ul className="survey-guide__list">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function QuestionField({
  q,
  answers,
  error,
  errors,
  onPatch,
  followUps,
}: {
  q: QuestionDef;
  answers: Answers;
  error?: string;
  errors: Record<string, string>;
  onPatch: (patch: Patch) => void;
  followUps?: ReactNode;
}) {
  const text = resolveText(q, answers);
  const hint = hintFor(q, answers);
  const subtitle = questionSubtitle(q);
  const required = q.required ?? !(q.type === 'text' || q.type === 'number');
  const value = answers[q.code];
  // Each choice carries the sentence shown once it is selected, and an icon where one helps.
  const options = visibleOptions(q, answers).map((option) => ({
    ...option,
    note: option.note ?? optionNote(q.code, option.id),
    icon: optionIcon(q.code, option.id),
  }));

  if (q.type === 'single') {
    const current = value == null || typeof value === 'object' ? undefined : String(value);
    const choose = (id: string) => onPatch({ [q.code]: q.numericValues ? Number(id) : id });
    if (options.some((o) => o.group)) {
      return (
        <GroupedSingleChoice
          code={q.code}
          question={text}
          required={required}
          value={current === '99' ? undefined : current}
          options={options}
          error={error}
          hint={hint}
        subtitle={subtitle}
        after={followUps}
          className={q.cardClass}
          onChange={choose}
        />
      );
    }
    return (
      <SingleChoice
        code={q.code}
        question={text}
        required={required}
        columns={q.columns}
        value={current === '99' ? undefined : current}
        options={options}
        error={error}
        hint={hint}
        subtitle={subtitle}
        after={followUps}
        className={q.cardClass}
        onChange={choose}
      />
    );
  }

  if (q.type === 'likert') {
    return (
      <LikertChoice
        code={q.code}
        scale={q.scale ?? 'agreement'}
        question={text}
        required={required}
        allowNA={q.allowNA}
        value={typeof value === 'number' || value === NOT_APPLICABLE ? value : undefined}
        error={error}
        hint={hint}
        subtitle={subtitle}
        after={followUps}
        onChange={(next) => onPatch({ [q.code]: next })}
      />
    );
  }

  if (q.type === 'multi') {
    return (
      <MultiChoice
        code={q.code}
        question={text}
        required={required}
        value={Array.isArray(value) ? (value as string[]) : undefined}
        options={options}
        exclusiveId={q.exclusiveId}
        maxNonExclusive={q.maxSelect}
        error={error}
        hint={hint}
        subtitle={subtitle}
        after={followUps}
        onChange={(next) => onPatch({ [q.code]: next })}
      />
    );
  }

  if (q.type === 'text') {
    return (
      <TextField
        code={q.code}
        question={text}
        required={required}
        value={typeof value === 'string' ? value : undefined}
        maxLength={q.maxLength ?? 300}
        error={error}
        hint={hint}
        subtitle={subtitle}
        after={followUps}
        onChange={(next) => onPatch({ [q.code]: next })}
      />
    );
  }

  if (q.type === 'number') {
    return (
      <NumberField
        code={q.code}
        question={text}
        required={required}
        value={typeof value === 'number' ? value : undefined}
        min={q.min ?? 0}
        max={q.max ?? 1_000_000}
        error={error}
        hint={hint}
        subtitle={subtitle}
        after={followUps}
        onChange={(next) => onPatch({ [q.code]: next })}
      />
    );
  }

  return (
    <NestedChoiceField
      q={q}
      text={text}
      subtitle={subtitle}
      after={followUps}
      required={required}
      answers={answers}
      error={error}
      otherError={errors[`${q.code}_other`]}
      onPatch={onPatch}
    />
  );
}

/** Multi-choice whose choices open their own list of sub-choices. */
function NestedChoiceField({
  q,
  text,
  subtitle,
  after,
  required,
  answers,
  error,
  otherError,
  onPatch,
}: {
  q: QuestionDef;
  text: string;
  subtitle?: string;
  after?: ReactNode;
  required: boolean;
  answers: Answers;
  error?: string;
  otherError?: string;
  onPatch: (patch: Patch) => void;
}) {
  const t = useT();
  const detailsCode = `${q.code}Details`;
  const otherCode = `${q.code}_other`;
  const exclusiveId = q.exclusiveId;
  const selected = Array.isArray(answers[q.code]) ? (answers[q.code] as string[]) : [];
  const details = (answers[detailsCode] as Record<string, unknown> | undefined) ?? {};
  const categories = q.categories ?? [];
  const extra = visibleOptions(q, answers);
  const options = [...categories.map((c) => ({ id: c.id, label: c.label })), ...extra];

  const setDetails = (next: Record<string, unknown>) => onPatch({ [detailsCode]: next });

  return (
    <div className={error ? 'survey-card survey-card--error' : 'survey-card'}>
      <div className="na-q" id={`${q.code}-label`}>
        {t(text)}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </div>
      <QuestionSubtitle id={`${q.code}-label-sub`} text={subtitle} />
      <div className="na-checks" role="group" aria-labelledby={`${q.code}-label`}>
        {options.map((option) => {
          const checked = selected.includes(option.id);
          const disabled = optionDisabled(selected, option.id, exclusiveId);
          const category = categories.find((item) => item.id === option.id);
          const picks = category && Array.isArray(details[category.id]) ? (details[category.id] as string[]) : [];
          const otherKey = category ? `${category.id}_other` : null;
          return (
            <div key={option.id}>
              <label className="na-check">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onPatch({ [q.code]: toggleMulti(selected, option.id, exclusiveId) })}
                />
                <span className="na-box" aria-hidden="true">
                  {checked ? '✓' : ''}
                </span>
                <span className="na-check-copy">
                  <span>{t(option.label)}</span>
                  {checked && category && o1CategoryNote(category.id) ? (
                    <span className="na-optnote" role="status">
                      {t(o1CategoryNote(category.id) ?? '')}
                    </span>
                  ) : null}
                </span>
              </label>
              {checked && category ? (
                <div className="na-sub" style={{ marginLeft: 28 }}>
                  <div
                    className="na-sub-grid"
                    style={{ '--rows': Math.ceil(category.items.length / 2) } as CSSProperties}
                  >
                  {category.items.map((item) => {
                    const itemChecked = picks.includes(item);
                    return (
                      <label key={item} className="na-check">
                        <input
                          type="checkbox"
                          checked={itemChecked}
                          onChange={() => setDetails({ ...details, [category.id]: toggleMulti(picks, item) })}
                        />
                        <span className="na-box" aria-hidden="true">
                          {itemChecked ? '✓' : ''}
                        </span>
                        <span className="na-check-copy">
                          <span>{t(item)}</span>
                          {itemChecked && item !== 'Other' && o1ItemNote(item) ? (
                            <span className="na-optnote" role="status">
                              {t(o1ItemNote(item) ?? '')}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                  </div>
                  {picks.includes('Other') && otherKey ? (
                    <textarea
                      className="na-area"
                      maxLength={200}
                      aria-label={`${t(category.label)} — ${t('Other')}`}
                      value={typeof details[otherKey] === 'string' ? (details[otherKey] as string) : ''}
                      onChange={(event) => setDetails({ ...details, [otherKey]: event.target.value })}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {selected.includes('other') ? (
        <textarea
          className="na-area"
          style={{ marginTop: 12 }}
          maxLength={200}
          aria-label={t('Other problem')}
          placeholder={t('Other problem')}
          value={typeof answers[otherCode] === 'string' ? (answers[otherCode] as string) : ''}
          onChange={(event) => onPatch({ [otherCode]: event.target.value })}
        />
      ) : null}
      {error || otherError ? (
        <p className="na-error" role="alert">
          {t(error || otherError || '')}
        </p>
      ) : null}
      {after ? <div className="na-followups">{after}</div> : null}
    </div>
  );
}

/**
 * A follow-up question (one that appears only because of a single earlier
 * answer in the same step) belongs to the question that opens it.
 */
function groupFollowUps(questions: QuestionDef[]): {
  roots: QuestionDef[];
  children: Map<string, QuestionDef[]>;
} {
  const parentOf = (q: QuestionDef): string | undefined => {
    const when = q.showWhen;
    if (!when || !('q' in when)) return undefined;
    const index = questions.findIndex((item) => item.code === when.q);
    return index >= 0 && index < questions.indexOf(q) ? when.q : undefined;
  };
  const children = new Map<string, QuestionDef[]>();
  const roots: QuestionDef[] = [];
  for (const q of questions) {
    const parent = parentOf(q);
    if (parent) children.set(parent, [...(children.get(parent) ?? []), q]);
    else roots.push(q);
  }
  return { roots, children };
}

interface Item {
  q: QuestionDef;
  node: ReactNode;
}

/** Re-create the wrapper divs (bento grid) that questions ask for. */
function wrap(items: Item[], depth: number): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < items.length) {
    const cls = items[i]!.q.layout?.[depth];
    if (!cls) {
      out.push(items[i]!.node);
      i += 1;
      continue;
    }
    let j = i;
    while (j < items.length && items[j]!.q.layout?.[depth] === cls) j += 1;
    out.push(
      <div key={`${cls}-${items[i]!.q.code}`} className={cls}>
        {wrap(items.slice(i, j), depth + 1)}
      </div>,
    );
    i = j;
  }
  return out;
}

export function InstrumentStep({
  instrument,
  step,
  answers,
  errors,
  onPatch,
}: {
  instrument: Instrument;
  step: StepDef;
  answers: Answers;
  errors: Record<string, string>;
  onPatch: (patch: Patch) => void;
}) {
  const t = useT();
  const questions = visibleQuestions(instrument, step.id, answers);
  const { roots, children } = groupFollowUps(questions);
  const notes = (step.notes ?? []).filter((n) => evalCondition(n.when, answers));
  const top = notes.filter((n) => !n.after);
  const guideNotes = top.filter((n) => (n.kind ?? 'intro') === 'intro');
  const otherTop = top.filter((n) => (n.kind ?? 'intro') !== 'intro');
  const guideItems: ReactNode[] = [
    ...(step.showRequiredNote ? [<WithStar key="required" text={t(REQUIRED_NOTE)} />] : []),
    ...guideNotes.flatMap((n, noteIndex) =>
      n.text
        .split('\n')
        .filter((line) => line.trim())
        .map((line, lineIndex) => <Fragment key={`${noteIndex}-${lineIndex}`}>{t(line)}</Fragment>),
    ),
  ];

  // Everything an answer opens (follow-up questions, hints, the interview form)
  // renders inside the card of the question that opened it.
  const renderQuestion = (q: QuestionDef): ReactNode => {
    const followUps = [
      ...(children.get(q.code) ?? []).map(renderQuestion),
      ...notes
        .filter((n) => n.after === q.code)
        .map((n, index) => <Note key={`${q.code}-note-${index}`} text={n.text} kind={n.kind ?? 'hint'} />),
      q.attachForm && evalCondition(q.attachForm.when, answers) ? (
        <InterviewInvitationForm key={`${q.code}-form`} variant="embedded" />
      ) : null,
    ].filter(Boolean);
    return (
      <QuestionField
        key={q.code}
        q={q}
        answers={answers}
        error={errors[q.code]}
        errors={errors}
        onPatch={onPatch}
        followUps={followUps.length ? followUps : undefined}
      />
    );
  };

  const items: Item[] = roots.map((q) => ({ q, node: renderQuestion(q) }));

  return (
    <>
      <StepGuide items={guideItems} />
      {otherTop.map((n, index) => (
        <Note key={`top-${index}`} text={n.text} kind={n.kind ?? 'intro'} />
      ))}
      {wrap(items, 0)}
    </>
  );
}
