import type { CountBucket } from '@/lib/admin/analytics';
import {
  ACCESS_ITEMS,
  FEATURE_ITEMS,
  READINESS_ITEMS,
  ageBuckets,
  dailySeries,
  deviceBuckets,
  phaseBuckets,
  problemRanking,
  problemsByPhase,
  residentBuckets,
  residentSeries,
  scaleRows,
  type ScaleRow,
} from '@/lib/admin/dataAnalytics';
import { parseSubmittedAt } from '@/lib/admin/dateRange';
import { digitalFeasibility, scaleScore } from '@/lib/admin/extendedWidgets';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { SCALE_LABELS, SCALE_RANGES, effectLabel, fmt, fmtP, mean, verbal, welch } from '@/lib/admin/stats';
import { DEFAULT_INSTRUMENT } from '@/survey/defaultInstrument';
import { resolveText } from '@/survey/model';

// ---- document model ------------------------------------------------------------

export type FigureId =
  | 'trend'
  | 'byResident'
  | 'phase'
  | 'access'
  | 'readiness'
  | 'features'
  | 'compare'
  | 'problems'
  | 'heat'
  | 'dailyByResident'
  | 'age'
  | 'resident'
  | 'device';

export type TableRow = string[] | { panel: string };

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h3'; text: string }
  | {
      kind: 'table';
      label: string;
      title: string;
      head: string[];
      rows: TableRow[];
      note: string;
      align?: Array<'l' | 'r' | 'c'>;
      small?: boolean;
    }
  | { kind: 'figure'; label: string; title: string; id: FigureId; note: string }
  | { kind: 'screenshot'; label: string; title: string; file: string; note: string }
  | { kind: 'bullets'; items: string[] };

export interface DocSection {
  id: string;
  heading: string;
  pageBreak?: boolean;
  blocks: Block[];
}

export interface ReportMeta {
  periodLabel: string;
  phase: string;
  resident: string;
  generated: string;
}

export interface ReportDocument {
  sections: DocSection[];
  needed: string[];
  sampleSize: number;
}

/**
 * Screenshots of the survey system, shown in the Methodology section. Put each PNG in
 * public/report-screenshots/ under the file name below. A missing file shows a placeholder.
 * They are labeled "Screen n" so the numbering of the data figures does not change.
 */
export const SCREENSHOT_DIR = '/report-screenshots';
export const SCREENSHOTS: Array<{ side: 'resident' | 'admin'; file: string; title: string; note: string }> = [
  { side: 'resident', file: 'resident-01-welcome.png', title: 'Resident Welcome Screen', note: 'Note. Residents choose English or Tagalog and start the survey or resume a draft saved on the device.' },
  { side: 'resident', file: 'resident-02-consent.png', title: 'Consent and Eligibility Screen', note: 'Note. Two required confirmations: agreement to take part, and being 18 or older and a Camella Homes Tibig owner, tenant, or household member.' },
  { side: 'resident', file: 'resident-03-household.png', title: 'Survey Step: About Your Household', note: 'Note. The screening answers decide which later question sets are shown.' },
  { side: 'resident', file: 'resident-04-digital-access.png', title: 'Survey Step: Digital Access', note: 'Note. Device, connection, and cost questions.' },
  { side: 'resident', file: 'resident-05-likert.png', title: 'Survey Step with Five-Point Statements', note: 'Note. Agreement and likelihood items use five labeled points, with Not applicable where it fits.' },
  { side: 'resident', file: 'resident-06-problems.png', title: 'Survey Step: Community Problems', note: 'Note. Residents pick problem groups, and each group opens a short checklist.' },
  { side: 'resident', file: 'resident-07-review.png', title: 'Review Screen', note: 'Note. Residents can check their answers by section before submitting.' },
  { side: 'resident', file: 'resident-08-thank-you.png', title: 'Thank-You Screen with Interview Invitation', note: 'Note. The interview form is separate from the survey answers and is not linked to them.' },
  { side: 'admin', file: 'admin-01-dashboard.png', title: 'Superadmin Dashboard', note: 'Note. Summary of responses received, by phase and resident type.' },
  { side: 'admin', file: 'admin-02-responses.png', title: 'Responses Page', note: 'Note. Submitted responses with filters. Responses carry no names or addresses.' },
  { side: 'admin', file: 'admin-03-data-analytics.png', title: 'Data Analytics Page', note: 'Note. Charts and tables used in the Results section of this report.' },
  { side: 'admin', file: 'admin-04-survey-builder.png', title: 'Survey Builder', note: 'Note. Questions, steps, and branching rules are edited here, and a version is published to residents.' },
  { side: 'admin', file: 'admin-05-interview-invites.png', title: 'Interview Invites Page', note: 'Note. Interview invitations with preferred date, time, and format, and a contact status.' },
  { side: 'admin', file: 'admin-06-survey-control.png', title: 'Survey Control Page', note: 'Note. Opens or closes the survey, sets the schedule, and chooses the live version.' },
];

function screenshotBlocks(side: 'resident' | 'admin', start: number): Block[] {
  return SCREENSHOTS.filter((x) => x.side === side).map((x, i) => ({
    kind: 'screenshot' as const,
    label: `Screen ${start + i}`,
    title: x.title,
    file: x.file,
    note: x.note,
  }));
}

// ---- helpers -------------------------------------------------------------------

const NA = 'n/a';

