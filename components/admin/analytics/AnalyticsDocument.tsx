'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ColumnChart } from '@/components/admin/analytics/ColumnChart';
import { GroupCompare } from '@/components/admin/analytics/GroupCompare';
import { Heatmap } from '@/components/admin/analytics/Heatmap';
import { ScaleBars } from '@/components/admin/analytics/ScaleBars';
import { StackedArea } from '@/components/admin/analytics/StackedArea';
import { TrendChart } from '@/components/admin/analytics/TrendChart';
import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import {
  ACCESS_ITEMS,
  FEATURE_ITEMS,
  READINESS_ITEMS,
  ageBuckets,
  dailySeries,
  deviceBuckets,
  featureByResidentGroup,
  phaseBuckets,
  problemRanking,
  problemsByPhase,
  residentBuckets,
  residentSeries,
  scaleRows,
} from '@/lib/admin/dataAnalytics';
import { CAPSTONE } from '@/lib/admin/capstone';
import {
  REFERENCES,
  SCREENSHOT_DIR,
  buildReportDocument,
  type Block,
  type FigureId,
  type ReportMeta,
} from '@/lib/admin/reportDocument';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

function useFigures(records: SampleRecord[]): Record<FigureId, React.ReactNode> {
  return useMemo(() => {
    const top = problemRanking(records)
      .filter((p) => p.count > 0)
      .map((p) => ({ label: p.label, count: p.count, pct: p.pct }));
    const heat = problemsByPhase(records, 6);
    const compare = featureByResidentGroup(records);
    return {
      trend: <TrendChart points={dailySeries(records, 60)} readOnly />,
      byResident: <StackedArea series={residentSeries(records, 60)} readOnly />,
      phase: <ColumnChart buckets={phaseBuckets(records)} />,
      access: <ScaleBars rows={scaleRows(records, ACCESS_ITEMS)} kind="agreement" />,
      readiness: <ScaleBars rows={scaleRows(records, READINESS_ITEMS)} kind="agreement" />,
      features: <ScaleBars rows={scaleRows(records, FEATURE_ITEMS)} kind="likelihood" />,
      compare: <GroupCompare rows={compare.rows} homeownerCount={compare.homeownerCount} tenantCount={compare.tenantCount} />,
      problems: <HorizontalBars buckets={top} wrapLabels />,
      heat: <Heatmap phases={heat.phases} rows={heat.rows} max={heat.max} />,
      dailyByResident: <StackedArea series={residentSeries(records, 60)} readOnly initialMode="daily" />,
      age: <ColumnChart buckets={ageBuckets(records)} />,
      resident: <HorizontalBars buckets={residentBuckets(records)} wrapLabels />,
      device: <HorizontalBars buckets={deviceBuckets(records)} />,
    };
  }, [records]);
}

