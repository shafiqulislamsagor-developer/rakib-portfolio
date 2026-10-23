"use client";

import { saveResumeSettings } from "@/app/admin/_actions/site";
import {
  Field,
  FormFooter,
  SwitchField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { Panel } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  RESUME_SECTION_LABELS,
  RESUME_TEMPLATE_META,
  RESUME_TEMPLATES,
  type ResumeSectionKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { resumeSettingsSchema, type ResumeSettingsInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Check, PenLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";

export const SECTION_LABELS = RESUME_SECTION_LABELS;

/** Where the content of each section is actually edited. */
const SECTION_SOURCES: Record<ResumeSectionKey, { href: string; label: string }> = {
  summary: { href: "/admin/profile", label: "Profile → About" },
  highlights: { href: "/admin/profile", label: "Profile → Highlights" },
  experience: { href: "/admin/experience", label: "Experience" },
  skills: { href: "/admin/skills", label: "Skills" },
  projects: { href: "/admin/projects", label: "Projects" },
  education: { href: "/admin/education", label: "Education" },
  certifications: { href: "/admin/education", label: "Education → Certifications" },
  achievements: { href: "/admin/education", label: "Education → Achievements" },
  services: { href: "/admin/services", label: "Services" },
  testimonials: { href: "/admin/testimonials", label: "Testimonials" },
};

function TemplatePicker() {
  const { control } = useFormContext<ResumeSettingsInput>();
  return (
    <Controller
      control={control}
      name="resume.template"
      render={({ field }) => (
        <Field label="Layout" hint="Only the arrangement changes — every layout shows the same content.">
          <div role="radiogroup" aria-label="Résumé layout" className="grid gap-3 sm:grid-cols-2">
            {RESUME_TEMPLATES.map((template) => {
              const meta = RESUME_TEMPLATE_META[template];
              const active = field.value === template;
              return (
                <button
                  key={template}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => field.onChange(template)}
                  className={cn(
                    "rounded-[4px] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    {active && <Check className="size-4 shrink-0 text-primary" />}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{meta.description}</span>
                </button>
              );
            })}
          </div>
        </Field>
      )}
    />
  );
}

function SectionsField({ available }: { available: Record<ResumeSectionKey, number> }) {
  const { control } = useFormContext<ResumeSettingsInput>();
  const { fields, move } = useFieldArray({ control, name: "resume.sections" });
  return (
    <Field
      label="Sections"
      hint="Reorder or hide blocks. A section with no content yet is skipped automatically, so nothing shows up empty."
    >
      <ol className="divide-y divide-border rounded-[4px] border border-border">
        {fields.map((section, index) => {
          const key = section.key as ResumeSectionKey;
          const count = available[key] ?? 0;
          const source = SECTION_SOURCES[key];
          return (
            <li key={section.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:px-4">
              <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{SECTION_LABELS[key]}</span>
                <Link
                  href={source.href}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  title={`Edit this content in ${source.label}`}
                >
                  <PenLine className="size-3" />
                  {source.label}
                  <span className={cn("ml-1", count === 0 && "text-destructive dark:text-destructive")}>
                    · {count === 0 ? "nothing yet" : `${count} item${count === 1 ? "" : "s"}`}
                  </span>
                </Link>
              </span>
              <Controller
                control={control}
                name={`resume.sections.${index}.visible`}
                render={({ field }) => (
                  <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} aria-label={`Show ${SECTION_LABELS[key]}`} />
                )}
              />
              <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${SECTION_LABELS[key]} up`}>
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                aria-label={`Move ${SECTION_LABELS[key]} down`}
              >
                <ArrowDown />
              </Button>
            </li>
          );
        })}
      </ol>
    </Field>
  );
}

export default function ResumeForm({
  initial,
  available,
}: {
  initial: ResumeSettingsInput;
  available: Record<ResumeSectionKey, number>;
}) {
  const router = useRouter();
  const form = useForm<ResumeSettingsInput>({ resolver: zodResolver(resumeSettingsSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: ResumeSettingsInput) => {
    const result = await saveResumeSettings(values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    form.reset(values);
    router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Panel title="Layout" description="Pick how the résumé is arranged. Every template prints cleanly.">
              <TemplatePicker />
            </Panel>
            <Panel title="What to include" description="The content itself lives where you normally edit it — these switches only decide what the résumé shows.">
              <SectionsField available={available} />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Header" description="Leave both blank to use what the profile already says.">
              <div className="space-y-5">
                <TextField
                  name="resume.headline"
                  label="Headline override"
                  placeholder="Full-stack developer · Next.js & MongoDB"
                  maxLength={160}
                  hint="Blank uses your profile title."
                />
                <TextAreaField
                  name="resume.summary"
                  label="Summary override"
                  rows={4}
                  maxLength={1200}
                  hint="Blank uses your About text. Useful when the résumé needs a shorter, more formal version."
                />
              </div>
            </Panel>

            <Panel title="Options">
              <div className="space-y-5">
                <TextField
                  name="resume.projectLimit"
                  label="Projects to show"
                  type="number"
                  min={1}
                  max={12}
                  hint="How many entries the “Selected work” section lists."
                />
                <SwitchField
                  name="resume.featuredProjectsOnly"
                  label="Featured projects only"
                  description="Off lists your most recent published projects instead. If nothing is featured, recent ones are used anyway."
                />
                <SwitchField
                  name="resume.showSkillLevels"
                  label="Show skill levels"
                  description="Draws the percentage bar beside each skill. Off lists the names only, which reads better on paper."
                />
                <SwitchField name="resume.showPhone" label="Show phone number" description="Your résumé is a public page, so leave this off if you would rather not publish it." />
                <SwitchField name="resume.showLocation" label="Show location" description="The city line under your name." />
                <SwitchField name="resume.showSocials" label="Show social links" description="GitHub, LinkedIn and the rest, beside your email." />
              </div>
            </Panel>
          </div>
        </div>
        <FormFooter isDirty={form.formState.isDirty} isSubmitting={form.formState.isSubmitting} />
      </form>
    </FormProvider>
  );
}
