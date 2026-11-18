'use client';

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OverflowMenu, type OverflowItem } from '@/components/ui/OverflowMenu';
import { Select } from '@/components/ui/Select';
import { isCoreCode } from '@/survey/lint';
import { describeConditionPlain, type Instrument, type QuestionDef, type StepDef } from '@/survey/model';

type Selection = { kind: 'question' | 'step'; id: string } | null;
type Filter = 'all' | 'conditional' | 'dashboard' | 'optional';
type SortKey = 'order' | 'code' | 'type';

const MIME_Q = 'application/x-recares-question';
const MIME_S = 'application/x-recares-step';

const TYPE_LABEL: Record<QuestionDef['type'], string> = {
  single: 'Pick one',
  multi: 'Pick many',
  likert: 'Scale',
  text: 'Free text',
  number: 'Number',
  nested_multi: 'Nested list',
};

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All questions',
  conditional: 'Conditional only',
  dashboard: 'Dashboard fields',
  optional: 'Optional only',
};

const SORT_LABEL: Record<SortKey, string> = {
  order: 'Survey order',
  code: 'Code A to Z',
  type: 'Answer type',
};

/** One question plus the facts every view needs, derived once from the instrument. */
interface Row {
  q: QuestionDef;
  step: StepDef;
  stepIndex: number;
  /** Index among the step's questions in survey order, ignoring search and sort. */
  position: number;
  stepSize: number;
  required: boolean;
  core: boolean;
  rule: string | null;
}

interface Handlers {
  readOnly: boolean;
  sorted: boolean;
  selectedCode: string | null;
  onSelectQuestion: (code: string) => void;
  onMoveQuestionBy: (code: string, delta: number) => void;
  onDeleteQuestion: (code: string) => void;
}

function isRequired(q: QuestionDef): boolean {
  return q.required ?? !(q.type === 'text' || q.type === 'number');
}

function deriveRows(inst: Instrument): Row[] {
  const rows: Row[] = [];
  inst.steps.forEach((step, stepIndex) => {
    const own = inst.questions.filter((q) => q.stepId === step.id);
    own.forEach((q, position) => {
      rows.push({
        q,
        step,
        stepIndex,
        position,
        stepSize: own.length,
        required: isRequired(q),
        core: isCoreCode(q.code),
        rule: q.showWhen ? describeConditionPlain(q.showWhen, inst) : null,
      });
    });
  });
  return rows;
}

function passesFilter(row: Row, filter: Filter): boolean {
  if (filter === 'conditional') return Boolean(row.q.showWhen);
  if (filter === 'dashboard') return row.core;
  if (filter === 'optional') return !row.required;
  return true;
}

function compare(a: Row, b: Row, sort: SortKey): number {
  if (sort === 'code') return a.q.code.localeCompare(b.q.code, undefined, { numeric: true, sensitivity: 'base' });
  if (sort === 'type') return TYPE_LABEL[a.q.type].localeCompare(TYPE_LABEL[b.q.type]) || a.q.code.localeCompare(b.q.code, undefined, { numeric: true });
  return a.stepIndex - b.stepIndex || a.position - b.position;
}

// ---------------------------------------------------------------------------
// Shared pieces

/** Type, whether it is optional, and where it comes from, as one quiet line of words. */
function RowMeta({ row }: { row: Row }) {
  const { q } = row;
  const parts: string[] = [TYPE_LABEL[q.type]];
  if (!row.required) parts.push('Optional');
  if (row.core) parts.push('Dashboard');
  if (q.options?.some((o) => o.showWhen)) parts.push('Conditional choices');
  if (q.textVariants?.length) parts.push('Wording varies');
  return (
    <span className="qx-meta" title={row.core ? 'The dashboard reads this answer by its code' : undefined}>
      {parts.join(' · ')}
    </span>
  );
}

/** Only a rule is worth a line. A question that is always shown says nothing. */
function RuleLine({ row }: { row: Row }) {
  if (!row.rule) return null;
  const text = `Shown only when ${row.rule}`;
  return (
    <span className="qx-rule" title={text}>
      {text}
    </span>
  );
}

