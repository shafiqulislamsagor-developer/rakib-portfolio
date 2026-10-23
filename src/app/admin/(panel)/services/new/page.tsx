import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import type { Metadata } from "next";
import ServiceForm, { emptyService } from "../service-form";

export const metadata: Metadata = { title: "Add service" };

export default async function NewServicePage() {
  await adminPage();
  return (
    <>
      <PageHeader title="Add service" />
      <ServiceForm id={null} initial={emptyService} />
    </>
  );
}
