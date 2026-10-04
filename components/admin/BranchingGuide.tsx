'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BRANCH_CORE_SECTIONS,
  BRANCH_GATED_SECTIONS,
  BRANCH_LEGEND,
  BRANCH_PLAIN_STORY,
  BRANCH_SCREENING,
  BRANCH_SECTIONS,
  type BranchQuestion,
  type BranchSection,
} from '@/lib/admin/branchingMap';

type GuideMode = 'simple' | 'detailed';

function NestedItems({ question }: { question: BranchQuestion }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!question.nested?.length) return null;

  return (
    <ul className="branch-guide__nested">
      {question.nested.map((category) => {
        const open = openId === category.id;
        return (
          <li key={category.id}>
            <button
              type="button"
              className="branch-guide__nested-btn"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : category.id)}
            >
              <span>{category.label}</span>
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className={`branch-guide__chev${open ? ' is-open' : ''}`}
                aria-hidden="true"
              />
            </button>
            {open ? (
              <ul className="branch-guide__items">
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function SectionAccordion({
  section,
  showCodes,
}: {
  section: BranchSection;
  showCodes: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const questionCount = section.questions.length;

  return (
    <div className={`branch-guide__section${section.path === 'gated' ? ' is-gated' : ''}`}>
      <button
        type="button"
        className="branch-guide__section-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="branch-guide__section-meta">
          {showCodes ? (
            section.chip ? (
              <span className="admin-chip" title={section.gateSummary}>
                {section.chip}
              </span>
            ) : (
              <span className="branch-guide__code">{section.code}</span>
            )
          ) : section.path === 'gated' ? (
            <span className="branch-guide__pill">Extra</span>
          ) : (
            <span className="branch-guide__pill branch-guide__pill--core">Everyone</span>
          )}
          <span className="branch-guide__section-title">{section.title}</span>
        </span>
        <span className="branch-guide__section-count">
          {questionCount} question{questionCount === 1 ? '' : 's'}
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            className={`branch-guide__chev${open ? ' is-open' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {open ? (
        <div id={panelId} className="branch-guide__section-body">
          {section.gateSummary ? (
            <p className="branch-guide__gate-note">
              {showCodes ? `Gate: ${section.gateSummary}` : `Shown when: ${section.gateSummary}`}
            </p>
          ) : null}
          <ul className="branch-guide__questions">
            {section.questions.map((q) => (
              <li key={q.code}>
                <div className={`branch-guide__q-row${showCodes ? '' : ' branch-guide__q-row--plain'}`}>
                  {showCodes ? <code className="branch-guide__q-code">{q.code}</code> : null}
                  <span className="branch-guide__q-text">{q.question}</span>
                </div>
                {q.gateNote ? (
                  <p className="branch-guide__q-gate">
                    {showCodes ? q.gateNote : q.gateNote.replace(/\s*\(chip [^)]+\)/gi, '')}
                  </p>
                ) : null}
                <NestedItems question={q} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SimpleView() {
  return (
    <>
      <ol className="branch-guide__story">
        {BRANCH_PLAIN_STORY.map((step, index) => (
          <li key={step.id}>
            <span className="branch-guide__story-num" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="branch-guide__plain-flow" role="img" aria-label="Who sees which topics">
        <div className="branch-guide__plain-card">
          <h3 className="branch-guide__flow-title">Topics everyone sees</h3>
          <ul className="branch-guide__plain-topics">
            {BRANCH_CORE_SECTIONS.map((section) => (
              <li key={section.id}>{section.title}</li>
            ))}
          </ul>
        </div>

        <div className="branch-guide__flow-arrow" aria-hidden="true">
          +
        </div>

        <div className="branch-guide__plain-card">
          <h3 className="branch-guide__flow-title">Extra topics some people see</h3>
          <ul className="branch-guide__legend-list">
            {BRANCH_LEGEND.map((item) => (
              <li key={item.chip}>
                <span className="admin-chip" aria-hidden="true">
                  {item.chip}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.plainRule}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="branch-guide__plain-card">
        <h3 className="branch-guide__flow-title">Early questions that change the path</h3>
        <ul className="branch-guide__plain-screening">
          {BRANCH_SCREENING.map((item) => (
            <li key={item.code}>{item.plainLabel}</li>
          ))}
        </ul>
      </div>

      <div className="branch-guide__explorer">
        <h3 className="branch-guide__flow-title">Browse topics &amp; questions</h3>
        <p className="branch-guide__hint">
          Open a topic to see the questions inside. Open-problem topics expand further into
          checklists.
        </p>
        <div className="branch-guide__sections">
          {BRANCH_SECTIONS.map((section) => (
            <SectionAccordion key={section.id} section={section} showCodes={false} />
          ))}
        </div>
      </div>
    </>
  );
}

function DetailedView() {
  return (
    <>
      <div className="branch-guide__flow" role="img" aria-label="Survey branching flow">
        <div className="branch-guide__flow-col">
          <h3 className="branch-guide__flow-title">Screening gates</h3>
          <ul className="branch-guide__flow-list">
            {BRANCH_SCREENING.map((item) => (
              <li key={item.code}>
                <code>{item.code}</code>
                <span>{item.question}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="branch-guide__flow-arrow" aria-hidden="true">
          →
        </div>

        <div className="branch-guide__flow-col branch-guide__flow-col--core">
          <h3 className="branch-guide__flow-title">Core path</h3>
          <ol className="branch-guide__trunk">
            {BRANCH_CORE_SECTIONS.map((section) => (
              <li key={section.id}>
                <span className="branch-guide__code">{section.code}</span>
                <span>{section.title}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="branch-guide__flow-arrow" aria-hidden="true">
          →
        </div>

        <div className="branch-guide__flow-col">
          <h3 className="branch-guide__flow-title">Gated branches</h3>
          <ul className="branch-guide__gates">
            {BRANCH_GATED_SECTIONS.map((section) => (
              <li key={section.id}>
                <span className="admin-chip">{section.chip}</span>
                <div>
                  <strong>{section.title}</strong>
                  <span>{section.gateSummary}</span>
                </div>
              </li>
            ))}
            <li>
              <span className="admin-chip">P+</span>
              <div>
                <strong>Permit follow-ups</strong>
                <span>Inside P when P1 / A5 unlock</span>
              </div>
            </li>
            <li>
              <span className="admin-chip">B+</span>
              <div>
                <strong>Device-dependent digital</strong>
                <span>Inside B when B1 unlocks</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="branch-guide__legend">
        <h3 className="branch-guide__flow-title">Legend</h3>
        <ul className="branch-guide__legend-list">
          {BRANCH_LEGEND.map((item) => (
            <li key={item.chip}>
              <span className="admin-chip" aria-hidden="true">
                {item.chip}
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.rule}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="branch-guide__explorer">
        <h3 className="branch-guide__flow-title">Categories &amp; questions</h3>
        <div className="branch-guide__sections">
          {BRANCH_SECTIONS.map((section) => (
            <SectionAccordion key={section.id} section={section} showCodes />
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Collapsible survey branching map for the Responses screen.
 * Defaults to a plain-language Simple view; Detailed keeps field codes.
 */
export function BranchingGuide() {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<GuideMode>('simple');
  const panelId = useId();

  return (
    <section className={`branch-guide${expanded ? ' is-open' : ''}`} aria-label="Survey branching">
      <button
        type="button"
        className="branch-guide__toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="branch-guide__toggle-label">How the survey branches</span>
        <ChevronDown
          size={18}
          strokeWidth={2.4}
          className={`branch-guide__chev${expanded ? ' is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div id={panelId} className="branch-guide__panel">
          <div className="branch-guide__mode" role="tablist" aria-label="Branching guide view">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'simple'}
              className={`branch-guide__mode-btn${mode === 'simple' ? ' is-active' : ''}`}
              onClick={() => setMode('simple')}
            >
              Simple
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'detailed'}
              className={`branch-guide__mode-btn${mode === 'detailed' ? ' is-active' : ''}`}
              onClick={() => setMode('detailed')}
            >
              Detailed
            </button>
          </div>

          <div key={mode} className="admin-view-transition">
            {mode === 'simple' ? <SimpleView /> : <DetailedView />}
          </div>
        </div>
      ) : null}
    </section>
  );
}
