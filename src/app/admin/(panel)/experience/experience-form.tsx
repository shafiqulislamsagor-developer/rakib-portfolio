"use client";

import { saveExperience } from "@/app/admin/_actions/career";
import {
  FormFooter,
  Repeater,
  SelectField,
  StringListField,
  TagsField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { Panel } from "@/app/admin/_components/ui";
import { EXPERIENCE_TYPES, ITEM_STATUSES } from "@/lib/constants";
import { experienceSchema, type ExperienceInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const emptyExperience: ExperienceInput = {
  type: "work",
  title: "",
  company: "",
  companyUrl: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  achievements: [],
  progression: [],
  technologies: [],
  order: 0,
  status: "active",
};

const label = (value: string) => value[0].toUpperCase() + value.slice(1);

export default function ExperienceForm({ id, initial }: { id: string | null; initial: ExperienceInput }) {
  const router = useRouter();
  const form = useForm<ExperienceInput>({ resolver: zodResolver(experienceSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: ExperienceInput) => {
    const result = await saveExperience(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    if (!id && result.data) router.replace(`/admin/experience/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-6">
        <Panel title="Role">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField name="title" label="Job title" className="sm:col-span-2" placeholder="Senior Frontend Engineer (Full-Time)" />
            <TextField name="company" label="Company" />
            <TextField name="companyUrl" label="Company website" type="url" placeholder="https://…" />
            <TextField name="location" label="Location" placeholder="Dhaka, Bangladesh (Remote)" />
            <SelectField name="type" label="Type" options={EXPERIENCE_TYPES.map((value) => ({ value, label: label(value) }))} />
            <TextField name="startDate" label="Start month" type="month" />
            <TextField name="endDate" label="End month" type="month" hint="Leave empty if this is your current role." />
          </div>
        </Panel>
        <Panel title="Details">
          <div className="space-y-5">
            <TextAreaField name="description" label="Description" rows={4} maxLength={2000} />
            <StringListField name="achievements" label="Key achievements" hint="The first two appear on the homepage." placeholder="Shipped…" />
            <TagsField name="technologies" label="Technologies" />
          </div>
        </Panel>
        <Panel title="Career progression" description="Optional: promotions within this company, shown as a “Career level up” timeline.">
          <Repeater
            name="progression"
            label="Roles"
            addLabel="Add role"
            emptyItem={{ title: "", startDate: "", endDate: "" }}
            renderItem={(_, prefix) => (
              <>
                <TextField name={`${prefix}.title`} label="Role title" className="sm:col-span-2" />
                <TextField name={`${prefix}.startDate`} label="Start month" type="month" />
                <TextField name={`${prefix}.endDate`} label="End month" type="month" hint="Empty = current" />
              </>
            )}
          />
        </Panel>
        <Panel title="Visibility">
          <SelectField name="status" label="Status" options={ITEM_STATUSES.map((value) => ({ value, label: value === "active" ? "Active (shown on site)" : "Archived (hidden)" }))} />
        </Panel>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} cancelHref="/admin/experience" submitLabel={id ? "Save" : "Add experience"} />
      </form>
    </FormProvider>
  );
}
