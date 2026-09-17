'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, MoreVertical } from 'lucide-react';
import { QuestionChartCard } from '@/components/admin/charts/QuestionChartCard';
import { GatedSectionChips } from '@/components/admin/GatedSectionChips';
import { ResponseEmptyState } from '@/components/admin/ResponseEmptyState';
import { ResponseTable } from '@/components/admin/ResponseTable';
import {
  ResponseToolbar,
  type Section4Filter,
  type SortDir,
  type SortKey,
} from '@/components/admin/ResponseToolbar';
import { LIKERT_LABELS, type SampleRecord } from '@/lib/admin/sampleResponses';
import { RESPONSE_QUESTIONS } from '@/lib/admin/responseQuestions';

export type ResponseViewTab = 'summary' | 'question' | 'individual';

const TABS: { id: ResponseViewTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'question', label: 'Question' },
  { id: 'individual', label: 'Individual' },
];

/**
 * Google Forms–style response views: Summary, Question, Individual.
 */
export function ResponseViewsPanel({
  records,
  filtered,
  query,
  onQueryChange,
  phase,
  onPhaseChange,
  section4,
  onSection4Change,
  sortKey,
  sortDir,
  onSortKeyChange,
  onToggleSortDir,
  onExport,
  onCopySummary,
  copyNote,
  exportDisabled,
  onView,
  onDelete,
  highlightId,
  onResetFilters,
  emptyDataset,
}: {
  records: SampleRecord[];
  filtered: SampleRecord[];
  query: string;
  onQueryChange: (v: string) => void;
  phase: string;
  onPhaseChange: (v: string) => void;
  section4: Section4Filter;
  onSection4Change: (v: Section4Filter) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortKeyChange: (v: SortKey) => void;
  onToggleSortDir: () => void;
  onExport: () => void;
  onCopySummary: () => void;
  copyNote: string | null;
  exportDisabled: boolean;
  onView: (r: SampleRecord) => void;
  onDelete: (r: SampleRecord) => void;
  highlightId: string | null;
  onResetFilters: () => void;
  emptyDataset: boolean;
}) {
  const [tab, setTab] = useState<ResponseViewTab>('summary');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [individualIndex, setIndividualIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const chartSource = filtered.length > 0 ? filtered : records;
  const responseCount = chartSource.length;

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
      <header className="gf-panel__head">
        <h3 className="gf-panel__count">
          {responseCount} {responseCount === 1 ? 'response' : 'responses'}
          {filtered.length !== records.length ? (
            <span className="gf-panel__count-note">
              {' '}
              (filtered from {records.length})
            </span>
          ) : null}
        </h3>
        <div className="gf-panel__actions">
          <button
            type="button"
            className="gf-panel__sheets"
            onClick={onExport}
            disabled={exportDisabled}
          >
            <FileSpreadsheet size={18} strokeWidth={2.2} aria-hidden="true" />
            Export CSV
          </button>
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
            <ResponseToolbar
              query={query}
              onQueryChange={onQueryChange}
              phase={phase}
              onPhaseChange={onPhaseChange}
              section4={section4}
              onSection4Change={onSection4Change}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortKeyChange={onSortKeyChange}
              onToggleSortDir={onToggleSortDir}
              showing={filtered.length}
              total={records.length}
              onExport={onExport}
              onCopySummary={onCopySummary}
              exportDisabled={exportDisabled}
            />
            {filtered.length === 0 ? (
              <ResponseEmptyState kind="filtered" onReset={onResetFilters} />
            ) : (
              <div className="gf-summary__stack">
                {RESPONSE_QUESTIONS.map((q) => (
                  <QuestionChartCard
                    key={q.id}
                    title={q.title}
                    responseCount={responseCount}
                    kind={q.kind}
                    buckets={q.buckets(chartSource)}
                  />
                ))}
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
                  setQuestionIndex((i) =>
                    Math.min(RESPONSE_QUESTIONS.length - 1, i + 1),
                  )
                }
                aria-label="Next question"
              >
                <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            {filtered.length === 0 ? (
              <ResponseEmptyState kind="filtered" onReset={onResetFilters} />
            ) : currentQuestion ? (
              <QuestionChartCard
                title={currentQuestion.title}
                responseCount={responseCount}
                kind={currentQuestion.kind}
                buckets={currentQuestion.buckets(chartSource)}
              />
            ) : null}
          </div>
        ) : null}

        {tab === 'individual' ? (
          <div className="gf-individual">
            <ResponseToolbar
              query={query}
              onQueryChange={onQueryChange}
              phase={phase}
              onPhaseChange={onPhaseChange}
              section4={section4}
              onSection4Change={onSection4Change}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortKeyChange={onSortKeyChange}
              onToggleSortDir={onToggleSortDir}
              showing={filtered.length}
              total={records.length}
              onExport={onExport}
              onCopySummary={onCopySummary}
              exportDisabled={exportDisabled}
            />
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
                      setIndividualIndex((i) =>
                        Math.min(filtered.length - 1, i + 1),
                      )
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
                      <h4 className="gf-individual__sub">Gated sections</h4>
                      <GatedSectionChips
                        ext={individualDetail.ext}
                        s4={individualDetail.s4}
                        s5={individualDetail.s5}
                        s7a={individualDetail.s7a}
                        s7b={individualDetail.s7b}
                      />
                    </div>
                    <div className="gf-individual__block">
                      <h4 className="gf-individual__sub">
                        Communication quality (Section 2)
                      </h4>
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
        question stay distinguishable in analysis.
      </p>
    </div>
  );
}
