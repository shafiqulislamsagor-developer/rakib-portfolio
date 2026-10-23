"use client";

import { saveSiteSettings } from "@/app/admin/_actions/site";
import {
  Field,
  FormFooter,
  Repeater,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { FileUrlField, ImageField } from "@/app/admin/_components/media-field";
import { Panel } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { HomeSectionKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  hero: "Hero",
  highlights: "Advantages & toolkit",
  services: "Services",
  projects: "Work",
  about: "About & profile",
  experience: "Experience",
  process: "Work process",
  testimonials: "Testimonials",
  education: "Education & certifications",
  blog: "Latest blog posts",
  faq: "FAQ",
  contact: "Contact",
};

function HomeSectionsField() {
  const { control } = useFormContext<SiteSettingsInput>();
  const { fields, move } = useFieldArray({ control, name: "homeSections" });
  return (
    <Field label="Homepage sections" hint="Reorder or hide sections. Sections without content (e.g. no testimonials yet) are skipped automatically.">
      <ol className="divide-y divide-border rounded-[4px] border border-border">
        {fields.map((section, index) => (
          <li key={section.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-6 font-mono text-xs text-muted-foreground">{index + 1}</span>
            <span className="flex-1 text-sm font-medium">{SECTION_LABELS[section.key]}</span>
            <Controller
              control={control}
              name={`homeSections.${index}.visible`}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={`Show ${SECTION_LABELS[section.key]}`} />
              )}
            />
            <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Move up">
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === fields.length - 1}
              onClick={() => move(index, index + 1)}
              aria-label="Move down"
            >
              <ArrowDown />
            </Button>
          </li>
        ))}
      </ol>
    </Field>
  );
}

/** Visitor-log retention. The one-year TTL on the collections is the hard limit. */
const RETENTION_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "3 months" },
  { value: "180", label: "6 months" },
  { value: "365", label: "12 months" },
] as const;

/** Day boundaries for every analytics chart and the timestamps under Visitors. */
const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

/**
 * The zone list, plus whatever is currently saved (which may be any IANA name
 * set from a script). Built after mount so the browser's own zone can be
 * suggested without the server and client rendering different option lists.
 */
function TimeZoneField() {
  const { watch } = useFormContext<SiteSettingsInput>();
  const current = watch("analytics.timezone");
  const [local, setLocal] = useState("");
  // Read after mount: the browser's own zone is not knowable while rendering
  // on the server, and offering it as a choice must not change the markup.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: a browser-only value
      setLocal(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
    } catch {
      setLocal("");
    }
  }, []);

  const zones = [...new Set([current, local, ...COMMON_TIMEZONES].filter(Boolean))];
  return (
    <SelectField
      name="analytics.timezone"
      label="Analytics time zone"
      hint="Where a day starts and ends in every chart, and the zone timestamps under Visitors are shown in."
      options={zones.map((value) => ({ value, label: value === local ? `${value} — your zone` : value }))}
    />
  );
}

const COPY_SECTIONS = [
  ["highlights", "Highlights (companies label)"],
  ["services", "Services"],
  ["process", "Process (Services page)"],
  ["projects", "Projects"],
  ["about", "About"],
  ["experience", "Experience"],
  ["testimonials", "Testimonials"],
  ["education", "Education"],
  ["blog", "Blog"],
  ["faq", "FAQ"],
  ["contact", "Contact"],
] as const;

