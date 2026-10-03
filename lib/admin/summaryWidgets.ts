import {
  RESPONSE_QUESTIONS,
  SUMMARY_FULL_IDS,
  SUMMARY_PIE_IDS,
} from '@/lib/admin/responseQuestions';

export const DEFAULT_SUMMARY_WIDGETS: string[] = [
  ...SUMMARY_PIE_IDS,
  ...SUMMARY_FULL_IDS,
];

export type WidgetTag = 'Resident Profile' | 'Branch Coverage' | 'Communication Quality';

export interface SummaryWidgetMeta {
  id: string;
  title: string;
  description: string;
  tag: WidgetTag;
  kind: 'pie' | 'hbar';
}

function tagFor(id: string): WidgetTag {
  if (id.startsWith('s2_') || id === 'comm-by-resident') return 'Communication Quality';
  if (id === 'gated') return 'Branch Coverage';
  return 'Resident Profile';
}

function descriptionFor(id: string, title: string): string {
  if (id === 'gated') return 'Which gated survey branches respondents actually saw.';
  if (id === 'comm-by-resident') return 'Mean communication Likert score grouped by resident type.';
  if (id.startsWith('s2_')) {
    return `Distribution of answers for ${title.replace('Communication quality — ', '')}.`;
  }
  return `Breakdown of ${title.toLowerCase()}.`;
}

export const SUMMARY_WIDGET_CATALOG: SummaryWidgetMeta[] = RESPONSE_QUESTIONS.map((q) => ({
  id: q.id,
  title: q.title,
  description: descriptionFor(q.id, q.title),
  tag: tagFor(q.id),
  kind: q.kind,
}));

export function normalizeSummaryWidgets(
  raw: unknown,
  opts?: { allowEmpty?: boolean },
): string[] {
  if (raw === undefined || raw === null) return [...DEFAULT_SUMMARY_WIDGETS];
  if (!Array.isArray(raw)) return [...DEFAULT_SUMMARY_WIDGETS];
  const valid = new Set(RESPONSE_QUESTIONS.map((q) => q.id));
  const cleaned = raw.filter((id): id is string => typeof id === 'string' && valid.has(id));
  if (cleaned.length === 0) {
    return opts?.allowEmpty ? [] : [...DEFAULT_SUMMARY_WIDGETS];
  }
  return cleaned;
}
