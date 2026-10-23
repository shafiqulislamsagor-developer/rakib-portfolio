"use client";

import { saveEducation } from "@/app/admin/_actions/career";
import { FormFooter, SelectField, TextAreaField, TextField, applyServerErrors, useUnsavedChangesWarning } from "@/app/admin/_components/fields";
import { Panel } from "@/app/admin/_components/ui";
import { EDUCATION_KINDS, ITEM_STATUSES } from "@/lib/constants";
import { educationSchema, type EducationInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const emptyEducation: EducationInput = {
  kind: "education",
  title: "",
  institution: "",
  location: "",
  startDate: "",
  endDate: "",
  credentialId: "",
  credentialUrl: "",
  description: "",
  order: 0,
  status: "active",
};

export default function EducationForm({ id, initial }: { id: string | null; initial: EducationInput }) {
  const router = useRouter();
  const form = useForm<EducationInput>({ resolver: zodResolver(educationSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);
  const kind = form.watch("kind");

  const onSubmit = async (values: EducationInput) => {
    const result = await saveEducation(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    if (!id && result.data) router.replace(`/admin/education/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-6">
        <Panel title="Details">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField
              name="kind"
              label="Type"
              options={EDUCATION_KINDS.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))}
            />
            <TextField
              name="title"
              label={kind === "education" ? "Degree / programme" : kind === "certification" ? "Certification" : "Achievement"}
              placeholder={kind === "education" ? "BSc in Computer Science" : kind === "certification" ? "AWS Certified Developer" : "Hackathon winner"}
            />
            <TextField name="institution" label={kind === "education" ? "Institution" : "Issuer / organisation"} />
            <TextField name="location" label="Location" />
            <TextField name="startDate" label={kind === "education" ? "Start month" : "Issued (month)"} type="month" />
            <TextField name="endDate" label={kind === "education" ? "End month" : "Expires (month)"} type="month" hint={kind === "education" ? "Empty = in progress" : "Optional"} />
            {kind !== "achievement" && (
              <>
                <TextField name="credentialId" label="Credential ID" />
                <TextField name="credentialUrl" label="Credential URL" type="url" placeholder="https://…" />
              </>
            )}
            <TextAreaField name="description" label="Description" rows={4} maxLength={2000} className="sm:col-span-2" />
          </div>
        </Panel>
        <Panel title="Visibility">
          <SelectField name="status" label="Status" options={ITEM_STATUSES.map((value) => ({ value, label: value === "active" ? "Active (shown on site)" : "Archived (hidden)" }))} />
        </Panel>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} cancelHref="/admin/education" submitLabel={id ? "Save" : "Add entry"} />
      </form>
    </FormProvider>
  );
}
