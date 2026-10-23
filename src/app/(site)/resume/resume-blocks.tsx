import type { ResumeSection } from "@/types/content";
import { cn } from "@/lib/utils";

/*
 * The content of a résumé block, with no heading and no frame of its own.
 * Every template reuses these, so a template is purely a layout choice and the
 * blocks look consistent whichever one is picked. `.resume-item` marks things
 * that must not be split across printed pages (see the print rules in
 * app/globals.css).
 */

export function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Title on the left, dates on the right — the line every résumé entry starts with. */
function EntryHead({ title, meta }: { title: React.ReactNode; meta?: string }) {
  return (
    <div className="resume-entry-head flex flex-wrap items-baseline justify-between gap-x-4">
      <h3 className="font-semibold">{title}</h3>
      {meta && <p className="resume-meta font-mono text-xs text-muted-foreground">{meta}</p>}
    </div>
  );
}

export function SectionBody({ section, timeline = false }: { section: ResumeSection; timeline?: boolean }) {
  switch (section.kind) {
    case "text":
      return <p className="leading-7 text-muted-foreground">{section.body}</p>;

    case "stats":
      return (
        <dl className="resume-stats grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {section.items.map((item) => (
            <div key={item.label} className="resume-item">
              <dt className="text-xl font-semibold tracking-tight text-primary">{item.value}</dt>
              <dd className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.label}</dd>
            </div>
          ))}
        </dl>
      );

    case "roles":
      return (
        <ol className={cn("resume-roles", timeline ? "space-y-6 border-l border-border pl-6" : "space-y-7")}>
          {section.items.map((role) => (
            <li key={role.id} className={cn("resume-item", timeline && "relative")}>
              {timeline && <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2 border-primary bg-background" aria-hidden="true" />}
              <EntryHead
                title={
                  <>
                    {role.title} · <span className="text-primary">{role.org}</span>
                  </>
                }
                meta={role.period}
              />
              {role.location && <p className="text-xs text-muted-foreground">{role.location}</p>}
              {role.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>}
              <Bullets items={role.bullets} />
            </li>
          ))}
        </ol>
      );

    case "skills":
      return section.showLevels ? (
        <div className="space-y-4">
          {section.groups.map((group) => (
            <div key={group.category} className="resume-item">
              <p className="text-sm font-semibold">{group.category}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{item.name}</span>
                    {item.level !== null && (
                      <>
                        <span className="resume-level h-1 w-14 shrink-0 overflow-hidden rounded-full bg-border">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${item.level}%` }} />
                        </span>
                        <span className="sr-only">{item.level} percent</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <dl className="space-y-2 text-sm">
          {section.groups.map((group) => (
            <div key={group.category} className="resume-item resume-skill-row grid gap-1 sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold">{group.category}</dt>
              <dd className="text-muted-foreground">{group.items.map((item) => item.name).join(", ")}</dd>
            </div>
          ))}
        </dl>
      );

    case "projects":
      return (
        <ul className="space-y-4">
          {section.items.map((project) => (
            <li key={project.id} className="resume-item">
              <a href={project.url} className="font-semibold hover:text-primary">
                {project.title}
              </a>
              {project.summary && <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.summary}</p>}
              {project.tech.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{project.tech.join(" · ")}</p>}
            </li>
          ))}
        </ul>
      );

    case "credentials":
      return (
        <ul className={cn(timeline ? "space-y-4 border-l border-border pl-6" : "space-y-4")}>
          {section.items.map((item) => (
            <li key={item.id} className={cn("resume-item", timeline && "relative")}>
              {timeline && <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2 border-primary bg-background" aria-hidden="true" />}
              <EntryHead
                title={
                  item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-primary">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )
                }
                meta={item.period}
              />
              {item.org && <p className="text-sm text-muted-foreground">{item.org}</p>}
              {item.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>}
            </li>
          ))}
        </ul>
      );

    case "list":
      return (
        <ul className="space-y-3">
          {section.items.map((item) => (
            <li key={item.title} className="resume-item">
              <p className="font-semibold">{item.title}</p>
              {item.summary && <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
            </li>
          ))}
        </ul>
      );

    case "quotes":
      return (
        <ul className="space-y-4">
          {section.items.map((quote) => (
            <li key={quote.id} className="resume-item">
              <blockquote className="text-sm leading-6 text-muted-foreground">“{quote.quote}”</blockquote>
              <p className="mt-1 text-xs font-semibold">
                {quote.name}
                {quote.role && <span className="font-normal text-muted-foreground"> — {quote.role}</span>}
              </p>
            </li>
          ))}
        </ul>
      );
  }
}