/** Reordering and delete live in one overflow menu. Opening a question is the row itself. */
function RowActions({ row, h }: { row: Row; h: Handlers }) {
  const { q } = row;
  const items: OverflowItem[] = h.readOnly
    ? []
    : [
        {
          id: 'up',
          label: 'Move up',
          icon: <ArrowUp size={14} />,
          disabled: h.sorted || row.position <= 0,
          hint: h.sorted ? 'Sort by “Survey order” to reorder' : undefined,
          onSelect: () => h.onMoveQuestionBy(q.code, -1),
        },
        {
          id: 'down',
          label: 'Move down',
          icon: <ArrowDown size={14} />,
          disabled: h.sorted || row.position >= row.stepSize - 1,
          hint: h.sorted ? 'Sort by “Survey order” to reorder' : undefined,
          onSelect: () => h.onMoveQuestionBy(q.code, 1),
        },
        {
          id: 'delete',
          label: 'Delete…',
          icon: <Trash2 size={14} />,
          danger: true,
          disabled: row.core,
          hint: row.core ? 'The dashboard needs this question' : undefined,
          onSelect: () => h.onDeleteQuestion(q.code),
        },
      ];
  if (items.length === 0) return <span className="qx-actions" />;
  return (
    <span className="qx-actions">
      <OverflowMenu label={`More actions for ${q.code}`} items={items} />
    </span>
  );
}

// ---------------------------------------------------------------------------

