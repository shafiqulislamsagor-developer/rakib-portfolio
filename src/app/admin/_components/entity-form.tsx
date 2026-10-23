"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type FieldValues, type Resolver, type UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/app/admin/_components/ui";
import { FormFooter, applyServerErrors, useUnsavedChangesWarning } from "@/app/admin/_components/fields";
import type { ActionResult } from "@/types/content";

export interface EntityFormProps<TValues extends FieldValues, TResult = unknown, TSchema = unknown> {
  schema: TSchema;
  defaultValues: UseFormProps<TValues>["defaultValues"];
  onSubmit: (values: TValues) => Promise<ActionResult<TResult>>;
  onSuccess?: (result: ActionResult<TResult>, values: TValues) => void;
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode | ((form: ReturnType<typeof useForm<TValues>>) => React.ReactNode);
  successMessage?: string;
  saveLabel?: string;
}

/**
 * Reusable layout and lifecycle shell for admin entity editors (posts, projects, services).
 * Wraps FormProvider, handles Zod validation, handles unsaved change warnings,
 * provides standard page headers with back navigation, and handles submit feedback.
 */
export function EntityForm<TValues extends FieldValues, TResult = unknown, TSchema = unknown>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  title,
  description,
  backHref,
  backLabel = "Back to list",
  headerActions,
  children,
  successMessage = "Changes saved successfully",
  saveLabel = "Save changes",
}: EntityFormProps<TValues, TResult, TSchema>) {
  const router = useRouter();
  const form = useForm<TValues>({
    resolver: zodResolver(schema as never) as Resolver<TValues>,
    defaultValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty && !form.formState.isSubmitting);

  const handleSubmit = form.handleSubmit(async (values: TValues) => {
    try {
      const result = await onSubmit(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error || "Please fix the errors in the form.");
        return;
      }
      toast.success(result.message ?? successMessage);
      onSuccess?.(result, values);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> {backLabel}
          </Link>
        )}

        <PageHeader
          title={title}
          description={description}
          actions={
            <div className="flex items-center gap-2">
              {headerActions}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saveLabel}
              </Button>
            </div>
          }
        />

        {typeof children === "function" ? children(form) : children}

        <FormFooter
          isSubmitting={form.formState.isSubmitting}
          isDirty={form.formState.isDirty}
          cancelHref={backHref ?? "/admin"}
          submitLabel={saveLabel}
        />
      </form>
    </FormProvider>
  );
}

