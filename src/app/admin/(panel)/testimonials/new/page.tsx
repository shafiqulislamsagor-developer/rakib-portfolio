import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Project } from "@/lib/db/models";
import type { Metadata } from "next";
import TestimonialForm, { emptyTestimonial } from "../testimonial-form";

export const metadata: Metadata = { title: "Add testimonial" };

export default async function NewTestimonialPage() {
  await adminPage();
  const projects = await Project.find({ status: "published" }).select("slug title").sort({ order: 1 }).lean();
  return (
    <>
      <PageHeader title="Add testimonial" />
      <TestimonialForm id={null} initial={emptyTestimonial} projects={projects.map((project) => ({ slug: project.slug, title: project.title }))} />
    </>
  );
}