export function QuestionList({
  inst,
  selected,
  readOnly,
  onSelectQuestion,
  onSelectStep,
  onMoveQuestion,
  onMoveQuestionBy,
  onMoveStep,
  onMoveStepBy,
  onAddQuestion,
  onAddStep,
  onDeleteQuestion,
}: {
  inst: Instrument;
  selected: Selection;
  readOnly: boolean;
  onSelectQuestion: (code: string) => void;
  onSelectStep: (id: string) => void;
  /** Place `code` before `beforeCode` (in that question's step), or at the end of `stepId`. */
  onMoveQuestion: (code: string, target: { beforeCode?: string; stepId: string }) => void;
  onMoveQuestionBy: (code: string, delta: number) => void;
  onMoveStep: (stepId: string, beforeStepId: string | null) => void;
  onMoveStepBy: (stepId: string, delta: number) => void;
  onAddQuestion: (stepId: string) => void;
  onAddStep: () => void;
  onDeleteQuestion: (code: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [over, setOver] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('order');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const term = query.trim().toLowerCase();
  const sorted = sort !== 'order';
  const filtering = term !== '' || filter !== 'all';
  const all = useMemo(() => deriveRows(inst), [inst]);
  const visible = useMemo(() => {
    const keep = all.filter(
      (r) => passesFilter(r, filter) && (!term || `${r.q.code} ${r.q.text}`.toLowerCase().includes(term) || r.step.title.toLowerCase().includes(term)),
    );
    return [...keep].sort((a, b) => compare(a, b, sort));
  }, [all, filter, term, sort]);
  const allCollapsed = inst.steps.length > 0 && inst.steps.every((s) => collapsed[s.id]);

  useEffect(() => {
    rootRef.current?.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' });
  }, [selected?.kind, selected?.id]);

  const handlers: Handlers = {
    readOnly,
    sorted,
    selectedCode: selected?.kind === 'question' ? selected.id : null,
    onSelectQuestion,
    onMoveQuestionBy,
    onDeleteQuestion,
  };

  const accept = (event: React.DragEvent, mime: string) => {
    if (readOnly || sorted || !event.dataTransfer.types.includes(mime)) return false;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return true;
  };

  const clearFilters = () => {
    setQuery('');
    setFilter('all');
  };

  // ---- renderers -----------------------------------------------------------

  const grip = (code: string) =>
    readOnly || sorted ? (
      <span className="qx-grip" aria-hidden="true" />
    ) : (
      <span
        className="qx-grip is-active"
        draggable
        title="Drag to reorder"
        aria-hidden="true"
        onDragStart={(e) => {
          e.dataTransfer.setData(MIME_Q, code);
          e.dataTransfer.effectAllowed = 'move';
        }}
      >
        <GripVertical size={16} />
      </span>
    );

  const dropProps = (row: Row) => ({
    onDragOver: (e: React.DragEvent) => {
      if (accept(e, MIME_Q)) setOver(`q:${row.q.code}`);
    },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => {
      setOver(null);
      const dragged = e.dataTransfer.getData(MIME_Q);
      if (dragged && dragged !== row.q.code) {
        e.preventDefault();
        e.stopPropagation();
        onMoveQuestion(dragged, { beforeCode: row.q.code, stepId: row.step.id });
      }
    },
  });

  const rowClass = (row: Row) =>
    `qx${handlers.selectedCode === row.q.code ? ' is-selected' : ''}${over === `q:${row.q.code}` ? ' is-over' : ''}`;

  const openOnClick = (row: Row) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, [role="menu"]')) return;
    onSelectQuestion(row.q.code);
  };

  /** The question text is the real button, so a row works from the keyboard as well. */
  const openButton = (row: Row) => (
    <button type="button" className="qx-title" title={row.q.text} onClick={() => onSelectQuestion(row.q.code)}>
      {row.q.text}
    </button>
  );

  const renderCard = (row: Row) => (
    <li key={row.q.code} className={rowClass(row)} onClick={openOnClick(row)} {...dropProps(row)}>
      {grip(row.q.code)}
      <span className="qx-code">{row.q.code}</span>
      <div className="qx-main">
        {openButton(row)}
        <RowMeta row={row} />
        <RuleLine row={row} />
      </div>
      <RowActions row={row} h={handlers} />
    </li>
  );

  const renderGrouped = () =>
    inst.steps.map((step, stepIndex) => {
      const own = all.filter((r) => r.step.id === step.id);
      const rows = visible.filter((r) => r.step.id === step.id);
      if (filtering && rows.length === 0) return null;
      const isCollapsed = !filtering && collapsed[step.id];
      const stepSelected = selected?.kind === 'step' && selected.id === step.id;
      const countText = filtering ? `${rows.length} of ${own.length} questions` : `${own.length} question${own.length === 1 ? '' : 's'}`;
      const stepItems: OverflowItem[] = readOnly
        ? []
        : [
            { id: 'add', label: 'Add question', icon: <Plus size={14} />, onSelect: () => onAddQuestion(step.id) },
            { id: 'earlier', label: 'Move step earlier', icon: <ArrowUp size={14} />, disabled: stepIndex === 0, onSelect: () => onMoveStepBy(step.id, -1) },
            { id: 'later', label: 'Move step later', icon: <ArrowDown size={14} />, disabled: stepIndex === inst.steps.length - 1, onSelect: () => onMoveStepBy(step.id, 1) },
          ];
      return (
        <section key={step.id} className="qxs" aria-label={`Step ${stepIndex + 1}: ${step.title}`}>
          <div
            className={`qxs__head${stepSelected ? ' is-selected' : ''}${over === `s:${step.id}` ? ' is-over' : ''}`}
            onDragOver={(e) => {
              if (accept(e, MIME_S) || accept(e, MIME_Q)) setOver(`s:${step.id}`);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              setOver(null);
              const dragStep = e.dataTransfer.getData(MIME_S);
              const dragQuestion = e.dataTransfer.getData(MIME_Q);
              if (dragStep && dragStep !== step.id) {
                e.preventDefault();
                onMoveStep(dragStep, step.id);
              } else if (dragQuestion) {
                e.preventDefault();
                onMoveQuestion(dragQuestion, { stepId: step.id });
              }
            }}
          >
            {readOnly || sorted ? (
              <span className="qx-grip" aria-hidden="true" />
            ) : (
              <span
                className="qx-grip is-active"
                draggable
                title="Drag to reorder"
                aria-hidden="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData(MIME_S, step.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <GripVertical size={16} />
              </span>
            )}
            <span className="qxs__num">{stepIndex + 1}</span>
            <button type="button" className="qxs__name" title={step.title} onClick={() => onSelectStep(step.id)}>
              {step.title || 'Untitled step'}
            </button>
            <span className="qxs__count">{countText}</span>
            <button
              type="button"
              className="qx-icon"
              aria-label={isCollapsed ? `Expand step ${stepIndex + 1}` : `Collapse step ${stepIndex + 1}`}
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed((c) => ({ ...c, [step.id]: !c[step.id] }))}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </button>
            {stepItems.length ? (
              <span className="qx-actions">
                <OverflowMenu label={`More actions for step ${stepIndex + 1}`} items={stepItems} />
              </span>
            ) : null}
          </div>

          {isCollapsed ? null : (
            <ul className="qxs__list">
              {rows.map((row) => renderCard(row))}
              {own.length === 0 ? <li className="qxs__empty">No questions in this step yet.</li> : null}
              {readOnly || filtering ? null : (
                <li className="qxs__add">
                  <button type="button" className="qx-btn" onClick={() => onAddQuestion(step.id)}>
                    Add question to this step
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>
      );
    });

  const shown = visible.length;

  const conditionalCount = all.filter((r) => r.rule).length;
  const FILTER_KEYS = Object.keys(FILTER_LABEL) as Filter[];
  const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];

  return (
    <div className="qx-wrap" ref={rootRef}>
      <div className="inq-toolbar qx-toolbar">
        <div className="inq-toolbar__search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Find a question" aria-label="Find a question" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="inq-toolbar__sort">
          <Select
            label="Filter questions"
            options={FILTER_KEYS.map((k) => FILTER_LABEL[k])}
            value={FILTER_LABEL[filter]}
            onChange={(e) => setFilter(FILTER_KEYS.find((k) => FILTER_LABEL[k] === e.target.value) ?? 'all')}
          />
        </div>
        <div className="inq-toolbar__sort">
          <Select
            label="Sort questions"
            options={SORT_KEYS.map((k) => SORT_LABEL[k])}
            value={SORT_LABEL[sort]}
            onChange={(e) => setSort(SORT_KEYS.find((k) => SORT_LABEL[k] === e.target.value) ?? 'order')}
          />
        </div>
      </div>

      <div className="qx-foot">
        <p className="qx-count" aria-live="polite">
          {filtering
            ? `Showing ${shown} of ${all.length} questions`
            : `${all.length} questions in ${inst.steps.length} steps${conditionalCount ? ` · ${conditionalCount} conditional` : ''}`}
          {sorted && !readOnly ? ' · reordering is off while sorted' : ''}
        </p>
        <div className="qx-foot__actions">
          {filtering ? (
            <button type="button" className="qx-btn" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
          <button
            type="button"
            className="qx-btn"
            onClick={() => setCollapsed(allCollapsed ? {} : Object.fromEntries(inst.steps.map((s) => [s.id, true])))}
          >
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </button>
        </div>
      </div>

      {inst.steps.length === 0 ? (
        <div className="inq-state">
          <p className="admin-empty__title">This survey has no steps yet</p>
          <p className="admin-empty__body">Add a step, then add questions to it.</p>
          {readOnly ? null : (
            <button type="button" className="qx-btn qx-btn--primary" onClick={onAddStep}>
              Add step
            </button>
          )}
        </div>
      ) : filtering && shown === 0 ? (
        <div className="inq-state">
          <p className="admin-empty__title">No questions match</p>
          <p className="admin-empty__body">Nothing fits {query ? `“${query}”` : 'this filter'}. Try a different word or clear the filters.</p>
          <button type="button" className="qx-btn" onClick={clearFilters}>
            Clear search and filters
          </button>
        </div>
      ) : (
        renderGrouped()
      )}

      {readOnly ? null : (
        <button
          type="button"
          className="qx-btn qxs__addstep"
          onClick={onAddStep}
          onDragOver={(e) => {
            accept(e, MIME_S);
          }}
          onDrop={(e) => {
            const dragStep = e.dataTransfer.getData(MIME_S);
            if (dragStep) {
              e.preventDefault();
              onMoveStep(dragStep, null);
            }
          }}
        >
          Add step
        </button>
      )}
    </div>
  );
}
