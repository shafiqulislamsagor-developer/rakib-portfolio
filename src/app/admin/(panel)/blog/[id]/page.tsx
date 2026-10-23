import { deletePost, duplicatePost } from "@/app/admin/_actions/posts";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { PageHeader, StatusBadge } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Post } from "@/lib/db/models";
import { toPost } from "@/lib/db/serialize";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { Eye } from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "../post-form";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const [doc, categories] = await Promise.all([Post.findById(id).lean(), Post.distinct("category")]);
  if (!doc) notFound();
  const post = toPost(doc);

  return (
    <>
      <PageHeader
        title={post.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            <span>
              {post.status === "scheduled" ? `Goes live ${formatDateTime(post.publishAt)} · ` : ""}
              {formatNumber(post.viewCount)} views · updated {formatDateTime(post.updatedAt)}
            </span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/blog/${id}/preview`}>
                <Eye /> Preview
              </Link>
            </Button>
            <ActionButton action={duplicatePost.bind(null, id)} label="Duplicate" icon="duplicate" />
            <ActionButton
              action={deletePost.bind(null, id)}
              label="Delete"
              icon="delete"
              variant="destructive"
              redirectTo="/admin/blog"
              confirm={{ title: "Delete this post?", description: "This cannot be undone. Consider archiving instead.", confirmLabel: "Delete permanently" }}
            />
          </>
        }
      />
      <PostForm
        id={id}
        initial={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          category: post.category,
          tags: post.tags,
          status: post.status,
          publishAt: post.publishAt ?? "",
          seo: post.seo,
        }}
        categories={(categories as string[]).filter(Boolean)}
        siteUrl={await getSiteUrl()}
      />
    </>
  );
}
