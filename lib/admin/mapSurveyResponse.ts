import { isHomeownerBranch, isTenantBranch, showAC1, showDeviceDependentItems, showP2P3 } from '@/survey/branching';
import type { SurveyAnswers, SurveyResponseDocument } from '@/survey/schema';
import type { LikertValue, SampleRecord, SampleSection2 } from '@/lib/admin/sampleResponses';

const A1_LABELS: Record<number, string> = {
  1: 'Homeowner living in the unit',
  2: 'OFW homeowner',
  3: 'Absentee homeowner',
  4: 'Family or household member of a homeowner',
  5: 'Tenant or lessee',
  6: 'Family or household member of a tenant or lessee',
};

function asLikert(value: unknown, fallback: LikertValue = 3): LikertValue {
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return fallback;
}

function formatTs(iso: string): string {
  // Date-only YYYY-MM-DD → local calendar day (avoid UTC midnight shift).
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00`)
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return d.toLocaleDateString('en-PH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return d.toLocaleString('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Map a Firestore needsAssessmentResponses doc into dashboard SampleRecord shape.
 */
export function mapSurveyDocToSample(
  doc: SurveyResponseDocument,
  language: 'EN' | 'FIL' = 'EN',
): SampleRecord {
  const a = (doc.answers || {}) as Partial<SurveyAnswers>;
  const section2: SampleSection2 = {
    s2_adequacy: asLikert(a.F1),
    s2_frequency: asLikert(a.F2),
    s2_satisfaction: asLikert(a.F3),
    s2_effectiveness: asLikert(a.F4),
    s2_agreement: asLikert(a.F7 ?? a.F5),
  };

  const pwd = a.A4 === 'yes' ? 'Yes' : 'No';
  const resident =
    typeof a.A1 === 'number' && A1_LABELS[a.A1]
      ? A1_LABELS[a.A1]
      : 'Not sure';

  return {
    id: doc.responseId,
    submittedAt: doc.submittedDate,
    ts: formatTs(doc.submittedDate),
    phase: typeof a.A2 === 'string' ? a.A2 : 'Not sure',
    resident,
    pwd,
    homeowner: isHomeownerBranch(a),
    tenant: isTenantBranch(a),
    accessibility: showAC1(a),
    permitsExtended: showP2P3(a),
    deviceDependent: showDeviceDependentItems(a),
    language,
    section2,
    answers: a,
    deviceClass: doc.deviceClass === 'computer' ? 'computer' : 'phone',
    status: doc.status === 'partial' ? 'partial' : 'complete',
    screeningNotes: [
      `Status ${doc.status}`,
      `Last step ${doc.lastStepReached}`,
      `Device ${doc.deviceClass}`,
    ],
  };
}
