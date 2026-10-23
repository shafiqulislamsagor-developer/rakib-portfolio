"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldValues, type Resolver, type UseFormProps, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/app/admin/_components/fields";
import type { ActionResult } from "@/types/content";

export interface UseAdminFormOptions<TValues extends FieldValues, TResult = unknown, TSchema = unknown> {
  schema?: TSchema;
  defaultValues?: UseFormProps<TValues>["defaultValues"];
  onSubmit: (values: TValues) => Promise<ActionResult<TResult>>;
  successMessage?: string | ((result: ActionResult<TResult>) => string);
  onSuccess?: (result: ActionResult<TResult>, values: TValues) => void;
  resetOnSuccess?: boolean;
}

export interface UseAdminFormReturn<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  register: UseFormReturn<TValues>["register"];
  control: UseFormReturn<TValues>["control"];
  watch: UseFormReturn<TValues>["watch"];
  setValue: UseFormReturn<TValues>["setValue"];
  formState: UseFormReturn<TValues>["formState"];
  reset: UseFormReturn<TValues>["reset"];
}

/**
 * Reusable admin form hook handling Zod validation, submission lifecycle,
 * server error mapping, toast notifications, and cache refresh.
 */
export function useAdminForm<TValues extends FieldValues, TResult = unknown, TSchema = unknown>({
  schema,
  defaultValues,
  onSubmit,
  successMessage = "Saved successfully",
  onSuccess,
  resetOnSuccess = false,
}: UseAdminFormOptions<TValues, TResult, TSchema>): UseAdminFormReturn<TValues> {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TValues>({
    resolver: schema ? (zodResolver(schema as never) as Resolver<TValues>) : undefined,
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values: TValues) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error || "Submission failed. Please check the form.");
        return;
      }

      const message =
        typeof successMessage === "function"
          ? successMessage(result)
          : (result.message ?? successMessage);

      if (message) {
        toast.success(message);
      }

      if (resetOnSuccess) {
        form.reset();
      }

      onSuccess?.(result, values);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: isSubmitting || form.formState.isSubmitting,
    register: form.register,
    control: form.control,
    watch: form.watch,
    setValue: form.setValue,
    formState: form.formState,
    reset: form.reset,
  };
}

