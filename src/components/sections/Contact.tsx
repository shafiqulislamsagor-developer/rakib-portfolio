"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { getVisitorId } from "@/app/(site)/visitor-tracker";
import { sendContactMessage } from "@/lib/mails/send-contact";
import { Eyebrow, OutlineButton } from "../kit";

type ContactProps = {
  eyebrow: string;
  heading: string;
  intro: string;
  /** paddings of the heading block differ slightly between pages */
  headingGap?: number;
  headingPadRight?: number;
  placeholders?: { name: string; email: string; company: string; details: string };
  className?: string;
  /** Closed in Admin → Settings: the form is replaced by the email address. */
  formEnabled?: boolean;
  email?: string;
};

const defaultPlaceholders = {
  name: "Type your name here",
  email: "Enter you email",
  company: "Company name",
  details: "About your project",
};

const labelCls =
  "block text-[14px] leading-[21px] text-white/80 transition-colors duration-300 group-focus-within/field:text-white";
const fieldCls =
  "peer block w-full border-b border-white/[0.32] bg-transparent py-2 text-[16px] text-white outline-none transition-colors duration-300 placeholder:text-white/40 hover:border-white/60";

/** Field wrapper: the underline brightens on hover and a white line draws in on focus (AZ form). */
function Field({ label, gap, children }: { label: string; gap?: boolean; children: ReactNode }) {
  return (
    <label className={`group/field relative flex flex-col ${gap ? "gap-px" : ""}`}>
      <span className={labelCls}>{label}</span>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-700 ease-out-soft peer-focus:scale-x-100"
      />
    </label>
  );
}

export function Contact({
  eyebrow,
  heading,
  intro,
  headingGap = 16,
  headingPadRight = 67,
  placeholders = defaultPlaceholders,
  className = "",
  formEnabled = true,
  email = "",
}: ContactProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  /*
   * When the form became usable. Submissions that arrive within a moment of it
   * are bots (see CONTACT_LIMITS.minFillMs). It is stamped after mount rather
   * than during render, so the value belongs to the visitor's session and not
   * to the moment the page was rendered on the server.
   */
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const company = String(data.get("company") ?? "").trim();
    const details = String(data.get("details") ?? "").trim();

    setState("sending");
    setError(null);
    const result = await sendContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      // The design has no subject field, so the company line becomes the subject.
      subject: company ? `New project enquiry — ${company}` : "New project enquiry",
      message: company ? `${details}\n\nCompany: ${company}` : details,
      website: String(data.get("website") ?? ""),
      startedAt: startedAt.current || undefined,
      visitorId: getVisitorId(),
    });

    if (result.success) {
      setState("sent");
      form.reset();
      startedAt.current = Date.now();
    } else {
      setState("idle");
      setError(result.error);
    }
  }

  return (
    <section id="contact" className={`relative mx-auto flex w-full max-w-[1360px] justify-between gap-5 ${className}`}>
      {/* pinned while the form scrolls past it (see [data-sticky] in globals.css) */}
      <div
        data-sticky
        className="flex h-fit w-[670px] flex-col gap-2 self-start"
        style={{ "--sticky-top": "128px" } as CSSProperties}
      >
        <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">
          {`/     ${eyebrow}`}
        </Eyebrow>
        <div className="flex flex-col" style={{ gap: headingGap, paddingRight: headingPadRight }}>
          <h2 data-reveal="lines" className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
            {heading}
          </h2>
          <p data-reveal="lines" data-reveal-delay="0.15" className="max-w-[531px] text-[16px] leading-[20px] text-g2">
            {intro}
          </p>
        </div>
      </div>

      {formEnabled ? (
        <form data-reveal="stagger" data-track="Contact form" onSubmit={onSubmit} className="flex w-[670px] flex-col gap-[51px]">
          <Field label="Name" gap>
            <input
              name="name"
              required
              autoComplete="name"
              placeholder={placeholders.name}
              className={`${fieldCls} h-[35px] font-inter leading-[19.36px]`}
            />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={placeholders.email}
              className={`${fieldCls} h-[37px] leading-[21.28px]`}
            />
          </Field>
          <Field label="I work at (optional)">
            <input
              name="company"
              autoComplete="organization"
              placeholder={placeholders.company}
              className={`${fieldCls} h-[37px] leading-[21.28px]`}
            />
          </Field>
          <Field label="Details about the project">
            <textarea
              name="details"
              required
              minLength={10}
              placeholder={placeholders.details}
              className={`${fieldCls} h-[120px] resize-none leading-[22.86px]`}
            />
          </Field>
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] size-0 opacity-0"
          />
          <div className="flex items-center gap-6">
            <OutlineButton
              label={state === "sending" ? "Sending" : "Send"}
              type="submit"
              className="w-[226px]"
              disabled={state === "sending"}
            />
            <span role="status" aria-live="polite" className="text-[14px] text-g2">
              {state === "sent" && "Thanks — your message is in. I'll reply within one business day."}
            </span>
          </div>
          {error && (
            <p role="alert" className="text-[14px] text-destructive">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div data-reveal="up" className="flex w-[670px] flex-col gap-6 pt-2">
          <p className="text-[18px] leading-[28px] text-g2">
            The form is closed at the moment — email is the fastest way to reach me.
          </p>
          {email && <OutlineButton label={email} href={`mailto:${email}`} className="w-[340px]" />}
        </div>
      )}
    </section>
  );
}
