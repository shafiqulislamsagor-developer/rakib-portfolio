"use client";

import { saveSeoSettings } from "@/app/admin/_actions/site";
import { FormFooter, SwitchField, TagsField, TextAreaField, TextField, applyServerErrors, useUnsavedChangesWarning } from "@/app/admin/_components/fields";
import { FileUrlField } from "@/app/admin/_components/media-field";
import { SearchPreview, SeoFields } from "@/app/admin/_components/seo-fields";
import { Panel } from "@/app/admin/_components/ui";
import { seoSettingsSchema, type SeoSettingsInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

const PAGE_SEO = [
  ["about", "About"],
  ["services", "Services"],
  ["projects", "Projects"],
  ["blog", "Blog"],
  ["contact", "Contact"],
  ["resume", "Résumé"],
] as const;

export default function SeoForm({ initial, siteUrl }: { initial: SeoSettingsInput; siteUrl: string }) {
  const router = useRouter();
  const form = useForm<SeoSettingsInput>({ resolver: zodResolver(seoSettingsSchema), defaultValues: initial });
  useUnsavedChangesWarning(form.formState.isDirty);
  const title = form.watch("seo.titleDefault");
  const description = form.watch("seo.description");
  const allowIndexing = form.watch("seo.allowIndexing");

  const onSubmit = async (values: SeoSettingsInput) => {
    const result = await saveSeoSettings(values);
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
          <Panel title="Global defaults" description="Used for the homepage and as fallbacks for every page.">
            <div className="space-y-5">
              <SearchPreview title={title} description={description} url={siteUrl} />
              <TextField name="seo.titleDefault" label="Default title" maxLength={120} />
              <TextField name="seo.titleTemplate" label="Title template" hint="%s is replaced by the page title, e.g. “%s | Your Name”." />
              <TextAreaField name="seo.description" label="Default meta description" rows={3} maxLength={320} />
              <TagsField name="seo.keywords" label="Keywords" max={30} />
              <FileUrlField name="seo.ogImage" label="Default social share image" accept="image" hint="1200×630. Empty uses the generated brand image (/opengraph-image)." />
              <TextField name="seo.twitterHandle" label="X / Twitter handle" placeholder="@yourhandle" />
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Indexing">
              <div className="space-y-4">
                <SwitchField
                  name="seo.allowIndexing"
                  label="Allow search engines to index the site"
                  description="Turning this off sets noindex everywhere, blocks crawlers in robots.txt and empties the sitemap."
                />
                {!allowIndexing && (
                  <p role="alert" className="rounded-[4px] border border-destructive/40 bg-destructive/[0.1] p-3 text-sm text-destructive dark:text-destructive">
                    Indexing is disabled. Your site will drop out of search results after saving.
                  </p>
                )}
                <TextField
                  name="seo.googleSiteVerification"
                  label="Google Search Console verification"
                  hint="Paste only the content value of the google-site-verification meta tag."
                />
              </div>
            </Panel>
            {PAGE_SEO.map(([key, label]) => (
              <Panel key={key} title={`/${key} page`}>
                <SeoFields prefix={`pages.${key}`} fallbackTitle={label} fallbackDescription={description} url={`${siteUrl}/${key}`} />
              </Panel>
            ))}
          </div>
        </div>
        <FormFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} submitLabel="Save SEO settings" />
      </form>
    </FormProvider>
  );
}
