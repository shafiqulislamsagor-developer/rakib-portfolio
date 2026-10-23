import { deletePage } from "@/app/admin/_actions/pages";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { PageHeader, StatusBadge } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Page } from "@/lib/db/models";
import { toPage } from "@/lib/db/serialize";
import { formatDateTime } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { ExternalLink } from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageForm from "../page-form";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const doc = await Page.findById(id).lean();
  if (!doc) notFound();
  const page = toPage(doc);

  return (
    <>
      <PageHeader
        title={page.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={page.status} />
            <span>updated {formatDateTime(page.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            {page.status === "published" && (
              <Button asChild variant="outline" size="sm">
                <a href={`/${page.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> View live
                </a>
              </Button>
            )}
            <ActionButton
              action={deletePage.bind(null, id)}
              label="Delete"
              icon="delete"
              variant="destructive"
              redirectTo="/admin/pages"
              confirm={{ title: "Delete this page?", description: "This cannot be undone.", confirmLabel: "Delete" }}
            />
          </>
        }
      />
      <PageForm
        id={id}
        initial={{
          title: page.title,
          slug: page.slug,
          intro: page.intro,
          content: page.content,
          status: page.status,
          showInFooter: page.showInFooter,
          seo: page.seo,
        }}
        siteUrl={await getSiteUrl()}
      />
    </>
  );
}
