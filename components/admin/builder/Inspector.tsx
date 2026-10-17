'use client';

import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ConditionEditor } from '@/components/admin/builder/ConditionEditor';
import { isCoreCode } from '@/survey/lint';
import type { Instrument, OptionDef, QuestionDef, StepDef, StepNote } from '@/survey/model';

export type Edit = (fn: (draft: Instrument) => void) => void;

type Selection = { kind: 'question' | 'step'; id: string } | null;

const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,29}$/;

const TYPE_OPTIONS: Array<[QuestionDef['type'], string]> = [
  ['single', 'Pick one'],
  ['multi', 'Pick many'],
  ['likert', 'Scale (1 to 5)'],
  ['text', 'Free text'],
  ['number', 'Whole number'],
  ['nested_multi', 'Pick many, with sub-lists'],
];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="sb-field">
      <span className="sb-field__label">{label}</span>
      {children}
      {hint ? <span className="sb-field__hint">{hint}</span> : null}
    </label>
  );
}

function Section({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="sb-section">
      <button type="button" className="sb-section__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
        {badge ? <span className="sb-section__badge">{badge}</span> : null}
      </button>
      {open ? <div className="sb-section__body">{children}</div> : null}
    </section>
  );
}

/** Text with an optional Tagalog version stored in the instrument's translation table. */
function TranslatedText({
  label,
  value,
  translation,
  multiline,
  disabled,
  onChange,
  onTranslation,
}: {
  label: string;
  value: string;
  translation: string;
  multiline?: boolean;
  disabled?: boolean;
  onChange: (next: string) => void;
  onTranslation: (next: string) => void;
}) {
  return (
    <div className="sb-trans">
      <Field label={label}>
        {multiline ? (
          <textarea className="sb-input" rows={3} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input className="sb-input" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        )}
      </Field>
      <Field label="Tagalog (optional)">
        {multiline ? (
          <textarea
            className="sb-input"
            rows={3}
            value={translation}
            disabled={disabled}
            onChange={(e) => onTranslation(e.target.value)}
          />
        ) : (
          <input className="sb-input" value={translation} disabled={disabled} onChange={(e) => onTranslation(e.target.value)} />
        )}
      </Field>
    </div>
  );
}

function setTranslation(d: Instrument, english: string, tagalog: string) {
  d.translations = { ...(d.translations ?? {}) };
  if (tagalog.trim()) d.translations[english] = tagalog;
  else delete d.translations[english];
}

/** Rename English text and carry its Tagalog version along. */
function renameText(d: Instrument, from: string, to: string) {
  const old = d.translations?.[from];
  if (old != null && from !== to) {
    d.translations = { ...(d.translations ?? {}) };
    delete d.translations[from];
    if (to.trim()) d.translations[to] = old;
  }
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item!);
  return next;
}

// ---------------------------------------------------------------------------

