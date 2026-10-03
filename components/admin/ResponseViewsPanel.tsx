'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Plus } from 'lucide-react';
import { ExtendedWidgetCard } from '@/components/admin/charts/ExtendedWidgetCard';
import { QuestionChartCard } from '@/components/admin/charts/QuestionChartCard';
import { GatedSectionChips } from '@/components/admin/GatedSectionChips';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { ResponseTable } from '@/components/admin/ResponseTable';
import { Button } from '@/components/ui/Button';
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

export type ResponseViewTab = 'summary' | 'question' | 'individual';

const TABS: { id: ResponseViewTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'question', label: 'Question' },
  { id: 'individual', label: 'Individual' },
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
  copyNote,
  onExport,
  exportDisabled,
  onView,
  onDelete,
  highlightId,
  onResetFilters,
  emptyDataset,
  summaryWidgets,
  onOpenWidgetPicker,
  onRemoveWidget,
  initialTab,
  focusResponseId,
}: {
  records: SampleRecord[];
  filtered: SampleRecord[];
  onCopySummary: () => void;
  copyNote: string | null;
  onExport: () => void;
  exportDisabled: boolean;
  onView: (r: SampleRecord) => void;
  onDelete: (r: SampleRecord) => void;
  highlightId: string | null;
  onResetFilters: () => void;
  emptyDataset: boolean;
  summaryWidgets: string[];
  onOpenWidgetPicker: () => void;
  onRemoveWidget: (id: string) => void;
  initialTab?: ResponseViewTab;
  focusResponseId?: string | null;
}) {
  const [tab, setTab] = useState<ResponseViewTab>(initialTab ?? 'summary');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [individualIndex, setIndividualIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (
      initialTab === 'summary' ||
      initialTab === 'question' ||
      initialTab === 'individual'
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

  const individualDetail = useMemo(() => {
    if (!currentIndividual) return null;
    return currentIndividual;
  }, [currentIndividual]);

  if (emptyDataset) {
    return (
      <div className="admin-panel">
        <ResponseEmptyState kind="empty" />
      </div>
    );
  }

  return (
    <div className="admin-panel gf-panel">
      <header className="gf-panel__head gf-panel__head--tabs-only">
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
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {copyNote ? (
        <p className="admin-toast-inline" role="status">
          {copyNote}
        </p>
      ) : null}

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
              <span className="gf-pager__label">
                Question {safeQuestionIndex + 1} of {RESPONSE_QUESTIONS.length}
              </span>
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
              <ChartById
                id={currentQuestion.id}
                records={chartSource}
                responseCount={responseCount}
              />
            ) : null}
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
                  <span className="gf-pager__label">
                    Response {safeIndividualIndex + 1} of {filtered.length}
                  </span>
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
                  <article className="gf-card gf-individual__card">
                    <header className="gf-individual__head">
                      <div>
                        <h3 className="gf-card__title">{individualDetail.id}</h3>
                        <p className="gf-card__meta">{individualDetail.ts}</p>
                      </div>
                      <div className="gf-individual__actions">
                        <button
                          type="button"
                          className="gf-individual__link"
                          onClick={() => onView(individualDetail)}
                        >
                          Open detail
                        </button>
                        <button
                          type="button"
                          className="gf-individual__danger"
                          onClick={() => onDelete(individualDetail)}
                        >
                          Delete
                        </button>
                      </div>
                    </header>
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
                    </dl>
                    <div className="gf-individual__block">
                      <h4 className="gf-individual__sub">Gated branches</h4>
                      <GatedSectionChips
                        homeowner={individualDetail.homeowner}
                        tenant={individualDetail.tenant}
                        accessibility={individualDetail.accessibility}
                        permitsExtended={individualDetail.permitsExtended}
                        deviceDependent={individualDetail.deviceDependent}
                      />
                    </div>
                    <div className="gf-individual__block">
                      <h4 className="gf-individual__sub">Communication quality</h4>
                      <ul className="gf-individual__likert">
                        {LIKERT_LABELS.map(({ key, label }) => (
                          <li key={key}>
                            <span>{label}</span>
                            <strong>{individualDetail.section2[key]} / 5</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="gf-individual__block">
                      <h4 className="gf-individual__sub">Screening notes</h4>
                      <ul className="gf-individual__notes">
                        {individualDetail.screeningNotes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ) : null}

                <div className="gf-individual__table">
                  <h4 className="gf-individual__sub">All matching responses</h4>
                  <ResponseTable
                    records={filtered}
                    onView={(r) => {
                      const idx = filtered.findIndex((x) => x.id === r.id);
                      if (idx >= 0) setIndividualIndex(idx);
                      onView(r);
                    }}
                    onDelete={onDelete}
                    highlightId={highlightId}
                  />
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      <p className="admin-panel__footnote">
        Fields belonging to a section a respondent never unlocked are stored as{' '}
        <code>not_shown</code> rather than blank, so an unanswered question and an unasked
        question stay distinguishable in analysis. Toolbar + tabs stay top-left (F/Z scan)
        on purpose.
      </p>
    </div>
  );
}
