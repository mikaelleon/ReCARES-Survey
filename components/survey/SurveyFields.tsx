'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '@/components/survey/SurveyLanguage';
import { NOT_APPLICABLE } from '@/survey/model';
import { SCALE_NOTES } from '@/survey/optionNotes';
import { optionDisabled, toggleMulti } from '@/survey/exclusive';

export const REQUIRED_NOTE =
  'A red asterisk (*) means you need to answer that question before you can continue.';

const AGREEMENT = [
  { id: '1', label: 'Strongly disagree' },
  { id: '2', label: 'Disagree' },
  { id: '3', label: 'Neutral' },
  { id: '4', label: 'Agree' },
  { id: '5', label: 'Strongly agree' },
] as const;

const LIKELIHOOD = [
  { id: '1', label: 'Very unlikely' },
  { id: '2', label: 'Unlikely' },
  { id: '3', label: 'Not sure' },
  { id: '4', label: 'Likely' },
  { id: '5', label: 'Very likely' },
] as const;

/** Plain-language help under a question: what it means, with examples. */
export function QuestionSubtitle({ id, text }: { id: string; text?: string }) {
  const t = useT();
  if (!text) return null;
  return (
    <p className="na-qsub" id={id}>
      {t(text)}
    </p>
  );
}

function describedBy(...ids: Array<string | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined || undefined;
}

