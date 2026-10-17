'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { Condition, Instrument, Primitive, QuestionDef } from '@/survey/model';

type Leaf = Exclude<Condition, { args: Condition[] }>;
type Group = Extract<Condition, { args: Condition[] }>;

const OPS_CHOICE: Array<[Leaf['op'], string]> = [
  ['eq', 'is'],
  ['neq', 'is not'],
  ['in', 'is one of'],
  ['notIn', 'is none of'],
  ['answered', 'is answered'],
  ['unanswered', 'is blank'],
];
const OPS_LIST: Array<[Leaf['op'], string]> = [
  ['includes', 'includes'],
  ['notIncludes', 'does not include'],
  ['answered', 'is answered'],
  ['unanswered', 'is blank'],
];
const OPS_FREE: Array<[Leaf['op'], string]> = [
  ['answered', 'is answered'],
  ['unanswered', 'is blank'],
];

function opsFor(q: QuestionDef | undefined): Array<[Leaf['op'], string]> {
  if (!q) return OPS_FREE;
  if (q.type === 'single' || q.type === 'likert') return OPS_CHOICE;
  if (q.type === 'multi' || q.type === 'nested_multi') return OPS_LIST;
  return OPS_FREE;
}

/** Choices a rule can compare against for this question. */
export function valueChoices(q: QuestionDef | undefined): Array<{ id: string; label: string }> {
  if (!q) return [];
  if (q.type === 'likert') {
    const labels =
      q.scale === 'likelihood'
        ? ['Very unlikely', 'Unlikely', 'Not sure', 'Likely', 'Very likely']
        : ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
    return labels.map((label, i) => ({ id: String(i + 1), label: `${i + 1} — ${label}` }));
  }
  if (q.type === 'nested_multi') {
    return [
      ...(q.categories ?? []).map((c) => ({ id: c.id, label: c.label })),
      ...(q.options ?? []).map((o) => ({ id: o.id, label: o.label })),
    ];
  }
  return (q.options ?? []).map((o) => ({ id: String(o.id), label: o.label }));
}

function coerce(q: QuestionDef | undefined, id: string): Primitive {
  return q && (q.type === 'likert' || q.numericValues) ? Number(id) : id;
}

export function defaultLeaf(q: QuestionDef): Leaf {
  const first = valueChoices(q)[0];
  if (q.type === 'single' && first) return { op: 'eq', q: q.code, value: coerce(q, first.id) };
  if ((q.type === 'multi' || q.type === 'nested_multi') && first) {
    return { op: 'includes', q: q.code, value: first.id };
  }
  if (q.type === 'likert') return { op: 'in', q: q.code, value: [4, 5] };
  return { op: 'answered', q: q.code };
}

function leafForOp(q: QuestionDef | undefined, code: string, op: Leaf['op'], previous?: Leaf): Leaf {
  const first = valueChoices(q)[0];
  const firstId = first ? first.id : '';
  if (op === 'answered' || op === 'unanswered') return { op, q: code };
  if (op === 'in' || op === 'notIn') {
    const keep = previous && 'value' in previous ? [previous.value].flat() : [];
    return { op, q: code, value: keep.length ? (keep as Primitive[]) : firstId ? [coerce(q, firstId)] : [] };
  }
  if (op === 'includes' || op === 'notIncludes') {
    const keep = previous && 'value' in previous && !Array.isArray(previous.value) ? String(previous.value) : firstId;
    return { op, q: code, value: keep };
  }
  const keep = previous && 'value' in previous && !Array.isArray(previous.value) ? previous.value : coerce(q, firstId);
  return { op, q: code, value: keep };
}

