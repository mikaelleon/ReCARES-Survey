import type { SampleRecord } from '@/lib/admin/sampleResponses';

/**
 * Assign 1-based submission numbers by chronological order (oldest = 1).
 * Preserves the input array order; only stamps `submissionNumber` on each row.
 */
export function withSubmissionNumbers(records: SampleRecord[]): SampleRecord[] {
  const ordered = [...records].sort((a, b) => {
    const byTime = a.submittedAt.localeCompare(b.submittedAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
  const numberById = new Map(ordered.map((record, index) => [record.id, index + 1]));
  return records.map((record) => ({
    ...record,
    submissionNumber: numberById.get(record.id) ?? 0,
  }));
}

/** Pad to at least 3 digits: 1 → "001", 12 → "012", 1000 → "1000". */
export function formatSubmissionCode(submissionNumber: number): string {
  if (!Number.isFinite(submissionNumber) || submissionNumber < 1) return '???';
  const n = Math.floor(submissionNumber);
  return n < 1000 ? String(n).padStart(3, '0') : String(n);
}

/**
 * Human-facing response label: "Submission ### - Phase #".
 * `submissionNumber` is the chronological index (first response = 1 → 001).
 */
export function formatSubmissionLabel(
  submissionNumber: number,
  phaseLabel: string,
): string {
  const phaseNum = phaseLabel.match(/Phase\s+(\d+)/i)?.[1];
  const phasePart = phaseNum ? `Phase ${phaseNum}` : phaseLabel || 'Phase ?';
  return `Submission ${formatSubmissionCode(submissionNumber)} - ${phasePart}`;
}

/** Prefer stamped number; fall back to lookup in a full record list. */
export function submissionNumberFor(
  record: SampleRecord,
  allRecords?: SampleRecord[],
): number {
  if (typeof record.submissionNumber === 'number' && record.submissionNumber > 0) {
    return record.submissionNumber;
  }
  if (!allRecords?.length) return 0;
  const numbered = withSubmissionNumbers(allRecords);
  return numbered.find((r) => r.id === record.id)?.submissionNumber ?? 0;
}
