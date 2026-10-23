import { ASIDE_SECTIONS, type ResumeTemplate } from "@/lib/constants";
import type { Resume, ResumeSection } from "@/types/content";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { SectionBody } from "./resume-blocks";

/*
 * The four résumé layouts (Admin → Résumé → Layout). A template decides the
 * page frame, where the heading of a block sits and how dense the type is —
 * never what a block contains, which is SectionBody's job. All of them keep the
 * .resume-sheet / .resume-block / .resume-item class names the print rules in
 * app/globals.css hang off, so every template prints cleanly.
 */

export type TemplateProps = { resume: Resume };

function ContactList({ resume, className }: { resume: Resume; className?: string }) {
  return (
    <ul className={cn("resume-contacts flex flex-wrap gap-x-5 gap-y-1.5 text-sm", className)}>
      {resume.header.contacts.map((contact) => (
        <li key={contact.href}>
          <a href={contact.href} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {contact.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- Classic

/** Label in a left gutter, content on the right. The original layout. */
function ClassicBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="resume-block grid gap-4 border-t border-border py-8 sm:grid-cols-[10rem_1fr] sm:gap-8">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-primary">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Classic({ resume }: TemplateProps) {
  return (
    <article className="resume-sheet resume-sheet--classic rounded-[4px] border border-[#4e4e4e]/50 bg-white/[0.015] p-6 sm:p-12">
      <header className="resume-head pb-8">
        <h1 className="resume-name text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{resume.header.name}</h1>
        <p className="resume-headline mt-2 text-lg text-primary">{resume.header.headline}</p>
        {resume.header.location && <p className="resume-location mt-1 text-sm text-muted-foreground">{resume.header.location}</p>}
        <ContactList resume={resume} className="mt-5" />
      </header>
      {resume.sections.map((section) => (
        <ClassicBlock key={section.key} title={section.title}>
          <SectionBody section={section} />
        </ClassicBlock>
      ))}
    </article>
  );
}

// ---------------------------------------------------------------- Sidebar

function SidebarBlock({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return (
    <section className={cn("resume-block", compact ? "pb-6" : "border-t border-border pt-6 first:border-t-0 first:pt-0")}>
      <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-primary">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Narrow column for the short blocks, wide column for the story. */
function Sidebar({ resume }: TemplateProps) {
  const aside = resume.sections.filter((section) => ASIDE_SECTIONS.includes(section.key));
  const main = resume.sections.filter((section) => !ASIDE_SECTIONS.includes(section.key));
  return (
    <article className="resume-sheet resume-sheet--sidebar rounded-[4px] border border-[#4e4e4e]/50 bg-white/[0.015] p-6 sm:p-10">
      <header className="resume-head border-b border-border pb-7">
        <h1 className="resume-name text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{resume.header.name}</h1>
        <p className="resume-headline mt-2 text-base text-primary">{resume.header.headline}</p>
        {resume.header.location && <p className="resume-location mt-1 text-sm text-muted-foreground">{resume.header.location}</p>}
        <ContactList resume={resume} className="mt-4" />
      </header>
      <div className="resume-columns grid gap-8 pt-7 lg:grid-cols-[1fr_17rem] lg:gap-10">
        <div className="resume-main min-w-0 space-y-6">
          {main.map((section) => (
            <SidebarBlock key={section.key} title={section.title}>
              <SectionBody section={section} />
            </SidebarBlock>
          ))}
        </div>
        {aside.length > 0 && (
          <aside className="resume-aside min-w-0 space-y-6 lg:border-l lg:border-border lg:pl-8">
            {aside.map((section) => (
              <SidebarBlock key={section.key} title={section.title} compact>
                <SectionBody section={section} />
              </SidebarBlock>
            ))}
          </aside>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- Minimal

/** No card, no colour blocks, centred header — the plainest thing to print or paste. */
function Minimal({ resume }: TemplateProps) {
  return (
    <article className="resume-sheet resume-sheet--minimal">
      <header className="resume-head pb-7 text-center">
        <h1 className="resume-name text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{resume.header.name}</h1>
        <p className="resume-headline mt-1.5 text-base text-muted-foreground">{resume.header.headline}</p>
        {resume.header.location && <p className="resume-location mt-1 text-sm text-muted-foreground">{resume.header.location}</p>}
        <ContactList resume={resume} className="mt-4 justify-center" />
      </header>
      {resume.sections.map((section) => (
        <section key={section.key} className="resume-block pb-6">
          <h2 className="mb-3 border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-[.14em]">{section.title}</h2>
          <SectionBody section={section} />
        </section>
      ))}
    </article>
  );
}

// ---------------------------------------------------------------- Timeline

/** Roles and credentials run down a dotted line; everything else reads normally. */
function Timeline({ resume }: TemplateProps) {
  const dotted = (section: ResumeSection) => section.kind === "roles" || section.kind === "credentials";
  return (
    <article className="resume-sheet resume-sheet--timeline rounded-[4px] border border-[#4e4e4e]/50 bg-white/[0.015] p-6 sm:p-12">
      <header className="resume-head pb-8">
        <p className="eyebrow no-print">Résumé</p>
        <h1 className="resume-name mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{resume.header.name}</h1>
        <p className="resume-headline mt-2 text-lg text-primary">{resume.header.headline}</p>
        {resume.header.location && <p className="resume-location mt-1 text-sm text-muted-foreground">{resume.header.location}</p>}
        <ContactList resume={resume} className="mt-5" />
      </header>
      {resume.sections.map((section) => (
        <section key={section.key} className="resume-block border-t border-border py-7">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[.12em] text-primary">{section.title}</h2>
          <SectionBody section={section} timeline={dotted(section)} />
        </section>
      ))}
    </article>
  );
}

export const RESUME_TEMPLATE_COMPONENTS: Record<ResumeTemplate, (props: TemplateProps) => ReactNode> = {
  classic: Classic,
  sidebar: Sidebar,
  minimal: Minimal,
  timeline: Timeline,
};

/** Shown in the admin picker. */
export const RESUME_TEMPLATE_META: Record<ResumeTemplate, { label: string; description: string }> = {
  classic: { label: "Classic", description: "Section labels in a left column, content on the right. Roomy and easy to scan." },
  sidebar: { label: "Sidebar", description: "Experience and work in a wide column; skills, education and stats in a narrow one." },
  minimal: { label: "Minimal", description: "No card or colour — centred name, ruled headings. The safest to print or paste." },
  timeline: { label: "Timeline", description: "Roles and credentials run down a dotted line, newest first." },
};
