"use client";

import { saveProject } from "@/app/admin/_actions/projects";
import {
  FormFooter,
  MarkdownField,
  Repeater,
  SelectField,
  SwitchField,
  TagsField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { ImageField } from "@/app/admin/_components/media-field";
import { SeoFields } from "@/app/admin/_components/seo-fields";
import { Panel } from "@/app/admin/_components/ui";
import { PROJECT_STATUSES } from "@/lib/constants";
import { slugify } from "@/lib/validation/common";
import { projectSchema, type ProjectInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const emptyProject: ProjectInput = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  category: "",
  technologies: [],
  role: "",
  client: "",
  year: "",
  thumbnail: { url: "", alt: "" },
  cover: { url: "", alt: "" },
  gallery: [],
  process: { body: "", images: [] },
  fullPreview: { url: "", alt: "" },
  liveUrl: "",
  repoUrl: "",
  featured: false,
  order: 0,
  status: "draft",
  seo: { title: "", description: "", ogImage: "", noIndex: false },
};

export default function ProjectForm({
  id,
  initial,
  categories,
  siteUrl,
}: {
  id: string | null;
  initial: ProjectInput;
  categories: string[];
  siteUrl: string;
}) {
  const router = useRouter();
  const form = useForm<ProjectInput>({ resolver: zodResolver(projectSchema), defaultValues: initial });
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, isDirty },
  } = form;
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  useUnsavedChangesWarning(isDirty);

  const title = watch("title");
  const slug = watch("slug");
  const summary = watch("summary");
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(title), { shouldValidate: false });
  }, [title, slugTouched, setValue]);

  const onSubmit = async (values: ProjectInput) => {
    const result = await saveProject(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    reset(values);
    if (!id && result.data) router.replace(`/admin/projects/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-6">
            <Panel title="Basics">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField name="title" label="Title" className="sm:col-span-2" maxLength={160} />
                <TextField
                  name="slug"
                  label="URL slug"
                  className="sm:col-span-2"
                  hint={`${siteUrl}/projects/${slug || "…"}${id ? " — changing it keeps the old URL as a redirect" : ""}`}
                  onInput={() => setSlugTouched(true)}
                />
                <TextAreaField name="summary" label="Summary" className="sm:col-span-2" rows={4} maxLength={1200} hint="Shown on cards and at the top of the case study." />
                <div className="space-y-2">
                  <TextField name="category" label="Category" list="project-categories" placeholder="Full Stack, Frontend…" />
                  <datalist id="project-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <TextField name="year" label="Year" placeholder="2026" maxLength={20} />
                <TextField name="role" label="Your role" placeholder="Lead frontend engineer" />
                <TextField name="client" label="Client / company" />
                <div className="sm:col-span-2">
                  <TagsField name="technologies" label="Technologies" placeholder="React, Next.js…" />
                </div>
              </div>
            </Panel>

            <Panel title="Links">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField name="liveUrl" label="Live site URL" type="url" placeholder="https://…" />
                <TextField name="repoUrl" label="Repository URL" type="url" placeholder="https://github.com/…" />
              </div>
            </Panel>

            <Panel title="Images">
              <div className="space-y-6">
                <ImageField name="thumbnail" label="Thumbnail" hint="Used on project cards." />
                <ImageField name="cover" label="Cover image" hint="Large image at the top of the case study. Falls back to the thumbnail." />
                <Repeater
                  name="gallery"
                  label="Gallery"
                  max={20}
                  addLabel="Add image"
                  emptyItem={{ url: "", alt: "" }}
                  renderItem={(_, prefix) => (
                    <div className="sm:col-span-2">
                      <ImageField name={prefix} label="Image" aspect="aspect-[4/3]" />
                    </div>
                  )}
                  hint="The first four fill the Overview grid on the case study, in order."
                />
              </div>
            </Panel>

            <Panel
              title="Design process"
              description="The block below Overview: one paragraph and up to three shots, laid out as in the design."
            >
              <div className="space-y-6">
                <TextAreaField
                  name="process.body"
                  label="How you worked"
                  rows={7}
                  placeholder="Research, wireframes, iterations — the route from brief to result."
                />
                <Repeater
                  name="process.images"
                  label="Process shots"
                  max={3}
                  addLabel="Add shot"
                  emptyItem={{ url: "", alt: "" }}
                  renderItem={(_, prefix) => (
                    <div className="sm:col-span-2">
                      <ImageField name={prefix} label="Image" aspect="aspect-[4/3]" />
                    </div>
                  )}
                  hint="Three slots: two side by side, then one full width."
                />
                <ImageField
                  name="fullPreview"
                  label="Full overview"
                  hint="The one tall screenshot of the whole design that closes the case study."
                  aspect="aspect-[3/4]"
                />
              </div>
            </Panel>

            <Panel title="Case study" description="The story: the problem, your approach, the result. Leave empty to show only the summary.">
              <MarkdownField
                name="content"
                label="Content"
                placeholder={"## The challenge\n\n…\n\n## What I built\n\n…\n\n## Outcome\n\n…"}
              />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Publishing">
              <div className="space-y-4">
                <SelectField
                  name="status"
                  label="Status"
                  options={PROJECT_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))}
                  hint="Only published projects appear on the site."
                />
                <SwitchField name="featured" label="Feature on homepage" description="Featured projects appear in the homepage grid." />
              </div>
            </Panel>
            <Panel title="SEO">
              <SeoFields fallbackTitle={title} fallbackDescription={summary} url={`${siteUrl}/projects/${slug}`} />
            </Panel>
          </div>
        </div>
        <FormFooter isSubmitting={isSubmitting} isDirty={isDirty} cancelHref="/admin/projects" submitLabel={id ? "Save project" : "Create project"} />
      </form>
    </FormProvider>
  );
}
