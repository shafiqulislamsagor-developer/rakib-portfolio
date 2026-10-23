import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import type { Metadata } from "next";
import FaqForm, { emptyFaq } from "../faq-form";

export const metadata: Metadata = { title: "Add question" };

export default async function NewFaqPage() {
  await adminPage();
  return (
    <>
      <PageHeader title="Add question" />
      <FaqForm id={null} initial={emptyFaq} />
    </>
  );
}
