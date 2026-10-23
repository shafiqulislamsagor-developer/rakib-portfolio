import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import type { Metadata } from "next";
import EducationForm, { emptyEducation } from "../education-form";

export const metadata: Metadata = { title: "Add education" };

export default async function NewEducationPage() {
  await adminPage();
  return (
    <>
      <PageHeader title="Add education or certification" />
      <EducationForm id={null} initial={emptyEducation} />
    </>
  );
}
