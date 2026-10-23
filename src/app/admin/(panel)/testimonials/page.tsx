import CareerList from "@/app/admin/_components/career-list";
import { PageHeader } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Testimonial } from "@/lib/db/models";
import { toTestimonial } from "@/lib/db/serialize";
import { MessageSquareQuote, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await adminPage();
  const status = param((await searchParams).status) === "archived" ? "archived" : "active";
  const [docs, active, archived] = await Promise.all([
    Testimonial.find({ status }).sort({ order: 1, createdAt: -1 }).lean(),
    Testimonial.countDocuments({ status: "active" }),
    Testimonial.countDocuments({ status: "archived" }),
  ]);
  const items = docs.map(toTestimonial);

  return (
    <>
      <PageHeader
        icon={MessageSquareQuote}
        title="Testimonials"
        description="Recommendations from clients and colleagues. The section appears on the site once you add an active testimonial."
        actions={
          <Button asChild>
            <Link href="/admin/testimonials/new">
              <Plus /> Add testimonial
            </Link>
          </Button>
        }
      />
      <CareerList
        kind="testimonial"
        basePath="/admin/testimonials"
        status={status}
        counts={{ active, archived }}
        icon={MessageSquareQuote}
        emptyTitle="No testimonials yet"
        emptyDescription="Add real recommendations — for example from LinkedIn — with permission from the person."
        rows={items.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: [item.role, item.company].filter(Boolean).join(" · ") || "—",
          meta: `“${item.quote.slice(0, 90)}${item.quote.length > 90 ? "…" : ""}”`,
          status: item.status,
          badge: item.featured ? "Homepage" : undefined,
        }))}
      />
    </>
  );
}
