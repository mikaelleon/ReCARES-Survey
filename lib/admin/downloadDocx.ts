import { nodeToPng, type PngImage } from '@/lib/admin/domToPng';
import { buildReportDocx } from '@/lib/admin/docxExport';
import type { FigureId, ReportMeta } from '@/lib/admin/reportDocument';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/** Lets the browser lay out the off-screen report. A timer is used because animation frames pause in background tabs. */
function settle(ms = 120): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Captures each chart from the hidden report, builds the Word file, and saves it.
 * The report is shown off-screen for a moment so the charts can be measured and drawn.
 */
export async function downloadReportDocx(records: SampleRecord[], meta: ReportMeta): Promise<void> {
  const root = document.querySelector<HTMLElement>('.an-report-root');
  if (!root) throw new Error('The report is not ready yet.');

  const images: Partial<Record<FigureId, PngImage>> = {};
  root.classList.add('is-capturing');
  try {
    await settle();
    const figures = Array.from(root.querySelectorAll<HTMLElement>('[data-figure-id]'));
    for (const figure of figures) {
      const id = figure.dataset.figureId as FigureId;
      const target = figure.querySelector<HTMLElement>('.doc-figure__body');
      if (!target) continue;
      try {
        images[id] = await nodeToPng(target);
      } catch {
        // A chart that cannot be drawn is replaced by a note in the file.
      }
    }
  } finally {
    root.classList.remove('is-capturing');
  }

  const blob = await buildReportDocx(records, meta, images);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ReCARES-Data-Analytics-${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