function ScreenshotView({ block }: { block: Extract<Block, { kind: 'screenshot' }> }) {
  const [missing, setMissing] = useState(false);
  return (
    <figure className="doc-figure doc-screenshot">
      <p className="doc-label">{block.label}</p>
      <p className="doc-title">{block.title}</p>
      <div className="doc-figure__body">
        {missing ? (
          <p className="doc-p doc-screenshot__missing">[NEEDED: screenshot {block.file}]</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${SCREENSHOT_DIR}/${block.file}`} alt={block.title} onError={() => setMissing(true)} style={{ maxWidth: '100%' }} />
        )}
      </div>
      <p className="doc-note">
        <em>Note.</em> {block.note.replace(/^Note\.\s*/, '')}
      </p>
    </figure>
  );
}

function BlockView({ block, figures }: { block: Block; figures: Record<FigureId, React.ReactNode> }) {
  switch (block.kind) {
    case 'p':
      return <p className="doc-p">{block.text}</p>;
    case 'h3':
      return <h3 className="doc-h2">{block.text}</h3>;
    case 'bullets':
      return (
        <ul className="doc-bullets">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'figure':
      return (
        <figure className="doc-figure" data-figure-id={block.id}>
          <p className="doc-label">{block.label}</p>
          <p className="doc-title">{block.title}</p>
          <div className="doc-figure__body">{figures[block.id]}</div>
          <p className="doc-note">
            <em>Note.</em> {block.note.replace(/^Note\.\s*/, '')}
          </p>
        </figure>
      );
    case 'screenshot':
      return <ScreenshotView block={block} />;
    case 'table': {
      const align = block.align ?? [];
      const cls = (i: number) => (align[i] === 'r' ? 'is-r' : align[i] === 'c' ? 'is-c' : '');
      return (
        <div className={`doc-table${block.small ? ' doc-table--small' : ''}`}>
          <p className="doc-label">{block.label}</p>
          <p className="doc-title">{block.title}</p>
          <table>
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={h + i} className={cls(i)}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) =>
                Array.isArray(row) ? (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={cls(ci)}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ) : (
                  <tr key={ri} className="doc-panel">
                    <td colSpan={block.head.length}>{row.panel}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          <p className="doc-note">
            <em>Note.</em> {block.note.replace(/^Note\.\s*/, '')}
          </p>
        </div>
      );
    }
    default:
      return null;
  }
}

/**
 * Print-only documentation of the analysis, in the order of the capstone
 * documentation format: title page, executive summary, background and objectives,
 * data description, methodology, results with interpretation, summary of findings,
 * conclusions, recommendations, limitations, and references.
 *
 * It renders in a portal on <body> so that "Save as PDF" prints only the report,
 * in light colours, whatever the theme.
 */
export function AnalyticsDocument({ records, meta }: { records: SampleRecord[]; meta: ReportMeta }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  const figures = useFigures(records);

  const doc = useMemo(() => {
    const built = buildReportDocument(records, meta);
    return built;
  }, [records, meta]);

  if (!host) return null;

  return createPortal(
    <div className="an-report-root">
      <article className="doc" aria-label="Data analytics documentation">
        <section className="doc-cover" aria-label="Title page">
          <h1>{CAPSTONE.title}</h1>
          <p className="doc-cover__sub">{CAPSTONE.subtitle}</p>
          <p className="doc-cover__doc">Data Analytics Documentation: Resident Needs Assessment Survey</p>

          <div className="doc-cover__block">
            <p className="doc-cover__label">Proponents</p>
            {CAPSTONE.proponents.map((name) => (
              <p key={name}>{name}</p>
            ))}
          </div>

          <div className="doc-cover__block">
            <p className="doc-cover__label">Adviser</p>
            <p>[NEEDED: the name of the capstone adviser]</p>
          </div>

          <div className="doc-cover__block">
            <p>{CAPSTONE.college}</p>
            <p>{CAPSTONE.university}</p>
            <p>{CAPSTONE.program}</p>
          </div>

          <div className="doc-cover__block">
            <p>{meta.generated}</p>
            <p className="doc-cover__scope">
              Data analyzed: {meta.periodLabel}. Phase: {meta.phase}. Resident type: {meta.resident}. Responses: {doc.sampleSize}.
            </p>
          </div>
        </section>

        {doc.sections.map((section) => (
          <section key={section.id} className={`doc-section${section.pageBreak ? ' doc-section--break' : ''}`}>
            <h2 className="doc-h1">{section.heading}</h2>
            {section.blocks.map((block, i) => (
              <BlockView key={i} block={block} figures={figures} />
            ))}
          </section>
        ))}

        {doc.sampleSize ? (
          <section className="doc-section doc-section--break">
            <h2 className="doc-h1">References</h2>
            <div className="doc-refs">
              {REFERENCES.map((parts, i) => (
                <p key={i}>
                  {parts.map((part, j) =>
                    part.italic ? <em key={j}>{part.text}</em> : <Fragment key={j}>{part.text}</Fragment>,
                  )}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {doc.needed.length ? (
          <section className="doc-section doc-section--break doc-needed">
            <h2 className="doc-h1">Items to Complete Before Submission</h2>
            <p className="doc-p">
              The following placeholders appear in the report. They mark information that the data could not supply. Remove this page after the placeholders are filled in.
            </p>
            <ol>
              {doc.needed.map((item) => (
                <li key={item}>[NEEDED: {item}]</li>
              ))}
            </ol>
          </section>
        ) : null}
      </article>
    </div>,
    host,
  );
}
