import { z } from "zod";

const mailFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(80, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(160, "Email is too long"),
  subject: z
    .string()
    .trim()
    .min(3, "Tell me what this is about")
    .max(120, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail")
    .max(3000, "Message is too long"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .refine((value) => value === "" || /^\+?[\d\s()-]{6,}$/.test(value), "Enter a valid phone number")
    .optional(),
  address: z.string().trim().max(200, "Address is too long").optional(),
  // The visitor-log id from the tracker, so the message links to what the sender did on the site.
  visitorId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional().catch(undefined),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0, "Invalid submission").optional(),
  // When the form was rendered (ms since epoch) — instant submissions are bots.
  startedAt: z.number().int().positive().optional(),
});

export default mailFormSchema;
