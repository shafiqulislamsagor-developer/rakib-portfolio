import { deleteProject, duplicateProject } from "@/app/admin/_actions/projects";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { PageHeader, StatusBadge } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Project } from "@/lib/db/models";
import { toProject } from "@/lib/db/serialize";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { omit } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectForm from "../project-form";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const [doc, categories] = await Promise.all([Project.findById(id).lean(), Project.distinct("category")]);
  if (!doc) notFound();
  const project = toProject(doc);

  return (
    <>
      <PageHeader
        title={project.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <span>
              {formatNumber(project.viewCount)} views · updated {formatDateTime(project.updatedAt)}
            </span>
          </span>
        }
        actions={
          <>
            {project.status === "published" && (
              <Button asChild variant="outline" size="sm">
                <a href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> View live
                </a>
              </Button>
            )}
            <ActionButton action={duplicateProject.bind(null, id)} label="Duplicate" icon="duplicate" />
            <ActionButton
              action={deleteProject.bind(null, id)}
              label="Delete"
              icon="delete"
              variant="destructive"
              redirectTo="/admin/projects"
              confirm={{
                title: "Delete this project?",
                description:
                  project.status === "published"
                    ? "This project is live. Deleting removes its page permanently — consider archiving instead."
                    : "This cannot be undone.",
                confirmLabel: "Delete permanently",
              }}
            />
          </>
        }
      />
      <ProjectForm
        id={id}
        initial={omit(project, ["id", "publishedAt", "viewCount", "createdAt", "updatedAt"])}
        categories={(categories as string[]).filter(Boolean)}
        siteUrl={await getSiteUrl()}
      />
    </>
  );
}
