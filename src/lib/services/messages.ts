import { attachVisitorContact } from "@/lib/analytics/visitors";
import { connectDB } from "@/lib/db/connect";
import { Message } from "@/lib/db/models";
import { isDbConfigured } from "@/lib/env";
import { hmac } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { CONTACT_FORM_LIMITS } from "@/lib/security/rate-limit-config";
import mailFormSchema from "@/lib/validation/mail-form";

/*
 * Contact form submissions are stored in MongoDB and appear in the admin
 * inbox (with an unread badge and notifications). No email is sent — the
 * owner follows up personally and records the reply in the inbox.
 */

export const CONTACT_LIMITS = CONTACT_FORM_LIMITS;

export type ContactContext = {
  ip: string;
  userAgent: string;
  country: string;
  formEnabled: boolean;
};

export type ContactResult = { success: true } | { success: false; error: string };

export function spamScore(input: { name: string; subject: string; message: string }) {
  const text = `${input.name} ${input.subject} ${input.message}`;
  let score = 0;
  const links = text.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (links > 2) score += links;
  if (/\b(viagra|casino|crypto ?invest|seo services|backlinks|loan offer)\b/i.test(text)) score += 5;
  if (/<a\s|\[url=/i.test(text)) score += 3;
  if (/https?:\/\//i.test(input.name)) score += 3;
  return score;
}

export async function submitContactMessage(raw: unknown, context: ContactContext): Promise<ContactResult> {
  const parsed = mailFormSchema.safeParse(raw);
  if (!parsed.success) {
    // A filled honeypot gets a fake success so bots learn nothing.
    if (parsed.error.issues.some((issue) => issue.path[0] === "website")) return { success: true };
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  if (!context.formEnabled || !isDbConfigured()) {
    return { success: false, error: "The contact form is currently closed. Please reach out by email instead." };
  }

  const input = parsed.data;
  const tooFast = typeof input.startedAt === "number" && Date.now() - input.startedAt < CONTACT_LIMITS.minFillMs;
  const score = spamScore(input) + (tooFast ? 5 : 0);

  await connectDB();
  const ipHash = hmac(context.ip);
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit(`contact:ip:${ipHash}`, CONTACT_LIMITS.perIp.limit, CONTACT_LIMITS.perIp.windowMs),
    rateLimit(`contact:email:${hmac(input.email.toLowerCase())}`, CONTACT_LIMITS.perEmail.limit, CONTACT_LIMITS.perEmail.windowMs),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return { success: false, error: "Too many messages. Please try again in a few minutes." };
  }

  const status = score >= 5 ? "spam" : "pending";
  const created = await Message.create({
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    phone: input.phone ?? "",
    address: input.address ?? "",
    status,
    meta: { ipHash, userAgent: context.userAgent, country: context.country, spamScore: score, visitorId: input.visitorId ?? "" },
  });

  if (input.visitorId && status !== "spam") {
    await attachVisitorContact(input.visitorId, {
      name: input.name,
      email: input.email,
      phone: input.phone ?? "",
      address: input.address ?? "",
      messageId: created._id.toString(),
    }).catch((error) => console.error("[contact] failed to link visitor", error));
  }
  return { success: true };
}
