import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Experience } from "@/lib/db/models";
import { toExperience } from "@/lib/db/serialize";
import { isoToMonth } from "@/lib/format";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExperienceForm from "../experience-form";

export const metadata: Metadata = { title: "Edit experience" };

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const doc = await Experience.findById(id).lean();
  if (!doc) notFound();
  const item = toExperience(doc);

  return (
    <>
      <PageHeader title={item.title} description={item.company} />
      <ExperienceForm
        id={id}
        initial={{
          type: item.type,
          title: item.title,
          company: item.company,
          companyUrl: item.companyUrl,
          location: item.location,
          startDate: isoToMonth(item.startDate),
          endDate: isoToMonth(item.endDate),
          description: item.description,
          achievements: item.achievements,
          progression: item.progression.map((step) => ({
            title: step.title,
            startDate: isoToMonth(step.startDate),
            endDate: isoToMonth(step.endDate),
          })),
          technologies: item.technologies,
          order: item.order,
          status: item.status,
        }}
      />
    </>
  );
}
