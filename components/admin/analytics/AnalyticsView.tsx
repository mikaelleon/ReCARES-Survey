'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, FileText, Minus, Monitor, Sparkles, Smartphone, Users, Wifi, Handshake, Star } from 'lucide-react';
import { downloadReportDocx } from '@/lib/admin/downloadDocx';
import { AnalyticsDocument } from '@/components/admin/analytics/AnalyticsDocument';
import { EvidenceSummaryView } from '@/components/admin/analytics/EvidenceSummaryView';
import { buildEvidenceSummary } from '@/lib/admin/evidence';
import { buildInterpretation } from '@/lib/admin/interpretation';
import { GroupCompare } from '@/components/admin/analytics/GroupCompare';
import { Heatmap } from '@/components/admin/analytics/Heatmap';
import { ColumnChart } from '@/components/admin/analytics/ColumnChart';
import { ScaleBars } from '@/components/admin/analytics/ScaleBars';
import { StackedArea } from '@/components/admin/analytics/StackedArea';
import { TrendChart } from '@/components/admin/analytics/TrendChart';
import { HorizontalBars } from '@/components/admin/charts/HorizontalBars';
import { PieChart } from '@/components/admin/charts/PieChart';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { PageTitle } from '@/components/admin/PageTitle';
import { ChartSkeleton, StatSkeleton } from '@/components/ui/Skeleton';
import { computeKpis } from '@/lib/admin/analytics';
import {
  ACCESS_ITEMS,
  FEATURE_ITEMS,
  READINESS_ITEMS,
  ageBuckets,
  averageFeatureInterest,
  dailySeries,
  deviceBuckets,
  featureByResidentGroup,
  highlightLines,
  interviewShare,
  phaseBuckets,
  residentSeries,
  problemRanking,
  problemsByPhase,
  residentBuckets,
  scaleRows,
} from '@/lib/admin/dataAnalytics';
import {
  DEFAULT_DATE_RANGE,
  countInBounds,
  formatRangeLabel,
  filterRecordsByDateRange,
  loadStoredDateRange,
  previousPeriodBounds,
  resolveDateBounds,
  storeDateRange,
  type DateRangeValue,
} from '@/lib/admin/dateRange';
import { digitalFeasibility } from '@/lib/admin/extendedWidgets';
import { PHASE_OPTIONS } from '@/lib/admin/sampleResponses';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

type TabId = 'overview' | 'insights' | 'features' | 'access' | 'problems' | 'people';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'insights', label: 'Interpretation' },
  { id: 'features', label: 'Features' },
  { id: 'access', label: 'Access and readiness' },
  { id: 'problems', label: 'Problems' },
  { id: 'people', label: 'Respondents' },
];

function Card({
  title,
  hint,
  className = '',
  loading,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={`dash-insight an-card ${className}`.trim()} aria-label={title}>
      <header className="dash-insight__head">
        <h2 className="dash-insight__title">{title}</h2>
        {hint ? <p className="an-card__hint">{hint}</p> : null}
      </header>
      <div className="dash-insight__body">{loading ? <ChartSkeleton height={160} /> : children}</div>
    </article>
  );
}

