import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";
import PageForm, { emptyPage } from "../page-form";

export const metadata: Metadata = { title: "New page" };

export default async function NewPagePage() {
  await adminPage();
  return (
    <>
      <PageHeader title="New page" description="Drafts stay private until you publish them." />
      <PageForm id={null} initial={emptyPage} siteUrl={await getSiteUrl()} />
    </>
  );
}
