import CareerList from "@/app/admin/_components/career-list";
import { PageHeader } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Experience } from "@/lib/db/models";
import { toExperience } from "@/lib/db/serialize";
import { formatPeriod } from "@/lib/format";
import { BriefcaseBusiness, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Experience" };

export default async function ExperienceAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await adminPage();
  const status = param((await searchParams).status) === "archived" ? "archived" : "active";
  const [docs, active, archived] = await Promise.all([
    Experience.find({ status }).sort({ order: 1, startDate: -1 }).lean(),
    Experience.countDocuments({ status: "active" }),
    Experience.countDocuments({ status: "archived" }),
  ]);
  const items = docs.map(toExperience);

  return (
    <>
      <PageHeader
        icon={BriefcaseBusiness}
        title="Experience"
        description="Work history and internships, shown in this order on the homepage. Leave the end date empty for current roles."
        actions={
          <Button asChild>
            <Link href="/admin/experience/new">
              <Plus /> Add experience
            </Link>
          </Button>
        }
      />
      <CareerList
        kind="experience"
        basePath="/admin/experience"
        status={status}
        counts={{ active, archived }}
        icon={BriefcaseBusiness}
        emptyTitle="No experience yet"
        emptyDescription="Add your roles, internships and freelance work."
        rows={items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: [item.company, item.location].filter(Boolean).join(" · "),
          meta: `${formatPeriod(item.startDate, item.endDate)} · ${item.type}`,
          status: item.status,
          badge: item.endDate ? undefined : "Current",
        }))}
      />
    </>
  );
}
