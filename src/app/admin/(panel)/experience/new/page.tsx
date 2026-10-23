import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import type { Metadata } from "next";
import ExperienceForm, { emptyExperience } from "../experience-form";

export const metadata: Metadata = { title: "Add experience" };

export default async function NewExperiencePage() {
  await adminPage();
  return (
    <>
      <PageHeader title="Add experience" />
      <ExperienceForm id={null} initial={emptyExperience} />
    </>
  );
}
