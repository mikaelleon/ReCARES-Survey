'use client';

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GitBranch,
  GripVertical,
  LayoutList,
  List as ListIcon,
  Lock,
  Pencil,
  Plus,
  Rows3,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BuilderView } from '@/components/admin/builder/useBuilderView';
import { OverflowMenu, type OverflowItem } from '@/components/ui/OverflowMenu';
import { ViewSwitcher, type ViewOption } from '@/components/ui/ViewSwitcher';
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

const VIEW_OPTIONS: ViewOption<BuilderView>[] = [
  { id: 'comfortable', label: 'Comfortable', icon: <LayoutList size={16} /> },
  { id: 'compact', label: 'Compact', icon: <Rows3 size={16} /> },
  { id: 'list', label: 'List', icon: <ListIcon size={16} /> },
  { id: 'table', label: 'Table', icon: <Table2 size={16} /> },
];

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

function StatusChips({ row, dense }: { row: Row; dense?: boolean }) {
  const { q } = row;
  return (
    <span className="qc__chips">
      <span className="qc__code">{q.code}</span>
      <span className="qc__chip">{TYPE_LABEL[q.type]}</span>
      {row.required ? null : <span className="qc__chip">Optional</span>}
      {row.core ? (
        <span className="qc__chip qc__chip--lock" title="The dashboard reads this answer by its code">
          <Lock size={11} aria-hidden="true" /> Dashboard
        </span>
      ) : null}
      {dense ? (
        row.rule ? (
          <span className="qc__chip">
            <GitBranch size={11} aria-hidden="true" /> Conditional
          </span>
        ) : null
      ) : (
        <>
          {q.options?.some((o) => o.showWhen) ? <span className="qc__chip">Conditional choices</span> : null}
          {q.textVariants?.length ? <span className="qc__chip">Wording varies</span> : null}
        </>
      )}
    </span>
  );
}

function RuleLine({ row }: { row: Row }) {
  const text = row.rule ? `Shown only when ${row.rule}` : 'Always shown';
  return (
    <span className={`qc__rule${row.rule ? ' is-conditional' : ''}`} title={text}>
      {row.rule ? <GitBranch size={13} aria-hidden="true" /> : null}
      <span className="qc__rule-text">{text}</span>
    </span>
  );
}

/** One primary button plus an overflow menu for the rest. Delete is never next to the arrows. */
function RowActions({ row, h, labelled = true }: { row: Row; h: Handlers; labelled?: boolean }) {
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
  return (
    <span className="qc__actions">
      <button type="button" className="qc__edit" onClick={() => h.onSelectQuestion(q.code)} aria-label={`${h.readOnly ? 'View' : 'Edit'} ${q.code}`}>
        <Pencil size={14} aria-hidden="true" />
        {labelled ? <span>{h.readOnly ? 'View' : 'Edit'}</span> : null}
      </button>
      {items.length ? <OverflowMenu label={`More actions for ${q.code}`} items={items} /> : null}
    </span>
  );
}

// ---------------------------------------------------------------------------

