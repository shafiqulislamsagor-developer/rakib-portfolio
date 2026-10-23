import { Panel, PageHeader, StatusBadge } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Post, Project, Settings } from "@/lib/db/models";
import { toSettings } from "@/lib/db/serialize";
import { getSiteUrl } from "@/lib/site";
import { ExternalLink, Globe } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import SeoForm from "./seo-form";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoPage() {
  await adminPage();
  const [siteUrl, settingsDoc, projectsMissing, postsMissing, redirects] = await Promise.all([
    getSiteUrl(),
    Settings.findOne({ key: "main" }).lean(),
    Project.find({ status: "published", $or: [{ summary: { $in: ["", null] } }, { "thumbnail.url": { $in: ["", null] }, "cover.url": { $in: ["", null] } }] })
      .select("title")
      .limit(10)
      .lean(),
    Post.find({ status: { $in: ["published", "scheduled"] }, excerpt: { $in: ["", null] }, "seo.description": { $in: ["", null] } })
      .select("title")
      .limit(10)
      .lean(),
    Promise.all([
      Project.find({ "previousSlugs.0": { $exists: true } }).select("slug previousSlugs").lean(),
      Post.find({ "previousSlugs.0": { $exists: true } }).select("slug previousSlugs").lean(),
    ]),
  ]);
  const settings = toSettings(settingsDoc);
  const redirectRows = [
    ...redirects[0].flatMap((doc) => doc.previousSlugs.map((from) => ({ from: `/projects/${from}`, to: `/projects/${doc.slug}` }))),
    ...redirects[1].flatMap((doc) => doc.previousSlugs.map((from) => ({ from: `/blog/${from}`, to: `/blog/${doc.slug}` }))),
  ];

  return (
    <>
      <PageHeader icon={Globe}
        title="SEO"
        description="Metadata defaults, indexing, Search Console and page-level overrides. Projects and posts have their own SEO fields in their editors."
      />
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Generated files">
          <ul className="space-y-2 text-sm">
            {[
              ["/sitemap.xml", "Sitemap (published pages only)"],
              ["/robots.txt", "Robots rules"],
              ["/opengraph-image", "Default share image"],
              ["/manifest.webmanifest", "Web app manifest"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  {href} <ExternalLink className="size-3" />
                </a>
                <span className="block text-xs text-muted-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Structured data">
          <p className="text-sm text-muted-foreground">
            Generated automatically: <strong>Person</strong> (every public page), <strong>CreativeWork</strong> (project pages) and{" "}
            <strong>BlogPosting</strong> (articles). Validate with{" "}
            <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(siteUrl)}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Google’s Rich Results Test
            </a>
            .
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Search Console:{" "}
            {settings.seo.googleSiteVerification ? <StatusBadge status="active" label="verification tag set" /> : <StatusBadge status="draft" label="not configured" />}
          </p>
        </Panel>
        <Panel title="Content checks">
          {projectsMissing.length + postsMissing.length === 0 ? (
            <p className="text-sm text-muted-foreground">All published projects and posts have descriptions and images.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {projectsMissing.map((project) => (
                <li key={project._id.toString()}>
                  <Link href={`/admin/projects/${project._id}`} className="hover:text-primary">
                    Project “{project.title}” is missing a summary or image
                  </Link>
                </li>
              ))}
              {postsMissing.map((post) => (
                <li key={post._id.toString()}>
                  <Link href={`/admin/blog/${post._id}`} className="hover:text-primary">
                    Post “{post.title}” has no excerpt or meta description
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <SeoForm initial={{ seo: settings.seo, pages: settings.pages }} siteUrl={siteUrl} />

      <Panel title="Slug redirects" description="Created automatically when you change a project or post URL. Old links return a permanent (308) redirect." className="mt-6">
        {redirectRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No redirects yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {redirectRows.map((row) => (
              <li key={row.from} className="flex flex-wrap items-center gap-2 py-2 font-mono text-xs">
                <span className="text-muted-foreground">{row.from}</span> → <span>{row.to}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
