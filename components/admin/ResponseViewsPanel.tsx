'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Minus,
  MoreVertical,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { ExtendedWidgetCard } from '@/components/admin/charts/ExtendedWidgetCard';
import { QuestionChartCard } from '@/components/admin/charts/QuestionChartCard';
import { IndividualAnswers } from '@/components/admin/IndividualAnswers';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { RowMenu } from '@/components/admin/RowMenu';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/AuthProvider';
import { canWriteFindingNotes } from '@/lib/admin/access';
import {
  EXTENDED_COMPACT_IDS,
  EXTENDED_FULL_IDS,
  isExtendedWidgetId,
} from '@/lib/admin/extendedWidgets';
import { LIKERT_LABELS, type SampleRecord } from '@/lib/admin/sampleResponses';
import {
  RESPONSE_QUESTIONS,
  SUMMARY_FULL_IDS,
  SUMMARY_LIKERT_IDS,
  SUMMARY_PIE_IDS,
  getQuestionById,
} from '@/lib/admin/responseQuestions';
import { formatSubmissionLabel } from '@/lib/admin/submissionLabel';

export type ResponseViewTab = 'summary' | 'question' | 'individual' | 'list';

const TABS: { id: ResponseViewTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'question', label: 'Question' },
  { id: 'individual', label: 'Individual' },
  { id: 'list', label: 'List' },
];

const PIE_SET = new Set<string>(SUMMARY_PIE_IDS);
const FULL_SET = new Set<string>([...SUMMARY_FULL_IDS, ...EXTENDED_FULL_IDS]);
const LIKERT_SET = new Set<string>(SUMMARY_LIKERT_IDS);
const EXT_COMPACT_SET = new Set<string>(EXTENDED_COMPACT_IDS);

function ChartById({
  id,
  records,
  responseCount,
  compact = false,
  onRemove,
}: {
  id: string;
  records: SampleRecord[];
  responseCount: number;
  compact?: boolean;
  onRemove?: () => void;
}) {
  if (isExtendedWidgetId(id)) {
    return (
      <div className="gf-bento__cell" id={`summary-widget-${id}`}>
        <ExtendedWidgetCard
          id={id}
          records={records}
          compact={compact}
          onRemove={onRemove}
        />
      </div>
    );
  }
  const q = getQuestionById(id);
  if (!q) return null;
  return (
    <div className="gf-bento__cell" id={`summary-widget-${id}`}>
      <QuestionChartCard
        title={q.title}
        responseCount={responseCount}
        kind={q.kind}
        buckets={q.buckets(records)}
        compact={compact}
        onRemove={onRemove}
      />
      {q.hint ? <p className="gf-chart-hint">{q.hint}</p> : null}
    </div>
  );
}

/**
 * Google Forms–style response views: Summary, Question, Individual.
 * Page-level filters live in ResponsesToolbar above this panel.
 */
