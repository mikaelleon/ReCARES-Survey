import type { DashboardKpis } from '@/lib/admin/analytics';
import {
  accessibilityNeeds,
  digitalFeasibility,
  interviewOptIn,
  openProblems,
  rankFeatures,
  serviceQualityGauge,
  waitTimeStat,
} from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

export type DashboardViewMode = 'detailed' | 'simple';

const VIEW_KEY = 'recares-dashboard-view';
const RESPONDENT_TARGET = 100;

export function loadDashboardViewMode(): DashboardViewMode {
  if (typeof window === 'undefined') return 'detailed';
  try {
    return sessionStorage.getItem(VIEW_KEY) === 'simple' ? 'simple' : 'detailed';
  } catch {
    return 'detailed';
  }
}

export function storeDashboardViewMode(mode: DashboardViewMode): void {
  try {
    sessionStorage.setItem(VIEW_KEY, mode);
  } catch {
    /* ignore */
  }
}

export interface DashboardTakeaway {
  id: string;
  title: string;
  value: string;
  meaning: string;
  forPlan: string;
}

export interface DashboardSimpleSnapshot {
  respondentTarget: number;
  total: number;
  progressPct: number;
  homeownerPct: number;
  tenantPct: number;
  pwdPct: number;
  takeaways: DashboardTakeaway[];
  topFeatures: { label: string; score: string }[];
  topProblems: { label: string; count: number; pct: number }[];
}

/**
 * Plain-language snapshot for Simple dashboard mode — what the numbers imply
 * for the planned HOA web system (not field-code detail).
 */
export function buildDashboardSimpleSnapshot(
  records: SampleRecord[],
  kpis: DashboardKpis,
): DashboardSimpleSnapshot {
  const digital = digitalFeasibility(records);
  const service = serviceQualityGauge(records);
  const wait = waitTimeStat(records);
  const interview = interviewOptIn(records);
  const features = rankFeatures(records).filter((f) => f.responseCount > 0).slice(0, 3);
  const problems = openProblems(records)
    .filter((p) => p.count > 0 && p.label !== 'None of these')
    .slice(0, 3);
  const ac = accessibilityNeeds(records);

  const takeaways: DashboardTakeaway[] = [];

  const progressPct = Math.min(100, Math.round((kpis.total / RESPONDENT_TARGET) * 100));
  takeaways.push({
    id: 'sample',
    title: 'Survey progress',
    value: `${kpis.total} of ${RESPONDENT_TARGET}`,
    meaning:
      kpis.total === 0
        ? 'No responses in this date range yet.'
        : kpis.total < 30
          ? 'Still early — treat patterns as directional, not final.'
          : kpis.total < RESPONDENT_TARGET
            ? 'Growing sample — priority signals are becoming clearer.'
            : 'Target sample reached — stronger basis for planning decisions.',
    forPlan:
      kpis.total < RESPONDENT_TARGET
        ? 'Keep collecting responses before locking the full feature roadmap.'
        : 'You can prioritize the top needs below with more confidence.',
  });

  if (kpis.total > 0) {
    takeaways.push({
      id: 'digital',
      title: 'Can residents use a website?',
      value: `${digital.pct}%`,
      meaning: `${digital.count} of ${digital.total} report a phone/computer and regular internet.`,
      forPlan:
        digital.pct >= 70
          ? 'A web-first HOA system is realistic for most respondents.'
          : 'Plan for offline or assisted paths — not everyone is ready for web-only.',
    });

    if (features[0]) {
      takeaways.push({
        id: 'feature',
        title: 'Most wanted feature',
        value: features[0].label,
        meaning: `Average interest ${features[0].averageLikelihood.toFixed(1)} out of 5.`,
        forPlan: 'Consider this among the first capabilities in the system plan.',
      });
    }

    if (problems[0]) {
      takeaways.push({
        id: 'problem',
        title: 'Most reported problem',
        value: problems[0].label,
        meaning: `${problems[0].count} respondent${problems[0].count === 1 ? '' : 's'} (${problems[0].pct}%) selected this.`,
        forPlan: 'Make reporting and tracking this issue easy in the product.',
      });
    }

    if (service.n > 0) {
      takeaways.push({
        id: 'service',
        title: 'Current HOA service feel',
        value: `${service.pctOfScale}%`,
        meaning: 'How residents rate office hours, in-person visits, and response time.',
        forPlan:
          service.pctOfScale < 60
            ? 'Online self-service could relieve pain around office access.'
            : 'Digital tools can complement a service experience that is already middling-to-good.',
      });
    }

    if (wait.averageMinutes != null) {
      takeaways.push({
        id: 'wait',
        title: 'Typical gate wait',
        value: `${wait.averageMinutes} min`,
        meaning: `Based on ${wait.answered} optional answer${wait.answered === 1 ? '' : 's'}.`,
        forPlan: 'Visitor pre-registration could shorten time spent at the gate.',
      });
    }

    if (ac.baseN > 0) {
      const topNeed = ac.buckets.filter((b) => b.count > 0)[0];
      takeaways.push({
        id: 'access',
        title: 'Accessibility path',
        value: `${kpis.pwdRelatedPct}% households`,
        meaning: topNeed
          ? `Among those on the accessibility path, “${topNeed.label}” is most common.`
          : 'Some households indicated a disability or mobility limitation.',
        forPlan: 'Accessible design (text size, contrast, screen readers) should be first-class.',
      });
    }

    if (interview.yes > 0) {
      takeaways.push({
        id: 'interview',
        title: 'Open to interviews',
        value: String(interview.yes),
        meaning: 'Residents willing to be contacted for follow-up conversations.',
        forPlan: 'Use Interview Invites to deepen design research with real residents.',
      });
    }
  }

  return {
    respondentTarget: RESPONDENT_TARGET,
    total: kpis.total,
    progressPct,
    homeownerPct: kpis.homeownerPct,
    tenantPct: kpis.tenantPct,
    pwdPct: kpis.pwdRelatedPct,
    takeaways: takeaways.slice(0, 6),
    topFeatures: features.map((f) => ({
      label: f.label,
      score: `${f.averageLikelihood.toFixed(1)}/5`,
    })),
    topProblems: problems.map((p) => ({
      label: p.label,
      count: p.count,
      pct: p.pct,
    })),
  };
}