function Kpi({
  icon,
  label,
  value,
  caption,
  trend,
  hero = false,
  empty,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
  trend?: string | null;
  hero?: boolean;
  empty: boolean;
}) {
  const direction = trend?.startsWith('+') ? 'up' : trend?.startsWith('-') ? 'down' : 'flat';
  return (
    <div className={`an-kpi${hero ? ' an-kpi--hero' : ''}`}>
      <div className="an-kpi__top">
        <span className="an-kpi__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="an-kpi__label">{label}</span>
      </div>
      <div className="an-kpi__value">{empty ? '—' : value}</div>
      <div className="an-kpi__foot">
        <span>{caption}</span>
        {trend ? (
          <span className={`an-kpi__trend an-kpi__trend--${direction}`}>
            {direction === 'up' ? <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" /> : direction === 'down' ? <ArrowDownRight size={13} strokeWidth={2.4} aria-hidden="true" /> : <Minus size={13} strokeWidth={2.4} aria-hidden="true" />}
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AnalyticsView({
  records,
  status,
  source,
  usingDemoSample,
  allowed,
}: {
  records: SampleRecord[];
  status: 'loading' | 'ready' | 'error';
  source: string;
  usingDemoSample: boolean;
  allowed: boolean;
}) {
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [phase, setPhase] = useState('all');
  const [resident, setResident] = useState('all');
  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    setDateRange(loadStoredDateRange());
  }, []);

  const ranged = useMemo(() => filterRecordsByDateRange(records, dateRange), [records, dateRange]);
  const residentOptions = useMemo(() => residentBuckets(ranged).map((b) => b.label), [ranged]);
  const filtered = useMemo(
    () =>
      ranged.filter(
        (r) => (phase === 'all' || r.phase === phase) && (resident === 'all' || r.resident === resident),
      ),
    [ranged, phase, resident],
  );

  const loading = status === 'loading';
  const empty = !loading && status !== 'error' && filtered.length === 0;
  const filtering = phase !== 'all' || resident !== 'all';

  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const series = useMemo(() => dailySeries(filtered), [filtered]);
  const byResident = useMemo(() => residentSeries(filtered), [filtered]);
  const digital = useMemo(() => digitalFeasibility(filtered), [filtered]);
  const interest = useMemo(() => averageFeatureInterest(filtered), [filtered]);
  const interview = useMemo(() => interviewShare(filtered), [filtered]);
  const devices = useMemo(() => deviceBuckets(filtered), [filtered]);
  const phases = useMemo(() => phaseBuckets(filtered), [filtered]);
  const ages = useMemo(() => ageBuckets(filtered), [filtered]);
  const residents = useMemo(() => residentBuckets(filtered), [filtered]);
  const problems = useMemo(
    () =>
      problemRanking(filtered)
        .filter((p) => p.count > 0)
        .slice(0, 8)
        .map((p) => ({ label: p.label, count: p.count, pct: p.pct })),
    [filtered],
  );
  const heat = useMemo(() => problemsByPhase(filtered), [filtered]);
  const compare = useMemo(() => featureByResidentGroup(filtered), [filtered]);
  const featureRows = useMemo(() => scaleRows(filtered, FEATURE_ITEMS), [filtered]);
  const accessRows = useMemo(() => scaleRows(filtered, ACCESS_ITEMS), [filtered]);
  const readinessRows = useMemo(() => scaleRows(filtered, READINESS_ITEMS), [filtered]);
  const rangeLabel = useMemo(() => formatRangeLabel(dateRange), [dateRange]);
  const interpretation = useMemo(() => buildInterpretation(filtered, rangeLabel), [filtered, rangeLabel]);
  const evidence = useMemo(() => buildEvidenceSummary(filtered), [filtered]);
  const highlights = useMemo(() => highlightLines(filtered, kpis.last7DaysCount), [filtered, kpis.last7DaysCount]);

  const periodTrend = useMemo(() => {
    if (source !== 'firestore' || usingDemoSample || filtering) return null;
    const prev = previousPeriodBounds(dateRange);
    const cur = resolveDateBounds(dateRange);
    if (!prev || cur.startMs == null || cur.endMs == null) return null;
    const now = countInBounds(records, cur.startMs, cur.endMs);
    const before = countInBounds(records, prev.startMs, prev.endMs);
    if (now === 0 && before === 0) return null;
    const delta = now - before;
    return delta === 0 ? 'Same as before' : delta > 0 ? `+${delta} vs prior period` : `${delta} vs prior period`;
  }, [records, dateRange, source, usingDemoSample, filtering]);

  const reportMeta = useMemo(
    () => ({
      periodLabel: rangeLabel,
      phase: phase === 'all' ? 'All phases' : phase,
      resident: resident === 'all' ? 'All residents' : resident,
      generated: new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
    }),
    [rangeLabel, phase, resident],
  );
  const [wordBusy, setWordBusy] = useState(false);
  const [wordError, setWordError] = useState('');

  const downloadWord = async () => {
    setWordBusy(true);
    setWordError('');
    try {
      await downloadReportDocx(filtered, reportMeta);
    } catch {
      setWordError('The Word file could not be created. Try again, or use Download PDF.');
    } finally {
      setWordBusy(false);
    }
  };

  const downloadPdf = () => {
    const previous = document.title;
    document.title = `ReCARES-Data-Analytics-${new Date().toISOString().slice(0, 10)}`;
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.requestAnimationFrame(() => window.print());
  };

  if (!allowed) {
    return (
      <section className="dash-page an-page" aria-labelledby="admin-analytics-title">
        <p className="na-error" role="alert">
          You do not have permission to view analytics. Ask a superadmin if you need access.
        </p>
      </section>
    );
  }

  return (
    <section className="dash-page an-page" aria-labelledby="admin-analytics-title">
      <div className="dash-page__header">
        <div>
          <PageTitle pageId="admin-analytics-title">Data Analytics</PageTitle>
          <p className="an-page__sub">Charts that compare, rank, and track survey answers. Use the filters to focus on a group.</p>
        </div>
        <div className="dash-page__tools" aria-label="Analytics filters">
          <div className="dash-page__filter-open">
            <DateRangePicker
              value={dateRange}
              onChange={(next) => {
                setDateRange(next);
                storeDateRange(next);
              }}
            />
          </div>
          <button
            type="button"
            className="an-download"
            onClick={downloadPdf}
            disabled={loading || filtered.length === 0}
            title="Opens the print dialog. Choose Save as PDF."
          >
            <Download size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className="an-download an-download--secondary"
            onClick={downloadWord}
            disabled={loading || filtered.length === 0 || wordBusy}
            title="Downloads an editable Word file (.docx)"
          >
            <FileText size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>{wordBusy ? 'Preparing…' : 'Download Word (.docx)'}</span>
          </button>
          {wordError ? (
            <p className="na-error" role="alert">
              {wordError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="an-filters" role="group" aria-label="Narrow the data">
        <label className="an-filter">
          <span>Phase</span>
          <select value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="all">All phases</option>
            {PHASE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="an-filter">
          <span>Resident type</span>
          <select value={resident} onChange={(e) => setResident(e.target.value)}>
            <option value="all">All residents</option>
            {residentOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        {filtering ? (
          <button
            type="button"
            className="an-filters__reset"
            onClick={() => {
              setPhase('all');
              setResident('all');
            }}
          >
            Reset filters
          </button>
        ) : null}
        <p className="an-filters__count" aria-live="polite">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'response' : 'responses'} in view`}
        </p>
      </div>

      {status === 'error' && !usingDemoSample ? (
        <p className="na-error" role="alert">
          Could not load live responses from Firestore. Charts stay empty until the query succeeds.
        </p>
      ) : null}
      {usingDemoSample ? (
        <p className="na-error" role="status">
          Demo sample mode (?demo=sample). Not live Firestore data.
        </p>
      ) : null}

      <div className="an-top">
        <aside className="an-highlights" aria-label="Highlights">
          <h2>
            <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" /> Highlights
          </h2>
          {loading ? (
            <p>Loading…</p>
          ) : highlights.length === 0 ? (
            <p>Highlights appear once responses come in.</p>
          ) : (
            <ul>
              {highlights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </aside>

        {loading ? (
          <StatSkeleton count={4} />
        ) : (
          <div className="an-kpis">
            <Kpi hero icon={<Users size={18} strokeWidth={2.2} />} label="Responses" value={String(kpis.total)} caption={`${kpis.last7DaysCount} in the last 7 days`} trend={periodTrend} empty={empty} />
            <Kpi icon={<Wifi size={18} strokeWidth={2.2} />} label="Digital-ready" value={`${digital.pct}%`} caption={`${digital.count} of ${digital.total} have a device and internet`} empty={empty} />
            <Kpi icon={<Star size={18} strokeWidth={2.2} />} label="Feature interest" value={interest.n ? `${interest.mean.toFixed(1)} / 5` : '—'} caption="Average likelihood to use a feature" empty={empty} />
            <Kpi icon={<Handshake size={18} strokeWidth={2.2} />} label="Open to interview" value={`${interview.pct}%`} caption={`${interview.yes} said yes`} empty={empty} />
          </div>
        )}
      </div>

      <div className="an-tabs" role="tablist" aria-label="Analytics sections">
        {TABS.map((t, index) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`an-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`an-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="an-tabs__btn"
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!delta) return;
              e.preventDefault();
              const next = TABS[(index + delta + TABS.length) % TABS.length]!;
              setTab(next.id);
              document.getElementById(`an-tab-${next.id}`)?.focus();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="an-grid an-panel" role="tabpanel" id={`an-panel-${tab}`} aria-labelledby={`an-tab-${tab}`}>
        {tab === 'overview' ? (
          <>
            <Card title="Responses over time" hint="Daily submissions, or the running total." className="an-span-8" loading={loading}>
              <TrendChart points={series} />
            </Card>
            <Card title="Device used" hint="Phone or computer at submission." className="an-span-4" loading={loading}>
              <PieChart buckets={devices} />
              <p className="an-card__note">
                <Smartphone size={14} aria-hidden="true" /> / <Monitor size={14} aria-hidden="true" /> Phone-first answers mean the online service must work well on small screens.
              </p>
            </Card>
            <Card title="Responses by resident type" hint="Who is answering over time, one colour per group." className="an-span-12" loading={loading}>
              <StackedArea series={byResident} />
            </Card>
            <Card title="Responses by phase" hint="Where answers come from." className="an-span-12" loading={loading}>
              <ColumnChart buckets={phases} />
            </Card>
          </>
        ) : null}

        {tab === 'insights' ? (
          <div className="an-span-12 an-prose">
            <p className="an-prose__note">{interpretation.sampleNote}</p>
            <article className="dash-insight an-card an-prose__card an-prose__card--evidence">
              <h2 className="dash-insight__title">Summary: what each chart proves</h2>
              <EvidenceSummaryView summary={evidence} />
            </article>
            {interpretation.sections.map((section) => (
              <article key={section.id} className="dash-insight an-card an-prose__card">
                <h2 className="dash-insight__title">{section.title}</h2>
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {section.bullets?.length ? (
                  <ul>
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {tab === 'features' ? (
          <>
            <Card title="Which features residents want" hint="Share of answers, from very unlikely to very likely." className="an-span-7" loading={loading}>
              <ScaleBars rows={featureRows} kind="likelihood" />
            </Card>
            <Card title="Homeowners and tenants compared" hint="Average likelihood to use each feature, out of 5." className="an-span-5" loading={loading}>
              <GroupCompare rows={compare.rows} homeownerCount={compare.homeownerCount} tenantCount={compare.tenantCount} />
            </Card>
          </>
        ) : null}

        {tab === 'access' ? (
          <>
            <Card title="Reaching the HOA today" hint="Agreement with each statement." className="an-span-6" loading={loading}>
              <ScaleBars rows={accessRows} kind="agreement" />
            </Card>
            <Card title="Readiness for online services" hint="Comfort with devices, internet, and ID upload." className="an-span-6" loading={loading}>
              <ScaleBars rows={readinessRows} kind="agreement" />
            </Card>
          </>
        ) : null}

        {tab === 'problems' ? (
          <>
            <Card title="Most reported problems" hint="Share of residents who chose each group." className="an-span-5" loading={loading}>
              <HorizontalBars buckets={problems} wrapLabels />
            </Card>
            <Card title="Problems by phase" hint="Share of each phase reporting the top problems." className="an-span-7" loading={loading}>
              <Heatmap phases={heat.phases} rows={heat.rows} max={heat.max} />
            </Card>
          </>
        ) : null}

        {tab === 'people' ? (
          <>
            <Card title="Resident type" className="an-span-6" loading={loading}>
              <HorizontalBars buckets={residents} wrapLabels />
            </Card>
            <Card title="Age range" className="an-span-6" loading={loading}>
              <ColumnChart buckets={ages} />
            </Card>
          </>
        ) : null}
      </div>
      <AnalyticsDocument records={filtered} meta={reportMeta} />
    </section>
  );
}
