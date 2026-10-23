import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Project } from "@/lib/db/models";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";
import ProjectForm, { emptyProject } from "../project-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await adminPage();
  const categories = (await Project.distinct("category")).filter(Boolean) as string[];
  return (
    <>
      <PageHeader title="New project" description="Drafts stay private until you publish them." />
      <ProjectForm id={null} initial={emptyProject} categories={categories} siteUrl={await getSiteUrl()} />
    </>
  );
}
