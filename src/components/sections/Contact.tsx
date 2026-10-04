"use client";

import { useState, type FormEvent } from "react";
import { contact } from "@/data/site";
import { Eyebrow, OutlineButton } from "../ui";

type ContactProps = {
  intro?: string;
  /** paddings of the heading block differ slightly between pages */
  headingGap?: number;
  headingPadRight?: number;
  placeholders?: { name: string; email: string; company: string; details: string };
  className?: string;
};

const defaults = {
  intro:
    "Have a project in mind or just want to say hello? I’m always open to discussing new ideas, collaborations, or opportunities. Let’s connect and create something great together.",
  placeholders: {
    name: "Type your name here",
    email: "Enter you email",
    company: "Company name",
    details: "About your project",
  },
};

const labelCls = "block text-[14px] leading-[21px] text-white/80";
const fieldCls =
  "block w-full border-b border-white/[0.32] bg-transparent py-2 text-[16px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/70";

export function Contact({
  intro = defaults.intro,
  headingGap = 16,
  headingPadRight = 67,
  placeholders = defaults.placeholders,
  className = "",
}: ContactProps) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = [
      `Name: ${data.get("name") ?? ""}`,
      `Email: ${data.get("email") ?? ""}`,
      `Company: ${data.get("company") ?? ""}`,
      "",
      String(data.get("details") ?? ""),
    ].join("\n");
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
      "New project enquiry",
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="contact" className={`relative mx-auto flex w-full max-w-[1360px] justify-between gap-5 ${className}`}>
      <div className="flex w-[670px] flex-col gap-2">
        <Eyebrow className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">{"/     Contact"}</Eyebrow>
        <div className="flex flex-col" style={{ gap: headingGap, paddingRight: headingPadRight }}>
          <h2 className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">LET&apos;S WORK TOGETHER</h2>
          <p className="max-w-[531px] text-[16px] leading-[20px] text-g2">{intro}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex w-[670px] flex-col gap-[51px]">
        <label className="flex flex-col gap-px">
          <span className={labelCls}>Name</span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder={placeholders.name}
            className={`${fieldCls} h-[35px] font-inter leading-[19.36px]`}
          />
        </label>
        <label className="flex flex-col">
          <span className={labelCls}>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={placeholders.email}
            className={`${fieldCls} h-[37px] leading-[21.28px]`}
          />
        </label>
        <label className="flex flex-col">
          <span className={labelCls}>I work at (optional)</span>
          <input
            name="company"
            autoComplete="organization"
            placeholder={placeholders.company}
            className={`${fieldCls} h-[37px] leading-[21.28px]`}
          />
        </label>
        <label className="flex flex-col">
          <span className={labelCls}>Details about the project</span>
          <textarea
            name="details"
            placeholder={placeholders.details}
            className={`${fieldCls} h-[120px] resize-none leading-[22.86px]`}
          />
        </label>
        <div className="flex items-center gap-6">
          <OutlineButton label="Send" type="submit" className="w-[226px]" />
          {sent && <span className="text-[14px] text-g2">Your mail app should open now — thanks!</span>}
        </div>
      </form>
    </section>
  );
}
