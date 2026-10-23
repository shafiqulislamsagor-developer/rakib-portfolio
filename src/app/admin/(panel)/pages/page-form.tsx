"use client";

import { savePage } from "@/app/admin/_actions/pages";
import {
  FormFooter,
  MarkdownField,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { SeoFields } from "@/app/admin/_components/seo-fields";
import { Panel } from "@/app/admin/_components/ui";
import { PROJECT_STATUSES } from "@/lib/constants";
import { slugify } from "@/lib/validation/common";
import { pageSchema, type PageInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const emptyPage: PageInput = {
  title: "",
  slug: "",
  intro: "",
  content: "",
  status: "draft",
  showInFooter: true,
  seo: { title: "", description: "", ogImage: "", noIndex: false },
};

export default function PageForm({ id, initial, siteUrl }: { id: string | null; initial: PageInput; siteUrl: string }) {
  const router = useRouter();
  const form = useForm<PageInput>({ resolver: zodResolver(pageSchema), defaultValues: initial });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  useUnsavedChangesWarning(form.formState.isDirty);
  const title = form.watch("title");
  const slug = form.watch("slug");
  const intro = form.watch("intro");
  const { setValue } = form;

  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(title));
  }, [title, slugTouched, setValue]);

  const onSubmit = async (values: PageInput) => {
    const result = await savePage(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    if (!id && result.data) router.replace(`/admin/pages/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-6">
            <Panel title="Page">
              <div className="space-y-5">
                <TextField name="title" label="Title" maxLength={160} />
                <TextField
                  name="slug"
                  label="URL"
                  hint={`${siteUrl}/${slug || "…"}${id ? " — changing it keeps the old URL as a redirect" : ""}`}
                  onInput={() => setSlugTouched(true)}
                />
                <TextAreaField name="intro" label="Intro" rows={2} maxLength={400} hint="Shown under the title and used as the default meta description." />
                <MarkdownField name="content" label="Content" rows={20} />
              </div>
            </Panel>
          </div>
          <div className="min-w-0 space-y-6">
            <Panel title="Publishing">
              <div className="space-y-4">
                <SelectField name="status" label="Status" options={PROJECT_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
                <SwitchField name="showInFooter" label="Link in footer" description="Adds the page to the footer's “More” column." />
              </div>
            </Panel>
            <Panel title="SEO">
              <SeoFields fallbackTitle={title} fallbackDescription={intro} url={`${siteUrl}/${slug}`} />
            </Panel>
          </div>
        </div>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} cancelHref="/admin/pages" submitLabel={id ? "Save page" : "Create page"} />
      </form>
    </FormProvider>
  );
}
