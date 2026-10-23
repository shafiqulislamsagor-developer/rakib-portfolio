import { StatusBadge } from "@/app/admin/_components/ui";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Post } from "@/lib/db/models";
import { toPost } from "@/lib/db/serialize";
import { formatDate } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Preview" };

/** Private preview, available for drafts and scheduled posts. */
export default async function PostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const doc = await Post.findById(id).lean();
  if (!doc) notFound();
  const post = toPost(doc);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          Preview — <StatusBadge status={post.status} /> visitors cannot see this page.
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/blog/${id}`}>
            <ArrowLeft /> Back to editor
          </Link>
        </Button>
      </div>
      <article className="mx-auto max-w-3xl rounded-[4px] border border-border bg-card px-6 py-10 sm:px-12">
        <p className="eyebrow">{post.category || "Article"}</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em]">{post.title}</h1>
        {post.excerpt && <p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>}
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          {formatDate(post.publishedAt ?? post.publishAt ?? post.updatedAt)} · {post.readingMinutes} min read
        </p>
        {post.coverImage.url && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URL
          <img src={post.coverImage.url} alt={post.coverImage.alt} className="mt-10 w-full rounded-[4px] border border-border" />
        )}
        <div className="mt-10">
          {post.content.trim() ? <Markdown content={post.content} /> : <p className="text-muted-foreground">No content yet.</p>}
        </div>
      </article>
    </>
  );
}