export function QuestionList({
  inst,
  selected,
  readOnly,
  view,
  onViewChange,
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
  view: BuilderView;
  onViewChange: (view: BuilderView) => void;
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
  const [tableStep, setTableStep] = useState('');
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
    readOnly || sorted ? null : (
      <span
        className="qc__grip"
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

  const rowClass = (row: Row, mode: string) =>
    `qc qc--${mode}${handlers.selectedCode === row.q.code ? ' is-selected' : ''}${over === `q:${row.q.code}` ? ' is-over' : ''}`;

  const openOnClick = (row: Row) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, [role="menu"]')) return;
    onSelectQuestion(row.q.code);
  };

  const renderCard = (row: Row, mode: 'comfortable' | 'compact') => (
    <li key={row.q.code} className={rowClass(row, mode)} onClick={openOnClick(row)} {...dropProps(row)}>
      {grip(row.q.code)}
      <div className="qc__body">
        <span className="qc__title" title={row.q.text}>
          {row.q.text}
        </span>
        <RuleLine row={row} />
        <StatusChips row={row} dense={mode === 'compact'} />
      </div>
      <RowActions row={row} h={handlers} labelled={mode === 'comfortable'} />
    </li>
  );

  const renderListRow = (row: Row) => (
    <li key={row.q.code} className={rowClass(row, 'list')} onClick={openOnClick(row)} {...dropProps(row)}>
      {grip(row.q.code) ?? <span className="qc__grip-gap" aria-hidden="true" />}
      <span className="qc__code">{row.q.code}</span>
      <span className="qc__title" title={row.q.text}>
        {row.q.text}
      </span>
      <span className="qc__chip qc__col-type">{TYPE_LABEL[row.q.type]}</span>
      <span className="qc__col-rule">
        <RuleLine row={row} />
      </span>
      <RowActions row={row} h={handlers} labelled={false} />
    </li>
  );

  const sortHeader = (key: SortKey, label: string) => (
    <button type="button" className={`qt__sort${sort === key ? ' is-active' : ''}`} onClick={() => setSort(sort === key ? 'order' : key)}>
      {label}
      <span aria-hidden="true">{sort === key ? ' ▲' : ''}</span>
    </button>
  );

  const renderTable = () => (
    <div className="qt">
      <table className="qt__table">
        <thead>
          <tr>
            <th scope="col" aria-sort={sort === 'order' ? 'ascending' : 'none'}>{sortHeader('order', 'Step')}</th>
            <th scope="col" aria-sort={sort === 'code' ? 'ascending' : 'none'}>{sortHeader('code', 'Code')}</th>
            <th scope="col">Question</th>
            <th scope="col" aria-sort={sort === 'type' ? 'ascending' : 'none'}>{sortHeader('type', 'Type')}</th>
            <th scope="col">Required</th>
            <th scope="col">Shown when</th>
            <th scope="col" className="qt__actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.q.code} className={handlers.selectedCode === row.q.code ? 'is-selected' : ''} onClick={openOnClick(row)}>
              <td>
                <span className={`qc__stepnum sb-step-${row.stepIndex % 6}`} title={row.step.title}>
                  {row.stepIndex + 1}
                </span>
              </td>
              <td>
                <span className="qc__code">{row.q.code}</span>
                {row.core ? <Lock size={11} aria-label="Dashboard field" className="qt__lock" /> : null}
              </td>
              <td className="qt__text" title={row.q.text}>
                {row.q.text}
              </td>
              <td>{TYPE_LABEL[row.q.type]}</td>
              <td>{row.required ? 'Yes' : 'Optional'}</td>
              <td className="qt__rule" title={row.rule ?? 'Always shown'}>
                <RuleLine row={row} />
              </td>
              <td className="qt__actions-col">
                <RowActions row={row} h={handlers} labelled={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {readOnly || inst.steps.length === 0 ? null : (
        <div className="qt__add">
          <label className="qt__add-label">
            <span>Add a question to</span>
            <select value={tableStep || inst.steps[0]!.id} onChange={(e) => setTableStep(e.target.value)} aria-label="Step for the new question">
              {inst.steps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.title}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="qc__edit" onClick={() => onAddQuestion(tableStep || inst.steps[0]!.id)}>
            <Plus size={14} aria-hidden="true" /> <span>Add question</span>
          </button>
        </div>
      )}
    </div>
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
        <section key={step.id} className={`qs sb-step-${stepIndex % 6}`} aria-label={`Step ${stepIndex + 1}: ${step.title}`}>
          <div
            className={`qs__head${stepSelected ? ' is-selected' : ''}${over === `s:${step.id}` ? ' is-over' : ''}`}
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
            <button
              type="button"
              className="qc__iconbtn"
              aria-label={isCollapsed ? `Expand step ${stepIndex + 1}` : `Collapse step ${stepIndex + 1}`}
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed((c) => ({ ...c, [step.id]: !c[step.id] }))}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </button>
            {readOnly || sorted ? null : (
              <span
                className="qc__grip"
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
            <span className="qc__stepnum">{stepIndex + 1}</span>
            <span className="qs__name" title={step.title}>
              {step.title || 'Untitled step'}
            </span>
            <span className="qs__count">{countText}</span>
            <span className="qc__actions">
              <button type="button" className="qc__edit" onClick={() => onSelectStep(step.id)} aria-label={`${readOnly ? 'View' : 'Edit'} step ${stepIndex + 1}`}>
                <Pencil size={14} aria-hidden="true" />
                <span>{readOnly ? 'View step' : 'Edit step'}</span>
              </button>
              {stepItems.length ? <OverflowMenu label={`More actions for step ${stepIndex + 1}`} items={stepItems} /> : null}
            </span>
          </div>

          {isCollapsed ? null : (
            <ul className={`qs__list qs__list--${view}`}>
              {rows.map((row) => (view === 'list' ? renderListRow(row) : renderCard(row, view === 'compact' ? 'compact' : 'comfortable')))}
              {own.length === 0 ? <li className="qs__empty">No questions in this step yet.</li> : null}
              {readOnly || filtering ? null : (
                <li>
                  <button type="button" className="qs__add" onClick={() => onAddQuestion(step.id)}>
                    <Plus size={16} aria-hidden="true" /> Add question to this step
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>
      );
    });

  const shown = visible.length;

  return (
    <div className="qlist" ref={rootRef}>
      <div className="qlist__tools">
        <label className="qlist__search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Find a question" aria-label="Find a question" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          ) : null}
        </label>
        <label className="qlist__select">
          <span className="visually-hidden">Filter</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filter questions">
            {(Object.keys(FILTER_LABEL) as Filter[]).map((key) => (
              <option key={key} value={key}>
                {FILTER_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="qlist__select">
          <span className="visually-hidden">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort questions">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <ViewSwitcher label="View" value={view} options={VIEW_OPTIONS} onChange={onViewChange} />
      </div>

      <div className="qlist__meta" aria-live="polite">
        <span>
          {filtering ? `Showing ${shown} of ${all.length} questions` : `${all.length} questions in ${inst.steps.length} steps`}
          {sorted && !readOnly ? ' · reordering is off while sorted' : ''}
        </span>
        <span className="qlist__meta-actions">
          {filtering ? (
            <button type="button" className="qlist__link" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
          {view === 'table' ? null : (
            <button
              type="button"
              className="qlist__link"
              onClick={() => setCollapsed(allCollapsed ? {} : Object.fromEntries(inst.steps.map((s) => [s.id, true])))}
            >
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          )}
        </span>
      </div>

      {inst.steps.length === 0 ? (
        <div className="qlist__state">
          <h3>This survey has no steps yet</h3>
          <p>Add a step, then add questions to it.</p>
          {readOnly ? null : (
            <button type="button" className="qc__edit qc__edit--solid" onClick={onAddStep}>
              <Plus size={14} aria-hidden="true" /> <span>Add step</span>
            </button>
          )}
        </div>
      ) : filtering && shown === 0 ? (
        <div className="qlist__state">
          <h3>No questions match</h3>
          <p>Nothing fits {query ? `“${query}”` : 'this filter'}. Try a different word or clear the filters.</p>
          <button type="button" className="qc__edit" onClick={clearFilters}>
            <span>Clear search and filters</span>
          </button>
        </div>
      ) : view === 'table' ? (
        renderTable()
      ) : (
        renderGrouped()
      )}

      {readOnly || view === 'table' ? null : (
        <button
          type="button"
          className="qs__addstep"
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
          <Plus size={16} aria-hidden="true" /> Add step
        </button>
      )}
    </div>
  );
}