export function ResponseViewsPanel({
  records,
  filtered,
  onCopySummary,
  onExport,
  exportDisabled,
  onDelete,
  onBulkDelete,
  bulkClearSignal = 0,
  canDelete = false,
  onResetFilters,
  emptyDataset,
  summaryWidgets,
  onOpenWidgetPicker,
  onRemoveWidget,
  initialTab,
  focusResponseId,
  rangeEmpty = false,
  onResetDateRange,
}: {
  records: SampleRecord[];
  filtered: SampleRecord[];
  onCopySummary: () => void;
  onExport: () => void;
  exportDisabled: boolean;
  onDelete: (r: SampleRecord) => void;
  onBulkDelete?: (ids: string[]) => void;
  /** Increment to clear the List-tab selection (after a successful bulk delete). */
  bulkClearSignal?: number;
  canDelete?: boolean;
  onResetFilters: () => void;
  emptyDataset: boolean;
  summaryWidgets: string[];
  onOpenWidgetPicker: () => void;
  onRemoveWidget: (id: string) => void;
  initialTab?: ResponseViewTab;
  focusResponseId?: string | null;
  /** True when responses exist but the selected date range excludes all of them. */
  rangeEmpty?: boolean;
  onResetDateRange?: () => void;
}) {
  const { user, can } = useAuth();
  const canAddFindingNote =
    can('findingNotes') &&
    can('findingNotesCreate') &&
    canWriteFindingNotes(
      user
        ? {
            fullName: user.name || '',
            email: user.email,
            requestedRole: user.requestedRole || '',
            role: user.role,
            status: user.status === 'active' ? 'active' : 'pending',
            permissions: user.permissions,
          }
        : null,
    );
  const [tab, setTab] = useState<ResponseViewTab>(initialTab ?? 'summary');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [individualIndex, setIndividualIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [bulkClearSignal]);

  /** Drop selections that filters or deletes removed from view. */
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filtered.map((r) => r.id));
      const next = new Set(Array.from(prev).filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));

  useEffect(() => {
    if (
      initialTab === 'summary' ||
      initialTab === 'question' ||
      initialTab === 'individual' ||
      initialTab === 'list'
    ) {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!focusResponseId) return;
    const idx = filtered.findIndex((r) => r.id === focusResponseId);
    if (idx >= 0) {
      setTab('individual');
      setIndividualIndex(idx);
    }
  }, [focusResponseId, filtered]);

  const chartSource = filtered.length > 0 ? filtered : records;
  const responseCount = chartSource.length;

  const pieWidgets = summaryWidgets.filter((id) => PIE_SET.has(id));
  const fullWidgets = summaryWidgets.filter((id) => FULL_SET.has(id));
  const likertWidgets = summaryWidgets.filter((id) => LIKERT_SET.has(id));
  const extCompactWidgets = summaryWidgets.filter((id) => EXT_COMPACT_SET.has(id));
  const otherWidgets = summaryWidgets.filter(
    (id) =>
      !PIE_SET.has(id) &&
      !FULL_SET.has(id) &&
      !LIKERT_SET.has(id) &&
      !EXT_COMPACT_SET.has(id),
  );

  const safeQuestionIndex = Math.min(questionIndex, RESPONSE_QUESTIONS.length - 1);
  const currentQuestion = RESPONSE_QUESTIONS[safeQuestionIndex];

  const safeIndividualIndex =
    filtered.length === 0 ? 0 : Math.min(individualIndex, filtered.length - 1);
  const currentIndividual = filtered[safeIndividualIndex] ?? null;

  const hasStoredAnswers = Boolean(
    currentIndividual?.answers && Object.keys(currentIndividual.answers).length > 0,
  );

  const individualDetail = useMemo(() => {
    if (!currentIndividual) return null;
    return currentIndividual;
  }, [currentIndividual]);

  if (emptyDataset) {
    return (
      <div className="admin-panel">
        <ResponseEmptyState
          kind={rangeEmpty ? 'range' : 'empty'}
          onReset={rangeEmpty ? onResetDateRange : undefined}
        />
      </div>
    );
  }

  return (
    <div className="admin-panel gf-panel">
      <div className="gf-panel__bar">
        <span className="gf-panel__bar-spacer" aria-hidden="true" />
        <div className="gf-tabs" role="tablist" aria-label="Response views">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`gf-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`gf-panel-${t.id}`}
              className={`gf-tabs__tab${tab === t.id ? ' gf-tabs__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="gf-panel__actions">
          {tab === 'summary' ? (
            <Button variant="secondary" size="sm" onClick={onOpenWidgetPicker}>
              <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
              Add widget
            </Button>
          ) : null}
          <div className="gf-panel__menu-wrap">
            <button
              type="button"
              className="gf-panel__menu-btn"
              aria-label="More response actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="gf-panel__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCopySummary();
                    setMenuOpen(false);
                  }}
                  disabled={records.length === 0}
                >
                  Copy summary text
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onExport();
                    setMenuOpen(false);
                  }}
                  disabled={exportDisabled}
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled
                  title="Manually add a test response (not wired yet)"
                >
                  Add response (not available yet)
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        id={`gf-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`gf-tab-${tab}`}
        className="gf-tabpanel"
      >
        {tab === 'summary' ? (
          <div className="gf-summary">
            {filtered.length === 0 ? (
              <ResponseEmptyState kind="filtered" onReset={onResetFilters} />
            ) : summaryWidgets.length === 0 ? (
              <div className="gf-summary__empty-widgets">
                <p>No widgets pinned. Add charts to build your Summary view.</p>
                <Button variant="primary" onClick={onOpenWidgetPicker}>
                  Add widget
                </Button>
              </div>
            ) : (
              <div className="gf-bento">
                {pieWidgets.length > 0 ? (
                  <div className="gf-bento__pies">
                    {pieWidgets.map((id) => (
                      <ChartById
                        key={id}
                        id={id}
                        records={chartSource}
                        responseCount={responseCount}
                        compact
                        onRemove={() => onRemoveWidget(id)}
                      />
                    ))}
                  </div>
                ) : null}
                {fullWidgets.length > 0 ? (
                  <div className="gf-bento__full">
                    {fullWidgets.map((id) => (
                      <ChartById
                        key={id}
                        id={id}
                        records={chartSource}
                        responseCount={responseCount}
                        onRemove={() => onRemoveWidget(id)}
                      />
                    ))}
                  </div>
                ) : null}
                {extCompactWidgets.length > 0 ? (
                  <div className="gf-bento__likert">
                    {extCompactWidgets.map((id) => (
                      <ChartById
                        key={id}
                        id={id}
                        records={chartSource}
                        responseCount={responseCount}
                        compact
                        onRemove={() => onRemoveWidget(id)}
                      />
                    ))}
                  </div>
                ) : null}
                {likertWidgets.length > 0 ? (
                  <div className="gf-bento__likert">
                    {likertWidgets.map((id) => (
                      <ChartById
                        key={id}
                        id={id}
                        records={chartSource}
                        responseCount={responseCount}
                        compact
                        onRemove={() => onRemoveWidget(id)}
                      />
                    ))}
                  </div>
                ) : null}
                {otherWidgets.length > 0 ? (
                  <div className="gf-bento__full">
                    {otherWidgets.map((id) => (
                      <ChartById
                        key={id}
                        id={id}
                        records={chartSource}
                        responseCount={responseCount}
                        onRemove={() => onRemoveWidget(id)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {tab === 'question' ? (
          <div className="gf-question">
            <div className="gf-pager">
              <button
                type="button"
                className="gf-pager__btn"
                disabled={safeQuestionIndex <= 0}
                onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous question"
              >
                <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <select
                className="gf-pager__select"
                aria-label="Jump to question"
                value={safeQuestionIndex}
                onChange={(e) => setQuestionIndex(Number(e.target.value))}
              >
                {RESPONSE_QUESTIONS.map((q, i) => (
                  <option key={q.id} value={i}>
                    {q.title}
                  </option>
                ))}
              </select>
              <span className="gf-pager__count">of {RESPONSE_QUESTIONS.length}</span>
              <button
                type="button"
                className="gf-pager__btn"
                disabled={safeQuestionIndex >= RESPONSE_QUESTIONS.length - 1}
                onClick={() =>
                  setQuestionIndex((i) => Math.min(RESPONSE_QUESTIONS.length - 1, i + 1))
                }
                aria-label="Next question"
              >
                <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            {filtered.length === 0 ? (
              <ResponseEmptyState kind="filtered" onReset={onResetFilters} />
            ) : currentQuestion ? (
              <>
                <ChartById
                  id={currentQuestion.id}
                  records={chartSource}
                  responseCount={responseCount}
                />
                {canAddFindingNote ? (
                  <p className="gf-question__note-link">
                    <Link
                      href={`/admin/notes/?new=1&questionId=${encodeURIComponent(currentQuestion.id)}`}
                    >
                      Add note for this question
                    </Link>
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {tab === 'list' ? (
          <div className="gf-list">
            {filtered.length === 0 ? (
              <ResponseEmptyState kind="filtered" onReset={onResetFilters} />
            ) : (
              <>
                {selected.size > 0 ? (
                  <div className="members-bulk" role="region" aria-label="Bulk actions">
                    <span className="members-bulk__count">{selected.size} selected</span>
                    <button
                      type="button"
                      className="members-bulk__clear"
                      onClick={() => setSelected(new Set())}
                    >
                      Clear
                    </button>
                    {canDelete && onBulkDelete ? (
                      <button
                        type="button"
                        className="members-bulk__danger"
                        onClick={() => onBulkDelete(Array.from(selected))}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Delete selected
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div className="members-table-wrap">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th className="members-table__check" scope="col">
                          <input
                            type="checkbox"
                            aria-label="Select all responses"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected;
                            }}
                            onChange={toggleAll}
                          />
                        </th>
                        <th scope="col">Response</th>
                        <th scope="col">Submitted</th>
                        <th scope="col">Resident type</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const label = formatSubmissionLabel(r.submissionNumber ?? 0, r.phase);
                        return (
                          <tr
                            key={r.id}
                            className={`members-table__row${selected.has(r.id) ? ' is-selected' : ''}`}
                          >
                            <td className="members-table__check">
                              <input
                                type="checkbox"
                                aria-label={`Select ${label}`}
                                checked={selected.has(r.id)}
                                onChange={() => toggleOne(r.id)}
                              />
                            </td>
                            <td>{label}</td>
                            <td>{r.ts}</td>
                            <td>{r.resident}</td>
                            <td>{r.status === 'partial' ? 'Partial' : 'Complete'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === 'individual' ? (
          <div className="gf-individual">
            {filtered.length === 0 ? (
              <ResponseEmptyState kind="filtered" onReset={onResetFilters} />
            ) : (
              <>
                <div className="gf-pager">
                  <button
                    type="button"
                    className="gf-pager__btn"
                    disabled={safeIndividualIndex <= 0}
                    onClick={() => setIndividualIndex((i) => Math.max(0, i - 1))}
                    aria-label="Previous response"
                  >
                    <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                  <select
                    className="gf-pager__select"
                    aria-label="Jump to response"
                    value={safeIndividualIndex}
                    onChange={(e) => setIndividualIndex(Number(e.target.value))}
                  >
                    {filtered.map((r, i) => (
                      <option key={r.id} value={i}>
                        {formatSubmissionLabel(r.submissionNumber ?? 0, r.phase)}
                      </option>
                    ))}
                  </select>
                  <span className="gf-pager__count">of {filtered.length}</span>
                  <button
                    type="button"
                    className="gf-pager__btn"
                    disabled={safeIndividualIndex >= filtered.length - 1}
                    onClick={() =>
                      setIndividualIndex((i) => Math.min(filtered.length - 1, i + 1))
                    }
                    aria-label="Next response"
                  >
                    <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>

                {individualDetail ? (
                  <article className="gf-card gf-individual__card" aria-labelledby="gf-individual-title">
                    <header className="gf-individual__head">
                      <div className="gf-individual__id">
                        <h3 id="gf-individual-title" className="gf-card__title">
                          {formatSubmissionLabel(
                            individualDetail.submissionNumber ?? 0,
                            individualDetail.phase,
                          )}
                        </h3>
                        <p className="gf-card__meta">
                          {individualDetail.ts}
                          <span className={`rr-pill${individualDetail.status === 'partial' ? ' rr-pill--partial' : ''}`}>
                            {individualDetail.status === 'partial' ? (
                              <CircleDashed size={14} strokeWidth={2.4} aria-hidden="true" />
                            ) : (
                              <CircleCheck size={14} strokeWidth={2.4} aria-hidden="true" />
                            )}
                            {individualDetail.status === 'partial' ? 'Partial' : 'Complete'}
                          </span>
                        </p>
                      </div>
                      <RowMenu
                        label="More actions for this response"
                        items={[
                          ...(canAddFindingNote
                            ? [
                                {
                                  key: 'note',
                                  label: 'Add finding note',
                                  icon: <StickyNote size={16} aria-hidden="true" />,
                                  href: '/admin/notes/?new=1',
                                },
                              ]
                            : []),
                          {
                            key: 'delete',
                            label: 'Delete response…',
                            icon: <Trash2 size={16} aria-hidden="true" />,
                            danger: true,
                            onSelect: () => onDelete(individualDetail),
                          },
                        ]}
                      />
                    </header>

                    <div className="gf-individual__cols">
                      <section className="gf-individual__block" aria-labelledby="gf-ind-resp">
                        <h4 id="gf-ind-resp" className="gf-individual__sub">Respondent</h4>
                        <dl className="gf-individual__dl">
                          <div>
                            <dt>Phase</dt>
                            <dd>{individualDetail.phase}</dd>
                          </div>
                          <div>
                            <dt>Resident type</dt>
                            <dd>{individualDetail.resident}</dd>
                          </div>
                          <div>
                            <dt>PWD (screening)</dt>
                            <dd>{individualDetail.pwd}</dd>
                          </div>
                          <div>
                            <dt>Language</dt>
                            <dd>{individualDetail.language}</dd>
                          </div>
                          <div>
                            <dt>Survey version</dt>
                            <dd>{individualDetail.instrumentVersion || 'Not recorded'}</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="gf-individual__block" aria-labelledby="gf-ind-branch">
                        <h4 id="gf-ind-branch" className="gf-individual__sub">
                          Extra sections this person saw
                        </h4>
                        <ul className="gf-individual__gates">
                          {[
                            { label: 'Homeowner', on: individualDetail.homeowner },
                            { label: 'Tenant / lessee', on: individualDetail.tenant },
                            { label: 'Accessibility', on: individualDetail.accessibility },
                            { label: 'Permit follow-ups', on: individualDetail.permitsExtended },
                            { label: 'Device-dependent digital', on: individualDetail.deviceDependent },
                          ].map((g) => (
                            <li key={g.label} className={g.on ? 'is-on' : ''}>
                              <span>{g.label}</span>
                              <span className="gf-individual__gate-state">
                                {g.on ? (
                                  <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                                ) : (
                                  <Minus size={14} strokeWidth={2.6} aria-hidden="true" />
                                )}
                                {g.on ? 'Shown' : 'Not shown'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      {hasStoredAnswers ? null : (
                      <section className="gf-individual__block" aria-labelledby="gf-ind-comm">
                        <h4 id="gf-ind-comm" className="gf-individual__sub">Communication quality</h4>
                        <ul className="gf-individual__likert">
                          {LIKERT_LABELS.filter(({ key }) => individualDetail.section2[key] != null).map(({ key, label }) => (
                            <li key={key}>
                              <span>{label}</span>
                              <meter
                                className="gf-individual__meter"
                                min={1}
                                max={5}
                                value={individualDetail.section2[key] ?? undefined}
                                aria-label={`${label}: ${individualDetail.section2[key]} out of 5`}
                              />
                              <strong>{individualDetail.section2[key]} / 5</strong>
                            </li>
                          ))}
                        </ul>
                      </section>
                      )}

                      <section className="gf-individual__block" aria-labelledby="gf-ind-notes">
                        <h4 id="gf-ind-notes" className="gf-individual__sub">Screening notes</h4>
                        <ul className="gf-individual__notes">
                          {individualDetail.screeningNotes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <section className="gf-individual__answers" aria-labelledby="gf-ind-answers">
                      <h4 id="gf-ind-answers" className="gf-individual__sub">
                        Their answers
                      </h4>
                      <IndividualAnswers record={individualDetail} />
                    </section>
                  </article>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <p className="admin-panel__footnote">
        Questions in a section a respondent never saw are saved as “not shown”, not left blank,
        so a skipped question and an unasked one stay distinguishable in analysis.
      </p>
    </div>
  );
}
