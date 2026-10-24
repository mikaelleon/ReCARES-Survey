import type { PngImage } from '@/lib/admin/domToPng';
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

/** A4 in twentieths of a point (twips), with 1 inch margins. */
const PAGE = { width: 11906, height: 16838 };
const MARGIN = 1440;
/** Width of the text area in pixels at 96 dpi: (11906 - 2880) / 15. */
const MAX_IMAGE_WIDTH = 601;

const FONT = 'Arial';
const BODY_SIZE = 24; // half-points: 12 pt
const TABLE_SIZE = 20; // 10 pt
const SMALL_TABLE_SIZE = 17; // 8.5 pt
const LINE = 360; // 1.5 line spacing

/**
 * Builds an editable Word file (.docx) from the same document model as the PDF:
 * A4, 1 inch margins, Arial 12 pt, 1.5 spacing, justified paragraphs, APA tables,
 * charts as images, and page numbers at the bottom right.
 */
export async function buildReportDocx(
  records: SampleRecord[],
  meta: ReportMeta,
  images: Partial<Record<FigureId, PngImage>>,
): Promise<Blob> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    HeadingLevel,
    ImageRun,
    Packer,
    PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const built = buildReportDocument(records, meta);

  // Screenshots are optional PNG files in public/report-screenshots. A file that is missing gets a placeholder.
  const shots: Record<string, PngImage> = {};
  for (const section of built.sections) {
    for (const block of section.blocks) {
      if (block.kind !== 'screenshot') continue;
      try {
        const res = await fetch(`${SCREENSHOT_DIR}/${block.file}`);
        if (!res.ok) continue;
        const blob = await res.blob();
        if (!blob.type.includes('png')) continue;
        const bitmap = await createImageBitmap(blob);
        shots[block.file] = { bytes: new Uint8Array(await blob.arrayBuffer()), width: bitmap.width, height: bitmap.height } as PngImage;
      } catch {
        /* placeholder below */
      }
    }
  }

  const run = (text: string, extra: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
    new TextRun({ text, font: FONT, size: extra.size ?? BODY_SIZE, bold: extra.bold, italics: extra.italics });

  const body = (text: string) =>
    new Paragraph({
      children: [run(text)],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { line: LINE, after: 120 },
    });

  const heading1 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      spacing: { line: LINE, after: 240 },
      children: [run(text, { bold: true, size: 28 })],
    });

  const heading2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      keepNext: true,
      spacing: { line: LINE, before: 240, after: 120 },
      children: [run(text, { bold: true })],
    });

  const labelAndTitle = (label: string, title: string) => [
    new Paragraph({ keepNext: true, spacing: { line: LINE, before: 240 }, children: [run(label, { bold: true })] }),
    new Paragraph({ keepNext: true, spacing: { line: LINE, after: 80 }, children: [run(title, { italics: true })] }),
  ];

  const note = (text: string, size = TABLE_SIZE) =>
    new Paragraph({
      spacing: { line: LINE, before: 60, after: 200 },
      children: [run('Note.', { italics: true, size }), run(` ${text.replace(/^Note\.\s*/, '')}`, { size })],
    });

  const ruleBorder = { style: BorderStyle.SINGLE, size: 8, color: '111111' };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

  const tableBlock = (block: Extract<Block, { kind: 'table' }>) => {
    const size = block.small ? SMALL_TABLE_SIZE : TABLE_SIZE;
    const align = (index: number) =>
      block.align?.[index] === 'r' ? AlignmentType.RIGHT : block.align?.[index] === 'c' ? AlignmentType.CENTER : AlignmentType.LEFT;

    const cell = (text: string, index: number, options: { bold?: boolean; italics?: boolean; header?: boolean; span?: number } = {}) =>
      new TableCell({
        columnSpan: options.span,
        borders: {
          top: noBorder,
          left: noBorder,
          right: noBorder,
          bottom: options.header ? { style: BorderStyle.SINGLE, size: 4, color: '111111' } : noBorder,
        },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: options.span ? AlignmentType.LEFT : align(index),
            spacing: { line: LINE },
            children: [run(text, { size, bold: options.bold, italics: options.italics })],
          }),
        ],
      });

    const rows = [
      new TableRow({ tableHeader: true, cantSplit: true, children: block.head.map((h, i) => cell(h, i, { bold: true, header: true })) }),
      ...block.rows.map((row) =>
        Array.isArray(row)
          ? new TableRow({ cantSplit: true, children: row.map((value, i) => cell(value, i)) })
          : new TableRow({ cantSplit: true, children: [cell(row.panel, 0, { bold: true, italics: true, span: block.head.length })] }),
      ),
    ];

    return [
      ...labelAndTitle(block.label, block.title),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: ruleBorder, bottom: ruleBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
        rows,
      }),
      note(block.note, size),
    ];
  };

  const figureBlock = (block: Extract<Block, { kind: 'figure' }>) => {
    const image = images[block.id];
    const out = [...labelAndTitle(block.label, block.title)];
    if (image) {
      const ratio = Math.min(1, MAX_IMAGE_WIDTH / image.width);
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { line: 240 },
          children: [
            new ImageRun({
              type: 'png',
              data: image.bytes,
              transformation: { width: Math.round(image.width * ratio), height: Math.round(image.height * ratio) },
              altText: { title: block.title, description: block.title, name: block.label },
            }),
          ],
        }),
      );
    } else {
      out.push(body('[The chart could not be included in this file. Use the PDF version for the figure.]'));
    }
    out.push(note(block.note));
    return out;
  };

  const screenshotBlock = (block: Extract<Block, { kind: 'screenshot' }>) => {
    const image = shots[block.file];
    const out = [...labelAndTitle(block.label, block.title)];
    if (image) {
      const ratio = Math.min(1, MAX_IMAGE_WIDTH / image.width);
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { line: 240 },
          children: [
            new ImageRun({
              type: 'png',
              data: image.bytes,
              transformation: { width: Math.round(image.width * ratio), height: Math.round(image.height * ratio) },
              altText: { title: block.title, description: block.title, name: block.label },
            }),
          ],
        }),
      );
    } else {
      out.push(body(`[NEEDED: screenshot ${block.file}]`));
    }
    out.push(note(block.note));
    return out;
  };

  const renderBlock = (block: Block) => {
    switch (block.kind) {
      case 'p':
        return [body(block.text)];
      case 'h3':
        return [heading2(block.text)];
      case 'bullets':
        return block.items.map(
          (item) =>
            new Paragraph({
              bullet: { level: 0 },
              alignment: AlignmentType.LEFT,
              spacing: { line: LINE, after: 60 },
              children: [run(item)],
            }),
        );
      case 'table':
        return tableBlock(block);
      case 'figure':
        return figureBlock(block);
      case 'screenshot':
        return screenshotBlock(block);
      default:
        return [];
    }
  };

  const centered = (text: string, extra: { bold?: boolean; italics?: boolean; size?: number; before?: number; after?: number } = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: LINE, before: extra.before, after: extra.after },
      children: [run(text, extra)],
    });

  const cover = [
    centered(CAPSTONE.title, { bold: true, size: 40, before: 1800, after: 200 }),
    centered(CAPSTONE.subtitle, { italics: true, size: 24, after: 480 }),
    centered('Data Analytics Documentation: Resident Needs Assessment Survey', { bold: true, size: 26, after: 600 }),
    centered('Proponents', { bold: true, size: 20, after: 40 }),
    ...CAPSTONE.proponents.map((name) => centered(name)),
    centered('Adviser', { bold: true, size: 20, before: 360, after: 40 }),
    centered('[NEEDED: the name of the capstone adviser]'),
    centered(CAPSTONE.college, { before: 360 }),
    centered(CAPSTONE.university),
    centered(CAPSTONE.program),
    centered(meta.generated, { before: 360 }),
    centered(`Data analyzed: ${meta.periodLabel}. Phase: ${meta.phase}. Resident type: ${meta.resident}. Responses: ${built.sampleSize}.`, { size: 20, before: 120 }),
  ];

  const content: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [...cover];

  built.sections.forEach((section) => {
    content.push(heading1(section.heading));
    section.blocks.forEach((block) => content.push(...renderBlock(block)));
  });

  if (built.sampleSize) {
    content.push(heading1('References'));
    REFERENCES.forEach((parts) =>
      content.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 720, hanging: 720 },
          spacing: { line: LINE, after: 120 },
          children: parts.map((part) => run(part.text, { italics: part.italic })),
        }),
      ),
    );
  }


  if (built.needed.length) {
    content.push(heading1('Items to Complete Before Submission'));
    content.push(body('The following placeholders appear in the document. They mark information that the data could not supply. Remove this page after the placeholders are filled in.'));
    built.needed.forEach((item, index) =>
      content.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 720, hanging: 360 },
          spacing: { line: LINE, after: 60 },
          children: [run(`${index + 1}. [NEEDED: ${item}]`)],
        }),
      ),
    );
  }

  const pageNumber = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })],
      }),
    ],
  });

  const document = new Document({
    creator: CAPSTONE.proponents.join('; '),
    title: `${CAPSTONE.title}: Data Analytics Documentation`,
    description: 'Resident Needs Assessment Survey: results and interpretation',
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: LINE } } },
        heading1: { run: { font: FONT, size: 28, bold: true, color: '000000' }, paragraph: { spacing: { line: LINE, after: 240 } } },
        heading2: { run: { font: FONT, size: BODY_SIZE, bold: true, color: '000000' }, paragraph: { spacing: { line: LINE, before: 240, after: 120 } } },
      },
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        footers: { default: pageNumber, first: new Footer({ children: [new Paragraph({ children: [] })] }) },
        children: content,
      },
    ],
  });

  return Packer.toBlob(document);
}
