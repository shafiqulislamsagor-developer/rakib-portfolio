"use client";

import { saveProcess } from "@/app/admin/_actions/site";
import { Repeater, TextAreaField, TextField, applyServerErrors } from "@/app/admin/_components/fields";
import { Button } from "@/components/ui/button";
import { processSchema, type ProcessInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

/** Steps shown in the "How we'll work together" section on /services. */
export default function ProcessForm({ initial }: { initial: ProcessInput }) {
  const router = useRouter();
  const form = useForm<ProcessInput>({ resolver: zodResolver(processSchema), defaultValues: initial });
  const onSubmit = async (values: ProcessInput) => {
    const result = await saveProcess(values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    router.refresh();
  };
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Repeater
          name="process"
          label="Steps"
          max={8}
          addLabel="Add step"
          emptyItem={{ title: "", description: "" }}
          renderItem={(_, prefix) => (
            <>
              <TextField name={`${prefix}.title`} label="Title" className="sm:col-span-2" />
              <TextAreaField name={`${prefix}.description`} label="Description" rows={2} maxLength={400} className="sm:col-span-2" />
            </>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} Save process
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
