import type { EvidenceSummary } from '@/lib/admin/evidence';

function figureLabel(figures: number[]): string {
  const sorted = [...figures].sort((a, b) => a - b);
  if (sorted.length === 0) return '';
  if (sorted.length === 1) return `Figure ${sorted[0]}`;
  const contiguous = sorted.every((value, i) => i === 0 || value === sorted[i - 1]! + 1);
  return contiguous ? `Figures ${sorted[0]}–${sorted[sorted.length - 1]}` : `Figures ${sorted.join(', ')}`;
}

const ROWS: Array<[keyof Pick<EvidenceSummary['blocks'][number], 'shows' | 'proves' | 'meaning' | 'issue' | 'plan'>, string]> = [
  ['shows', 'What it shows'],
  ['proves', 'What it proves'],
  ['meaning', 'What this means now'],
  ['issue', 'Why it is a problem here'],
  ['plan', 'How the system responds'],
];

/**
 * The evidence summary: every chart explained as what it shows, what it proves,
 * why it matters to these residents, and what it means for planning the system.
 * Used in the printed report (with figure numbers) and on the Interpretation tab.
 */
export function EvidenceSummaryView({ summary, showFigures = false }: { summary: EvidenceSummary; showFigures?: boolean }) {
  return (
    <div className="an-ev">
      <div className="an-ev__intro">
        {summary.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      {summary.blocks.map((block, index) => (
        <article key={block.id} className="an-ev__block">
          <header className="an-ev__head">
            <span className="an-ev__num">{index + 1}</span>
            <h3>{block.title}</h3>
            {showFigures ? <span className="an-ev__figs">{figureLabel(block.figures)}</span> : null}
          </header>
          <dl className="an-ev__rows">
            {ROWS.map(([key, label]) => (
              <div key={key} className={`an-ev__row an-ev__row--${key}`}>
                <dt>{label}</dt>
                <dd>{block[key]}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}

      {summary.closing.length ? (
        <div className="an-ev__closing">
          <h3>What this adds up to</h3>
          {summary.closing.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