function sentences(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const pc = (part: number, total: number) => (total <= 0 ? 0 : Math.round((part / total) * 100));
const cap = (text: string) => (text ? text[0]!.toUpperCase() + text.slice(1) : text);
const lowerBase = (text: string) => (/^[A-Z][a-z]/.test(text) ? text[0]!.toLowerCase() + text.slice(1) : text);
const lower = lowerBase;
/** A feature name as a noun phrase, with an article where the name needs one. */
const ph = (label: string) => (/^Accessible/.test(label) ? `the ${lower(label)}` : lower(label));

function sizeWord(n: number): string {
  if (n < 10) return 'very small';
  if (n < 30) return 'small';
  if (n < 100) return 'moderate';
  return 'solid';
}

function longDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Share of scored answers at 4 or 5. */
const topTwo = (row: ScaleRow) => (row.n ? pc(row.counts[3] + row.counts[4], row.n) : 0);

function bucketRows(buckets: CountBucket[]): TableRow[] {
  return buckets.map((b) => [b.label, String(b.count), `${b.pct}%`]);
}

// ---- builder -------------------------------------------------------------------

export function buildReportDocument(records: SampleRecord[], meta: ReportMeta): ReportDocument {
  const needed: string[] = [];
  const need = (what: string) => {
    if (!needed.includes(what)) needed.push(what);
    return `[NEEDED: ${what}]`;
  };

  const n = records.length;
  if (n === 0) {
    return {
      needed,
      sampleSize: 0,
      sections: [
        {
          id: 'summary',
          heading: 'Executive Summary',
          blocks: [
            {
              kind: 'p',
              text: 'The current view contains no responses, so no analysis or interpretation can be reported. The proponents should select a wider date range or clear the phase and resident filters, then generate the report again.',
            },
          ],
        },
      ],
    };
  }

  // ---- data ----
  const times = records.map((r) => parseSubmittedAt(r.submittedAt)).filter((t) => Number.isFinite(t));
  const first = longDate(Math.min(...times));
  const last = longDate(Math.max(...times));
  const days = Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000) + 1;
  const duplicates = n - new Set(records.map((r) => r.id)).size;
  const partial = records.filter((r) => r.status === 'partial').length;
  const versions = Array.from(new Set(records.map((r) => r.instrumentVersion).filter((v): v is string => Boolean(v))));

  const phases = phaseBuckets(records);
  const coveredPhases = phases.filter((p) => p.count > 0);
  const missingPhases = phases.filter((p) => p.count === 0).map((p) => p.label);
  const residents = residentBuckets(records);
  const ages = ageBuckets(records);
  const devices = deviceBuckets(records);
  const phoneShare = devices[0]?.pct ?? 0;
  const owners = records.filter((r) => r.homeowner);
  const tenants = records.filter((r) => r.tenant);
  const digital = digitalFeasibility(records);
  const disability = records.filter((r) => r.answers?.A4 === 'yes');
  const disabilityUnsure = records.filter((r) => r.answers?.A4 === 'prefer_not_to_say').length;
  const age55 = records.filter((r) => ['55-64', '65+'].includes(String(r.answers?.A6))).length;
  const age65 = records.filter((r) => r.answers?.A6 === '65+').length;
  const interview = records.filter((r) => r.answers?.IV1 === 'yes').length;
  const wroteHoa = records.filter((r) => typeof r.answers?.O2 === 'string' && (r.answers.O2 as string).trim()).length;
  const wroteCommunity = records.filter((r) => typeof r.answers?.O3 === 'string' && (r.answers.O3 as string).trim()).length;

  const features = scaleRows(records, FEATURE_ITEMS);
  const access = scaleRows(records, ACCESS_ITEMS);
  const readiness = scaleRows(records, READINESS_ITEMS);
  const rankedFeatures = features.filter((r) => r.n > 0).sort((a, b) => b.meanExact - a.meanExact);
  const byCode = new Map(access.map((r) => [r.code, r]));
  const S1 = byCode.get('S1');
  const S2 = byCode.get('S2');
  const S3 = byCode.get('S3');
  const F7 = byCode.get('F7');
  const readyRows = readiness.filter((r) => r.n > 0);
  const weakest = [...readyRows].sort((a, b) => a.meanExact - b.meanExact)[0];
  const problems = problemRanking(records);
  const reported = problems.filter((p) => p.count > 0);
  const anyProblem = records.filter((r) =>
    ((r.answers?.O1 as string[] | undefined) ?? []).some((id) => id !== 'none_of_these' && id !== 'other'),
  ).length;
  const heat = problemsByPhase(records, 99);
  const series = dailySeries(records, 60);
  const byGroup = residentSeries(records, 60);
  const peakDay = [...series].sort((a, b) => b.count - a.count)[0];

  const allScaleCodes = [...FEATURE_ITEMS, ...ACCESS_ITEMS, ...READINESS_ITEMS].map((i) => i.code);
  let outOfRange = 0;
  for (const r of records) {
    for (const code of allScaleCodes) {
      const raw = (r.answers as Record<string, unknown> | undefined)?.[code];
      if (typeof raw === 'number' && raw !== 99 && scaleScore(raw) == null) outOfRange += 1;
    }
  }

  const sample = sizeWord(n);
  const small = n < 30;
  const topFeature = rankedFeatures[0];
  const secondFeature = rankedFeatures[1];
  const lowFeature = rankedFeatures[rankedFeatures.length - 1];
  const topProblem = reported[0];
  const verb = (row: ScaleRow, kind: 'agreement' | 'likelihood') => verbal(row.meanExact, kind);
  const mSd = (row: ScaleRow) => `M = ${fmt(row.meanExact)}, SD = ${fmt(row.sd)}`;

  const sections: DocSection[] = [];

  // =========================================================================
  // Executive Summary
  // =========================================================================
  sections.push({
    id: 'summary',
    heading: 'Executive Summary',
    pageBreak: true,
    blocks: [
      {
        kind: 'p',
        text: sentences(
          'The proponents of ReCARES analyzed how residents of Camella Homes Tibig reach the services of the Homeowners Association (HOA) and which online features they would use.',
          `The analysis draws on the Resident Needs Assessment Survey, which collected anonymous responses from ${n} residents between ${first} and ${last}.`,
          `Respondents came from ${coveredPhases.length} of ${phases.length} phases, and ${phoneShare}% of them answered on a phone.`,
          'The survey asked about access to HOA services, readiness to use online services, interest in six proposed features, and problems experienced in the community.',
          'Results were summarized with frequencies, percentages, weighted means, standard deviations, and Welch t tests.',
          `Because respondents volunteered, the findings describe the ${n} residents who answered and do not measure all households.`,
        ),
      },
      {
        kind: 'p',
        text: sentences(
          S2?.n && S1?.n
            ? `Residents described reaching the HOA as costly: ${topTwo(S2)}% agreed that they must visit the office in person even for simple matters, and ${topTwo(S1)}% agreed that office hours make transactions hard.`
            : 'The access items did not receive enough answers to be summarized.',
          digital.total
            ? `Overall, ${digital.pct}% of respondents have both a device and an internet connection${weakest ? `, and the weakest readiness item was "${lower(weakest.label)}" (M = ${fmt(weakest.meanExact)}, ${verb(weakest, 'agreement')})` : ''}.`
            : '',
          topFeature && lowFeature
            ? `Residents were most likely to use ${ph(topFeature.label)} (M = ${fmt(topFeature.meanExact)}, ${verb(topFeature, 'likelihood')}), and the lowest-ranked feature was ${ph(lowFeature.label)} (M = ${fmt(lowFeature.meanExact)}).`
            : '',
          topProblem
            ? `The most frequently reported problem group was ${lower(topProblem.label)} (${topProblem.pct}% of respondents), followed by ${joinAnd(reported.slice(1, 3).map((p) => `${lower(p.label)} (${p.pct}%)`))}.`
            : '',
          'These results suggest that a service that works on a phone and lets residents submit and track requests outside office hours would address the burden that residents described.',
          topFeature && secondFeature
            ? `The key recommendation is to build ${ph(topFeature.label)} and ${ph(secondFeature.label)} first, design for phones and for residents with limited mobility, and give the HOA a categorized channel for resident problems.`
            : 'The key recommendation is to confirm these findings with a larger group of respondents before the feature list is final.',
          `The sample is ${sample}, so the findings should be confirmed with a larger and more varied group of respondents.`,
        ),
      },
    ],
  });

  // =========================================================================
  // Background and Objectives
  // =========================================================================
  sections.push({
    id: 'background',
    heading: 'Background and Objectives',
    blocks: [
      {
        kind: 'p',
        text: sentences(
          'Camella Homes Tibig is a subdivision in Lipa City, Batangas, where the Homeowners Association serves residents mainly through walk-in transactions and through messages sent to a private Facebook account.',
          'The proponents observed that downloadable forms must still be printed, filled in by hand, and delivered to the office, so the work remains in person even when the document is online.',
          'These conditions are hardest for residents with disabilities or mobility limitations, who may be unable to reach the office during its limited hours.',
          'Republic Act No. 7277, the Magna Carta for Disabled Persons, requires Philippine institutions to provide services that persons with disabilities can use (Republic of the Philippines, 1992).',
          'Research on public web services shows that accessibility remains an unresolved problem worldwide (Ouaziz et al., 2026), and a comparison of government electronic systems found that those in the Philippines were not easily navigated by persons with disabilities (Majid, 2026).',
          'Compliance also differs by country income level (Jordanoski & Meyerhoff Nielsen, 2023), and it improves when websites are monitored continually instead of checked once (Frandell & Allgood, 2026).',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'The ReCARES study follows the design science research process of Peffers et al. (2007), in which the problem must be identified before a solution is designed.',
          'The Resident Needs Assessment Survey serves as the first stage of data gathering in the proposal, and its results are meant to verify the problems the proponents observed and to reveal others.',
          'This report analyzes the responses so that the features of ReCARES can be chosen from resident evidence instead of assumption.',
          'The proposal named the walk-in service model, limited office hours, and one-way communication as problems, and the survey asked residents about them directly.',
          'Recommendations from the panel that reviewed the initial proposal also asked the proponents to look for further problem types, so the survey includes a section for open problem discovery.',
          need('confirm the objectives approved after the panel review, because the objectives below come from the initial proposal'),
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'The initial proposal states five objectives, of which the first three are supported by this analysis.',
          'Objective 1 is to analyze the concepts that guide the platform, including web accessibility standards.',
          'Objective 2 is to design and develop ReCARES and its features, and Objective 3 is to propose and implement the platform for the Camella Homes Tibig Homeowners Association as the primary client.',
          'Objectives 4 and 5 concern evaluation after development, so they fall outside this report.',
          'Six analysis questions translate the first three objectives into measurable terms, and Table 1 lists each question with the measure used to answer it.',
        ),
      },
      {
        kind: 'table',
        label: 'Table 1',
        title: 'Analysis Questions and the Study Objectives They Support',
        head: ['No.', 'Analysis question', 'Measure', 'Objective'],
        align: ['c', 'l', 'l', 'c'],
        rows: [
          ['AQ1', 'Who responded to the survey?', 'Frequency and percentage by phase, resident type, age range, and device', '3'],
          ['AQ2', 'How burdensome is reaching the HOA today?', 'Weighted mean, standard deviation, and percent agreement for items S1, S2, S3, and F7', '1, 2'],
          ['AQ3', 'Are residents ready to use online services?', 'Percent with a device and internet; weighted mean for items B7, B9, R1, and R2', '1, 2'],
          ['AQ4', 'Which proposed features are residents most likely to use, and do homeowners and tenants differ?', 'Weighted mean for items F1 to F6; Welch t test and Cohen d by resident group', '2'],
          ['AQ5', 'Which problems do residents report, and where?', 'Frequency and percentage by problem group; percentage within phase', '2'],
          ['AQ6', 'How many households need accessible services?', 'Percentage of households with a member with a disability or mobility limitation; percentage aged 55 or older', '1, 3'],
        ],
        note: 'Note. Objective numbers follow Section 1.3 of the initial proposal. AQ = analysis question.',
      },
    ],
  });

  // =========================================================================
  // Data Description
  // =========================================================================
  sections.push({
    id: 'data',
    heading: 'Data Description',
    blocks: [
      {
        kind: 'p',
        text: sentences(
          'The data come from the Resident Needs Assessment Survey, a self-administered web questionnaire stored in the Cloud Firestore database of the ReCARES project.',
          `The records cover submissions dated from ${first} to ${last}, a span of ${days} ${days === 1 ? 'day' : 'days'}.`,
          need('the official opening and closing dates of the survey'),
          partial === 0
            ? `The dataset holds ${n} complete responses, and it holds no partial responses because unfinished answers stay on the respondent's device until submission.`
            : `The dataset holds ${n - partial} complete and ${partial} partial responses.`,
          versions.length
            ? `The records were collected with instrument ${joinAnd(versions)}.`
            : `The records do not store an instrument version, so ${need('the instrument version used during collection')}.`,
          'Each record contains coded answers, a submission date, a device class, and the instrument version, and it contains no name, address, or contact detail.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'Table 2 lists the variables analyzed in this report, together with the survey items that produced them and their level of measurement.',
          'Phase, resident type, device class, household disability, and problem groups are nominal variables, and age range and the rating items are ordinal.',
          'The rating items use a five-point scale, which the proponents summarized with means and standard deviations in line with common practice for Likert-type items.',
          'Written answers to two open questions were counted but not coded, so they do not appear as variables in the results.',
        ),
      },
      {
        kind: 'table',
        label: 'Table 2',
        title: 'Variables, Survey Items, and Level of Measurement',
        head: ['Variable', 'Items', 'Type', 'Categories or scale'],
        align: ['l', 'c', 'l', 'l'],
        rows: [
          ['Phase', 'A2', 'Nominal', 'Six phases of the subdivision'],
          ['Resident type', 'A1', 'Nominal', 'Six categories, grouped into four for time charts'],
          ['Age range', 'A6', 'Ordinal', 'Six ranges and prefer not to say'],
          ['Device class', 'System', 'Nominal', 'Phone or computer, recorded at submission'],
          ['Household disability or mobility limitation', 'A4', 'Nominal', 'Yes, no, or prefer not to say'],
          ['Device and internet access', 'B1, B3', 'Nominal', 'Device types and connection types'],
          ['Readiness to use online services', 'B7, B9, R1, R2', 'Ordinal', 'Five-point agreement scale'],
          ['Access to the HOA today', 'S1, S2, S3, F7', 'Ordinal', 'Five-point agreement scale'],
          ['Interest in proposed features', 'F1 to F6', 'Ordinal', 'Five-point likelihood scale'],
          ['Problem groups', 'O1', 'Nominal', 'Thirteen groups, more than one allowed'],
          ['Interview interest', 'IV1', 'Nominal', 'Yes or no'],
          ['Written answers', 'O2, O3', 'Text', 'Counted only'],
        ],
        note: 'Note. Item codes refer to the survey instrument described in the Methodology.',
      },
      {
        kind: 'p',
        text: sentences(
          'Participation was voluntary and open to adults who own, rent, or live in a home in Camella Homes Tibig, and eligibility was confirmed on the first screen of the survey.',
          'The sample is therefore a non-probability, self-selected sample and not a random one.',
          `The sample size is n = ${n}, and ${need('the total number of households in Camella Homes Tibig, so that coverage can be reported')}.`,
          `Responses came from ${coveredPhases.length} of ${phases.length} phases${missingPhases.length ? `, and none came from ${joinAnd(missingPhases)}` : ''}.`,
          'Because respondents were not drawn from a sampling frame, the results describe those who answered and may not apply to every household.',
          'No answer can be traced to a person or a unit, which protects respondents but also prevents the proponents from checking whether one household answered more than once.',
        ),
      },
    ],
  });

  // =========================================================================
  // Methodology
  // =========================================================================
  sections.push({
    id: 'method',
    heading: 'Methodology',
    blocks: [
      {
        kind: 'p',
        text: sentences(
          'Responses were read from the Firestore collection and analyzed with TypeScript functions in the ReCARES administration application, which produced every table and figure in this report.',
          `The functions are deterministic, so the same records always give the same results, and the subset analyzed here is ${lower(meta.periodLabel)}, ${lower(meta.phase)}, and ${lower(meta.resident)}.`,
          'No spreadsheet, Python, or SPSS procedure produced the figures reported here.',
          need('state any additional tool, such as Excel or SPSS, that the proponents used to verify the results'),
          'Because every step is a fixed rule applied to the stored records, another researcher can repeat the analysis from the same data.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'Cleaning followed fixed rules that were applied before any statistic was computed.',
          `Duplicate records were checked by response identifier, and ${duplicates} ${duplicates === 1 ? 'duplicate was' : 'duplicates were'} found.`,
          'Missing values were handled item by item, so a respondent who skipped or was not shown an item was left out of that item only, which explains why the number of answers differs across items.',
          'Answers coded as Not Applicable, 99, or not shown were treated as missing when means and standard deviations were computed.',
          `Rating answers outside the range of 1 to 5 would have been excluded, and ${outOfRange} such ${outOfRange === 1 ? 'answer was' : 'answers were'} found.`,
          'Outliers were not removed because the rating items are bounded and the remaining items are categorical.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'Frequencies and percentages were used for categorical variables because they show how respondents are distributed without assuming an order.',
          'The weighted mean and the sample standard deviation were used for the rating items because the mean gives one comparable figure per item and the standard deviation shows how much residents disagreed with one another.',
          'Percent agreement, the share of scored answers at 4 or 5, was reported beside each mean because a mean can hide a split between high and low answers.',
          'Trend analysis, which counts responses per day and as a running total, was used to show when answers arrived and whether any resident group dominated a period.',
          'Percentages within each phase were used for the problem groups so that a larger phase would not look more affected only because it supplied more respondents.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'Welch t tests compared the mean interest of homeowners and tenants for each of the six features, because the test does not assume equal group sizes or equal variances.',
          'Cohen d was reported with each test to show the practical size of a difference, since statistical significance alone does not say whether a difference matters.',
          'The significance level was set at .05, and the six tests were treated as exploratory, so the stricter threshold of .008 that a Bonferroni adjustment would give is also noted in the results.',
          'Pearson correlation was not used, because the study questions concern group differences and not the relationship between two continuous variables.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'The five-point rating items were interpreted with the scale in Table 3, which divides the range of weighted means into five equal bands.',
          'The same bands were applied to agreement items and to likelihood items, with the verbal labels shown in the table.',
          'A mean in the Neutral band means that answers were mixed or that residents were unsure, and it should not be read as indifference.',
          'The bands were fixed before the data were analyzed so that the interpretation would not change with the results.',
        ),
      },
      {
        kind: 'table',
        label: 'Table 3',
        title: 'Interpretation Scale for Weighted Means',
        head: ['Weighted mean range', 'Agreement items', 'Likelihood items'],
        align: ['c', 'l', 'l'],
        rows: SCALE_RANGES.map(([range, index]) => [range, SCALE_LABELS.agreement[index]!, SCALE_LABELS.likelihood[index]!]),
        note: 'Note. Items are scored from 1 (lowest) to 5 (highest).',
      },
      { kind: 'h3', text: 'Survey System and Interface' },
      {
        kind: 'p',
        text: sentences(
          'The survey was collected through a web application with two sides: a resident side that residents open on a phone or computer, and a superadmin side where the proponents receive, filter, and analyze the answers.',
          'Screens 1 to 8 show the resident side in the order a respondent meets it, from the welcome and consent screens through the survey steps and the review screen to the thank-you screen.',
          'Screens 9 to 14 show the superadmin side that produced the tables and figures in this report.',
          'The screens are shown here, and not in a separate section, because they document how the data were collected and analyzed, which is the purpose of this section.',
        ),
      },
      { kind: 'h3', text: 'Resident Side' },
      ...screenshotBlocks('resident', 1),
      { kind: 'h3', text: 'Superadmin Dashboard Side' },
      ...screenshotBlocks('admin', SCREENSHOTS.filter((x) => x.side === 'resident').length + 1),
    ],
  });

  // =========================================================================
  // Results and Data Presentation (with interpretation after each result)
  // =========================================================================
  const results: Block[] = [];
  results.push({
    kind: 'p',
    text: sentences(
      'This section presents the results in the order of the six analysis questions.',
      'Each table or figure is introduced in the text, shown, and then discussed under the heading Interpretation.',
      'Section 7 draws these separate interpretations together by user group.',
      'Unless a note says otherwise, the source of every table and figure is the Resident Needs Assessment Survey.',
    ),
  });

  // ---- 6.1 profile ----
  const topPhase = [...phases].sort((a, b) => b.count - a.count)[0]!;
  const topResident = residents[0];
  const topGroup = [...byGroup.groups].sort((a, b) => b.sum - a.sum)[0];
  results.push({ kind: 'h3', text: 'Respondent Profile' });
  results.push({
    kind: 'p',
    text: sentences(
      'Table 4 presents the distribution of respondents by phase, resident type, age range, and device.',
      'Figure 1 shows the number of responses received each day, and Figure 2 divides the running total by resident group.',
      'Figure 3 shows the number of responses from each phase.',
      'The table is organized in four panels, and the counts in each panel refer to the same group of respondents.',
      'These descriptive results answer the first analysis question and set the context for every later table.',
    ),
  });
  results.push({
    kind: 'table',
    label: 'Table 4',
    title: 'Frequency and Percentage Distribution of Respondents',
    head: ['Characteristic', 'f', '%'],
    align: ['l', 'r', 'r'],
    rows: [
      { panel: 'Phase' },
      ...bucketRows(phases),
      { panel: 'Resident type' },
      ...bucketRows(residents),
      { panel: 'Age range' },
      ...bucketRows(ages),
      { panel: 'Device used' },
      ...bucketRows(devices),
    ],
    note: `Note. N = ${n}. Percentages are of all respondents and may not sum to 100 because of rounding.`,
  });
  results.push({ kind: 'figure', label: 'Figure 1', title: 'Responses Received per Day', id: 'trend', note: 'Note. Each point is the number of responses submitted on that day.' });
  results.push({ kind: 'figure', label: 'Figure 2', title: 'Running Total of Responses by Resident Group', id: 'byResident', note: 'Note. Resident types were grouped into four groups for readability.' });
  results.push({ kind: 'figure', label: 'Figure 3', title: 'Number of Responses by Phase', id: 'phase', note: `Note. N = ${n}.` });
  results.push({ kind: 'h3', text: 'Interpretation' });
  results.push({
    kind: 'p',
    text: sentences(
      `Table 4 shows that ${n} residents responded, with ${topPhase.label} supplying the most responses (${topPhase.pct}%) and ${topResident ? lower(topResident.label) : 'no resident type'} forming the largest resident group (${topResident?.pct ?? 0}%).`,
      `Homeowners made up ${pc(owners.length, n)}% of respondents and tenants made up ${pc(tenants.length, n)}%.`,
      `Overall, ${phoneShare}% answered on a phone and ${pc(age55, n)}% were aged 55 or older.`,
      'For ReCARES, the share of phone answers suggests that residents are likely to meet the platform on a small screen, which supports the mobile-first design planned under Objective 2.',
      'The age profile matters because the proposal names residents with limited mobility as the group the platform serves most directly, and older residents are more likely to belong to it.',
      missingPhases.length
        ? `No responses came from ${joinAnd(missingPhases)}, so the results say nothing about those areas.`
        : 'All six phases are represented, which gives the results a wider base than a single area would.',
      'A concern is that volunteers may be more connected than other residents, and a high phone share may also reflect that the survey link was shared online.',
    ),
  });
  results.push({
    kind: 'p',
    text: sentences(
      `Figure 1 shows responses arriving over ${days} ${days === 1 ? 'day' : 'days'}${peakDay ? `, with the busiest day on ${peakDay.label} when ${peakDay.count} ${peakDay.count === 1 ? 'response was' : 'responses were'} received` : ''}.`,
      topGroup ? `Figure 2 shows that the group labeled ${lower(topGroup.label)} supplied the largest share of responses (${pc(topGroup.sum, n)}%).` : 'Figure 2 could not be drawn because no resident group was recorded.',
      'Peaks in a trend like this commonly follow outreach, such as a message in a resident group, so they may reflect when the survey was shared and not a change in need.',
      'The mix of resident groups matters for planning, because a group that answers late or rarely may have needs that the early responses do not show.',
      'The proponents should therefore compare later responses with earlier ones before treating the current mix as settled.',
    ),
  });

  // ---- 6.2 access ----
  results.push({ kind: 'h3', text: 'Reaching the HOA Today' });
  results.push({
    kind: 'p',
    text: sentences(
      'Table 5 reports the weighted mean, standard deviation, and percent agreement for the four statements about reaching the HOA.',
      'Figure 4 shows how answers were spread across the five points for each statement.',
      'Items S1, S2, and F7 describe a burden or a hope, so higher agreement signals a stronger need, while item S3 is worded positively, so higher agreement signals a better experience.',
      'Together the statements measure how much effort residents say it takes to deal with the HOA today.',
      'These results answer the second analysis question.',
    ),
  });
  const accessRows = access.filter((r) => r.n > 0);
  results.push({
    kind: 'table',
    label: 'Table 5',
    title: 'Weighted Means for Statements About Reaching the HOA',
    head: ['Statement', 'n', 'M', 'SD', '% agree', 'Verbal interpretation'],
    align: ['l', 'r', 'r', 'r', 'r', 'l'],
    rows: accessRows.map((r) => [`${r.code}. ${r.label}`, String(r.n), fmt(r.meanExact), fmt(r.sd), `${topTwo(r)}%`, verb(r, 'agreement')]),
    note: 'Note. % agree is the share of scored answers at 4 (Agree) or 5 (Strongly Agree). Not Applicable answers are excluded.',
  });
  results.push({ kind: 'figure', label: 'Figure 4', title: 'Distribution of Answers to Statements About Reaching the HOA', id: 'access', note: 'Note. Segments show the share of scored answers at each point.' });
  results.push({ kind: 'h3', text: 'Interpretation' });
  const disabilityS2 = (() => {
    const scores = disability.map((r) => scaleScore((r.answers as Record<string, unknown> | undefined)?.S2)).filter((v): v is number => v != null);
    return scores.length >= 3 ? { m: mean(scores), n: scores.length } : null;
  })();
  results.push({
    kind: 'p',
    text: sentences(
      S1?.n && S2?.n
        ? `Table 5 shows that residents rated the statement on office hours at ${fmt(S1.meanExact)} (${verb(S1, 'agreement')}) and the statement on in-person visits at ${fmt(S2.meanExact)} (${verb(S2, 'agreement')}), with ${topTwo(S1)}% and ${topTwo(S2)}% agreeing.`
        : 'Table 5 shows that the access statements received few answers.',
      S3?.n ? `The positively worded statement on response time averaged ${fmt(S3.meanExact)} (${verb(S3, 'agreement')}), and ${topTwo(S3)}% agreed that concerns are answered in reasonable time.` : '',
      F7?.n ? `Residents rated the statement that a website like ReCARES would solve their problems at ${fmt(F7.meanExact)} (${verb(F7, 'agreement')}).` : '',
      'These results are the resident-side evidence for the problem the proponents observed, namely that the walk-in model and private Facebook messages put the cost of each transaction on the resident.',
      disabilityS2
        ? `Households that reported a disability or mobility limitation (n = ${disabilityS2.n}) rated the in-person visit statement at ${fmt(disabilityS2.m)}, which can be compared with ${S2 ? fmt(S2.meanExact) : NA} for all respondents, although the group is small.`
        : 'The survey did not ask about mobility in a way that allows a reliable comparison for residents who find the office hardest to reach.',
      'This pattern supports the problem identification phase of the design science process (Peffers et al., 2007) and gives Objective 2 a concrete target, which is to reduce the need for office visits.',
      'The statements measure perception and not recorded waiting time or visit counts, so the figures may overstate or understate the actual burden.',
    ),
  });

  // ---- 6.3 readiness ----
  results.push({ kind: 'h3', text: 'Readiness to Use Online Services' });
  results.push({
    kind: 'p',
    text: sentences(
      `Among respondents, ${digital.count} of ${digital.total} (${digital.pct}%) reported both a smartphone, laptop, or tablet and a regular internet connection.`,
      'Table 6 reports the weighted means for the four readiness statements, and Figure 5 shows how answers were distributed.',
      'Readiness was measured in two ways, by whether a resident has the equipment and connection and by how strongly the resident agrees with statements about using an online service.',
      'The device and connection result is given in the text because it combines two separate survey items.',
      'These results answer the third analysis question.',
    ),
  });
  results.push({
    kind: 'table',
    label: 'Table 6',
    title: 'Weighted Means for Readiness to Use Online Services',
    head: ['Statement', 'n', 'M', 'SD', '% agree', 'Verbal interpretation'],
    align: ['l', 'r', 'r', 'r', 'r', 'l'],
    rows: readyRows.map((r) => [`${r.code}. ${r.label}`, String(r.n), fmt(r.meanExact), fmt(r.sd), `${topTwo(r)}%`, verb(r, 'agreement')]),
    note: 'Note. % agree is the share of scored answers at 4 or 5. Not Applicable answers are excluded.',
  });
  results.push({ kind: 'figure', label: 'Figure 5', title: 'Distribution of Answers to Readiness Statements', id: 'readiness', note: 'Note. Segments show the share of scored answers at each point.' });
  results.push({ kind: 'h3', text: 'Interpretation' });
  results.push({
    kind: 'p',
    text: sentences(
      readyRows.length
        ? `Table 6 shows that readiness statements ranged from ${fmt(Math.min(...readyRows.map((r) => r.meanExact)))} to ${fmt(Math.max(...readyRows.map((r) => r.meanExact)))}, and the lowest was "${lower(weakest!.label)}" (${mSd(weakest!)}; ${verb(weakest!, 'agreement')}).`
        : 'Table 6 shows that the readiness statements received few answers.',
      `The device and connection result in the text suggests that access to equipment is ${digital.pct >= 80 ? 'widespread' : digital.pct >= 50 ? 'common but not universal' : 'limited'} among respondents.`,
      'For ReCARES, readiness matters because an unstable connection can lose work in the middle of a form, and doubt about how an ID photo is handled can stop a resident at registration.',
      'Registration with an ID is the step that gives residents access to the rest of the platform, so low comfort at this point would reduce the benefit of every other feature.',
      'These results relate to Objective 1 because accessible design depends on the abilities and confidence of users as well as on the interface, a point that echoes the finding that Philippine government electronic systems are hard to navigate (Majid, 2026).',
      'The respondents who answered online are likely to be more comfortable with technology than residents who did not respond, so true readiness may be lower than these figures suggest.',
    ),
  });

  // ---- 6.4 features ----
  results.push({ kind: 'h3', text: 'Interest in Proposed Features' });
  const featureTests = FEATURE_ITEMS.map((item) => {
    const a = owners.map((r) => scaleScore((r.answers as Record<string, unknown> | undefined)?.[item.code])).filter((v): v is number => v != null);
    const b = tenants.map((r) => scaleScore((r.answers as Record<string, unknown> | undefined)?.[item.code])).filter((v): v is number => v != null);
    return { item, test: welch(a, b), nA: a.length, nB: b.length, mA: a.length ? mean(a) : null, mB: b.length ? mean(b) : null };
  });
  results.push({
    kind: 'p',
    text: sentences(
      'Table 7 ranks the six proposed features by weighted mean likelihood of use, and Figure 6 shows how answers were distributed.',
      'Table 8 compares homeowners and tenants on each feature with a Welch t test, and Figure 7 plots the two group means side by side.',
      'The feature items describe the six services in the initial proposal and ask how likely a resident would be to use each one.',
      'Group differences are tested because the proposal expects homeowners and tenants to need different forms.',
      'These results answer the fourth analysis question.',
    ),
  });
  results.push({
    kind: 'table',
    label: 'Table 7',
    title: 'Weighted Means for Likelihood of Using Proposed Features',
    head: ['Rank', 'Feature', 'n', 'M', 'SD', '% likely', 'Verbal interpretation'],
    align: ['c', 'l', 'r', 'r', 'r', 'r', 'l'],
    rows: rankedFeatures.map((r, i) => [String(i + 1), r.label, String(r.n), fmt(r.meanExact), fmt(r.sd), `${topTwo(r)}%`, verb(r, 'likelihood')]),
    note: 'Note. % likely is the share of scored answers at 4 (Likely) or 5 (Very Likely).',
  });
  results.push({ kind: 'figure', label: 'Figure 6', title: 'Distribution of Answers on Likelihood of Using Each Feature', id: 'features', note: 'Note. Segments show the share of scored answers at each point.' });
  results.push({
    kind: 'table',
    label: 'Table 8',
    title: 'Welch t Test of Feature Interest Between Homeowners and Tenants',
    head: ['Feature', 'Homeowners M (n)', 'Tenants M (n)', 't (df)', 'p', 'd', 'Effect size'],
    align: ['l', 'r', 'r', 'r', 'r', 'r', 'l'],
    rows: featureTests.map(({ item, test, nA, nB, mA, mB }) => [
      item.label,
      mA == null ? NA : `${fmt(mA)} (${nA})`,
      mB == null ? NA : `${fmt(mB)} (${nB})`,
      test ? `${fmt(test.t)} (${fmt(test.df, 1)})` : NA,
      test ? fmtP(test.p).replace('p = ', '').replace('p < ', '< ') : NA,
      test ? fmt(test.d) : NA,
      test ? effectLabel(test.d) : NA,
    ]),
    note: 'Note. d = Cohen d with a pooled standard deviation; a positive d means that homeowners scored higher than tenants. Two-sided tests at the .05 level; a Bonferroni threshold for six tests is .008. n/a means a test could not be computed.',
  });
  results.push({ kind: 'figure', label: 'Figure 7', title: 'Average Likelihood of Using Each Feature by Resident Group', id: 'compare', note: 'Note. Bars show the mean on the five-point scale for homeowners and tenants.' });
  results.push({ kind: 'h3', text: 'Interpretation' });
  const sig = featureTests.filter((f) => f.test && f.test.p < 0.05);
  const strict = featureTests.filter((f) => f.test && f.test.p < 0.008);
  const widest = [...featureTests].filter((f) => f.test).sort((a, b) => Math.abs(b.test!.d) - Math.abs(a.test!.d))[0];
  const divided = rankedFeatures.filter((r) => r.n > 0 && (r.counts[0] + r.counts[1]) / r.n >= 0.25 && (r.counts[3] + r.counts[4]) / r.n >= 0.25);
  results.push({
    kind: 'p',
    text: sentences(
      topFeature && lowFeature
        ? `Table 7 shows that ${ph(topFeature.label)} ranked first (${mSd(topFeature)}; ${verb(topFeature, 'likelihood')}) and ${ph(lowFeature.label)} ranked last (${mSd(lowFeature)}; ${verb(lowFeature, 'likelihood')}).`
        : 'Table 7 shows that the feature items received few answers.',
      topFeature ? `Of those who answered the top item, ${topTwo(topFeature)}% said they were likely or very likely to use it.` : '',
      'Each feature stands for a daily problem, such as waiting at the gate, unclear street closures, paperwork that must be delivered by hand, or slow replies, so a high mean signals that residents expect that problem to be solved online.',
      'These results bear directly on Objective 2, because they allow the proponents to build the highest-ranked features first and to defer the lowest.',
      divided.length
        ? `Opinion was divided on ${joinAnd(divided.map((r) => ph(r.label)))}, where at least a quarter of residents were likely to use the feature and at least a quarter were not, so the mean alone hides a real split.`
        : 'No feature showed a clear split between supporters and opponents.',
      'Mean scores in the Neutral band may also reflect residents who did not understand the feature as described, so the wording of the items is an alternative explanation.',
    ),
  });
  results.push({
    kind: 'p',
    text: sentences(
      sig.length
        ? `Table 8 shows that homeowners and tenants differed significantly on ${joinAnd(sig.map((f) => ph(f.item.label)))} at the .05 level${strict.length ? `, and ${strict.length === sig.length ? 'all of these' : joinAnd(strict.map((f) => ph(f.item.label)))} also passed the stricter .008 threshold` : ', but none passed the stricter .008 threshold'}.`
        : 'Table 8 shows no statistically significant difference between homeowners and tenants on any feature at the .05 level.',
      widest?.test
        ? `The largest difference in practical terms was for ${ph(widest.item.label)}, where d = ${fmt(widest.test.d)} indicates a ${effectLabel(widest.test.d)} effect.`
        : 'Effect sizes could not be computed because one group had too few answers.',
      'Statistical significance only indicates that a difference of this size is unlikely to arise by chance, while Cohen d shows how large the difference is, so the two should be read together.',
      owners.length < 5 || tenants.length < 5
        ? 'One group has fewer than five respondents, so these tests are unreliable and are reported only as a hint.'
        : 'With group sizes of this order, a significant result may still be unstable, and the six tests increase the chance of a false positive.',
      'If the differences hold in a larger sample, ReCARES should give homeowners and tenants separate forms and wording, since the proposal expects tenants to need an owner\'s signature or documents.',
      'Differences could also arise because tenants answered about features they use less often, which is an alternative explanation the survey cannot rule out.',
    ),
  });

  // ---- 6.5 problems ----
  results.push({ kind: 'h3', text: 'Problems Reported by Residents' });
  const topPhaseFor = (id: string) => {
    const row = heat.rows.find((r) => r.id === id);
    if (!row) return NA;
    const best = [...row.cells].filter((c) => c.count >= 2).sort((a, b) => b.pct - a.pct)[0];
    return best ? `${best.phase} (${best.pct}%)` : NA;
  };
  results.push({
    kind: 'p',
    text: sentences(
      'Table 9 lists the twelve problem groups in the open problem discovery question, with the number and percentage of respondents who selected each one.',
      'Figure 8 shows the same ranking as bars, and Figure 9 shows the share of residents in each phase who selected the most reported groups.',
      'The question allowed more than one selection, so the percentages in Table 9 do not add up to 100.',
      'These results answer the fifth analysis question.',
    ),
  });
  results.push({
    kind: 'table',
    label: 'Table 9',
    title: 'Problem Groups Selected by Respondents',
    head: ['Problem group', 'f', '% of respondents', 'Phase with highest share'],
    align: ['l', 'r', 'r', 'l'],
    rows: problems.map((p) => [p.label, String(p.count), `${p.pct}%`, p.count ? topPhaseFor(p.id) : NA]),
    note: `Note. N = ${n}. Respondents could select more than one group. Phase shares are shown only where at least two residents in the phase selected the group.`,
  });
  results.push({ kind: 'figure', label: 'Figure 8', title: 'Most Reported Problem Groups', id: 'problems', note: 'Note. Bars show the percentage of all respondents.' });
  results.push({ kind: 'figure', label: 'Figure 9', title: 'Share of Residents in Each Phase Reporting the Top Problem Groups', id: 'heat', note: 'Note. Cell values are percentages of the respondents in that phase.' });
  results.push({ kind: 'h3', text: 'Interpretation' });
  results.push({
    kind: 'p',
    text: sentences(
      reported.length >= 3
        ? `Table 9 shows that ${anyProblem === n ? 'every' : `${pc(anyProblem, n)}% of`} respondent${anyProblem === n ? '' : 's'} reported at least one problem, and the most common groups were ${joinAnd(reported.slice(0, 3).map((p) => `${lower(p.label)} (${p.pct}%)`))}.`
        : 'Table 9 shows that few problem groups were selected.',
      'Many of these problems concern services that the HOA does not run itself, such as water or power, so residents appear to bring them to the HOA because it is the body closest to them.',
      'The proposal reports that sensitive and routine messages share one private inbox with no categories and no status, which means a recurring problem is hard to see and hard to follow up.',
      'For ReCARES, this supports a categorized request and reporting channel with a visible status, which the HOA board can review for repeated problems.',
      'The platform would record and route a problem such as a water outage but would not fix it, and the proposal should say so to avoid raising expectations.',
      wroteHoa || wroteCommunity
        ? `In addition, ${wroteHoa} respondents wrote about HOA-related problems and ${wroteCommunity} wrote about wider community problems, and reading these answers may reveal issues that the listed groups missed.`
        : 'No respondent used the written questions, so the listed groups may not cover every problem.',
      'Selecting a group shows that a problem exists but not how serious it is, so the percentages should not be read as a ranking of severity.',
    ),
  });
  const clusters = heat.rows
    .map((row) => {
      const best = [...row.cells].filter((c) => c.count >= 2).sort((a, b) => b.pct - a.pct)[0];
      const overall = problems.find((p) => p.id === row.id)?.pct ?? 0;
      return best && best.pct - overall >= 15 ? { label: row.label, phase: best.phase, pct: best.pct, overall } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 3);
  results.push({
    kind: 'p',
    text: sentences(
      clusters.length
        ? `Figure 9 shows that some problems cluster in particular phases: ${joinAnd(clusters.map((c) => `${lower(c.label)} in ${c.phase} (${c.pct}% there against ${c.overall}% overall)`))}.`
        : 'Figure 9 shows no problem that stands out sharply in a single phase.',
      'A cluster suggests that the cause is local, such as a specific stretch of road, a block, or a facility, and not a subdivision-wide matter.',
      'For ReCARES, this supports sending notices to the phase concerned and giving the board a view of problems by phase.',
      'Percentages within a phase rest on small groups, so a single respondent can change a cell noticeably, and the clusters should be treated as leads for follow-up and not as conclusions.',
      'A cluster may also reflect which phases were reached by the survey link and not where problems are worse.',
    ),
  });

  // ---- 6.6 accessibility and additional indicators ----
  results.push({ kind: 'h3', text: 'Accessibility Needs and Additional Indicators' });
  results.push({
    kind: 'p',
    text: sentences(
      'Table 10 reports the share of households that include a member with a disability or mobility limitation, the share of respondents aged 55 or older, and other indicators relevant to planning.',
      'The household item asks about any household member and is self-reported, so it does not identify the type of disability.',
      'The remaining rows show how many respondents were open to an interview and how many used the written questions.',
      'These results answer the sixth analysis question.',
    ),
  });
  results.push({
    kind: 'table',
    label: 'Table 10',
    title: 'Accessibility Needs and Additional Indicators',
    head: ['Indicator', 'f', '%'],
    align: ['l', 'r', 'r'],
    rows: [
      ['Household includes a member with a disability or mobility limitation', String(disability.length), `${pc(disability.length, n)}%`],
      ['Preferred not to say whether the household includes such a member', String(disabilityUnsure), `${pc(disabilityUnsure, n)}%`],
      ['Respondent aged 55 or older', String(age55), `${pc(age55, n)}%`],
      ['Respondent aged 65 or older', String(age65), `${pc(age65, n)}%`],
      ['Open to a follow-up interview', String(interview), `${pc(interview, n)}%`],
      ['Wrote about an HOA-related problem', String(wroteHoa), `${pc(wroteHoa, n)}%`],
      ['Wrote about a wider community problem', String(wroteCommunity), `${pc(wroteCommunity, n)}%`],
    ],
    note: `Note. N = ${n}. Percentages are of all respondents.`,
  });
  results.push({ kind: 'h3', text: 'Interpretation' });
  results.push({
    kind: 'p',
    text: sentences(
      `Table 10 shows that ${disability.length} respondents (${pc(disability.length, n)}%) reported a household member with a disability or mobility limitation, and ${age55} (${pc(age55, n)}%) were aged 55 or older.`,
      'These are the residents for whom a trip to the office is hardest, and the proposal treats them as the group that the platform serves most directly.',
      'Republic Act No. 7277 places a duty on institutions to make services usable by persons with disabilities (Republic of the Philippines, 1992), so these figures define the audience that the accessibility work in Objective 1 must serve.',
      'If the online service is hard to use for the same people who cannot visit the office, it moves the barrier instead of removing it.',
      'Accessibility should therefore be checked continually and not once, as Frandell and Allgood (2026) found that accessibility improved over time through repeated monitoring.',
      `${need('the number of registered persons with disability in Barangay Tibig, obtained from the Barangay Hall, to compare with these survey figures')}.`,
      `In total, ${interview} respondents were open to an interview, which gives the proponents a pool for the qualitative follow-up described in the proposal, although volunteers may differ from other residents.`,
    ),
  });

  sections.push({ id: 'results', heading: 'Results and Data Presentation', pageBreak: true, blocks: results });

  // =========================================================================
  // Data Interpretation (synthesis by user group)
  // =========================================================================
  sections.push({
    id: 'interpretation',
    heading: 'Data Interpretation',
    blocks: [
      {
        kind: 'p',
        text: sentences(
          'Each result above was interpreted directly after it was presented, so this section brings those readings together by the user groups that the platform concerns.',
          'The groups are residents with disabilities or mobility limitations, homeowners and tenants, and HOA staff.',
          'The survey did not ask about violence, and it did not record a location finer than the phase, so it holds no evidence for two groups named in the initial proposal, which are women and children affected by violence and residents living near the perimeter wall.',
          need('confirm whether women and children affected by violence and residents near perimeter walls remain in the study scope after the panel review'),
          'The interpretations below therefore apply only to the groups that the data can describe.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          `For residents with disabilities or mobility limitations, ${pc(disability.length, n)}% of households reported a member in this group, and older residents formed ${pc(age55, n)}% of respondents.`,
          S2?.n ? `The statement on in-person visits averaged ${fmt(S2.meanExact)} (${verb(S2, 'agreement')}), which suggests that the trip to the office is a common burden and may be a larger one for this group.` : '',
          'The platform can respond by allowing requests and documents to be submitted at any hour, by allowing a trusted person to act for a resident, and by following accessibility standards.',
          'The data cannot show which disability types are present, so the proponents should not claim that the platform meets particular needs until it is tested with these residents.',
          'The evidence is consistent with the view that accessible services must be designed and then checked repeatedly (Frandell & Allgood, 2026; Ouaziz et al., 2026).',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          `For homeowners and tenants, the sample contained ${owners.length} homeowners and ${tenants.length} tenants, and the Welch tests in Table 8 ${sig.length ? 'found some differences' : 'found no statistically significant differences'} in feature interest.`,
          'The proposal expects tenants to face extra steps, such as needing an owner\'s documents, so the platform should keep a separate tenant path even where the interest scores are similar.',
          'Tenants are also likely to be the group with the least say in how the HOA operates, which makes their inclusion in later rounds of data gathering important.',
          'Where the groups differ, the difference may reflect how often each group uses a service and not how much it values the feature.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'For HOA staff, the survey measured resident views and not staff workload, so the evidence is indirect.',
          topProblem ? `The problem ranking, led by ${lower(topProblem.label)} (${topProblem.pct}%), shows what residents bring to the HOA, and the proposal reports that staff receive these concerns through one shared inbox without categories.` : '',
          'A categorized channel with status tracking would give staff a clearer queue and give the board a record of repeated problems by phase.',
          need('data on HOA staff and security personnel workload or views, such as interviews, if the panel expects staff to be covered by this analysis'),
          'Until such data exist, claims about benefits to staff should be stated as expectations and not as findings.',
        ),
      },
    ],
  });

  // =========================================================================
  // Summary of Findings
  // =========================================================================
  sections.push({
    id: 'findings',
    heading: 'Summary of Findings',
    pageBreak: true,
    blocks: [
      {
        kind: 'p',
        text: sentences(
          `AQ1 (Objective 3) asked who responded, and ${n} residents answered between ${first} and ${last}.`,
          `They came from ${coveredPhases.length} of ${phases.length} phases${missingPhases.length ? `, with no answers from ${joinAnd(missingPhases)}` : ''}.`,
          `Homeowners formed ${pc(owners.length, n)}% of the sample and tenants ${pc(tenants.length, n)}%.`,
          `A total of ${phoneShare}% of respondents used a phone, and ${pc(age55, n)}% were aged 55 or older.`,
          'The sample is self-selected and its size is ' + sample + '.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'AQ2 (Objectives 1 and 2) asked how burdensome reaching the HOA is.',
          S1?.n ? `The statement on office hours averaged ${fmt(S1.meanExact)} (${verb(S1, 'agreement')}), and ${topTwo(S1)}% agreed.` : '',
          S2?.n ? `The statement on in-person visits averaged ${fmt(S2.meanExact)} (${verb(S2, 'agreement')}), and ${topTwo(S2)}% agreed.` : '',
          S3?.n ? `The statement on response time averaged ${fmt(S3.meanExact)} (${verb(S3, 'agreement')}).` : '',
          F7?.n ? `Agreement that a website like ReCARES would help averaged ${fmt(F7.meanExact)} (${verb(F7, 'agreement')}).` : '',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'AQ3 (Objectives 1 and 2) asked whether residents are ready to use online services.',
          `Overall, ${digital.pct}% of respondents have both a device and an internet connection.`,
          readyRows.length ? `Readiness statements averaged between ${fmt(Math.min(...readyRows.map((r) => r.meanExact)))} and ${fmt(Math.max(...readyRows.map((r) => r.meanExact)))}.` : '',
          weakest ? `The lowest was "${lower(weakest.label)}" at ${fmt(weakest.meanExact)} (${verb(weakest, 'agreement')}).` : '',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'AQ4 (Objective 2) asked which features residents are most likely to use and whether homeowners and tenants differ.',
          topFeature ? `${cap(ph(topFeature.label))} ranked first at ${fmt(topFeature.meanExact)} (${verb(topFeature, 'likelihood')}).` : '',
          lowFeature ? `${cap(ph(lowFeature.label))} ranked last at ${fmt(lowFeature.meanExact)} (${verb(lowFeature, 'likelihood')}).` : '',
          sig.length ? `Homeowners and tenants differed significantly on ${joinAnd(sig.map((f) => ph(f.item.label)))}.` : 'Homeowners and tenants did not differ significantly on any feature.',
          'These tests are exploratory.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'AQ5 (Objective 2) asked which problems residents report and where.',
          `Overall, ${pc(anyProblem, n)}% of respondents reported at least one problem.`,
          topProblem ? `The most frequent group was ${lower(topProblem.label)} (${topProblem.pct}%).` : '',
          clusters.length ? `Some problems clustered by phase, for example ${lower(clusters[0]!.label)} in ${clusters[0]!.phase}.` : 'No problem clustered strongly in one phase.',
          `In addition, ${wroteHoa + wroteCommunity} written answers were given.`,
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'AQ6 (Objectives 1 and 3) asked how many households need accessible services.',
          `A total of ${pc(disability.length, n)}% of households reported a member with a disability or mobility limitation.`,
          `In addition, ${pc(age55, n)}% of respondents were aged 55 or older, and ${pc(age65, n)}% were aged 65 or older.`,
          `Another ${disabilityUnsure} respondents preferred not to answer the household question.`,
        ),
      },
    ],
  });

  // =========================================================================
  // Conclusions
  // =========================================================================
  sections.push({
    id: 'conclusions',
    heading: 'Conclusions',
    blocks: [
      {
        kind: 'p',
        text: sentences(
          `On AQ1, the survey reached ${n} residents from ${coveredPhases.length} phases, which is enough to describe the respondents but not to speak for every household.`,
          missingPhases.length ? `The absence of ${joinAnd(missingPhases)} is a gap in coverage.` : 'Every phase is represented, although the amount of data differs by phase.',
          'The mix of homeowners and tenants shows that both groups were reached.',
          'The conclusion for Objective 3 is that the HOA can use these results as a starting point and not as a final measure.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'On AQ2, the data suggest that reaching the HOA carries a real cost for a considerable share of respondents.',
          S2?.n ? `Agreement that visits are required even for simple matters was ${topTwo(S2)}%.` : '',
          'This supports the proponents\' claim that the walk-in model is a problem worth solving, within the limits of a perception survey.',
          'The conclusion for Objectives 1 and 2 is that reducing the need for in-person visits is a justified target.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'On AQ3, most respondents can reach an online service, but confidence is uneven across the readiness items.',
          weakest ? `The weakest item, "${lower(weakest.label)}", marks the first barrier to address.` : '',
          'The conclusion for Objective 1 is that access to equipment is not the main obstacle, while connection quality and trust in ID handling need design attention.',
          'These readiness figures come from residents who chose to answer online, so they may be optimistic.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'On AQ4, residents expressed a clear order of preference among the proposed features.',
          topFeature && secondFeature ? `${cap(ph(topFeature.label))} and ${ph(secondFeature.label)} lead the ranking.` : '',
          sig.length ? 'Some differences between homeowners and tenants reached significance, but they need confirmation in a larger sample.' : 'No difference between homeowners and tenants reached significance in this sample.',
          'The conclusion for Objective 2 is that the feature list can be ordered by resident interest.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'On AQ5, residents report a wide range of everyday problems, and some appear concentrated in particular phases.',
          topProblem ? `${topProblem.label} is the most frequently reported group.` : '',
          'Most of these problems lie outside the direct control of the HOA, so the platform can improve how problems are recorded and followed but cannot resolve them alone.',
          'The conclusion for Objective 2 is that a categorized reporting and tracking channel is supported by the data.',
        ),
      },
      {
        kind: 'p',
        text: sentences(
          'On AQ6, a meaningful share of households include a member with a disability or mobility limitation, and many respondents are older adults.',
          'This supports the proposal\'s view that accessibility is central to the platform and not an optional extra.',
          'The survey cannot identify disability types or confirm that any design meets particular needs.',
          'The conclusion for Objectives 1 and 3 is that accessibility testing with these residents is required before the platform is proposed to the HOA as ready.',
        ),
      },
    ],
  });

  // =========================================================================
  // Recommendations
  // =========================================================================
  const rec = (k: number, text: string): Block => ({ kind: 'p', text: `Recommendation ${k}. ${text}` });
  sections.push({
    id: 'recommendations',
    heading: 'Recommendations',
    blocks: [
      rec(
        1,
        sentences(
          topFeature && secondFeature
            ? `The proponents should build ${ph(topFeature.label)} and ${ph(secondFeature.label)} first.`
            : 'The proponents should order the feature list by the ranking in Table 7.',
          'This follows from the ranking of likelihood of use in Table 7.',
          'Lower-ranked features should be deferred or tested early, especially where Figure 6 shows divided opinion.',
          'The ranking should be rechecked once a larger sample is available.',
        ),
      ),
      rec(
        2,
        sentences(
          'The proponents should design ReCARES for phones first, with short forms, camera upload for ID photos, large text, and easy-to-tap controls.',
          `This follows from the finding that ${phoneShare}% of respondents answered on a phone (Table 4).`,
          'No app installation should be required.',
          'Usability testing should be done on low-cost phones and slow connections.',
        ),
      ),
      rec(
        3,
        sentences(
          'The proponents should let residents submit requests and documents at any hour and show a status for each request.',
          S2?.n ? `This follows from the finding that ${topTwo(S2)}% agreed that in-person visits are required even for simple matters (Table 5).` : 'This follows from the access results in Table 5.',
          'A resident should also be able to name a trusted person to act for them.',
          'The effect can be checked later by comparing office visits before and after launch.',
        ),
      ),
      rec(
        4,
        sentences(
          weakest ? `The proponents should address "${lower(weakest.label)}" before launch.` : 'The proponents should address the weakest readiness item before launch.',
          'This follows from the readiness results in Table 6.',
          'Forms should save progress as residents type, and a plain privacy notice should explain who sees an ID, why, and when it is deleted.',
          'An in-person option should remain for residents who prefer it, and a named person, not the system, should make the final decision on any ID.',
        ),
      ),
      rec(
        5,
        sentences(
          'The proponents should provide one categorized channel for resident problems, with notices that can be sent to a single phase.',
          topProblem ? `This follows from the finding that ${lower(topProblem.label)} was the most reported group (Table 9) and from the clusters in Figure 9.` : 'This follows from the problem results in Table 9.',
          'The HOA board should receive a view of repeated problems by category and phase.',
          'The platform description should state that it records and routes problems and does not repair services.',
        ),
      ),
      rec(
        6,
        sentences(
          'The proponents should test ReCARES with residents who have disabilities or mobility limitations and with older residents.',
          `This follows from the finding that ${pc(disability.length, n)}% of households reported such a member and ${pc(age55, n)}% of respondents were aged 55 or older (Table 10).`,
          'Accessibility should be checked at several points during development and not once at the end.',
          'The Barangay Hall of Tibig should be asked for the count of registered persons with disability to place these figures in context.',
        ),
      ),
      rec(
        7,
        sentences(
          missingPhases.length
            ? `The proponents should reach residents in ${joinAnd(missingPhases)} and other under-represented groups before the feature list is final.`
            : 'The proponents should extend the survey to under-represented groups before the feature list is final.',
          'This follows from the coverage shown in Table 4 and Figure 3.',
          `The ${interview} residents who are open to an interview should be used to explore why residents answered as they did.`,
          'A larger and more varied sample would also allow the Welch tests in Table 8 to be repeated with more confidence.',
        ),
      ),
    ],
  });

  // =========================================================================
  // Limitations (bullets allowed)
  // =========================================================================
  sections.push({
    id: 'limitations',
    heading: 'Limitations',
    blocks: [
      {
        kind: 'p',
        text: 'The following boundaries apply to the findings in this report.',
      },
      {
        kind: 'bullets',
        items: [
          `The sample is ${sample} (n = ${n}) and self-selected, so the results describe respondents and not all households.`,
          missingPhases.length
            ? `No responses came from ${joinAnd(missingPhases)}, so the results do not describe those phases.`
            : 'Responses per phase are uneven, so phase comparisons rest on small groups.',
          `The total number of households was not available, so coverage could not be calculated ${need('the total number of households in Camella Homes Tibig, so that coverage can be reported')}.`,
          'All answers are self-reported perceptions, and none was checked against HOA records such as visit logs or request counts.',
          'Ratings were summarized with means, which treat ordinal answers as equally spaced, so the means should be read with the percent agreement and the answer distributions.',
          'The Welch tests were exploratory, used small groups, and were run six times without a formal correction, so the p values should be read with caution.',
          'The survey did not ask about violence and did not record a location below the phase, so it holds no evidence on women and children affected by violence or on residents near the perimeter wall.',
          'The household disability item does not identify the type of disability or the member concerned.',
          'HOA staff and security personnel were not surveyed, so benefits to staff are expectations and not findings.',
          'The analysis did not measure actual use of any feature, because the platform has not yet been built.',
        ],
      },
    ],
  });

  return { sections, needed, sampleSize: n };
}

// ---- references ---------------------------------------------------------------

export interface RefPart {
  text: string;
  italic?: boolean;
}

/** Only works cited in the text, taken from the reference list of the initial proposal. */
export const REFERENCES: RefPart[][] = [
  [
    { text: 'Frandell, A., & Allgood, M. (2026). Breaking barriers: Evaluating accessibility in local government online platforms for individuals with disabilities. ' },
    { text: 'Government Information Quarterly, 43', italic: true },
    { text: ', Article 102111. https://doi.org/10.1016/j.giq.2026.102111' },
  ],
  [
    { text: 'Jordanoski, Z., & Meyerhoff Nielsen, M. (2023). The challenge of web accessibility: An evaluation of selected government websites and service portals of high, middle and low-income countries. In ' },
    { text: 'Proceedings of the 16th International Conference on Theory and Practice of Electronic Governance', italic: true },
    { text: ' (pp. 101-110). Association for Computing Machinery. https://doi.org/10.1145/3614321.3614343' },
  ],
  [
    { text: 'Majid, A. (2026). An evaluation of the accessibility of electronic based government systems for persons with disabilities: Case studies in Indonesia, the Philippines, and Dubai. ' },
    { text: 'Journal of Governance and Administrative Reform, 7', italic: true },
    { text: '(1), 18-28. https://doi.org/10.20473/jgar.v7i1.68784' },
  ],
  [
    { text: 'Ouaziz, M. R., Cheikhi, L., Idri, A., & Abran, A. (2026). Accessibility in e-government portals: A systematic mapping study. ' },
    { text: 'International Journal of Electrical and Computer Engineering, 16', italic: true },
    { text: '(1), 357-372. https://doi.org/10.11591/ijece.v16i1.pp357-372' },
  ],
  [
    { text: 'Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. ' },
    { text: 'Journal of Management Information Systems, 24', italic: true },
    { text: '(3), 45-77. https://doi.org/10.2753/MIS0742-1222240302' },
  ],
  [
    { text: 'Republic of the Philippines. (1992). ' },
    { text: 'Magna Carta for Disabled Persons (Republic Act No. 7277)', italic: true },
    { text: '. Congress of the Philippines.' },
  ],
];
