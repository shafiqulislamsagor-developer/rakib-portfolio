import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Project, Testimonial } from "@/lib/db/models";
import { toTestimonial } from "@/lib/db/serialize";
import { omit } from "@/lib/utils";
import { Types } from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TestimonialForm from "../testimonial-form";

export const metadata: Metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const [doc, projects] = await Promise.all([
    Testimonial.findById(id).lean(),
    Project.find({ status: "published" }).select("slug title").sort({ order: 1 }).lean(),
  ]);
  if (!doc) notFound();
  const item = toTestimonial(doc);
  return (
    <>
      <PageHeader title={item.name} description={[item.role, item.company].filter(Boolean).join(" · ")} />
      <TestimonialForm id={id} initial={omit(item, ["id"])} projects={projects.map((project) => ({ slug: project.slug, title: project.title }))} />
    </>
  );
}
