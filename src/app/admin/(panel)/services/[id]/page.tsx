import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Service } from "@/lib/db/models";
import { toService } from "@/lib/db/serialize";
import { omit } from "@/lib/utils";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceForm from "../service-form";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const doc = await Service.findById(id).lean();
  if (!doc) notFound();
  const service = toService(doc);
  return (
    <>
      <PageHeader title={service.title} />
      <ServiceForm id={id} initial={omit(service, ["id"])} />
    </>
  );
}