function VoiceGreetingPreview() {
  const { watch } = useFormContext<SiteSettingsInput>();
  const url = watch("voiceIntro.url");
  if (!url) return null;
  return (
    <div className="space-y-1.5 rounded-[4px] border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between text-xs font-medium text-foreground">
        <span>Audio player preview:</span>
        <span className="max-w-[14rem] truncate font-mono text-[10px] text-muted-foreground">{url}</span>
      </div>
      <audio src={url} controls className="h-8 w-full" preload="metadata" />
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: SiteSettingsInput }) {
  const router = useRouter();
  const form = useForm<SiteSettingsInput>({ resolver: zodResolver(siteSettingsSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: SiteSettingsInput) => {
    const result = await saveSiteSettings(values);
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
        <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2 text-xs">
          {[
            { label: "Branding", href: "#branding" },
            { label: "Theme", href: "#theme" },
            { label: "Layout", href: "#layout" },
            { label: "Navigation", href: "#navigation" },
            { label: "Headings", href: "#headings" },
            { label: "Footer", href: "#footer" },
            { label: "Voice Greeting 🎙️", href: "#voice-greeting", highlight: true },
            { label: "Contact & Analytics", href: "#analytics" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full border px-3 py-1.5 font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                item.highlight
                  ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel id="branding" title="Branding">
            <div className="space-y-5">
              <TextField name="siteName" label="Website name" />
              <TextAreaField name="siteDescription" label="Website description" rows={3} maxLength={320} />
              <TextField
                name="siteUrl"
                label="Public website address"
                placeholder="https://your-domain.com"
                hint="Your live domain, with https:// and no trailing slash. Used for canonical links, the sitemap, the RSS feed and share cards. Empty falls back to the hosting URL."
              />
              <TextField name="logoText" label="Logo mark text" maxLength={12} hint="The monospace mark, e.g. <S/>." />
              <ImageField name="logo" label="Logo image (optional)" aspect="aspect-square" hint="Replaces the text mark in the header when set." />
              <FileUrlField name="faviconUrl" label="Favicon override (optional)" accept="image" hint="Square PNG, 512×512 recommended. Empty uses the built-in icon." />
            </div>
          </Panel>

          <Panel id="theme" title="Theme">
            {/*
             * The site has one palette, taken from the design: ink background,
             * grey type, white as the only accent. There is deliberately no
             * picker here — a second palette would not be this site.
             */}
            <p className="text-[14px] leading-[22px] text-g2">
              The palette is fixed by the design — ink background, grey type and white as the single accent — and the
              admin panel uses the same one. Change it in <code className="text-mist">src/app/globals.css</code> and{" "}
              <code className="text-mist">src/app/panel.css</code> if you ever need to.
            </p>
          </Panel>

          <Panel id="layout" title="Homepage layout">
            <HomeSectionsField />
          </Panel>

          <Panel id="navigation" title="Navigation">
            <Repeater
              name="navigation"
              label="Header & footer links"
              hint="Pages: /about, /services, /projects, /blog, /contact, /resume — or /#section for homepage anchors. A Blog link is hidden until a post is published."
              addLabel="Add link"
              emptyItem={{ label: "", href: "/#", visible: true }}
              renderItem={(_, prefix) => (
                <>
                  <TextField name={`${prefix}.label`} label="Label" />
                  <TextField name={`${prefix}.href`} label="Link" />
                  <div className="sm:col-span-2">
                    <SwitchField name={`${prefix}.visible`} label="Visible" />
                  </div>
                </>
              )}
            />
          </Panel>

          <Panel id="headings" title="Section headings" className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {COPY_SECTIONS.map(([key, label]) => (
                <fieldset key={key} className="space-y-3 rounded-[4px] border border-border p-4">
                  <legend className="px-1 text-sm font-medium">{label}</legend>
                  <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                    <TextField name={`sectionCopy.${key}.eyebrow`} label="Eyebrow" />
                    <TextField name={`sectionCopy.${key}.heading`} label="Heading" />
                  </div>
                  {!["about", "highlights", "testimonials", "faq"].includes(key) && (
                    <TextAreaField name={`sectionCopy.${key}.intro`} label="Intro" rows={2} maxLength={400} />
                  )}
                </fieldset>
              ))}
            </div>
          </Panel>

          <Panel id="footer" title="Footer">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField name="footer.eyebrow" label="Eyebrow" className="sm:col-span-2" />
              <TextField name="footer.headline" label="Headline" />
              <TextField name="footer.highlight" label="Highlighted words" />
              <TextAreaField name="footer.blurb" label="Short bio" rows={2} maxLength={300} className="sm:col-span-2" />
              <TextField name="footer.ctaLabel" label="Button label" />
              <TextField name="footer.ctaHref" label="Button link" hint="Empty = mailto: your profile email." />
            </div>
          </Panel>

          <Panel
            id="voice-greeting"
            title="Voice greeting"
            description="A short recording that welcomes visitors. Browsers block audio that starts on its own, so the site always shows a small play button and starts the clip on the visitor's first tap if autoplay is refused."
          >
            <div className="space-y-5">
              <SwitchField name="voiceIntro.enabled" label="Play a voice greeting" description="Shows the player on every public page." />
              <FileUrlField
                name="voiceIntro.url"
                label="Audio file"
                accept="audio"
                hint="Upload an MP3, M4A, OGG, WAV or WebM, up to 4 MB — it has to be hosted here, not linked from elsewhere. Keep it under about 15 seconds; it plays while someone is trying to read."
              />
              <VoiceGreetingPreview />
              <TextField name="voiceIntro.label" label="Button label" placeholder="Play my welcome" maxLength={60} />
              <TextAreaField
                name="voiceIntro.transcript"
                label="Transcript"
                rows={3}
                maxLength={600}
                hint="What the recording says. Shown to anyone who cannot play audio, and read by screen readers — please fill it in."
              />
              <SwitchField
                name="voiceIntro.autoplay"
                label="Try to start on arrival"
                description="When the browser refuses, the clip starts on the visitor's first click or key press instead."
              />
              <SwitchField name="voiceIntro.oncePerSession" label="Only once per visit" description="Off means it plays again on every page they open." />
            </div>
          </Panel>

          <Panel id="analytics" title="Contact & analytics">
            <div className="space-y-4">
              <SwitchField name="contact.formEnabled" label="Accept contact form messages" description="When off, visitors see your email address instead of the form." />
              <SwitchField
                name="analytics.firstPartyEnabled"
                label="First-party visitor analytics"
                description="Cookie-less daily counts stored in your database. Powers the dashboard charts."
              />
              <SwitchField
                name="analytics.visitorLogEnabled"
                label="Visitor log"
                description="Records each visitor's IP address, device, browser, location and what they click. See it under Visitors. Mention this in your privacy policy."
              />
              <SelectField
                name="analytics.visitorRetention"
                label="Delete visitor records after"
                hint="Applied whenever you open the Visitors page. Shorter is kinder: keep only what you will actually use."
                options={RETENTION_OPTIONS}
              />
              <TimeZoneField />
              <TextField
                name="analytics.gaMeasurementId"
                label="Google Analytics 4 measurement ID (optional)"
                placeholder="G-XXXXXXXXXX"
                hint="Loads GA4 on every public page. Leave empty to use only the built-in, cookie-less analytics."
              />
            </div>
          </Panel>
        </div>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} submitLabel="Save settings" />
      </form>
    </FormProvider>
  );
}
