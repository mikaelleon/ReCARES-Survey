import {
  ACCESS_ITEMS,
  FEATURE_ITEMS,
  READINESS_ITEMS,
  ageBuckets,
  averageFeatureInterest,
  deviceBuckets,
  featureByResidentGroup,
  interviewShare,
  phaseBuckets,
  problemRanking,
  problemsByPhase,
  residentBuckets,
  scaleRows,
  type ScaleRow,
} from '@/lib/admin/dataAnalytics';
import { digitalFeasibility } from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

export interface ReportSection {
  id: 'summary' | 'people' | 'readiness' | 'features' | 'access' | 'problems' | 'next' | 'method';
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Interpretation {
  sampleNote: string;
  sections: ReportSection[];
}

export const pct = (part: number, total: number) => (total <= 0 ? 0 : Math.round((part / total) * 100));

export function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** Share of answers that agree or strongly agree (or are likely or very likely). */
export const positive = (row: ScaleRow) => (row.n ? pct(row.counts[3] + row.counts[4], row.n) : 0);
export const negative = (row: ScaleRow) => (row.n ? pct(row.counts[0] + row.counts[1], row.n) : 0);

export function lowerFirst(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text[0]!.toLowerCase() + text.slice(1) : text;
}

export function sampleWord(n: number): string {
  if (n < 10) return 'very small';
  if (n < 30) return 'small';
  if (n < 100) return 'moderate';
  return 'solid';
}

/**
 * Plain-language reading of the filtered responses. Every sentence is built
 * from the numbers on screen, and the wording softens as the sample shrinks,
 * so the report never states more than the data can support.
 */
export function buildInterpretation(records: SampleRecord[], periodLabel: string): Interpretation {
  const n = records.length;
  const sections: ReportSection[] = [];
  const sizeWord = sampleWord(n);

  const sampleNote =
    n === 0
      ? 'There are no responses in this view yet, so there is nothing to interpret.'
      : n < 30
        ? `The ${n} responses in this view are a ${sizeWord} sample. Read the figures as early signals, not firm findings.`
        : `The ${n} responses in this view are a ${sizeWord} sample for a community survey. Differences of a few points between groups are not reliable.`;

  if (n === 0) {
    return { sampleNote, sections: [{ id: 'summary', title: 'Key findings at a glance', paragraphs: [sampleNote] }] };
  }

  const phones = deviceBuckets(records);
  const phoneShare = phones[0]?.pct ?? 0;
  const digital = digitalFeasibility(records);
  const interest = averageFeatureInterest(records);
  const features = scaleRows(records, FEATURE_ITEMS).filter((r) => r.n > 0).sort((a, b) => b.mean - a.mean);
  const readiness = scaleRows(records, READINESS_ITEMS).filter((r) => r.n > 0);
  const access = scaleRows(records, ACCESS_ITEMS);
  const problems = problemRanking(records).filter((p) => p.count > 0);
  const residents = residentBuckets(records);
  const phases = phaseBuckets(records);
  const ages = ageBuckets(records).filter((a) => a.label !== 'No answer');
  const compare = featureByResidentGroup(records);
  const interview = interviewShare(records);

  const topFeature = features[0];
  const lowFeature = features[features.length - 1];
  const topProblem = problems[0];
  const weakestReadiness = [...readiness].sort((a, b) => positive(a) - positive(b))[0];

  // ---- Summary ----------------------------------------------------------------
  const summary: string[] = [];
  summary.push(
    `${n} ${n === 1 ? 'resident' : 'residents'} of Camella Homes Tibig answered the survey${periodLabel ? ` (${periodLabel.toLowerCase()})` : ''}. ${phoneShare}% answered on a phone, which is the main way residents are likely to reach an online service.`,
  );
  if (interest.n > 0) {
    const level = interest.mean >= 4 ? 'high' : interest.mean >= 3.4 ? 'moderate to high' : interest.mean >= 2.6 ? 'mixed' : 'low';
    summary.push(
      `Interest in the proposed online features is ${level}, averaging ${interest.mean.toFixed(1)} out of 5.${topFeature ? ` ${topFeature.label} is the most wanted feature (${topFeature.mean.toFixed(1)}), and ${positive(topFeature)}% of those who answered said they would be likely to use it.` : ''}`,
    );
  }
  if (digital.total > 0) {
    const ready = digital.pct >= 80 ? 'most' : digital.pct >= 50 ? 'about half or more' : 'fewer than half';
    summary.push(
      `${digital.pct}% of respondents have both a device and an internet connection, so ${ready} of this group could use an online service today.${weakestReadiness ? ` The weakest point is "${lowerFirst(weakestReadiness.label)}", which only ${positive(weakestReadiness)}% agreed with.` : ''}`,
    );
  }
  if (topProblem) {
    summary.push(
      `${topProblem.label} is the problem residents report most often (${topProblem.pct}% of respondents), followed by ${problems.slice(1, 3).map((p) => `${lowerFirst(p.label)} (${p.pct}%)`).join(' and ') || 'no other group in particular'}.`,
    );
  }
  const readyHigh = digital.pct >= 70;
  const interestHigh = interest.mean >= 3.4;
  summary.push(
    interestHigh && readyHigh
      ? 'Taken together, residents are both interested in and equipped for online HOA services. The data supports starting with the features at the top of the ranking.'
      : interestHigh
        ? 'Residents want these services, but a share of them may not be able to use them yet. Plan for support, such as help at the office or an easy-to-use mobile page, alongside the online service.'
        : readyHigh
          ? 'Most residents could use an online service, but interest is lukewarm. It would help to learn which problems residents find most worth solving before building features.'
          : 'Both interest and readiness are modest in this view, so any online service should be introduced gradually, with clear help for residents who are less comfortable with it.',
  );
  sections.push({ id: 'summary', title: 'Key findings at a glance', paragraphs: summary });

  // ---- Who responded ----------------------------------------------------------
  const people: string[] = [];
  const topResident = residents[0];
  if (topResident) {
    people.push(
      `The largest resident group is ${lowerFirst(topResident.label)} (${topResident.pct}% of respondents)${residents[1] ? `, followed by ${lowerFirst(residents[1].label)} (${residents[1].pct}%)` : ''}.${compare.homeownerCount && compare.tenantCount ? ` Homeowners make up ${pct(compare.homeownerCount, n)}% and tenants ${pct(compare.tenantCount, n)}% of this view.` : ''}`,
    );
  }
  const topPhase = [...phases].sort((a, b) => b.count - a.count)[0];
  const missingPhases = phases.filter((p) => p.count === 0).map((p) => p.label);
  if (topPhase && topPhase.count > 0) {
    people.push(
      `${topPhase.label} contributed the most responses (${topPhase.pct}%).${missingPhases.length ? ` No responses yet from ${list(missingPhases)}, so findings do not describe those areas.` : ' All phases are represented.'}`,
    );
  }
  const withDisability = records.filter((r) => r.answers?.A4 === 'yes').length;
  if (withDisability > 0) {
    people.push(
      `${pct(withDisability, n)}% (${withDisability}) say someone in their household has a disability or mobility limitation. These residents are the group the study treats as its primary beneficiaries, so their answers deserve a closer look in the Responses page.`,
    );
  }
  const topAge = [...ages].sort((a, b) => b.count - a.count)[0];
  if (topAge && topAge.count > 0) {
    people.push(`The largest age group is ${topAge.label} (${topAge.pct}%). Check that older residents, who may find online services hardest, are represented before drawing conclusions about them.`);
  }
  sections.push({ id: 'people', title: 'Who responded', paragraphs: people });

  // ---- Readiness --------------------------------------------------------------
  const ready: string[] = [];
  if (digital.total > 0) {
    ready.push(`${digital.count} of ${digital.total} respondents (${digital.pct}%) have a smartphone, laptop, or tablet and a regular internet connection.`);
  }
  if (readiness.length) {
    ready.push(
      `On comfort and trust: ${readiness.map((r) => `${positive(r)}% agree "${lowerFirst(r.label)}"`).join('; ')}.`,
    );
    const idComfort = readiness.find((r) => r.code === 'R1');
    const idTrust = readiness.find((r) => r.code === 'R2');
    if (idComfort && idTrust && positive(idTrust) - positive(idComfort) >= 10) {
      ready.push('Residents trust the HOA more than they feel comfortable uploading an ID. Explaining how the ID is stored, who can see it, and when it is deleted should help.');
    } else if (idComfort && positive(idComfort) < 50) {
      ready.push('Fewer than half are comfortable uploading a photo of an ID. A feature that depends on ID upload should offer an in-person alternative.');
    }
  }
  if (weakestReadiness) {
    ready.push(`The lowest-scoring readiness item is "${lowerFirst(weakestReadiness.label)}" (${positive(weakestReadiness)}% agree, ${negative(weakestReadiness)}% disagree). This is the first barrier to address.`);
  }
  sections.push({ id: 'readiness', title: 'Digital access and readiness', paragraphs: ready });

  // ---- Features ---------------------------------------------------------------
  const feat: string[] = [];
  if (features.length) {
    feat.push(
      `Features ranked by average likelihood of use: ${features.map((f) => `${lowerFirst(f.label)} (${f.mean.toFixed(1)})`).join(', ')}.`,
    );
    if (topFeature && lowFeature && topFeature.code !== lowFeature.code) {
      const gap = topFeature.mean - lowFeature.mean;
      feat.push(
        gap < 0.4
          ? 'The scores are close together, so residents do not strongly prefer one feature over another. Other factors, such as cost to build or how often a task comes up, can decide the order.'
          : `There is a clear gap between the most wanted (${topFeature.mean.toFixed(1)}) and least wanted (${lowFeature.mean.toFixed(1)}) feature, which makes the order easier to defend.`,
      );
    }
    const split = features.filter((f) => negative(f) >= 25 && positive(f) >= 25);
    if (split.length) {
      feat.push(`Opinion is divided on ${list(split.map((f) => lowerFirst(f.label)))}: a quarter or more of residents are likely to use it and a quarter or more are not. An average alone hides this.`);
    }
  }
  const minGroup = Math.min(compare.homeownerCount, compare.tenantCount);
  if (compare.homeownerCount && compare.tenantCount) {
    const gaps = compare.rows
      .filter((r) => r.homeowner.mean != null && r.tenant.mean != null)
      .map((r) => ({ label: r.label, diff: (r.tenant.mean as number) - (r.homeowner.mean as number) }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    const biggest = gaps[0];
    if (biggest && Math.abs(biggest.diff) >= 0.5) {
      feat.push(
        minGroup < 5
          ? `Tenants and homeowners differ most on ${lowerFirst(biggest.label)}, but one group has fewer than five residents, so this is only a hint.`
          : `Tenants and homeowners differ most on ${lowerFirst(biggest.label)}: ${biggest.diff > 0 ? 'tenants' : 'homeowners'} rate it ${Math.abs(biggest.diff).toFixed(1)} points higher. Consider whether it should be shaped differently for each group.`,
      );
    } else {
      feat.push('Homeowners and tenants want broadly the same features, so one design is likely to serve both.');
    }
  }
  sections.push({ id: 'features', title: 'Which features residents want', paragraphs: feat });

  // ---- Access today -----------------------------------------------------------
  const acc: string[] = [];
  const byCode = new Map(access.map((r) => [r.code, r]));
  const hours = byCode.get('S1');
  const visits = byCode.get('S2');
  const response = byCode.get('S3');
  const solves = byCode.get('F7');
  if (hours?.n) acc.push(`${positive(hours)}% say the office hours make it hard to do their transactions.`);
  if (visits?.n) acc.push(`${positive(visits)}% say they must visit the office in person even for simple matters.`);
  if (response?.n) {
    acc.push(
      `${positive(response)}% say they get a response to their concerns within a reasonable time, and ${negative(response)}% disagree.${positive(response) < 50 ? ' Slow replies make a case for a request-tracking feature, so residents can see where their concern stands.' : ''}`,
    );
  }
  if (solves?.n) acc.push(`${positive(solves)}% agree that a website with these features would solve some of the problems they face.`);
  if (hours?.n && visits?.n && (positive(hours) >= 50 || positive(visits) >= 50)) {
    acc.push('A majority feel the current way of reaching the HOA costs them time. This is the clearest reason for an online option.');
  }
  if (acc.length) sections.push({ id: 'access', title: 'Reaching the HOA today', paragraphs: acc });

  // ---- Problems ---------------------------------------------------------------
  const prob: string[] = [];
  if (problems.length) {
    prob.push(`The most reported problem areas are ${list(problems.slice(0, 3).map((p) => `${lowerFirst(p.label)} (${p.pct}%)`))}.`);
    const heat = problemsByPhase(records, 3);
    const concentrated = heat.rows
      .map((row) => {
        const best = [...row.cells].filter((c) => c.count >= 2).sort((a, b) => b.pct - a.pct)[0];
        return best ? { label: row.label, phase: best.phase, pct: best.pct, overall: problems.find((p) => p.id === row.id)?.pct ?? 0 } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && x.pct - x.overall >= 15);
    if (concentrated.length) {
      prob.push(
        `Some problems cluster in particular areas: ${concentrated.map((c) => `${lowerFirst(c.label)} in ${c.phase} (${c.pct}% there, against ${c.overall}% overall)`).join('; ')}. These may call for a local response rather than a subdivision-wide one.`,
      );
    }
    const anyProblem = records.filter((r) => ((r.answers?.O1 as string[] | undefined) ?? []).some((id) => id !== 'none_of_these' && id !== 'other')).length;
    prob.push(`${pct(anyProblem, n)}% of respondents reported at least one problem in the open problem discovery question.`);
  } else {
    prob.push('No problem areas have been reported in this view yet.');
  }
  const written = records.filter((r) => typeof r.answers?.O2 === 'string' && (r.answers.O2 as string).trim()).length;
  const community = records.filter((r) => typeof r.answers?.O3 === 'string' && (r.answers.O3 as string).trim()).length;
  if (written || community) {
    prob.push(`${written} wrote about other HOA-related problems and ${community} about wider community problems. Reading these answers can reveal issues the listed groups missed.`);
  }
  sections.push({ id: 'problems', title: 'Problems residents face', paragraphs: prob });

  // ---- Next steps -------------------------------------------------------------
  const next: string[] = [];
  if (features.length >= 2) next.push(`Start with ${lowerFirst(features[0]!.label)} and ${lowerFirst(features[1]!.label)}, the two features residents are most likely to use.`);
  if (phoneShare >= 60) next.push('Design and test for phones first, since most responses come from them.');
  if (weakestReadiness && positive(weakestReadiness) < 60) next.push(`Address "${lowerFirst(weakestReadiness.label)}" with clear guidance or an offline alternative.`);
  if (topProblem) next.push(`Share the ${lowerFirst(topProblem.label)} findings with the HOA as the most commonly reported problem.`);
  if (missingPhases.length) next.push(`Reach residents in ${list(missingPhases)}, which have not responded yet.`);
  if (interview.yes > 0) next.push(`${interview.yes} residents (${interview.pct}%) are open to a follow-up interview. Use these to explore the reasons behind the main findings.`);
  sections.push({
    id: 'next',
    title: 'Suggested priorities',
    paragraphs: ['These follow from the numbers above and are suggestions for the study team to weigh, not conclusions.'],
    bullets: next,
  });

  // ---- Method and limits ------------------------------------------------------
  sections.push({
    id: 'method',
    title: 'How to read this report',
    paragraphs: [
      'Responses are anonymous and come from residents who chose to take part, so they may not match the whole community. Percentages describe the respondents in this view, not every resident.',
      'Rating questions run from 1 to 5. "Agree" and "likely" combine the top two points; "Not applicable" answers are left out of averages. Group comparisons are shown only as differences in averages and have not been tested for statistical significance.',
      sampleNote,
    ],
  });

  return { sampleNote, sections };
}
