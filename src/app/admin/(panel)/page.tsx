import { BarList } from "@/app/admin/_components/analytics-ui";
import { RangePicker } from "@/app/admin/_components/range-picker";
import { TrafficChart } from "@/app/admin/_components/charts";
import { SetupChecklist, type ChecklistItem } from "@/app/admin/_components/setup-checklist";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { buildReport, percentChange } from "@/lib/admin/analytics";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { STATUS_FILTERS } from "@/lib/analytics/status";
import { ONLINE_WINDOW_MS } from "@/lib/constants";
import { getSiteSettings, visiblePostFilter } from "@/lib/content/public";
import { pingDB } from "@/lib/db/connect";
import { ActivityLog, Education, Experience, Faq, Media, Message, Page, Post, Profile, Project, Service, Skill, Testimonial, Visitor } from "@/lib/db/models";
import { formatNumber, relativeTime } from "@/lib/format";
import {
  BookOpenText,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Globe,
  ImagePlus,
  Inbox,
  LayoutTemplate,
  MailPlus,
  PenSquare,
  Plus,
  Radio,
  Send,
  UserRound,
  Users,
  UsersRound,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await adminPage();
  const params = await searchParams;
  const report = await buildReport({ range: param(params.range), from: param(params.from), to: param(params.to) }, 5);

  const [contentCounts, projectsTotal, projectsPublished, postsTotal, postsLive, unread, pending, activity, db, checks, online, leads] = await Promise.all([
    Promise.all([
      Service.countDocuments({ status: "active" }),
      Testimonial.countDocuments({ status: "active" }),
      Faq.countDocuments({ status: "active" }),
      Page.countDocuments({ status: "published" }),
      Skill.countDocuments({ status: "active" }),
      Experience.countDocuments({ status: "active" }),
      Education.countDocuments({ status: "active" }),
      Media.countDocuments(),
    ]),
    Project.countDocuments(),
    Project.countDocuments({ status: "published" }),
    Post.countDocuments(),
    Post.countDocuments(visiblePostFilter()),
    Message.countDocuments({ read: false, status: { $in: ["pending", "replied"] } }),
    Message.countDocuments({ status: "pending" }),
    ActivityLog.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    pingDB(),
    Promise.all([
      Profile.findOne({ key: "main" }).select("avatar bio cv socials").lean(),
      Project.countDocuments({ status: "published", content: { $nin: ["", null] } }),
      Project.countDocuments({ status: "published", "seo.description": { $nin: ["", null] } }),
      Media.countDocuments({ resourceType: "image", alt: { $in: ["", null] } }),
      getSiteSettings(),
    ]),
    // From the visitor log rather than the daily aggregates: who is here now, and who left their details.
    // eslint-disable-next-line react-hooks/purity -- a server component: the clock is the point of this query
    Visitor.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }),
    Visitor.countDocuments(STATUS_FILTERS.lead),
  ]);
  const [servicesCount, testimonialsCount, faqsCount, pagesCount, skillsCount, experienceCount, educationCount, mediaCount] = contentCounts;
  const [profileDoc, projectsWithStory, projectsWithSeo, imagesWithoutAlt, settings] = checks;
  const checklist: ChecklistItem[] = [
    {
      label: "Profile photo",
      detail: profileDoc?.avatar?.url ? "Shown at the top of the About page." : "Visitors trust a face — add a photo shown on About.",
      done: Boolean(profileDoc?.avatar?.url),
      href: "/admin/profile",
      action: "Add photo",
    },
    {
      label: "Full biography",
      detail: profileDoc?.bio?.trim() ? "Your story appears on the About page." : "Write your story for the About page (“More about me”).",
      done: Boolean(profileDoc?.bio?.trim()),
      href: "/admin/profile",
      action: "Write bio",
    },
    {
      label: "CV / résumé file",
      detail: profileDoc?.cv?.url ? "Download buttons are live." : "Upload a PDF so the “Download CV” buttons appear.",
      done: Boolean(profileDoc?.cv?.url),
      href: "/admin/profile",
      action: "Upload CV",
    },
    {
      label: "Case studies written",
      detail: `${projectsWithStory} of ${projectsPublished} published projects have a full write-up.`,
      done: projectsPublished > 0 && projectsWithStory >= projectsPublished,
      href: "/admin/projects",
      action: "Write",
    },
    {
      label: "Project SEO descriptions",
      detail: `${projectsWithSeo} of ${projectsPublished} projects have a Google description.`,
      done: projectsPublished > 0 && projectsWithSeo >= projectsPublished,
      href: "/admin/projects",
      action: "Add",
    },
    {
      label: "Education & certificates",
      detail: educationCount ? `${educationCount} item(s) shown on the site.` : "The Education section stays hidden until you add one.",
      done: educationCount > 0,
      href: "/admin/education/new",
      action: "Add",
    },
    {
      label: "Testimonials",
      detail: testimonialsCount ? `${testimonialsCount} quote(s) shown on the site.` : "Ask a client or teammate for a quote — it builds trust.",
      done: testimonialsCount > 0,
      href: "/admin/testimonials/new",
      action: "Add",
    },
    {
      label: "Image descriptions (alt text)",
      detail: imagesWithoutAlt ? `${imagesWithoutAlt} image(s) have no description — needed for Google Images and screen readers.` : "Every image is described.",
      done: imagesWithoutAlt === 0,
      href: "/admin/media",
      action: "Describe",
    },
    {
      label: "Blog",
      detail: postsLive ? `${postsLive} article(s) live.` : "Publish a first article to show the Blog section.",
      done: postsLive > 0,
      href: "/admin/blog/new",
      action: "Write",
    },
    {
      label: "Google Search Console",
      detail: settings.seo.googleSiteVerification ? "Verification tag is set." : "Add the verification code so you can track Google rankings.",
      done: Boolean(settings.seo.googleSiteVerification),
      href: "/admin/seo",
      action: "Set up",
    },
    {
      label: "Public website address",
      detail: settings.siteUrl
        ? `Links, the sitemap and share cards use ${settings.siteUrl}.`
        : "Set your domain so canonical links, the sitemap and share cards point at it.",
      done: Boolean(settings.siteUrl),
      href: "/admin/settings",
      action: "Set URL",
    },
    {
      label: "Favicon",
      detail: settings.faviconUrl ? "Your own icon shows in browser tabs." : "Upload a square icon for browser tabs and the home-screen app.",
      done: Boolean(settings.faviconUrl),
      href: "/admin/settings",
      action: "Upload",
    },
    {
      label: "Voice greeting",
      detail: settings.voiceIntro.enabled && settings.voiceIntro.url
        ? "Welcome audio recording is active and ready."
        : "Upload a spoken welcome message for visitors on your home page.",
      done: Boolean(settings.voiceIntro.enabled && settings.voiceIntro.url),
      href: "/admin/settings#voice-greeting",
      action: settings.voiceIntro.enabled && settings.voiceIntro.url ? "Edit" : "Set up",
    },
  ];
  const quickActions: { label: string; hint: string; href: string; icon: LucideIcon }[] = [
    { label: "Voice greeting", hint: "Audio welcome clip", href: "/admin/settings#voice-greeting", icon: Volume2 },
    { label: "Add a project", hint: "New case study", href: "/admin/projects/new", icon: Plus },
    { label: "Write a post", hint: "Blog article", href: "/admin/blog/new", icon: PenSquare },
    { label: "Upload media", hint: "Images & audio", href: "/admin/media", icon: ImagePlus },
    { label: "Edit profile", hint: "Hero, about, CV", href: "/admin/profile", icon: UserRound },
    { label: "Homepage layout", hint: "Sections & menu", href: "/admin/settings", icon: LayoutTemplate },
    { label: "SEO & Google", hint: "Titles, sharing", href: "/admin/seo", icon: Globe },
  ];
  const overview = [
    { label: "Services", value: servicesCount, href: "/admin/services" },
    { label: "Testimonials", value: testimonialsCount, href: "/admin/testimonials" },
    { label: "FAQs", value: faqsCount, href: "/admin/faqs" },
    { label: "Published pages", value: pagesCount, href: "/admin/pages" },
    { label: "Skills", value: skillsCount, href: "/admin/skills" },
    { label: "Experience", value: experienceCount, href: "/admin/experience" },
    { label: "Education", value: educationCount, href: "/admin/education" },
    { label: "Media files", value: mediaCount, href: "/admin/media" },
  ];
  const { totals, previousTotals } = report;
  const vs = (current: number, previous: number) =>
    previous > 0 ? "vs previous period" : current > 0 ? "no data in previous period" : "no data yet";
  const noTraffic = totals.pageview === 0;
  const rangeLabel = report.range.preset === "custom" ? `${report.range.from} → ${report.range.to}` : `last ${report.dayCount} days`;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={`Overview for the ${rangeLabel}. Compared with the previous ${report.dayCount} days.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/messages">
                <Inbox /> Inbox{unread ? ` (${unread})` : ""}
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href="/" target="_blank" rel="noreferrer">
                <Send /> Live site
              </a>
            </Button>
          </>
        }
      />

      <ul className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
        {quickActions.map(({ label, hint, href, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-center gap-3 rounded-[4px] border border-border bg-card p-3 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-6">
        <SetupChecklist items={checklist} />
      </div>

      <div className="mb-6">
        <RangePicker basePath="/admin" preset={report.range.preset} from={report.range.from} to={report.range.to} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Page views" value={formatNumber(totals.pageview)} icon={Eye} trend={percentChange(totals.pageview, previousTotals.pageview)} hint={vs(totals.pageview, previousTotals.pageview)} href="/admin/analytics" />
        <StatCard
          label="Unique visitors (daily, summed)"
          value={formatNumber(totals.visitor)}
          icon={Users}
          trend={percentChange(totals.visitor, previousTotals.visitor)}
          hint={vs(totals.visitor, previousTotals.visitor)}
          href="/admin/analytics"
        />
        <StatCard label="CV downloads" value={formatNumber(totals.cv_download)} icon={Download} trend={percentChange(totals.cv_download, previousTotals.cv_download)} hint={vs(totals.cv_download, previousTotals.cv_download)} />
        <StatCard
          label="Contact messages"
          value={formatNumber(totals.contacts)}
          icon={MailPlus}
          hint={report.conversionRate !== null ? `${report.conversionRate.toFixed(1)}% of visitors` : "no visitors yet"}
          href="/admin/messages"
        />
        <StatCard label="Projects" value={`${projectsPublished} / ${projectsTotal}`} icon={FolderKanban} hint="published / total" href="/admin/projects" />
        <StatCard label="Blog posts" value={`${postsLive} / ${postsTotal}`} icon={BookOpenText} hint="live / total" href="/admin/blog" />
        <StatCard label="Unread messages" value={unread} icon={Inbox} hint={`${pending} awaiting reply`} href="/admin/messages?view=unread" />
        <StatCard label="Project views" value={formatNumber(totals.project_view)} icon={FileText} trend={percentChange(totals.project_view, previousTotals.project_view)} hint="case study pages" />
        <StatCard label="Online now" value={formatNumber(online)} icon={Radio} hint="visitors active in the last 5 minutes" href="/admin/visitors?view=online" />
        <StatCard label="Leads" value={formatNumber(leads)} icon={UsersRound} hint="visitors who sent the contact form" href="/admin/visitors?view=lead" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Traffic" description="Page views and daily unique visitors · first-party, cookie-less" className="xl:col-span-2">
          {noTraffic ? (
            <div className="grid h-72 place-items-center text-center">
              <div>
                <p className="font-medium">No visits recorded in this period</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Visits are counted from real page loads on the public site (bots and Do-Not-Track visitors excluded). Data appears here after your first visitors arrive.
                </p>
              </div>
            </div>
          ) : (
            <TrafficChart data={report.series} granularity={report.granularity} />
          )}
        </Panel>
        <Panel title="Popular projects" actions={<Link href="/admin/analytics" className="text-xs font-medium text-primary hover:underline">Full report</Link>}>
          <BarList items={report.projects} empty="No project views yet." linkable />
        </Panel>
        <Panel title="Top pages">
          <BarList items={report.pages} empty="No page views yet." linkable />
        </Panel>
        <Panel title="Traffic sources" description="Where landing visits came from">
          <BarList items={report.referrers} empty="No referral data yet." />
        </Panel>
        <Panel title="Countries" description="New daily visitors (from Vercel’s geo header)">
          <BarList items={report.countries} empty="No location data yet. Available when deployed on Vercel." />
        </Panel>
        <Panel title="Recent activity" actions={<Link href="/admin/activity" className="text-xs font-medium text-primary hover:underline">View all</Link>} className="xl:col-span-2">
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No admin activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((log) => (
                <li key={log._id.toString()} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{log.summary || log.action}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(log.createdAt.toISOString())}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Content overview" description="Active items shown on the site" className="xl:col-span-3">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {overview.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="block rounded-[4px] border border-border px-4 py-3 transition-colors hover:border-primary/40">
                  <span className="block text-xl font-semibold">{item.value}</span>
                  <span className="block text-xs text-muted-foreground">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {testimonialsCount === 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: add a testimonial or two — the homepage testimonial section appears automatically once one exists.
            </p>
          )}
        </Panel>
        <Panel title="Integration health" actions={<Link href="/admin/system" className="text-xs font-medium text-primary hover:underline">Details</Link>}>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: "Database", ok: db.ok, detail: db.ok ? `${db.latencyMs} ms` : "down" },
              { label: "Public site URL", ok: Boolean(settings.siteUrl), detail: settings.siteUrl ? "set" : "using host URL" },
              { label: "Contact form", ok: db.ok, detail: db.ok ? "saving to inbox" : "offline" },
              { label: "Google Analytics", ok: Boolean(settings.analytics.gaMeasurementId), detail: settings.analytics.gaMeasurementId ? "on" : "optional" },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                <StatusBadge status={item.ok ? "active" : "draft"} label={item.detail} />
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full">
            <a href="/" target="_blank" rel="noreferrer">
              <Send /> Open live site
            </a>
          </Button>
        </Panel>
      </div>
    </>
  );
}