export function Question({
  id,
  text,
  required,
  subtitle,
}: {
  id: string;
  text: string;
  required?: boolean;
  subtitle?: string;
}) {
  const t = useT();
  return (
    <>
    <div className="na-q" id={id}>
      {t(text)}
      {required ? (
        <>
          {' '}
          <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
            *
          </span>
          <span className="visually-hidden"> {t('required')}</span>
        </>
      ) : null}
    </div>
    <QuestionSubtitle id={`${id}-sub`} text={subtitle} />
    </>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  const t = useT();
  if (!message) return null;
  return (
    <p id={id} className="na-error" role="alert">
      {t(message)}
    </p>
  );
}

export function Card({
  error,
  className,
  after,
  children,
}: {
  error?: string;
  className?: string;
  /** Follow-up questions opened by an answer here. They stay inside this card. */
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${error ? 'survey-card survey-card--error' : 'survey-card'}${className ? ` ${className}` : ''}`}>
      {children}
      {after ? <div className="na-followups">{after}</div> : null}
    </div>
  );
}

export type ChoiceOption = {
  id: string;
  label: string;
  hint?: string;
  wide?: boolean;
  /** Sentence shown once the option is selected. */
  note?: string;
  icon?: LucideIcon;
};

/** What a selected choice means, in a sentence. Appears only while selected. */
export function OptionNote({ text }: { text?: string }) {
  const t = useT();
  if (!text) return null;
  return (
    <span className="na-optnote" role="status">
      {t(text)}
    </span>
  );
}

function OptionLabel({ label, icon: Icon }: { label: string; icon?: LucideIcon }) {
  const t = useT();
  return (
    <span className="na-optlabel">
      {Icon ? <Icon className="na-opticon" size={18} strokeWidth={2} aria-hidden="true" /> : null}
      <span>{t(label)}</span>
    </span>
  );
}

function RadioMark({
  name,
  option,
  checked,
  onChange,
}: {
  name: string;
  option: ChoiceOption;
  checked: boolean;
  onChange: () => void;
}) {
  const t = useT();
  return (
    <label className={option.wide ? 'na-radio na-radio-wide' : 'na-radio'}>
      <input type="radio" name={name} value={option.id} checked={checked} onChange={onChange} />
      <span className="na-dot" aria-hidden="true" />
      <span className="na-radio-copy">
        <OptionLabel label={option.label} icon={option.icon} />
        {option.hint ? <span className="na-radio-hint">{t(option.hint)}</span> : null}
        {checked ? <OptionNote text={option.note} /> : null}
      </span>
    </label>
  );
}

export function SingleChoice({
  code,
  question,
  required = true,
  value,
  options,
  error,
  onChange,
  hint,
  subtitle,
  after,
  columns = 1,
  className,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  options: readonly ChoiceOption[];
  error?: string;
  onChange: (value: string) => void;
  hint?: string;
  subtitle?: string;
  after?: ReactNode;
  columns?: 1 | 2;
  className?: string;
}) {
  const t = useT();
  const errorId = `${code}-error`;
  const labelId = `${code}-label`;
  return (
    <Card error={error} className={className} after={after}>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy(subtitle ? `${labelId}-sub` : undefined, error ? errorId : undefined)}>
        <Question id={labelId} text={question} required={required} subtitle={subtitle} />
        {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{t(hint)}</p> : null}
        <div className={columns === 2 ? 'na-radios na-radios--2' : 'na-radios'}>
          {options.map((option) => (
            <RadioMark
              key={option.id}
              name={code}
              option={option}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
          ))}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
  );
}

export function MultiChoice({
  code,
  question,
  required = true,
  value,
  options,
  exclusiveId,
  maxNonExclusive,
  error,
  onChange,
  hint,
  subtitle,
  after,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string[];
  options: readonly { id: string; label: string; note?: string; icon?: LucideIcon }[];
  exclusiveId?: string;
  maxNonExclusive?: number;
  error?: string;
  onChange: (value: string[]) => void;
  hint?: string;
  subtitle?: string;
  after?: ReactNode;
}) {
  const t = useT();
  const errorId = `${code}-error`;
  const labelId = `${code}-label`;
  return (
    <Card error={error} after={after}>
      <div role="group" aria-labelledby={labelId} aria-describedby={describedBy(subtitle ? `${labelId}-sub` : undefined, error ? errorId : undefined)}>
        <Question id={labelId} text={question} required={required} subtitle={subtitle} />
        {hint ? <p className="na-hint">{t(hint)}</p> : null}
        <div className="na-checks">
          {options.map((option) => {
            const disabled = optionDisabled(value, option.id, exclusiveId, maxNonExclusive);
            const checked = (value ?? []).includes(option.id);
            return (
              <label key={option.id} className="na-check">
                <input
                  type="checkbox"
                  name={code}
                  value={option.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(toggleMulti(value, option.id, exclusiveId, maxNonExclusive))}
                />
                <span className="na-box" aria-hidden="true">
                  {checked ? '✓' : ''}
                </span>
                <span className="na-check-copy">
                  <OptionLabel label={option.label} icon={option.icon} />
                  {checked ? <OptionNote text={option.note} /> : null}
                </span>
              </label>
            );
          })}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
  );
}

export function LikertChoice({
  code,
  question,
  scale,
  required = true,
  allowNA = false,
  value,
  error,
  hint,
  subtitle,
  after,
  onChange,
}: {
  code: string;
  question: string;
  scale: 'agreement' | 'likelihood';
  required?: boolean;
  /** Adds a Not applicable choice under the scale. */
  allowNA?: boolean;
  value?: number | typeof NOT_APPLICABLE;
  error?: string;
  hint?: string;
  subtitle?: string;
  after?: ReactNode;
  onChange: (value: number | typeof NOT_APPLICABLE) => void;
}) {
  const t = useT();
  const options = scale === 'likelihood' ? LIKELIHOOD : AGREEMENT;
  const errorId = `${code}-error`;
  const labelId = `${code}-label`;
  return (
    <Card error={error} after={after}>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy(subtitle ? `${labelId}-sub` : undefined, error ? errorId : undefined)}>
        <Question id={labelId} text={question} required={required} subtitle={subtitle} />
        {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{t(hint)}</p> : null}
        <div className="na-likert">
          {options.map((option) => {
            const selected = typeof value === 'number' && String(value) === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className="na-likert-btn"
                aria-pressed={selected}
                aria-label={t(option.label)}
                onClick={() => onChange(Number(option.id))}
              >
                {option.id}
              </button>
            );
          })}
        </div>
        <div className="na-likert-ends">
          <span>{t(options[0].label)}</span>
          <span>{t(options.find((option) => option.id === '5')?.label ?? '')}</span>
        </div>
        <div className="na-likert-foot">
          <div className="na-likert-result" aria-live="polite">
            <p className="na-likert-selected">
              {typeof value === 'number'
                ? `${t('Your choice:')} ${value} — ${t(options.find((option) => option.id === String(value))?.label ?? '')}`
                : value === NOT_APPLICABLE
                  ? `${t('Your choice:')} ${t('Not applicable')}`
                  : ' '}
            </p>
            {typeof value === 'number' ? (
              <span className="na-optnote">{t(SCALE_NOTES[scale][value] ?? '')}</span>
            ) : value === NOT_APPLICABLE ? (
              <span className="na-optnote">{t(SCALE_NOTES.notApplicable)}</span>
            ) : null}
          </div>
          {allowNA ? (
            <button
              type="button"
              className="na-likert-na"
              aria-pressed={value === NOT_APPLICABLE}
              onClick={() => onChange(NOT_APPLICABLE)}
            >
              {t('Not applicable')}
            </button>
          ) : null}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
  );
}

export function NumberField({
  code,
  question,
  required = false,
  value,
  min,
  max,
  error,
  hint,
  subtitle,
  after,
  onChange,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: number;
  min: number;
  max: number;
  error?: string;
  hint?: string;
  subtitle?: string;
  after?: ReactNode;
  onChange: (value: number | undefined) => void;
}) {
  const t = useT();
  const errorId = `${code}-error`;
  const inputId = `${code}-input`;
  return (
    <Card error={error} after={after}>
      <label className="na-q" htmlFor={inputId}>
        {t(question)}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> {t('required')}</span>
          </>
        ) : null}
      </label>
      <QuestionSubtitle id={`${code}-sub`} text={subtitle} />
      {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{t(hint)}</p> : null}
      <input
        id={inputId}
        className={error ? 'na-input na-input--error' : 'na-input'}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(subtitle ? `${code}-sub` : undefined, error ? errorId : undefined)}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isNaN(parsed) ? undefined : parsed);
        }}
      />
      <FieldError id={errorId} message={error} />
    </Card>
  );
}

export function TextField({
  code,
  question,
  required = false,
  value,
  maxLength,
  error,
  onChange,
  hint,
  subtitle,
  after,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  maxLength: number;
  error?: string;
  onChange: (value: string) => void;
  hint?: string;
  subtitle?: string;
  after?: ReactNode;
}) {
  const t = useT();
  const errorId = `${code}-error`;
  const inputId = `${code}-input`;
  return (
    <Card error={error} after={after}>
      <label className="na-q" htmlFor={inputId}>
        {t(question)}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> {t('required')}</span>
          </>
        ) : null}
      </label>
      <QuestionSubtitle id={`${code}-sub`} text={subtitle} />
      {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{t(hint)}</p> : null}
      <textarea
        id={inputId}
        className={error ? 'na-area na-area--error' : 'na-area'}
        maxLength={maxLength}
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(subtitle ? `${code}-sub` : undefined, error ? errorId : undefined)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id={errorId} message={error} />
    </Card>
  );
}

export function SelectChoice({
  code,
  question,
  required = true,
  value,
  options,
  error,
  onChange,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  options: readonly { id: string; label: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const t = useT();
  const errorId = `${code}-error`;
  const inputId = `${code}-input`;
  return (
    <Card error={error}>
      <label className="na-q" htmlFor={inputId}>
        {t(question)}
        {required ? (
          <>
            {' '}
            <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> {t('required')}</span>
          </>
        ) : null}
      </label>
      <select
        id={inputId}
        className={error ? 'na-input na-input--error' : 'na-input'}
        value={value ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          {t('Select…')}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {t(option.label)}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </Card>
  );
}

/** Single choice where consecutive options with the same `group` sit under one legend. */
export function GroupedSingleChoice({
  code,
  question,
  required = true,
  value,
  options,
  error,
  hint,
  subtitle,
  after,
  className,
  onChange,
}: {
  code: string;
  question: string;
  required?: boolean;
  value?: string;
  options: readonly (ChoiceOption & { group?: string })[];
  error?: string;
  hint?: string;
  subtitle?: string;
  after?: ReactNode;
  className?: string;
  onChange: (value: string) => void;
}) {
  const t = useT();
  const errorId = `${code}-error`;
  const labelId = `${code}-label`;

  const blocks: Array<{ group?: string; items: (ChoiceOption & { group?: string })[] }> = [];
  for (const option of options) {
    const last = blocks[blocks.length - 1];
    if (last && last.group && last.group === option.group) last.items.push(option);
    else blocks.push({ group: option.group, items: [option] });
  }

  return (
    <Card error={error} className={className} after={after}>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy(subtitle ? `${labelId}-sub` : undefined, error ? errorId : undefined)}>
        <Question id={labelId} text={question} required={required} subtitle={subtitle} />
        {hint ? <p className="na-hint" style={{ marginBottom: 12 }}>{t(hint)}</p> : null}
        <div className="na-radios">
          {blocks.map((block) =>
            block.group ? (
              <fieldset key={`g-${block.items[0]!.id}`} className="na-sub">
                <legend className="na-sub-legend">{t(block.group)}</legend>
                {block.items.map((option) => (
                  <RadioMark
                    key={option.id}
                    name={code}
                    option={option}
                    checked={value === option.id}
                    onChange={() => onChange(option.id)}
                  />
                ))}
              </fieldset>
            ) : (
              <RadioMark
                key={block.items[0]!.id}
                name={code}
                option={block.items[0]!}
                checked={value === block.items[0]!.id}
                onChange={() => onChange(block.items[0]!.id)}
              />
            ),
          )}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    </Card>
  );
}
