import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Post } from "@/lib/db/models";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";
import PostForm, { emptyPost } from "../post-form";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await adminPage();
  const categories = ((await Post.distinct("category")) as string[]).filter(Boolean);
  return (
    <>
      <PageHeader title="New post" description="Drafts are private. Publish now or schedule for later." />
      <PostForm id={null} initial={emptyPost} categories={categories} siteUrl={await getSiteUrl()} />
    </>
  );
}
