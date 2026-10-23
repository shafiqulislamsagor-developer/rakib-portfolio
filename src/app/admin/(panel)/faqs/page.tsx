import CareerList from "@/app/admin/_components/career-list";
import { PageHeader } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Faq } from "@/lib/db/models";
import { toFaq } from "@/lib/db/serialize";
import { CircleHelp, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FAQs" };

export default async function FaqsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await adminPage();
  const status = param((await searchParams).status) === "archived" ? "archived" : "active";
  const [docs, active, archived] = await Promise.all([
    Faq.find({ status }).sort({ order: 1, createdAt: 1 }).lean(),
    Faq.countDocuments({ status: "active" }),
    Faq.countDocuments({ status: "archived" }),
  ]);
  const items = docs.map(toFaq);

  return (
    <>
      <PageHeader
        icon={CircleHelp}
        title="FAQs"
        description="Common questions, shown as an accordion on the homepage, Services and Contact pages (with FAQ structured data for search engines)."
        actions={
          <Button asChild>
            <Link href="/admin/faqs/new">
              <Plus /> Add question
            </Link>
          </Button>
        }
      />
      <CareerList
        kind="faq"
        basePath="/admin/faqs"
        status={status}
        counts={{ active, archived }}
        icon={CircleHelp}
        emptyTitle="No questions yet"
        emptyDescription="Answer what clients ask most often: availability, stack, process, pricing."
        rows={items.map((item) => ({
          id: item.id,
          title: item.question,
          subtitle: item.answer.replace(/[#*_`[\]()]/g, "").slice(0, 120),
          meta: `Shown on: ${item.placements.join(", ")}`,
          status: item.status,
        }))}
      />
    </>
  );
}
