import { AnalyticsCharts, BarList, DateRangeSelector, ExportButton } from "@/app/admin/_components/analytics-ui";
import { PageHeader, Panel, StatCard } from "@/app/admin/_components/ui";
import { buildReport, percentChange } from "@/lib/admin/analytics";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Settings } from "@/lib/db/models";
import { formatNumber } from "@/lib/format";
import { BarChart3, Download, Eye, FileText, MailPlus, Newspaper, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPage();
  const params = await searchParams;
  const query = { range: param(params.range), from: param(params.from), to: param(params.to), granularity: param(params.granularity) };
  const [report, settings] = await Promise.all([buildReport(query, 20), Settings.findOne({ key: "main" }).select("analytics").lean()]);
  const { totals, previousTotals } = report;
  const firstPartyOn = settings?.analytics?.firstPartyEnabled ?? true;
  const gaId = settings?.analytics?.gaMeasurementId ?? "";
  const rangeParams: Record<string, string> =
    report.range.preset === "custom" ? { from: report.range.from, to: report.range.to } : { range: report.range.preset };
  const exportHref = `/api/admin/analytics/export?from=${report.range.from}&to=${report.range.to}`;

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Analytics & reports"
        description={`${report.range.from} → ${report.range.to} (${report.dayCount} days), compared with ${report.previous.from} → ${report.previous.to}.`}
        actions={<ExportButton href={exportHref} />}
      />
      {!firstPartyOn && (
        <p role="alert" className="mb-6 rounded-[4px] border border-destructive/40 bg-destructive/[0.1] p-4 text-sm text-destructive dark:text-destructive">
          First-party analytics is turned off in Settings, so no new visits are being recorded.
        </p>
      )}

      <DateRangeSelector
        basePath="/admin/analytics"
        preset={report.range.preset}
        from={report.range.from}
        to={report.range.to}
        granularity={report.granularity}
        rangeParams={rangeParams}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard label="Page views" value={formatNumber(totals.pageview)} icon={Eye} trend={percentChange(totals.pageview, previousTotals.pageview)} hint={`prev. ${formatNumber(previousTotals.pageview)}`} />
        <StatCard
          label="Unique visitors (daily, summed)"
          value={formatNumber(totals.visitor)}
          icon={Users}
          trend={percentChange(totals.visitor, previousTotals.visitor)}
          hint={`prev. ${formatNumber(previousTotals.visitor)}`}
        />
        <StatCard
          label="Contact conversion"
          value={report.conversionRate !== null ? `${report.conversionRate.toFixed(1)}%` : "—"}
          icon={MailPlus}
          hint={`${totals.contacts} message${totals.contacts === 1 ? "" : "s"} ÷ visitors`}
        />
        <StatCard label="Project views" value={formatNumber(totals.project_view)} icon={FileText} trend={percentChange(totals.project_view, previousTotals.project_view)} hint={`prev. ${formatNumber(previousTotals.project_view)}`} />
        <StatCard label="Article views" value={formatNumber(totals.post_view)} icon={Newspaper} trend={percentChange(totals.post_view, previousTotals.post_view)} hint={`prev. ${formatNumber(previousTotals.post_view)}`} />
        <StatCard label="CV downloads" value={formatNumber(totals.cv_download)} icon={Download} trend={percentChange(totals.cv_download, previousTotals.cv_download)} hint={`prev. ${formatNumber(previousTotals.cv_download)}`} />
      </div>

      <AnalyticsCharts totals={totals} series={report.series} granularity={report.granularity} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Popular pages">
          <BarList items={report.pages} linkable />
        </Panel>
        <Panel title="Popular projects">
          <BarList items={report.projects} linkable empty="No project views in this period." />
        </Panel>
        <Panel title="Popular articles">
          <BarList items={report.posts} linkable empty="No article views in this period." />
        </Panel>
        <Panel title="Traffic sources" description="Referrer of the first page in each visit">
          <BarList items={report.referrers} />
        </Panel>
        <Panel title="Countries" description="New daily visitors by country">
          <BarList items={report.countries} empty="No location data. Country comes from Vercel’s x-vercel-ip-country header in production." />
        </Panel>
        <Panel title="Where these numbers come from">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Calculated by this application</strong> (first-party, cookie-less, stored as daily totals): page views,
              daily unique visitors, project and article views, traffic sources, countries and CV downloads. Bots and visitors sending Do-Not-Track or
              Global Privacy Control are not counted.
            </li>
            <li>
              <strong className="text-foreground">Unique visitors</strong> are counted per day with a salted hash that rotates daily, so the same person on
              two days counts twice. The range total is the sum of daily uniques.
            </li>
            <li>
              <strong className="text-foreground">Contact messages</strong> come from the inbox (spam excluded).
            </li>
            <li>
              <strong className="text-foreground">Provider-supplied:</strong> Vercel Web Analytics and Speed Insights (view in the Vercel dashboard)
              {gaId ? <> and Google Analytics 4 ({gaId}, view in GA)</> : <>; Google Analytics 4 is optional and not configured</>}. Their numbers are
              measured differently and will not match these exactly.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
