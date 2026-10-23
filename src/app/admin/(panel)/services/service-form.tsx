"use client";

import { saveService } from "@/app/admin/_actions/career";
import {
  FormFooter,
  SelectField,
  StringListField,
  SwitchField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { ImageField } from "@/app/admin/_components/media-field";
import { Panel } from "@/app/admin/_components/ui";
import { ContentIcon } from "@/components/content-icon";
import { ITEM_STATUSES, STRENGTH_ICONS } from "@/lib/constants";
import { serviceSchema, type ServiceInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const emptyService: ServiceInput = {
  title: "",
  summary: "",
  icon: "code",
  image: { url: "", alt: "" },
  deliverables: [],
  price: { amount: "", unit: "", note: "" },
  details: "",
  popular: false,
  featured: true,
  order: 0,
  status: "active",
};

export default function ServiceForm({ id, initial }: { id: string | null; initial: ServiceInput }) {
  const router = useRouter();
  const form = useForm<ServiceInput>({ resolver: zodResolver(serviceSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);
  const icon = form.watch("icon");

  const onSubmit = async (values: ServiceInput) => {
    const result = await saveService(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    if (!id && result.data) router.replace(`/admin/services/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-6">
        <Panel title="Service">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_14rem]">
            <TextField name="title" label="Title" placeholder="Full-stack web applications" maxLength={100} />
            <div className="flex items-end gap-3">
              <SelectField name="icon" label="Icon" className="flex-1" options={STRENGTH_ICONS.map((value) => ({ value, label: value }))} />
              <span className="mb-1 grid size-10 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary" aria-hidden="true">
                <ContentIcon name={icon} className="size-5" />
              </span>
            </div>
            <TextAreaField name="summary" label="Summary" rows={3} maxLength={400} className="sm:col-span-2" hint="One or two sentences on the outcome you deliver." />
            <div className="sm:col-span-2">
              <ImageField
                name="image"
                label="Preview shot"
                hint="Revealed beside the title when this row expands on the home page."
                aspect="aspect-[2/1]"
              />
            </div>
            <div className="sm:col-span-2">
              <StringListField name="deliverables" label="What's included" max={8} placeholder="REST APIs with Node.js" hint="Shown as a checklist on the card." />
            </div>
          </div>
        </Panel>

        <Panel title="Price" description="All optional — leave the amount empty and the card simply shows no price.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <TextField name="price.amount" label="Amount" placeholder="৳45,000" maxLength={40} hint="Free text, so any currency or “From …” works." />
            <TextField name="price.unit" label="Per" placeholder="per project" maxLength={40} hint="Shown next to the amount." />
            <TextField name="price.note" label="Small print" placeholder="2–4 weeks · 50% up front" maxLength={140} />
            <div className="sm:col-span-3">
              <TextAreaField
                name="details"
                label="Details"
                rows={8}
                maxLength={8000}
                hint="Markdown. Shown under the card on /services — scope, what is not included, how billing works."
              />
            </div>
          </div>
        </Panel>

        <Panel title="Visibility">
          <div className="space-y-4">
            <SwitchField name="popular" label="Mark as the recommended option" description="Adds a “Most popular” badge and highlights the card." />
            <SwitchField name="featured" label="Show on the homepage" description="All active services appear on /services." />
            <SelectField name="status" label="Status" options={ITEM_STATUSES.map((value) => ({ value, label: value === "active" ? "Active (shown on site)" : "Archived (hidden)" }))} />
          </div>
        </Panel>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} cancelHref="/admin/services" submitLabel={id ? "Save service" : "Add service"} />
      </form>
    </FormProvider>
  );
}
