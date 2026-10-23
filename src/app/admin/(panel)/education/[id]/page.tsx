import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Education } from "@/lib/db/models";
import { toEducation } from "@/lib/db/serialize";
import { isoToMonth } from "@/lib/format";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EducationForm from "../education-form";

export const metadata: Metadata = { title: "Edit education" };

export default async function EditEducationPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const doc = await Education.findById(id).lean();
  if (!doc) notFound();
  const item = toEducation(doc);

  return (
    <>
      <PageHeader title={item.title} description={item.institution} />
      <EducationForm
        id={id}
        initial={{
          kind: item.kind,
          title: item.title,
          institution: item.institution,
          location: item.location,
          startDate: isoToMonth(item.startDate),
          endDate: isoToMonth(item.endDate),
          credentialId: item.credentialId,
          credentialUrl: item.credentialUrl,
          description: item.description,
          order: item.order,
          status: item.status,
        }}
      />
    </>
  );
}
