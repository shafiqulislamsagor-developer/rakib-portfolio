"use client";

import { saveTestimonial } from "@/app/admin/_actions/career";
import {
  Field,
  FormFooter,
  NativeSelect,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { ImageField } from "@/app/admin/_components/media-field";
import { Panel } from "@/app/admin/_components/ui";
import { ITEM_STATUSES } from "@/lib/constants";
import { testimonialSchema, type TestimonialInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const emptyTestimonial: TestimonialInput = {
  name: "",
  role: "",
  company: "",
  avatar: { url: "", alt: "" },
  quote: "",
  rating: null,
  sourceUrl: "",
  projectSlug: "",
  featured: true,
  order: 0,
  status: "active",
};

export default function TestimonialForm({
  id,
  initial,
  projects,
}: {
  id: string | null;
  initial: TestimonialInput;
  projects: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const form = useForm<TestimonialInput>({ resolver: zodResolver(testimonialSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: TestimonialInput) => {
    const result = await saveTestimonial(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    if (!id && result.data) router.replace(`/admin/testimonials/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-6">
        <Panel title="Testimonial" description="Only publish real feedback you have permission to share.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextAreaField name="quote" label="Quote" rows={5} maxLength={1200} className="sm:col-span-2" />
            <TextField name="name" label="Name" />
            <TextField name="role" label="Role" placeholder="Product Manager" />
            <TextField name="company" label="Company" />
            <Controller
              control={form.control}
              name="rating"
              render={({ field }) => (
                <Field label="Rating (optional)">
                  <NativeSelect value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}>
                    <option value="">No rating</option>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {"★".repeat(value)} ({value}/5)
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />
            <TextField name="sourceUrl" label="Source link (optional)" type="url" placeholder="https://linkedin.com/in/…" hint="e.g. the original LinkedIn recommendation." />
            <SelectField
              name="projectSlug"
              label="Related project (optional)"
              options={[{ value: "", label: "None" }, ...projects.map((project) => ({ value: project.slug, label: project.title }))]}
              hint="Also shown on that project's case study."
            />
            <div className="sm:col-span-2">
              <ImageField name="avatar" label="Photo (optional)" aspect="aspect-square" hint="Initials are shown when empty." />
            </div>
          </div>
        </Panel>
        <Panel title="Visibility">
          <div className="space-y-4">
            <SwitchField name="featured" label="Show on the homepage" description="All active testimonials appear on About and Services." />
            <SelectField name="status" label="Status" options={ITEM_STATUSES.map((value) => ({ value, label: value === "active" ? "Active (shown on site)" : "Archived (hidden)" }))} />
          </div>
        </Panel>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} cancelHref="/admin/testimonials" submitLabel={id ? "Save testimonial" : "Add testimonial"} />
      </form>
    </FormProvider>
  );
}
