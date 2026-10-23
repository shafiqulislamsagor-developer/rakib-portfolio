import { deletePage, setPageStatus } from "@/app/admin/_actions/pages";
import { DataTable } from "@/app/admin/_components/data-table";
import { RowActions, type RowAction } from "@/app/admin/_components/row-actions";
import { EmptyState, PageHeader, StatusBadge } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Page } from "@/lib/db/models";
import { toPage } from "@/lib/db/serialize";
import { formatDate } from "@/lib/format";
import type { PageData } from "@/types/content";
import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pages" };

const BUILT_IN = [
  { path: "/", label: "Home", edit: "/admin/settings" },
  { path: "/about", label: "About", edit: "/admin/profile" },
  { path: "/services", label: "Services", edit: "/admin/services" },
  { path: "/projects", label: "Projects", edit: "/admin/projects" },
  { path: "/blog", label: "Blog", edit: "/admin/blog" },
  { path: "/contact", label: "Contact", edit: "/admin/settings" },
  { path: "/resume", label: "Résumé", edit: "/admin/profile" },
];

export default async function PagesAdminPage() {
  await adminPage();
  const pages = (await Page.find({}).select("-content").sort({ updatedAt: -1 }).lean()).map(toPage);

  const actionsFor = (page: PageData): RowAction[] => [
    { type: "link", label: "Edit", icon: "edit", href: `/admin/pages/${page.id}` },
    ...(page.status === "published" ? [{ type: "link" as const, label: "View live", icon: "view" as const, href: `/${page.slug}`, external: true }] : []),
    { type: "separator" },
    page.status === "published"
      ? { type: "action", label: "Unpublish", icon: "unpublish", action: setPageStatus.bind(null, page.id, "draft") }
      : { type: "action", label: "Publish", icon: "publish", action: setPageStatus.bind(null, page.id, "published") },
    {
      type: "action",
      label: "Delete",
      icon: "delete",
      destructive: true,
      action: deletePage.bind(null, page.id),
      confirm: { title: `Delete “${page.title}”?`, description: "The page and its URL will be removed permanently.", confirmLabel: "Delete" },
    },
  ];

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Pages"
        description="Custom pages such as a privacy policy, /uses or /now. They live at the top level of your site, e.g. /privacy."
        actions={
          <Button asChild>
            <Link href="/admin/pages/new">
              <Plus /> New page
            </Link>
          </Button>
        }
      />

      <DataTable
        label="Custom pages"
        columns={[
          { key: "page", label: "Page", width: "minmax(0,1fr)" },
          { key: "status", label: "Status", width: "6.5rem", hideBelow: "sm" },
          { key: "footer", label: "In footer", width: "5.5rem", hideBelow: "md" },
          { key: "updated", label: "Updated", width: "6.5rem", hideBelow: "lg" },
        ]}
        rows={pages.map((page) => ({
          id: page.id,
          label: page.title,
          dimmed: page.status === "archived",
          cells: {
            page: (
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0">
                  <Link href={`/admin/pages/${page.id}`} className="block truncate font-medium hover:text-primary">
                    {page.title}
                  </Link>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">/{page.slug}</p>
                  <div className="mt-1.5 @xl:hidden">
                    <StatusBadge status={page.status} />
                  </div>
                </div>
              </div>
            ),
            status: <StatusBadge status={page.status} />,
            footer: <span className="text-sm text-muted-foreground">{page.showInFooter ? "Yes" : "No"}</span>,
            updated: <span className="text-sm text-muted-foreground">{formatDate(page.updatedAt)}</span>,
          },
          actions: <RowActions actions={actionsFor(page)} label={`Actions for ${page.title}`} />,
        }))}
        empty={<EmptyState icon={FileText} title="No custom pages yet" description="Create a privacy policy, a /uses page or anything else you need." />}
      />

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Built-in pages</h2>
        <p className="mt-1 text-xs text-muted-foreground">These are generated from your content. Their SEO is set under SEO.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BUILT_IN.map((page) => (
            <li key={page.path} className="flex items-center justify-between rounded-[4px] border border-border bg-card px-4 py-3 text-sm">
              <span>
                <span className="font-medium">{page.label}</span> <span className="font-mono text-xs text-muted-foreground">{page.path}</span>
              </span>
              <span className="flex gap-3 text-xs">
                <Link href={page.edit} className="text-primary hover:underline">
                  Edit content
                </Link>
                <a href={page.path} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  View
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
