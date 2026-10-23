import CareerList from "@/app/admin/_components/career-list";
import { PageHeader } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Education } from "@/lib/db/models";
import { toEducation } from "@/lib/db/serialize";
import { formatMonth, formatPeriod } from "@/lib/format";
import { GraduationCap, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Education" };

export default async function EducationAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await adminPage();
  const status = param((await searchParams).status) === "archived" ? "archived" : "active";
  const [docs, active, archived] = await Promise.all([
    Education.find({ status }).sort({ order: 1, endDate: -1 }).lean(),
    Education.countDocuments({ status: "active" }),
    Education.countDocuments({ status: "archived" }),
  ]);
  const items = docs.map(toEducation);

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Education & certifications"
        description="Degrees, courses, certifications and achievements. The homepage section appears once you add an active entry."
        actions={
          <Button asChild>
            <Link href="/admin/education/new">
              <Plus /> Add entry
            </Link>
          </Button>
        }
      />
      <CareerList
        kind="education"
        basePath="/admin/education"
        status={status}
        counts={{ active, archived }}
        icon={GraduationCap}
        emptyTitle="No education or certifications yet"
        emptyDescription="Add degrees, certifications and achievements to show a credentials section."
        rows={items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: [item.institution, item.location].filter(Boolean).join(" · ") || "—",
          meta: `${item.kind} · ${item.kind === "education" ? formatPeriod(item.startDate, item.endDate) : formatMonth(item.endDate ?? item.startDate) || "no date"}`,
          status: item.status,
        }))}
      />
    </>
  );
}
