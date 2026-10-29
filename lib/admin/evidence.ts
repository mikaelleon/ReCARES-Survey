import {
  ACCESS_ITEMS,
  FEATURE_ITEMS,
  READINESS_ITEMS,
  ageBuckets,
  deviceBuckets,
  featureByResidentGroup,
  phaseBuckets,
  problemRanking,
  problemsByPhase,
  residentBuckets,
  scaleRows,
} from '@/lib/admin/dataAnalytics';
import { digitalFeasibility } from '@/lib/admin/extendedWidgets';
import { list, lowerFirst, negative, pct, positive, sampleWord } from '@/lib/admin/interpretation';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/** Figure numbers in the printed report, in the order the charts appear. */
export const FIG = {
  trend: 1,
  phase: 2,
  byResident: 3,
  resident: 4,
  age: 5,
  device: 6,
  readiness: 7,
  features: 8,
  compare: 9,
  access: 10,
  problems: 11,
  heat: 12,
} as const;

export interface EvidenceBlock {
  id: string;
  title: string;
  /** Figure numbers this block explains. */
  figures: number[];
  shows: string;
  proves: string;
  meaning: string;
  issue: string;
  plan: string;
}

export interface EvidenceSummary {
  intro: string[];
  blocks: EvidenceBlock[];
  closing: string[];
}

/** What each ReCARES feature is meant to relieve, from the proposal's problem statement. */
const FEATURE_PURPOSE: Record<string, string> = {
  F1: 'cuts the wait at the gate by letting a resident register visitors and workers ahead of time and issue a temporary pass',
  F2: 'replaces word-of-mouth street closures with a permit request and a notice, with rerouting, to the phase affected',
  F3: 'lets homeowners register or authorize a tenant from home instead of printing, filling in, and delivering forms',
  F4: 'moves registration and ID checking online, with the Board still making the final verification',
  F5: 'gives residents one channel to send a request or concern and see where it stands, instead of waiting on a private Facebook inbox',
  F6: 'makes the same services usable with larger text, stronger contrast, and a screen reader',
};

/** Wording that fits the size of a share, so a minority is never described as the norm. */
const strength = (share: number) =>
  share >= 60 ? 'Most residents' : share >= 50 ? 'About half or more of residents' : share >= 30 ? 'A substantial share of residents' : 'Some residents';

const caveat = (n: number) =>
  n < 30
    ? ` With only ${n} responses, treat this as an early signal that the full survey should confirm.`
    : '';

/**
 * Explains each visualization in four steps (what it shows, what it proves,
 * why it matters to residents, and what it means for the system), using the
 * numbers in the current view. Wording softens when the sample is small.
 */