function LeafRow({
  leaf,
  inst,
  choices,
  disabled,
  onChange,
  onRemove,
}: {
  leaf: Leaf;
  inst: Instrument;
  choices: QuestionDef[];
  disabled?: boolean;
  onChange: (next: Leaf) => void;
  onRemove: () => void;
}) {
  const source = inst.questions.find((q) => q.code === leaf.q);
  const ops = opsFor(source);
  const values = valueChoices(source);
  const picked: string[] =
    'value' in leaf ? (Array.isArray(leaf.value) ? leaf.value.map(String) : [String(leaf.value)]) : [];

  return (
    <div className="sb-rule">
      <select
        className="sb-input"
        aria-label="Question to check"
        value={leaf.q}
        disabled={disabled}
        onChange={(e) => {
          const next = inst.questions.find((q) => q.code === e.target.value);
          onChange(next ? defaultLeaf(next) : { op: 'answered', q: e.target.value });
        }}
      >
        {!choices.some((c) => c.code === leaf.q) ? <option value={leaf.q}>{leaf.q} (unavailable)</option> : null}
        {choices.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.text.slice(0, 48)}
          </option>
        ))}
      </select>
      <select
        className="sb-input"
        aria-label="Comparison"
        value={leaf.op}
        disabled={disabled}
        onChange={(e) => onChange(leafForOp(source, leaf.q, e.target.value as Leaf['op'], leaf))}
      >
        {ops.map(([op, label]) => (
          <option key={op} value={op}>
            {label}
          </option>
        ))}
      </select>

      {'value' in leaf && !Array.isArray(leaf.value) && values.length > 0 ? (
        <select
          className="sb-input"
          aria-label="Answer"
          value={String(leaf.value)}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...leaf, value: leaf.op === 'includes' || leaf.op === 'notIncludes' ? e.target.value : coerce(source, e.target.value) } as Leaf)
          }
        >
          {!values.some((v) => v.id === String(leaf.value)) ? (
            <option value={String(leaf.value)}>{String(leaf.value)} (not a choice)</option>
          ) : null}
          {values.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      ) : null}

      {'value' in leaf && !Array.isArray(leaf.value) && values.length === 0 ? (
        <input
          className="sb-input"
          aria-label="Answer"
          value={String(leaf.value)}
          disabled={disabled}
          onChange={(e) => onChange({ ...leaf, value: e.target.value } as Leaf)}
        />
      ) : null}

      {'value' in leaf && Array.isArray(leaf.value) ? (
        <div className="sb-rule__multi" role="group" aria-label="Answers">
          {values.map((v) => {
            const on = picked.includes(v.id);
            return (
              <label key={v.id} className="sb-check">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled}
                  onChange={() => {
                    const next = on ? picked.filter((id) => id !== v.id) : [...picked, v.id];
                    onChange({ ...leaf, value: next.map((id) => coerce(source, id)) } as Leaf);
                  }}
                />
                <span>{v.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      <button type="button" className="sb-icon-btn" aria-label="Remove rule" disabled={disabled} onClick={onRemove}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function GroupBox({
  group,
  inst,
  choices,
  disabled,
  depth,
  onChange,
  onRemove,
}: {
  group: Group;
  inst: Instrument;
  choices: QuestionDef[];
  disabled?: boolean;
  depth: number;
  onChange: (next: Condition | undefined) => void;
  onRemove: () => void;
}) {
  const setArg = (index: number, next: Condition | undefined) => {
    const args = group.args.flatMap((arg, i) => (i === index ? (next ? [next] : []) : [arg]));
    onChange(args.length === 0 ? undefined : args.length === 1 && depth > 0 ? args[0] : { ...group, args });
  };
  const addRule = () => {
    const q = choices[0];
    if (!q) return;
    onChange({ ...group, args: [...group.args, defaultLeaf(q)] });
  };
  const addGroup = () => {
    const q = choices[0];
    if (!q) return;
    onChange({
      ...group,
      args: [...group.args, { op: group.op === 'and' ? 'or' : 'and', args: [defaultLeaf(q)] }],
    });
  };

  return (
    <div className={`sb-group sb-group--${group.op}`}>
      <div className="sb-group__head">
        <select
          className="sb-input sb-input--inline"
          aria-label="Match mode"
          value={group.op}
          disabled={disabled}
          onChange={(e) => onChange({ ...group, op: e.target.value as 'and' | 'or' })}
        >
          <option value="and">All of these are true</option>
          <option value="or">Any of these is true</option>
        </select>
        {depth > 0 ? (
          <button type="button" className="sb-icon-btn" aria-label="Remove group" disabled={disabled} onClick={onRemove}>
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
      {group.args.map((arg, index) =>
        'args' in arg ? (
          <GroupBox
            key={index}
            group={arg}
            inst={inst}
            choices={choices}
            disabled={disabled}
            depth={depth + 1}
            onChange={(next) => setArg(index, next)}
            onRemove={() => setArg(index, undefined)}
          />
        ) : (
          <LeafRow
            key={index}
            leaf={arg}
            inst={inst}
            choices={choices}
            disabled={disabled}
            onChange={(next) => setArg(index, next)}
            onRemove={() => setArg(index, undefined)}
          />
        ),
      )}
      <div className="sb-group__actions">
        <button type="button" className="sb-link" disabled={disabled} onClick={addRule}>
          <Plus size={12} /> Add rule
        </button>
        <button type="button" className="sb-link" disabled={disabled} onClick={addGroup}>
          <Plus size={12} /> Add group
        </button>
      </div>
    </div>
  );
}

/**
 * Edits a branching condition. Only questions that come before `ownerCode` can be read,
 * because a respondent cannot have answered a later question yet.
 */
export function ConditionEditor({
  value,
  inst,
  ownerCode,
  emptyLabel = 'Always shown',
  disabled,
  onChange,
}: {
  value: Condition | undefined;
  inst: Instrument;
  /** Questions after this one are not offered. Omit to offer every question. */
  ownerCode?: string;
  emptyLabel?: string;
  disabled?: boolean;
  onChange: (next: Condition | undefined) => void;
}) {
  const ownerIndex = ownerCode ? inst.questions.findIndex((q) => q.code === ownerCode) : inst.questions.length;
  const choices = inst.questions.filter((q, i) => i < ownerIndex && q.code !== ownerCode);

  if (!value) {
    return (
      <div className="sb-cond-empty">
        <span>{emptyLabel}</span>
        <button
          type="button"
          className="sb-link"
          disabled={disabled || choices.length === 0}
          onClick={() => choices[0] && onChange(defaultLeaf(choices[0]))}
        >
          <Plus size={12} /> Add condition
        </button>
      </div>
    );
  }

  if ('args' in value) {
    return (
      <GroupBox
        group={value}
        inst={inst}
        choices={choices}
        disabled={disabled}
        depth={0}
        onChange={onChange}
        onRemove={() => onChange(undefined)}
      />
    );
  }

  return (
    <div className="sb-group sb-group--single">
      <LeafRow
        leaf={value}
        inst={inst}
        choices={choices}
        disabled={disabled}
        onChange={(next) => onChange(next)}
        onRemove={() => onChange(undefined)}
      />
      <div className="sb-group__actions">
        <button
          type="button"
          className="sb-link"
          disabled={disabled || choices.length === 0}
          onClick={() => choices[0] && onChange({ op: 'and', args: [value, defaultLeaf(choices[0])] })}
        >
          <Plus size={12} /> Add another rule
        </button>
      </div>
    </div>
  );
}
