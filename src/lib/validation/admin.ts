import { z } from "zod";
import { MESSAGE_STATUSES } from "@/lib/constants";
import { requiredText, text } from "./common";

export const passwordSchema = z.string().min(1, "Password is required").max(200);
export const currentPasswordSchema = z.string().min(1, "Enter your current password").max(200);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(160),
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordPolicy = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128, "Use 128 characters or fewer")
  .refine((value) => /[a-z]/i.test(value) && /\d/.test(value), "Include letters and at least one number");

export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: passwordPolicy,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password you have not used here",
  });
export const passwordChangeSchema = changePasswordSchema;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PasswordChangeInput = ChangePasswordInput;

export const accountSchema = z.object({
  name: requiredText(2, 80, "Name"),
});

export const messageNoteSchema = z.object({ body: requiredText(1, 2000, "Note") });

export const messageStatusSchema = z.enum(MESSAGE_STATUSES);

export const mediaMetaSchema = z.object({
  alt: text(300),
  caption: text(500),
});
