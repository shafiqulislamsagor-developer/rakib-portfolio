"use server";

import { headers } from "next/headers";
import { getSiteSettings } from "@/lib/content/public";
import { getClientIp, getCountry, getUserAgent } from "@/lib/security/request";
import { submitContactMessage } from "@/lib/services/messages";
import type { FormData } from "@/types/mail-form";

/** Public Server Action behind the contact form: stores the message in the admin inbox. */
export async function sendContactMessage(formData: FormData) {
  try {
    const requestHeaders = await headers();
    const settings = await getSiteSettings();
    const result = await submitContactMessage(formData, {
      ip: getClientIp(requestHeaders),
      userAgent: getUserAgent(requestHeaders),
      country: getCountry(requestHeaders),
      formEnabled: settings.contact.formEnabled,
    });
    return result.success
      ? { success: true as const, error: null }
      : { success: false as const, error: result.error };
  } catch (error) {
    console.error("Contact submission failed:", error);
    return { success: false as const, error: "Something went wrong. Please try again." };
  }
}
