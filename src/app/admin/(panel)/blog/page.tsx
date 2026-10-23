import { deletePost, duplicatePost, setPostStatus } from "@/app/admin/_actions/posts";
import { DataTable } from "@/app/admin/_components/data-table";
import { RowActions, type RowAction } from "@/app/admin/_components/row-actions";
import { Thumb } from "@/app/admin/_components/thumb";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchBox, StatusBadge, buildHref } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate, param, searchRegex } from "@/lib/admin/paginate";
import { POST_STATUSES } from "@/lib/constants";
import { Post } from "@/lib/db/models";
import { toPost } from "@/lib/db/serialize";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type { PostData } from "@/types/content";
import { BookOpenText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Blog" };

type Search = Promise<Record<string, string | string[] | undefined>>;

function displayStatus(post: PostData) {
  if (post.status === "scheduled" && post.publishAt && new Date(post.publishAt) <= new Date()) return "published";
  return post.status;
}

export default async function BlogAdminPage({ searchParams }: { searchParams: Search }) {
  await adminPage();
  const params = await searchParams;
  const status = param(params.status);
  const q = param(params.q);
  const page = pageFromParam(params.page);

  const filter = {
    ...(POST_STATUSES.includes(status as never) ? { status } : {}),
    ...(q ? { $or: [{ title: searchRegex(q) }, { tags: searchRegex(q) }, { category: searchRegex(q) }] } : {}),
  };
  const [result, counts] = await Promise.all([
    paginate(Post, filter, { page, sort: { updatedAt: -1 }, select: "-content", map: toPost }),
    Post.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const total = counts.reduce((sum, row) => sum + row.count, 0);

  const actionsFor = (post: PostData): RowAction[] => [
    { type: "link", label: "Edit", icon: "edit", href: `/admin/blog/${post.id}` },
    ...(displayStatus(post) === "published"
      ? [{ type: "link" as const, label: "View live", icon: "view" as const, href: `/blog/${post.slug}`, external: true }]
      : [{ type: "link" as const, label: "Preview", icon: "show" as const, href: `/admin/blog/${post.id}/preview` }]),
    { type: "action", label: "Duplicate", icon: "duplicate", action: duplicatePost.bind(null, post.id) },
    { type: "separator" },
    post.status === "published"
      ? { type: "action", label: "Unpublish", icon: "unpublish", action: setPostStatus.bind(null, post.id, "draft") }
      : { type: "action", label: "Publish now", icon: "publish", action: setPostStatus.bind(null, post.id, "published") },
    post.status === "archived"
      ? { type: "action", label: "Restore to draft", icon: "restore", action: setPostStatus.bind(null, post.id, "draft") }
      : { type: "action", label: "Archive", icon: "archive", action: setPostStatus.bind(null, post.id, "archived") },
    {
      type: "action",
      label: "Delete",
      icon: "delete",
      destructive: true,
      action: deletePost.bind(null, post.id),
      confirm: {
        title: `Delete “${post.title}”?`,
        description: "This permanently deletes the article and breaks any links to it. Consider archiving instead.",
        confirmLabel: "Delete permanently",
      },
    },
  ];

  return (
    <>
      <PageHeader
        icon={BookOpenText}
        title="Blog"
        description="Write, schedule and publish articles. Scheduled posts go live automatically within a few minutes of their publish time."
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus /> New post
            </Link>
          </Button>
        }
      />
      <DataTable
        label="Blog posts"
        toolbar={
          <>
            <FilterTabs
              items={[
                { label: "All", href: buildHref("/admin/blog", { q }), active: !status, count: total },
                ...POST_STATUSES.map((value) => ({
                  label: value[0].toUpperCase() + value.slice(1),
                  href: buildHref("/admin/blog", { status: value, q }),
                  active: status === value,
                  count: counts.find((row) => row._id === value)?.count ?? 0,
                })),
              ]}
            />
            <SearchBox action="/admin/blog" defaultValue={q} placeholder="Search posts…" hidden={{ status }} />
          </>
        }
        columns={[
          { key: "post", label: "Article", width: "minmax(0,1fr)" },
          { key: "status", label: "Status", width: "6.5rem", hideBelow: "sm" },
          { key: "date", label: "Publish date", width: "8.5rem", hideBelow: "lg" },
          { key: "views", label: "Views", width: "4rem", hideBelow: "md", align: "end" },
          { key: "updated", label: "Updated", width: "6.5rem", hideBelow: "xl" },
        ]}
        rows={result.items.map((post) => {
          const shown = displayStatus(post);
          const badge = <StatusBadge status={shown} label={shown !== post.status ? "published" : undefined} />;
          return {
            id: post.id,
            label: post.title,
            dimmed: post.status === "archived",
            cells: {
              post: (
                <div className="flex min-w-0 items-center gap-3">
                  <Thumb url={post.coverImage.url} alt={post.coverImage.alt} className="hidden @md:grid" />
                  <div className="min-w-0">
                    <Link href={`/admin/blog/${post.id}`} className="block truncate font-medium hover:text-primary">
                      {post.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {[post.category, post.tags.map((tag) => `#${tag}`).join(" ")].filter(Boolean).join(" · ") || `/blog/${post.slug}`}
                    </p>
                    <div className="mt-1.5 @xl:hidden">{badge}</div>
                  </div>
                </div>
              ),
              status: badge,
              date: (
                <span className="text-sm text-muted-foreground">
                  {post.status === "scheduled" ? formatDateTime(post.publishAt) : formatDate(post.publishedAt) || "—"}
                </span>
              ),
              views: <span className="text-sm tabular-nums">{formatNumber(post.viewCount)}</span>,
              updated: <span className="text-sm text-muted-foreground">{formatDate(post.updatedAt)}</span>,
            },
            actions: <RowActions actions={actionsFor(post)} label={`Actions for ${post.title}`} />,
          };
        })}
        empty={
          <EmptyState
            icon={BookOpenText}
            title={q || status ? "No posts match these filters" : "No posts yet"}
            description={q || status ? "Try another search or filter." : "The Blog link and homepage section appear once your first post is published."}
            action={
              !q && !status ? (
                <Button asChild>
                  <Link href="/admin/blog/new">
                    <Plus /> Write your first post
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
            href={(target) => buildHref("/admin/blog", { status, q, page: target })}
          />
        }
      />
    </>
  );
}