export function buildEvidenceSummary(records: SampleRecord[]): EvidenceSummary {
  const n = records.length;
  if (n === 0) {
    return {
      intro: ['There are no responses in this view yet, so there is no evidence to explain.'],
      blocks: [],
      closing: [],
    };
  }

  const phases = phaseBuckets(records);
  const covered = phases.filter((p) => p.count > 0);
  const missing = phases.filter((p) => p.count === 0).map((p) => p.label);
  const residents = residentBuckets(records);
  const devices = deviceBuckets(records);
  const phoneShare = devices[0]?.pct ?? 0;
  const ages = ageBuckets(records).filter((a) => a.label !== 'No answer');
  const digital = digitalFeasibility(records);
  const features = scaleRows(records, FEATURE_ITEMS).filter((r) => r.n > 0).sort((a, b) => b.mean - a.mean);
  const readiness = scaleRows(records, READINESS_ITEMS).filter((r) => r.n > 0);
  const access = new Map(scaleRows(records, ACCESS_ITEMS).map((r) => [r.code, r]));
  const problems = problemRanking(records).filter((p) => p.count > 0);
  const heat = problemsByPhase(records, 3);
  const compare = featureByResidentGroup(records);
  const hours = access.get('S1');
  const visits = access.get('S2');
  const response = access.get('S3');
  const solves = access.get('F7');
  const weakest = [...readiness].sort((a, b) => positive(a) - positive(b))[0];
  const withDisability = records.filter((r) => r.answers?.A4 === 'yes').length;
  const older = ages.filter((a) => a.label === '55–64' || a.label === '65+').reduce((sum, a) => sum + a.count, 0);
  const owners = compare.homeownerCount;
  const tenants = compare.tenantCount;

  const blocks: EvidenceBlock[] = [];

  // ---- Coverage -------------------------------------------------------------
  blocks.push({
    id: 'coverage',
    title: 'Who answered, and when',
    figures: [FIG.trend, FIG.phase, FIG.byResident, FIG.resident],
    shows: `How many responses came in each day, from which phases, and from which kind of resident (homeowner living in the unit, homeowner living elsewhere, tenant, or household member).`,
    proves: `The findings rest on ${n} responses from ${covered.length} of ${phases.length} phases. Homeowners make up ${pct(owners, n)}% and tenants ${pct(tenants, n)}% of the view${residents[0] ? `, and the largest single group is ${lowerFirst(residents[0].label)} (${residents[0].pct}%)` : ''}.${missing.length ? ` ${list(missing)} ${missing.length === 1 ? 'has' : 'have'} not responded.` : ''}`,
    meaning: `A survey can only describe the people who answered it. Where a phase or a type of resident is missing or thin, the results say little about their experience, however clear the rest of the picture looks.`,
    issue: `The proposal names tenants and households that depend on someone else as residents whose needs differ from an owner's, for example needing an owner's signature or documents. If they are under-represented, the problems that matter most to them stay invisible.`,
    plan: `Treat the requirements as valid for the groups shown here and design both a homeowner path and a tenant path. Before the feature list is final, reach the phases and groups that are missing so the system is not planned around a partial picture.${caveat(n)}`,
  });

  // ---- Devices and age ------------------------------------------------------
  blocks.push({
    id: 'device',
    title: 'How residents get online',
    figures: [FIG.device, FIG.age],
    shows: `The share of responses submitted from a phone or a computer, and the age range of respondents.`,
    proves: `${phoneShare}% of respondents answered on a phone. ${digital.total ? `${digital.pct}% have both a device and a regular internet connection.` : ''} ${older ? `${pct(older, n)}% are 55 or older.` : ''}`.trim(),
    meaning: phoneShare >= 50
      ? `For most residents the phone is the way onto the internet, so a service that only works well on a computer would miss many of them.`
      : `A meaningful share of residents answer on a computer, but a phone-friendly service is still needed so nobody is left out.`,
    issue: `The HOA's forms can be downloaded but must then be printed, filled in by hand, and brought to the office. The proposal calls this false digitization: the document is online, the work is not. It is hardest for people who cannot make the trip.`,
    plan: `Build for the phone first: a responsive web page with no app to install, short forms that can be finished on a small screen, and a camera upload for ID photos. Keep text large and controls easy to tap, since part of the audience is older.`,
  });

  // ---- Reaching the HOA -----------------------------------------------------
  if (hours?.n || visits?.n || response?.n) {
    blocks.push({
      id: 'access',
      title: 'Reaching the HOA today',
      figures: [FIG.access],
      shows: `How strongly residents agree with statements about office hours, the need to visit in person, how quickly concerns get answered, and whether a website would help.`,
      proves: [
        hours?.n ? `${positive(hours)}% say office hours make transactions hard` : '',
        visits?.n ? `${positive(visits)}% must visit in person even for simple matters` : '',
        response?.n ? `${positive(response)}% say concerns get a reasonable response time (${negative(response)}% disagree)` : '',
        solves?.n ? `${positive(solves)}% agree a website like this would solve some of their problems` : '',
      ]
        .filter(Boolean)
        .join('; ') + '.',
      meaning: `${strength(Math.max(hours?.n ? positive(hours) : 0, visits?.n ? positive(visits) : 0))} report that the way the HOA is reached today costs them effort. The walk-in model, limited office hours, and messages sent through a private Facebook account all put the cost of a transaction on the resident: time off work, travel, and waiting for a reply that may not come.`,
      issue: `The proposal describes residents with disabilities or mobility limits who cannot reach the office during its hours at all, and an association that cannot see which messages it has missed. These numbers are the resident-side evidence for both.`,
      plan: `Let residents submit requests and documents at any hour, let them name a trusted person to act for them, and show a status for every request. Together these remove the trip for simple matters and answer the complaint about slow replies.${caveat(n)}`,
    });
  }

  // ---- Feature demand -------------------------------------------------------
  if (features.length) {
    const top = features.slice(0, 3);
    const low = features[features.length - 1]!;
    const split = features.filter((f) => negative(f) >= 25 && positive(f) >= 25);
    blocks.push({
      id: 'features',
      title: 'What residents want the system to do',
      figures: [FIG.features, FIG.compare],
      shows: `For each proposed feature, how residents split between unlikely and likely to use it, with the average at the end of the bar. A second chart sets homeowners against tenants.`,
      proves: `The most wanted are ${list(top.map((f) => `${lowerFirst(f.label)} (${f.mean.toFixed(1)} of 5, ${positive(f)}% likely)`))}. The least wanted is ${lowerFirst(low.label)} (${low.mean.toFixed(1)}).${split.length ? ` Opinion is divided on ${list(split.map((f) => lowerFirst(f.label)))}.` : ''}${tenants >= 5 && owners >= 5 ? '' : ' One resident group is too small for a reliable homeowner and tenant comparison.'}`,
      meaning: `Each feature stands for a specific daily problem. ${top.map((f) => `${f.label} ${FEATURE_PURPOSE[f.code] ?? ''}`).join('; ')}. High interest means residents expect that problem to be solved online.`,
      issue: `Building every feature equally would spend limited capstone time on things few will use, and an average can hide a feature that half of residents want and half do not.`,
      plan: `Build the top-ranked features first and defer the lowest. Where opinion is divided, design with care or test early. Where homeowners and tenants differ, give each group its own form and wording instead of one shared flow.${caveat(n)}`,
    });
  }

  // ---- Readiness ------------------------------------------------------------
  if (readiness.length) {
    blocks.push({
      id: 'readiness',
      title: 'Whether residents can use it',
      figures: [FIG.readiness],
      shows: `Agreement with statements about internet stability, opening a website on a phone, comfort uploading a photo of an ID, and trust that only authorized staff would see it.`,
      proves: `${readiness.map((r) => `${positive(r)}% agree "${lowerFirst(r.label)}"`).join('; ')}.${weakest ? ` The weakest point is "${lowerFirst(weakest.label)}" at ${positive(weakest)}%.` : ''}`,
      meaning: weakest && positive(weakest) < 50
        ? `Interest does not guarantee use, and this chart shows where use could fall short. Fewer than half of residents agree on "${lowerFirst(weakest.label)}", so it needs attention before launch.`
        : `Readiness is mostly in place, so interest should turn into use. The lowest item still deserves care, because a resident needs a steady connection to finish a form and enough confidence to hand over personal documents.`,
      issue: `An unreliable connection loses work in the middle of a form, and doubt about ID handling stops people at the registration step, which is the step that gives them access to the rest of the system.`,
      plan: `Save progress as residents type and keep pages light. Show a plain privacy notice before ID upload that says who sees the ID, why, and when it is deleted. Keep an in-person option for anyone who prefers it, and have the system only check and flag IDs while a named person makes the final decision.`,
    });
  }

  // ---- Problems -------------------------------------------------------------
  if (problems.length) {
    const top = problems.slice(0, 3);
    const clusters = heat.rows
      .map((row) => {
        const best = [...row.cells].filter((c) => c.count >= 2).sort((a, b) => b.pct - a.pct)[0];
        const overall = problems.find((p) => p.id === row.id)?.pct ?? 0;
        return best && best.pct - overall >= 15 ? `${lowerFirst(row.label)} in ${best.phase} (${best.pct}% there against ${overall}% overall)` : null;
      })
      .filter((x): x is string => x !== null);
    const any = records.filter((r) => ((r.answers?.O1 as string[] | undefined) ?? []).some((id) => id !== 'none_of_these' && id !== 'other')).length;
    blocks.push({
      id: 'problems',
      title: 'The problems residents face',
      figures: [FIG.problems, FIG.heat],
      shows: `How many residents reported each kind of problem, and how the top problems are spread across phases.`,
      proves: `${pct(any, n)}% reported at least one problem. The most common are ${list(top.map((p) => `${lowerFirst(p.label)} (${p.pct}%)`))}.${clusters.length ? ` Some are concentrated: ${list(clusters)}.` : ' No problem stands out in a single phase.'}`,
      meaning: `Residents bring a wide range of everyday problems to the HOA, many of them about services the HOA does not run itself, such as water or power. What the HOA controls is how those problems are received, recorded, and followed up.`,
      issue: `Today there is no structured way to do that. Reports share one inbox with routine requests, nothing marks which are urgent or recurring, and the board has no record to show which problems repeat. A problem that clusters in one phase can look like a one-off when it is not.`,
      plan: `Give residents one categorized channel to report problems, with a status they can follow. Let the HOA send notices to the phase affected, and give the board a view of recurring problems by category and phase. The system does not fix a water outage, but it makes sure the problem is recorded, routed to the right person, and not lost.${caveat(n)}`,
    });
  }

  // ---- People needing most support ------------------------------------------
  if (withDisability > 0 || older > 0) {
    blocks.push({
      id: 'support',
      title: 'Residents who depend on access most',
      figures: [FIG.age, FIG.resident],
      shows: `The share of respondents whose household includes someone with a disability or mobility limitation, and the share aged 55 or older.`,
      proves: `${withDisability ? `${pct(withDisability, n)}% (${withDisability}) report a household member with a disability or mobility limitation. ` : ''}${older ? `${pct(older, n)}% (${older}) are 55 or older.` : ''}`.trim(),
      meaning: `These are the residents for whom a trip to the office is hardest, and the proposal treats them as the primary beneficiaries of the system.`,
      issue: `If the online service is hard to use for the same people who cannot visit the office, it moves the barrier instead of removing it.`,
      plan: `Meet web accessibility standards (readable text, strong contrast, keyboard and screen reader support), let a resident authorize a family member or caregiver to act for them, and test the system with these residents during user acceptance testing.`,
    });
  }

  // ---- Intro and closing ----------------------------------------------------
  const sizeWord = sampleWord(n);
  const topFeature = features[0];
  const topProblem = problems[0];
  const intro = [
    `This report summarises what ${n} ${n === 1 ? 'resident' : 'residents'} of Camella Homes Tibig told the study in the Resident Needs Assessment Survey. The survey is the study's evidence for two things: the problems residents face when dealing with the HOA, and which features of ReCARES are worth building first.`,
    `Each chart in the report is explained in the same four steps: what it shows, what it proves, why that matters to residents, and what it means for planning the system. The charts are numbered so each explanation can be matched to its figure.`,
    `In short: ${[
      hours?.n && visits?.n ? `${positive(visits)}% of residents must visit the office in person even for simple matters` : '',
      topProblem ? `${lowerFirst(topProblem.label)} is the problem reported most (${topProblem.pct}%)` : '',
      topFeature ? `${lowerFirst(topFeature.label)} is the feature residents say they would most likely use (${topFeature.mean.toFixed(1)} of 5)` : '',
      digital.total ? `${digital.pct}% have the device and internet to use it` : '',
    ]
      .filter(Boolean)
      .join('; ')}. The sample is ${sizeWord}, so read the figures as ${n < 30 ? 'early signals' : 'a guide to priorities'} rather than exact measures.`,
  ];
  const closing = [
    `Taken together, the charts support a plan with three parts. First, reduce the cost of dealing with the HOA by letting residents submit and track requests online at any hour. Second, make that service work on a phone, for residents with limited mobility, and for those who are cautious about sharing an ID. Third, give the HOA a record of the problems residents report, by category and by phase, so decisions rest on what residents said instead of assumptions.`,
  ];

  return { intro, blocks, closing };
}
