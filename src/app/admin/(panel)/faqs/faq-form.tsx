"use client";

import { saveFaq } from "@/app/admin/_actions/career";
import {
  Field,
  FormFooter,
  MarkdownField,
  SelectField,
  TextField,
  applyServerErrors,
  useFieldError,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { Panel } from "@/app/admin/_components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { FAQ_PLACEMENTS, ITEM_STATUSES, type FaqPlacement } from "@/lib/constants";
import { faqSchema, type FaqInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";

export const emptyFaq: FaqInput = { question: "", answer: "", placements: ["home"], order: 0, status: "active" };

const PLACEMENT_LABELS: Record<FaqPlacement, string> = { home: "Homepage", services: "Services page", contact: "Contact page" };

function PlacementsField() {
  const { control } = useFormContext<FaqInput>();
  const error = useFieldError("placements");
  return (
    <Controller
      control={control}
      name="placements"
      render={({ field }) => (
        <Field label="Show on" error={error}>
          <div className="flex flex-wrap gap-4">
            {FAQ_PLACEMENTS.map((placement) => (
              <label key={placement} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value.includes(placement)}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? [...field.value, placement] : field.value.filter((item) => item !== placement))
                  }
                />
                {PLACEMENT_LABELS[placement]}
              </label>
            ))}
          </div>
        </Field>
      )}
    />
  );
}

export default function FaqForm({ id, initial }: { id: string | null; initial: FaqInput }) {
  const router = useRouter();
  const form = useForm<FaqInput>({ resolver: zodResolver(faqSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: FaqInput) => {
    const result = await saveFaq(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    if (!id && result.data) router.replace(`/admin/faqs/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-6">
        <Panel title="Question">
          <div className="space-y-5">
            <TextField name="question" label="Question" maxLength={200} />
            <MarkdownField name="answer" label="Answer" rows={6} hint="Markdown supported — links like [About](/about) work." />
            <PlacementsField />
            <SelectField name="status" label="Status" options={ITEM_STATUSES.map((value) => ({ value, label: value === "active" ? "Active (shown on site)" : "Archived (hidden)" }))} />
          </div>
        </Panel>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} cancelHref="/admin/faqs" submitLabel={id ? "Save question" : "Add question"} />
      </form>
    </FormProvider>
  );
}
