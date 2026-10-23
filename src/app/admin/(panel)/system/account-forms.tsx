"use client";

import { changeOwnPassword, updateAccountName } from "@/app/admin/_actions/system";
import { TextField } from "@/app/admin/_components/fields";
import { useAdminForm } from "@/app/admin/_components/use-admin-form";
import { Button } from "@/components/ui/button";
import { accountSchema, changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/admin";
import { KeyRound, Loader2 } from "lucide-react";
import { FormProvider } from "react-hook-form";

export function AccountNameForm({ name }: { name: string }) {
  const { handleSubmit, isSubmitting, register, watch } = useAdminForm<{ name: string }>({
    schema: accountSchema,
    defaultValues: { name },
    onSubmit: async (values) => updateAccountName(values.name),
    successMessage: "Account name saved",
  });

  const currentName = watch("name");
  const isUnchanged = !currentName || currentName.trim() === name;

  return (
    <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={handleSubmit} noValidate>
      <label className="flex-1 space-y-2 text-sm font-medium">
        Display name
        <input
          {...register("name")}
          maxLength={80}
          className="flex h-10 w-full rounded-[4px] border border-input bg-background px-3 text-sm font-normal"
        />
      </label>
      <Button type="submit" variant="outline" disabled={isSubmitting || isUnchanged}>
        {isSubmitting && <Loader2 className="animate-spin" />} Save
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const { form, handleSubmit, isSubmitting } = useAdminForm<ChangePasswordInput>({
    schema: changePasswordSchema,
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    onSubmit: changeOwnPassword,
    successMessage: "Password changed successfully",
    resetOnSuccess: true,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
        <TextField
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 12 characters, with letters and a number."
        />
        <TextField name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />} Change password
        </Button>
      </form>
    </FormProvider>
  );
}
