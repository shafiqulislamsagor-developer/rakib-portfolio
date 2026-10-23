import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Faq } from "@/lib/db/models";
import { toFaq } from "@/lib/db/serialize";
import { omit } from "@/lib/utils";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FaqForm from "../faq-form";

export const metadata: Metadata = { title: "Edit question" };

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const doc = await Faq.findById(id).lean();
  if (!doc) notFound();
  const item = toFaq(doc);
  return (
    <>
      <PageHeader title="Edit question" description={item.question} />
      <FaqForm id={id} initial={omit(item, ["id"])} />
    </>
  );
}