function OptionsEditor({
  q,
  inst,
  lockedIds,
  disabled,
  edit,
}: {
  q: QuestionDef;
  inst: Instrument;
  lockedIds: Set<string>;
  disabled: boolean;
  edit: Edit;
}) {
  const [openCond, setOpenCond] = useState<string | null>(null);
  const options = q.options ?? [];

  const patchOption = (index: number, fn: (o: OptionDef, d: Instrument) => void) =>
    edit((d) => {
      const target = d.questions.find((x) => x.code === q.code);
      if (!target?.options?.[index]) return;
      fn(target.options[index]!, d);
    });

  return (
    <div className="sb-options">
      {options.map((o, index) => {
        const locked = lockedIds.has(String(o.id));
        return (
          <div key={`${o.id}-${index}`} className="sb-option">
            <div className="sb-option__row">
              <input
                className="sb-input sb-input--id"
                aria-label="Choice id"
                title={locked ? 'Stored in earlier responses, so the id is fixed.' : 'Saved with each answer'}
                value={o.id}
                disabled={disabled || locked}
                onChange={(e) =>
                  edit((d) => {
                    const target = d.questions.find((x) => x.code === q.code);
                    const was = target?.options?.[index]?.id;
                    if (!target?.options || was == null) return;
                    target.options[index]!.id = e.target.value.replace(/\s+/g, '_');
                    if (target.exclusiveId === was) target.exclusiveId = e.target.value.replace(/\s+/g, '_');
                  })
                }
              />
              <input
                className="sb-input"
                aria-label="Choice label"
                value={o.label}
                disabled={disabled}
                onChange={(e) =>
                  patchOption(index, (opt, d) => {
                    renameText(d, opt.label, e.target.value);
                    opt.label = e.target.value;
                  })
                }
              />
              </div>
              <div className="sb-option__tools">
              <button
                type="button"
                className={`sb-icon-btn${o.showWhen ? ' is-on' : ''}`}
                aria-label="Show this choice only when…"
                title="Show this choice only when…"
                onClick={() => setOpenCond(openCond === String(o.id) ? null : String(o.id))}
              >
                if
              </button>
              <button
                type="button"
                className="sb-icon-btn"
                aria-label="Move choice up"
                disabled={disabled || index === 0}
                onClick={() => edit((d) => {
                  const t = d.questions.find((x) => x.code === q.code);
                  if (t?.options) t.options = move(t.options, index, -1);
                })}
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                className="sb-icon-btn"
                aria-label="Move choice down"
                disabled={disabled || index === options.length - 1}
                onClick={() => edit((d) => {
                  const t = d.questions.find((x) => x.code === q.code);
                  if (t?.options) t.options = move(t.options, index, 1);
                })}
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                className="sb-icon-btn"
                aria-label="Delete choice"
                disabled={disabled || options.length <= 2}
                onClick={() => edit((d) => {
                  const t = d.questions.find((x) => x.code === q.code);
                  if (!t?.options) return;
                  t.options = t.options.filter((_, i) => i !== index);
                  if (t.exclusiveId === o.id) t.exclusiveId = undefined;
                })}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <input
              className="sb-input sb-input--sub"
              aria-label="Choice label in Tagalog"
              placeholder="Tagalog (optional)"
              value={inst.translations?.[o.label] ?? ''}
              disabled={disabled}
              onChange={(e) => edit((d) => setTranslation(d, o.label, e.target.value))}
            />
            {openCond === String(o.id) ? (
              <div className="sb-option__cond">
                <ConditionEditor
                  value={o.showWhen}
                  inst={inst}
                  ownerCode={q.code}
                  emptyLabel="Always offered"
                  disabled={disabled}
                  onChange={(next) =>
                    patchOption(index, (opt) => {
                      if (next) opt.showWhen = next;
                      else delete opt.showWhen;
                    })
                  }
                />
              </div>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        className="sb-link"
        disabled={disabled}
        onClick={() =>
          edit((d) => {
            const t = d.questions.find((x) => x.code === q.code);
            if (!t) return;
            const used = new Set((t.options ?? []).map((o) => String(o.id)));
            let n = (t.options ?? []).length + 1;
            while (used.has(`option_${n}`)) n += 1;
            t.options = [...(t.options ?? []), { id: `option_${n}`, label: `Option ${n}` }];
          })
        }
      >
        <Plus size={12} /> Add choice
      </button>
    </div>
  );
}

function CategoriesEditor({ q, disabled, edit }: { q: QuestionDef; disabled: boolean; edit: Edit }) {
  const categories = q.categories ?? [];
  const patch = (index: number, fn: (c: NonNullable<QuestionDef['categories']>[number]) => void) =>
    edit((d) => {
      const t = d.questions.find((x) => x.code === q.code);
      if (t?.categories?.[index]) fn(t.categories[index]!);
    });
  return (
    <div className="sb-options">
      {categories.map((c, index) => (
        <div key={`${c.id}-${index}`} className="sb-option">
          <div className="sb-option__row">
            <input
              className="sb-input sb-input--id"
              aria-label="Category id"
              value={c.id}
              disabled={disabled}
              onChange={(e) => patch(index, (cat) => (cat.id = e.target.value.replace(/\s+/g, '_')))}
            />
            <input
              className="sb-input"
              aria-label="Category label"
              value={c.label}
              disabled={disabled}
              onChange={(e) => patch(index, (cat) => (cat.label = e.target.value))}
            />
            <button
              type="button"
              className="sb-icon-btn"
              aria-label="Delete category"
              disabled={disabled || categories.length <= 1}
              onClick={() =>
                edit((d) => {
                  const t = d.questions.find((x) => x.code === q.code);
                  if (t?.categories) t.categories = t.categories.filter((_, i) => i !== index);
                })
              }
            >
              <Trash2 size={13} />
            </button>
          </div>
          <textarea
            className="sb-input sb-input--sub"
            rows={Math.min(8, Math.max(3, c.items.length))}
            aria-label="Sub-choices, one per line"
            placeholder="One sub-choice per line. A line that says Other opens a text box."
            value={c.items.join('\n')}
            disabled={disabled}
            onChange={(e) => patch(index, (cat) => (cat.items = e.target.value.split('\n')))}
          />
        </div>
      ))}
      <button
        type="button"
        className="sb-link"
        disabled={disabled}
        onClick={() =>
          edit((d) => {
            const t = d.questions.find((x) => x.code === q.code);
            if (!t) return;
            const used = new Set((t.categories ?? []).map((c) => c.id));
            let n = (t.categories ?? []).length + 1;
            while (used.has(`category_${n}`)) n += 1;
            t.categories = [...(t.categories ?? []), { id: `category_${n}`, label: `Category ${n}`, items: ['Item 1', 'Other'] }];
          })
        }
      >
        <Plus size={12} /> Add category
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuestionInspector({
  q,
  inst,
  baseline,
  created,
  disabled,
  edit,
  onRenameCode,
  onDelete,
  onMoveWithinStep,
}: {
  q: QuestionDef;
  inst: Instrument;
  baseline: Instrument | null;
  created: boolean;
  disabled: boolean;
  edit: Edit;
  onRenameCode: (from: string, to: string) => string | null;
  onDelete: () => void;
  onMoveWithinStep: (code: string, delta: number) => void;
}) {
  const [codeDraft, setCodeDraft] = useState(q.code);
  const [codeError, setCodeError] = useState<string | null>(null);
  useEffect(() => {
    setCodeDraft(q.code);
    setCodeError(null);
  }, [q.code]);

  const core = isCoreCode(q.code);
  const baseQuestion = baseline?.questions.find((b) => b.code === q.code);
  const lockedIds = new Set((baseQuestion?.options ?? []).map((o) => String(o.id)));
  const patch = (fn: (target: QuestionDef, d: Instrument) => void) =>
    edit((d) => {
      const target = d.questions.find((x) => x.code === q.code);
      if (target) fn(target, d);
    });

  const commitCode = () => {
    if (codeDraft === q.code) return;
    if (!CODE_PATTERN.test(codeDraft)) {
      setCodeError('Start with a letter; use letters, numbers, or underscores.');
      return;
    }
    const problem = onRenameCode(q.code, codeDraft);
    setCodeError(problem);
  };

  const hasOptions = q.type === 'single' || q.type === 'multi';
  const optionIds = (q.options ?? []).map((o) => String(o.id));
  const stepQuestions = inst.questions.filter((x) => x.stepId === q.stepId);
  const position = stepQuestions.findIndex((x) => x.code === q.code);

  return (
    <>
      <div className="sb-insp__title">
        <span className="sb-node__code">{q.code}</span>
        {core ? (
          <span className="sb-pill" title="The dashboard reads this answer by its code">
            <Lock size={11} /> dashboard field
          </span>
        ) : null}
      </div>

      <Section title="Question">
        <TranslatedText
          label="Question text"
          value={q.text}
          translation={inst.translations?.[q.text] ?? ''}
          multiline
          disabled={disabled}
          onChange={(next) =>
            patch((t, d) => {
              renameText(d, t.text, next);
              t.text = next;
            })
          }
          onTranslation={(next) => edit((d) => setTranslation(d, q.text, next))}
        />
        <div className="sb-grid2">
          <Field label="Code" hint={created ? 'Saved with each answer' : 'Fixed: earlier responses use it'}>
            <input
              className="sb-input"
              value={codeDraft}
              disabled={disabled || !created}
              onChange={(e) => setCodeDraft(e.target.value)}
              onBlur={commitCode}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCode();
              }}
            />
            {codeError ? <span className="sb-field__error">{codeError}</span> : null}
          </Field>
          <Field label="Answer type" hint={created ? undefined : 'Fixed after first use'}>
            <select
              className="sb-input"
              value={q.type}
              disabled={disabled || !created}
              onChange={(e) =>
                patch((t) => {
                  const type = e.target.value as QuestionDef['type'];
                  t.type = type;
                  if ((type === 'single' || type === 'multi') && !(t.options?.length)) {
                    t.options = [
                      { id: 'option_1', label: 'Option 1' },
                      { id: 'option_2', label: 'Option 2' },
                    ];
                  }
                  if (type === 'likert') t.scale = t.scale ?? 'agreement';
                  if (type === 'text') t.maxLength = t.maxLength ?? 300;
                  if (type === 'number') {
                    t.min = t.min ?? 0;
                    t.max = t.max ?? 100;
                  }
                  if (type === 'nested_multi' && !(t.categories?.length)) {
                    t.exclusiveId = 'none_of_these';
                    t.categories = [{ id: 'category_1', label: 'Category 1', items: ['Item 1', 'Other'] }];
                    t.options = [
                      { id: 'none_of_these', label: 'None of these' },
                      { id: 'other', label: 'Other' },
                    ];
                  }
                })
              }
            >
              {TYPE_OPTIONS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="sb-check">
          <input
            type="checkbox"
            checked={q.required ?? !(q.type === 'text' || q.type === 'number')}
            disabled={disabled}
            onChange={(e) => patch((t) => (t.required = e.target.checked))}
          />
          <span>Respondents must answer before continuing</span>
        </label>
        <div className="sb-grid2">
          <Field label="Step">
            <select
              className="sb-input"
              value={q.stepId}
              disabled={disabled}
              onChange={(e) =>
                edit((d) => {
                  const t = d.questions.find((x) => x.code === q.code);
                  if (!t) return;
                  t.stepId = e.target.value;
                })
              }
            >
              {inst.steps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Order in step">
            <div className="sb-row">
              <button
                type="button"
                className="sb-icon-btn"
                aria-label="Move question up"
                disabled={disabled || position <= 0}
                onClick={() => onMoveWithinStep(q.code, -1)}
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                className="sb-icon-btn"
                aria-label="Move question down"
                disabled={disabled || position >= stepQuestions.length - 1}
                onClick={() => onMoveWithinStep(q.code, 1)}
              >
                <ArrowDown size={13} />
              </button>
              <span className="sb-muted">
                {position + 1} of {stepQuestions.length}
              </span>
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Answers">
        {q.type === 'likert' ? (
          <Field label="Scale labels">
            <select
              className="sb-input"
              value={q.scale ?? 'agreement'}
              disabled={disabled}
              onChange={(e) => patch((t) => (t.scale = e.target.value as 'agreement' | 'likelihood'))}
            >
              <option value="agreement">Strongly disagree … Strongly agree</option>
              <option value="likelihood">Very unlikely … Very likely</option>
            </select>
          </Field>
        ) : null}
        {hasOptions ? <OptionsEditor q={q} inst={inst} lockedIds={lockedIds} disabled={disabled} edit={edit} /> : null}
        {q.type === 'single' ? (
          <Field label="List columns">
            <select
              className="sb-input"
              value={q.columns ?? 1}
              disabled={disabled}
              onChange={(e) => patch((t) => (t.columns = Number(e.target.value) === 2 ? 2 : 1))}
            >
              <option value={1}>One</option>
              <option value={2}>Two</option>
            </select>
          </Field>
        ) : null}
        {q.type === 'multi' ? (
          <div className="sb-grid2">
            <Field label="“None of these” choice" hint="Clears every other choice">
              <select
                className="sb-input"
                value={q.exclusiveId ?? ''}
                disabled={disabled}
                onChange={(e) => patch((t) => (t.exclusiveId = e.target.value || undefined))}
              >
                <option value="">None</option>
                {optionIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Most choices allowed" hint="Blank for no limit">
              <input
                className="sb-input"
                type="number"
                min={1}
                value={q.maxSelect ?? ''}
                disabled={disabled}
                onChange={(e) => patch((t) => (t.maxSelect = e.target.value === '' ? undefined : Math.max(1, Number(e.target.value))))}
              />
            </Field>
          </div>
        ) : null}
        {q.type === 'text' ? (
          <Field label="Longest answer (characters)">
            <input
              className="sb-input"
              type="number"
              min={1}
              value={q.maxLength ?? ''}
              disabled={disabled}
              onChange={(e) => patch((t) => (t.maxLength = e.target.value === '' ? undefined : Math.max(1, Number(e.target.value))))}
            />
          </Field>
        ) : null}
        {q.type === 'number' ? (
          <div className="sb-grid2">
            <Field label="Lowest">
              <input
                className="sb-input"
                type="number"
                value={q.min ?? ''}
                disabled={disabled}
                onChange={(e) => patch((t) => (t.min = e.target.value === '' ? undefined : Number(e.target.value)))}
              />
            </Field>
            <Field label="Highest">
              <input
                className="sb-input"
                type="number"
                value={q.max ?? ''}
                disabled={disabled}
                onChange={(e) => patch((t) => (t.max = e.target.value === '' ? undefined : Number(e.target.value)))}
              />
            </Field>
          </div>
        ) : null}
        {q.type === 'nested_multi' ? (
          <>
            <CategoriesEditor q={q} disabled={disabled} edit={edit} />
            <p className="sb-muted">Answers are saved as {q.code} (categories), {q.code}Details, and {q.code}_other.</p>
          </>
        ) : null}
      </Section>

      <Section title="Show this question" badge={q.showWhen ? 'conditional' : 'always'}>
        <p className="sb-muted">
          Leave this as “Always shown”, or add a rule so the question only appears for some answers to earlier questions.
        </p>
        <ConditionEditor
          value={q.showWhen}
          inst={inst}
          ownerCode={q.code}
          disabled={disabled}
          onChange={(next) =>
            patch((t) => {
              if (next) t.showWhen = next;
              else {
                delete t.showWhen;
                delete t.skipCode;
                delete t.skipCodeWhen;
              }
            })
          }
        />
      </Section>

      {q.showWhen ? (
        <Section title="When skipped" defaultOpen={Boolean(q.skipCode)}>
          <Field
            label="Value saved when this question is skipped"
            hint="Leave as nothing to save no answer. Codes keep skipped items distinct from blank ones in your data."
          >
            <select
              className="sb-input"
              value={q.skipCode === undefined ? '' : String(q.skipCode)}
              disabled={disabled}
              onChange={(e) =>
                patch((t) => {
                  if (e.target.value === '') {
                    delete t.skipCode;
                    delete t.skipCodeWhen;
                  } else t.skipCode = e.target.value === '99' ? 99 : 'not_shown';
                })
              }
            >
              <option value="">Nothing</option>
              <option value="99">99 (for pick-one answers)</option>
              <option value="not_shown">not_shown (for scale answers)</option>
            </select>
          </Field>
          {q.skipCode !== undefined ? (
            <>
              <span className="sb-field__label">Only write it when</span>
              <ConditionEditor
                value={q.skipCodeWhen}
                inst={inst}
                ownerCode={q.code}
                emptyLabel="Whenever the question is skipped"
                disabled={disabled}
                onChange={(next) =>
                  patch((t) => {
                    if (next) t.skipCodeWhen = next;
                    else delete t.skipCodeWhen;
                  })
                }
              />
            </>
          ) : null}
        </Section>
      ) : null}

      <Section title="Different wording" badge={q.textVariants?.length ? String(q.textVariants.length) : undefined} defaultOpen={Boolean(q.textVariants?.length)}>
        {(q.textVariants ?? []).map((variant, index) => (
          <div key={index} className="sb-card">
            <TranslatedText
              label="Use this wording"
              value={variant.text}
              translation={inst.translations?.[variant.text] ?? ''}
              multiline
              disabled={disabled}
              onChange={(next) =>
                patch((t, d) => {
                  const v = t.textVariants?.[index];
                  if (!v) return;
                  renameText(d, v.text, next);
                  v.text = next;
                })
              }
              onTranslation={(next) => edit((d) => setTranslation(d, variant.text, next))}
            />
            <span className="sb-field__label">When</span>
            <ConditionEditor
              value={variant.when}
              inst={inst}
              ownerCode={q.code}
              disabled={disabled}
              onChange={(next) =>
                patch((t) => {
                  if (!t.textVariants) return;
                  if (next) t.textVariants[index]!.when = next;
                  else t.textVariants = t.textVariants.filter((_, i) => i !== index);
                })
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="sb-link"
          disabled={disabled}
          onClick={() =>
            patch((t) => {
              const source = inst.questions.find((x) => x.code !== q.code && inst.questions.indexOf(x) < inst.questions.indexOf(q));
              if (!source) return;
              t.textVariants = [
                ...(t.textVariants ?? []),
                { text: t.text, when: { op: 'answered', q: source.code } },
              ];
            })
          }
        >
          <Plus size={12} /> Add wording for a group
        </button>
      </Section>

      <Section title="Helper text" badge={q.hints?.length ? String(q.hints.length) : undefined} defaultOpen={Boolean(q.hints?.length)}>
        {(q.hints ?? []).map((hint, index) => (
          <div key={index} className="sb-card">
            <Field label="Text shown under the question">
              <textarea
                className="sb-input"
                rows={2}
                value={hint.text}
                disabled={disabled}
                onChange={(e) =>
                  patch((t, d) => {
                    const h = t.hints?.[index];
                    if (!h) return;
                    renameText(d, h.text, e.target.value);
                    h.text = e.target.value;
                  })
                }
              />
            </Field>
            <Field label="Tagalog (optional)">
              <textarea
                className="sb-input"
                rows={2}
                value={inst.translations?.[hint.text] ?? ''}
                disabled={disabled}
                onChange={(e) => edit((d) => setTranslation(d, hint.text, e.target.value))}
              />
            </Field>
            <span className="sb-field__label">Show when</span>
            <ConditionEditor
              value={hint.when}
              inst={inst}
              emptyLabel="Always"
              disabled={disabled}
              onChange={(next) =>
                patch((t) => {
                  const h = t.hints?.[index];
                  if (!h) return;
                  if (next) h.when = next;
                  else delete h.when;
                })
              }
            />
            <button
              type="button"
              className="sb-link sb-link--danger"
              disabled={disabled}
              onClick={() => patch((t) => (t.hints = (t.hints ?? []).filter((_, i) => i !== index)))}
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="sb-link"
          disabled={disabled}
          onClick={() => patch((t) => (t.hints = [...(t.hints ?? []), { text: 'Helper text' }]))}
        >
          <Plus size={12} /> Add helper text
        </button>
      </Section>

      <div className="sb-danger">
        <button type="button" className="sb-btn sb-btn--danger" disabled={disabled || core} onClick={onDelete}>
          <Trash2 size={14} /> Delete question
        </button>
        {core ? <span className="sb-muted">The dashboard needs this field, so it cannot be deleted.</span> : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function StepInspector({
  step,
  inst,
  disabled,
  edit,
  onDelete,
  onMoveStep,
}: {
  step: StepDef;
  inst: Instrument;
  disabled: boolean;
  edit: Edit;
  onDelete: () => void;
  onMoveStep: (stepId: string, delta: number) => void;
}) {
  const own = inst.questions.filter((q) => q.stepId === step.id);
  const index = inst.steps.findIndex((s) => s.id === step.id);
  const patch = (fn: (s: StepDef, d: Instrument) => void) =>
    edit((d) => {
      const target = d.steps.find((s) => s.id === step.id);
      if (target) fn(target, d);
    });
  const patchNote = (i: number, fn: (n: StepNote, d: Instrument) => void) =>
    patch((s, d) => {
      if (s.notes?.[i]) fn(s.notes[i]!, d);
    });
  const ownerCode = own[0]?.code;

  return (
    <>
      <div className="sb-insp__title">
        <span className="sb-node__code">Step {index + 1}</span>
      </div>

      <Section title="Step">
        <TranslatedText
          label="Title"
          value={step.title}
          translation={inst.translations?.[step.title] ?? ''}
          disabled={disabled}
          onChange={(next) =>
            patch((s, d) => {
              renameText(d, s.title, next);
              s.title = next;
            })
          }
          onTranslation={(next) => edit((d) => setTranslation(d, step.title, next))}
        />
        <TranslatedText
          label="Line under the title"
          value={step.subtitle ?? ''}
          translation={inst.translations?.[step.subtitle ?? ''] ?? ''}
          multiline
          disabled={disabled}
          onChange={(next) =>
            patch((s, d) => {
              renameText(d, s.subtitle ?? '', next);
              s.subtitle = next;
            })
          }
          onTranslation={(next) => step.subtitle && edit((d) => setTranslation(d, step.subtitle!, next))}
        />
        <label className="sb-check">
          <input
            type="checkbox"
            checked={Boolean(step.showRequiredNote)}
            disabled={disabled}
            onChange={(e) => patch((s) => (s.showRequiredNote = e.target.checked))}
          />
          <span>Explain the red asterisk at the top</span>
        </label>
        <div className="sb-row">
          <button
            type="button"
            className="sb-icon-btn"
            aria-label="Move step earlier"
            disabled={disabled || index === 0}
            onClick={() => onMoveStep(step.id, -1)}
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            className="sb-icon-btn"
            aria-label="Move step later"
            disabled={disabled || index === inst.steps.length - 1}
            onClick={() => onMoveStep(step.id, 1)}
          >
            <ArrowDown size={13} />
          </button>
          <span className="sb-muted">
            {own.length} question{own.length === 1 ? '' : 's'}. A step with no visible question is skipped.
          </span>
        </div>
      </Section>

      <Section title="Review screen" defaultOpen={false}>
        <p className="sb-muted">Steps that share a section code are grouped under one heading on the review screen.</p>
        <div className="sb-grid2">
          <Field label="Section code">
            <input
              className="sb-input"
              value={step.review?.code ?? ''}
              disabled={disabled}
              onChange={(e) => patch((s) => (s.review = { code: e.target.value, title: s.review?.title ?? s.title }))}
            />
          </Field>
          <Field label="Section title">
            <input
              className="sb-input"
              value={step.review?.title ?? ''}
              disabled={disabled}
              onChange={(e) => patch((s) => (s.review = { code: s.review?.code ?? s.id, title: e.target.value }))}
            />
          </Field>
        </div>
      </Section>

      <Section title="Notes" badge={step.notes?.length ? String(step.notes.length) : undefined} defaultOpen={Boolean(step.notes?.length)}>
        {(step.notes ?? []).map((note, i) => (
          <div key={i} className="sb-card">
            <Field label="Text (a new line starts a new line)">
              <textarea
                className="sb-input"
                rows={3}
                value={note.text}
                disabled={disabled}
                onChange={(e) =>
                  patchNote(i, (n) => {
                    n.text = e.target.value;
                  })
                }
              />
            </Field>
            <Field label="Tagalog (optional)">
              <textarea
                className="sb-input"
                rows={3}
                value={inst.translations?.[note.text] ?? ''}
                disabled={disabled}
                onChange={(e) => edit((d) => setTranslation(d, note.text, e.target.value))}
              />
            </Field>
            <div className="sb-grid2">
              <Field label="Style">
                <select
                  className="sb-input"
                  value={note.kind ?? (note.after ? 'hint' : 'intro')}
                  disabled={disabled}
                  onChange={(e) => patchNote(i, (n) => (n.kind = e.target.value as 'intro' | 'hint'))}
                >
                  <option value="intro">Introduction</option>
                  <option value="hint">Small hint</option>
                </select>
              </Field>
              <Field label="Position">
                <select
                  className="sb-input"
                  value={note.after ?? ''}
                  disabled={disabled}
                  onChange={(e) =>
                    patchNote(i, (n) => {
                      if (e.target.value) n.after = e.target.value;
                      else delete n.after;
                    })
                  }
                >
                  <option value="">Top of the step</option>
                  {own.map((q) => (
                    <option key={q.code} value={q.code}>
                      After {q.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <span className="sb-field__label">Show when</span>
            <ConditionEditor
              value={note.when}
              inst={inst}
              ownerCode={ownerCode}
              emptyLabel="Always"
              disabled={disabled}
              onChange={(next) =>
                patchNote(i, (n) => {
                  if (next) n.when = next;
                  else delete n.when;
                })
              }
            />
            <button
              type="button"
              className="sb-link sb-link--danger"
              disabled={disabled}
              onClick={() => patch((s) => (s.notes = (s.notes ?? []).filter((_, k) => k !== i)))}
            >
              <Trash2 size={12} /> Remove note
            </button>
          </div>
        ))}
        <button
          type="button"
          className="sb-link"
          disabled={disabled}
          onClick={() => patch((s) => (s.notes = [...(s.notes ?? []), { kind: 'intro', text: 'New note' }]))}
        >
          <Plus size={12} /> Add note
        </button>
      </Section>

      <Section title="Different title" badge={step.variants?.length ? String(step.variants.length) : undefined} defaultOpen={Boolean(step.variants?.length)}>
        {(step.variants ?? []).map((variant, i) => (
          <div key={i} className="sb-card">
            <Field label="Title for this group">
              <input
                className="sb-input"
                value={variant.title ?? ''}
                disabled={disabled}
                onChange={(e) => patch((s) => s.variants && (s.variants[i]!.title = e.target.value))}
              />
            </Field>
            <Field label="Line under the title">
              <input
                className="sb-input"
                value={variant.subtitle ?? ''}
                disabled={disabled}
                onChange={(e) => patch((s) => s.variants && (s.variants[i]!.subtitle = e.target.value))}
              />
            </Field>
            <span className="sb-field__label">When</span>
            <ConditionEditor
              value={variant.when}
              inst={inst}
              ownerCode={ownerCode}
              disabled={disabled}
              onChange={(next) =>
                patch((s) => {
                  if (!s.variants) return;
                  if (next) s.variants[i]!.when = next;
                  else s.variants = s.variants.filter((_, k) => k !== i);
                })
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="sb-link"
          disabled={disabled}
          onClick={() =>
            patch((s) => {
              const source = ownerCode ? inst.questions.find((q) => inst.questions.indexOf(q) < inst.questions.findIndex((x) => x.code === ownerCode)) : inst.questions[0];
              if (!source) return;
              s.variants = [...(s.variants ?? []), { when: { op: 'answered', q: source.code }, title: s.title }];
            })
          }
        >
          <Plus size={12} /> Add title for a group
        </button>
      </Section>

      <div className="sb-danger">
        <button type="button" className="sb-btn sb-btn--danger" disabled={disabled || own.length > 0} onClick={onDelete}>
          <Trash2 size={14} /> Delete step
        </button>
        {own.length > 0 ? <span className="sb-muted">Move or delete its questions first.</span> : null}
      </div>
    </>
  );
}

export function Inspector({
  inst,
  baseline,
  selected,
  createdCodes,
  readOnly,
  edit,
  onRenameCode,
  onDeleteQuestion,
  onDeleteStep,
  onMoveWithinStep,
  onMoveStepBy,
}: {
  inst: Instrument;
  baseline: Instrument | null;
  selected: Selection;
  createdCodes: Set<string>;
  readOnly: boolean;
  edit: Edit;
  onRenameCode: (from: string, to: string) => string | null;
  onDeleteQuestion: (code: string) => void;
  onDeleteStep: (id: string) => void;
  onMoveWithinStep: (code: string, delta: number) => void;
  onMoveStepBy: (id: string, delta: number) => void;
}) {
  if (!selected) {
    return (
      <div className="sb-insp sb-insp--empty">
        <h2 className="sb-insp__heading">Nothing selected</h2>
        <dl className="sb-stats">
          <div>
            <dt>Steps</dt>
            <dd>{inst.steps.length}</dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd>{inst.questions.length}</dd>
          </div>
          <div>
            <dt>Conditional</dt>
            <dd>{inst.questions.filter((q) => q.showWhen).length}</dd>
          </div>
        </dl>
        <p className="sb-muted">
          Choose a question or step in the list to edit it, or add a new one.
          {readOnly ? ' This version is frozen, so details are read-only.' : ''}
        </p>
        <h3 className="sb-insp__sub">Tips</h3>
        <ul className="sb-help">
          <li>
            <kbd>Ctrl</kbd> + <kbd>S</kbd> saves the draft. <kbd>Esc</kbd> clears the selection.
          </li>
          <li>Open a question and use “Show this question” to add rules. Combine rules with “all of” or “any of”.</li>
          <li>Use the up and down arrows to reorder. On a computer you can also drag a row by its handle.</li>
          <li>A rule can only read questions that come earlier in the survey.</li>
        </ul>
      </div>
    );
  }

  if (selected.kind === 'question') {
    const q = inst.questions.find((x) => x.code === selected.id);
    if (!q) return <div className="sb-insp sb-insp--empty" />;
    return (
      <fieldset className="sb-insp" disabled={readOnly}>
        <QuestionInspector
          key={q.code}
          q={q}
          inst={inst}
          baseline={baseline}
          created={createdCodes.has(q.code)}
          disabled={readOnly}
          edit={edit}
          onRenameCode={onRenameCode}
          onDelete={() => onDeleteQuestion(q.code)}
          onMoveWithinStep={onMoveWithinStep}
        />
      </fieldset>
    );
  }

  const step = inst.steps.find((s) => s.id === selected.id);
  if (!step) return <div className="sb-insp sb-insp--empty" />;
  return (
    <fieldset className="sb-insp" disabled={readOnly}>
      <StepInspector
        key={step.id}
        step={step}
        inst={inst}
        disabled={readOnly}
        edit={edit}
        onDelete={() => onDeleteStep(step.id)}
        onMoveStep={onMoveStepBy}
      />
    </fieldset>
  );
}
