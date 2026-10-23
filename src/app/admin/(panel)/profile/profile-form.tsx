"use client";

import { saveProfile } from "@/app/admin/_actions/site";
import {
  FormFooter,
  MarkdownField,
  Repeater,
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { FileUrlField, ImageField } from "@/app/admin/_components/media-field";
import { Panel } from "@/app/admin/_components/ui";

import { SOCIAL_LABELS, SOCIAL_PLATFORMS, STRENGTH_ICONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { profileSchema, type ProfileInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ProfileForm({ initial, cvUpdatedAt }: { initial: ProfileInput; cvUpdatedAt: string | null }) {
  const router = useRouter();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: ProfileInput) => {
    const result = await saveProfile(values);
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
          <Panel title="Identity" className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <TextField name="name" label="Full name" />
              <TextField name="shortName" label="Short name" hint="Shown next to the logo." />
              <TextField name="title" label="Professional title" />
              <TextField name="email" label="Public email" type="email" />
              <TextField name="phone" label="Phone (optional)" type="tel" />
              <TextField name="location" label="Location" />
              <TextField name="availability" label="Availability badge" className="sm:col-span-2 lg:col-span-3" hint="Leave empty to hide the badge in the hero." />
            </div>
          </Panel>

          <Panel title="Hero section">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_12rem]">
                <TextField name="headline" label="Headline" />
                <TextField name="headlineHighlight" label="Highlighted words" hint="Shown with the gradient." />
              </div>
              <TextAreaField name="intro" label="Introduction" rows={3} maxLength={600} />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField name="primaryCta.label" label="Primary button label" />
                <TextField name="primaryCta.href" label="Primary button link" placeholder="#projects" />
                <TextField name="secondaryCta.label" label="Secondary button label" />
                <TextField name="secondaryCta.href" label="Secondary button link" placeholder="https://github.com/…" />
              </div>
              <fieldset className="space-y-4 rounded-[4px] border border-border p-4">
                <legend className="px-1 text-sm font-medium">Code card</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <TextField name="heroCode.focus" label="focus" />
                  <TextField name="heroCode.backend" label="backend" />
                  <TextField name="heroCode.status" label="status" />
                </div>
                <TagsField name="heroCode.craft" label="craft" max={6} />
              </fieldset>
            </div>
          </Panel>

          <Panel title="About section">
            <div className="space-y-5">
              <ImageField name="avatar" label="Profile photo" aspect="aspect-square" hint="Optional. Shown at the top of the About page." />
              <TextAreaField name="aboutBody" label="About paragraph" rows={4} maxLength={1200} />
              <MarkdownField name="bio" label="Full biography" rows={8} hint="Optional. Shown in an expandable “More about me” panel." />
            </div>
          </Panel>

          <Panel title="Strengths" description="The three cards under the About heading.">
            <Repeater
              name="strengths"
              label="Cards"
              max={6}
              addLabel="Add card"
              emptyItem={{ title: "", copy: "", icon: "layers" }}
              renderItem={(_, prefix) => (
                <>
                  <TextField name={`${prefix}.title`} label="Title" />
                  <SelectField name={`${prefix}.icon`} label="Icon" options={STRENGTH_ICONS.map((value) => ({ value, label: value }))} />
                  <TextAreaField name={`${prefix}.copy`} label="Text" rows={2} maxLength={300} className="sm:col-span-2" />
                </>
              )}
            />
          </Panel>

          <Panel title="Highlights" description="The numbers strip under the hero (and on About). Keep them factual.">
            <Repeater
              name="highlights"
              label="Numbers"
              max={6}
              addLabel="Add number"
              emptyItem={{ value: "", label: "" }}
              renderItem={(_, prefix) => (
                <>
                  <TextField name={`${prefix}.value`} label="Value" placeholder="5+" maxLength={20} />
                  <TextField name={`${prefix}.label`} label="Label" placeholder="Years of experience" maxLength={80} />
                </>
              )}
            />
          </Panel>

          <Panel title="Social links">
            <Repeater
              name="socials"
              label="Profiles"
              max={12}
              addLabel="Add link"
              emptyItem={{ platform: "github", label: "", url: "" }}
              renderItem={(_, prefix) => (
                <>
                  <SelectField name={`${prefix}.platform`} label="Platform" options={SOCIAL_PLATFORMS.map((value) => ({ value, label: SOCIAL_LABELS[value] }))} />
                  <TextField name={`${prefix}.label`} label="Display text" placeholder="@username" />
                  <TextField name={`${prefix}.url`} label="URL" type="url" className="sm:col-span-2" placeholder="https://…" />
                </>
              )}
            />
          </Panel>

          <Panel
            title="CV / résumé"
            description={cvUpdatedAt ? `Last replaced ${formatDateTime(cvUpdatedAt)}. Downloads are counted via /cv.` : "Visitors download it through /cv, which counts downloads."}
          >
            <div className="space-y-5">
              <FileUrlField
                name="cv.url"
                label="CV file (PDF)"
                accept="document"
                hint="Upload a PDF or paste a link. Leave empty to hide the download buttons."
                onUploaded={(media) => {
                  if (!form.getValues("cv.fileName")) form.setValue("cv.fileName", media.originalName, { shouldDirty: true });
                }}
              />
              <TextField name="cv.fileName" label="File name label" placeholder="Firstname-Lastname-CV.pdf" />
            </div>
          </Panel>
        </div>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} submitLabel="Save profile" />
      </form>
    </FormProvider>
  );
}
