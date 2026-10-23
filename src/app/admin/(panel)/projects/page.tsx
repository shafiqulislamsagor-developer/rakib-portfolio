import {
  deleteProject,
  duplicateProject,
  reorderProjects,
  setProjectStatus,
  toggleProjectFeatured,
} from "@/app/admin/_actions/projects";
import { DataTable } from "@/app/admin/_components/data-table";
import { RowActions, type RowAction } from "@/app/admin/_components/row-actions";
import { Thumb } from "@/app/admin/_components/thumb";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchBox, StatusBadge, buildHref } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate, param, searchRegex } from "@/lib/admin/paginate";
import { PROJECT_STATUSES } from "@/lib/constants";
import { Project } from "@/lib/db/models";
import { toProject } from "@/lib/db/serialize";
import { formatDate, formatNumber } from "@/lib/format";
import type { ProjectData } from "@/types/content";
import { FolderKanban, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Projects" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function ProjectsAdminPage({ searchParams }: { searchParams: Search }) {
  await adminPage();
  const params = await searchParams;
  const status = param(params.status);
  const q = param(params.q);
  const page = pageFromParam(params.page);

  const filter = {
    ...(PROJECT_STATUSES.includes(status as never) ? { status } : {}),
    ...(q ? { $or: [{ title: searchRegex(q) }, { technologies: searchRegex(q) }, { category: searchRegex(q) }] } : {}),
  };
  const [result, counts] = await Promise.all([
    paginate(Project, filter, { page, sort: { order: 1, createdAt: -1 }, select: "-content -gallery", map: toProject }),
    Project.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const countFor = (key: string) => counts.find((row) => row._id === key)?.count ?? 0;
  const total = counts.reduce((sum, row) => sum + row.count, 0);

  const actionsFor = (project: ProjectData): RowAction[] => [
    { type: "link", label: "Edit", icon: "edit", href: `/admin/projects/${project.id}` },
    ...(project.status === "published"
      ? [{ type: "link" as const, label: "View live", icon: "view" as const, href: `/projects/${project.slug}`, external: true }]
      : []),
    { type: "action", label: "Duplicate", icon: "duplicate", action: duplicateProject.bind(null, project.id) },
    {
      type: "action",
      label: project.featured ? "Remove from homepage" : "Feature on homepage",
      icon: project.featured ? "unfeature" : "feature",
      action: toggleProjectFeatured.bind(null, project.id),
    },
    { type: "separator" },
    project.status === "published"
      ? { type: "action", label: "Unpublish", icon: "unpublish", action: setProjectStatus.bind(null, project.id, "draft") }
      : { type: "action", label: "Publish", icon: "publish", action: setProjectStatus.bind(null, project.id, "published") },
    project.status === "archived"
      ? { type: "action", label: "Restore to draft", icon: "restore", action: setProjectStatus.bind(null, project.id, "draft") }
      : {
          type: "action",
          label: "Archive",
          icon: "archive",
          action: setProjectStatus.bind(null, project.id, "archived"),
          confirm: { title: "Archive this project?", description: "It will be hidden from the public site but kept here.", confirmLabel: "Archive" },
        },
    {
      type: "action",
      label: "Delete",
      icon: "delete",
      destructive: true,
      action: deleteProject.bind(null, project.id),
      confirm: {
        title: `Delete “${project.title}”?`,
        description:
          project.status === "published"
            ? "This project is live. Deleting it removes the page permanently and breaks existing links — consider archiving instead."
            : "This permanently deletes the project. This cannot be undone.",
        confirmLabel: "Delete permanently",
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        icon={FolderKanban}
        description="Case studies shown on the homepage and the /projects page. Drag to set the order; starred projects also appear on the homepage."
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />
      <DataTable
        label="Projects"
        reorder={q ? undefined : reorderProjects}
        reorderUnavailable={q ? "Clear the search to drag and reorder projects." : undefined}
        toolbar={
          <>
            <FilterTabs
              items={[
                { label: "All", href: buildHref("/admin/projects", { q }), active: !status, count: total },
                ...PROJECT_STATUSES.map((value) => ({
                  label: value[0].toUpperCase() + value.slice(1),
                  href: buildHref("/admin/projects", { status: value, q }),
                  active: status === value,
                  count: countFor(value),
                })),
              ]}
            />
            <SearchBox action="/admin/projects" defaultValue={q} placeholder="Search projects…" hidden={{ status }} />
          </>
        }
        columns={[
          { key: "project", label: "Project", width: "minmax(0,1fr)" },
          { key: "category", label: "Category", width: "9rem", hideBelow: "lg" },
          { key: "status", label: "Status", width: "6.5rem", hideBelow: "sm" },
          { key: "views", label: "Views", width: "4rem", hideBelow: "md", align: "end" },
          { key: "updated", label: "Updated", width: "6.5rem", hideBelow: "xl" },
        ]}
        rows={result.items.map((project) => ({
          id: project.id,
          label: project.title,
          dimmed: project.status === "archived",
          cells: {
            project: (
              <div className="flex min-w-0 items-center gap-3">
                <Thumb url={project.thumbnail.url || project.cover.url} alt={project.thumbnail.alt} className="hidden @md:grid" />
                <div className="min-w-0">
                  <Link href={`/admin/projects/${project.id}`} className="flex min-w-0 items-center gap-1.5 font-medium hover:text-primary">
                    {project.featured && <Star className="size-3.5 shrink-0 fill-destructive text-destructive" aria-label="Featured on homepage" />}
                    <span className="truncate">{project.title}</span>
                  </Link>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">/projects/{project.slug}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 @xl:hidden">
                    <StatusBadge status={project.status} />
                    <span className="text-[11px] text-muted-foreground">{formatNumber(project.viewCount)} views</span>
                  </div>
                </div>
              </div>
            ),
            category: (
              <span className="block truncate text-sm text-muted-foreground" title={project.category}>
                {project.category || "—"}
              </span>
            ),
            status: <StatusBadge status={project.status} />,
            views: <span className="text-sm tabular-nums">{formatNumber(project.viewCount)}</span>,
            updated: <span className="text-sm text-muted-foreground">{formatDate(project.updatedAt)}</span>,
          },
          actions: <RowActions actions={actionsFor(project)} label={`Actions for ${project.title}`} />,
        }))}
        empty={
          <EmptyState
            icon={FolderKanban}
            title={q || status ? "No projects match these filters" : "No projects yet"}
            description={q || status ? "Try another search or filter." : "Create your first case study to show it on the site."}
            action={
              !q && !status ? (
                <Button asChild>
                  <Link href="/admin/projects/new">
                    <Plus /> New project
                  </Link>
                </Button>
              ) : undefined
            }
          />
        }
        footer={
          <Pagination
            className="mt-0"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            href={(target) => buildHref("/admin/projects", { status, q, page: target })}
          />
        }
      />
    </>
  );
}
