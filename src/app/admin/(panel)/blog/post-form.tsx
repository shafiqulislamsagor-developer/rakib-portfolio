"use client";

import { savePost } from "@/app/admin/_actions/posts";
import {
  Field,
  FormFooter,
  MarkdownField,
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
  applyServerErrors,
  useFieldError,
  useUnsavedChangesWarning,
} from "@/app/admin/_components/fields";
import { ImageField } from "@/app/admin/_components/media-field";
import { SeoFields } from "@/app/admin/_components/seo-fields";
import { Panel } from "@/app/admin/_components/ui";
import { Input } from "@/components/ui/input";
import { POST_STATUSES } from "@/lib/constants";
import { readingMinutes } from "@/lib/format";
import { slugify } from "@/lib/validation/common";
import { postSchema, type PostInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";

export const emptyPost: PostInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: { url: "", alt: "" },
  category: "",
  tags: [],
  status: "draft",
  publishAt: "",
  seo: { title: "", description: "", ogImage: "", noIndex: false },
};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Shows local time to the author, stores an absolute ISO timestamp. */
function PublishAtField() {
  const { control, watch } = useFormContext<PostInput>();
  const id = useId();
  const error = useFieldError("publishAt");
  const status = watch("status");
  if (status !== "scheduled") return null;
  return (
    <Controller
      control={control}
      name="publishAt"
      render={({ field }) => (
        <Field
          label="Publish at"
          htmlFor={id}
          error={error}
          hint={`Your local time (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`}
        >
          <Input
            id={id}
            type="datetime-local"
            value={toLocalInput(field.value)}
            onChange={(event) => field.onChange(event.target.value ? new Date(event.target.value).toISOString() : "")}
          />
        </Field>
      )}
    />
  );
}

export default function PostForm({
  id,
  initial,
  categories,
  siteUrl,
}: {
  id: string | null;
  initial: PostInput;
  categories: string[];
  siteUrl: string;
}) {
  const router = useRouter();
  const form = useForm<PostInput>({ resolver: zodResolver(postSchema), defaultValues: initial });
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, isDirty },
  } = form;
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  useUnsavedChangesWarning(isDirty);

  const title = watch("title");
  const slug = watch("slug");
  const excerpt = watch("excerpt");
  const content = watch("content");
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(title));
  }, [title, slugTouched, setValue]);

  const onSubmit = async (values: PostInput) => {
    const result = await savePost(id, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    reset(values);
    if (!id && result.data) router.replace(`/admin/blog/${result.data.id}`);
    else router.refresh();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-6">
            <Panel title="Article">
              <div className="space-y-5">
                <TextField name="title" label="Title" maxLength={160} />
                <TextField
                  name="slug"
                  label="URL slug"
                  hint={`${siteUrl}/blog/${slug || "…"}${id ? " — changing it keeps the old URL as a redirect" : ""}`}
                  onInput={() => setSlugTouched(true)}
                />
                <TextAreaField name="excerpt" label="Excerpt" rows={3} maxLength={400} hint="Shown on cards and used as the default meta description." />
                <MarkdownField name="content" label="Content" rows={22} placeholder={"Start writing…\n\n## A section heading\n\nParagraphs, **bold**, lists, links, `code`."} />
                <p className="text-xs text-muted-foreground">Estimated reading time: {readingMinutes(content)} min</p>
              </div>
            </Panel>
            <Panel title="Cover image">
              <ImageField name="coverImage" label="Cover" hint="Shown on the article and in social shares." />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              title="Publishing"
              actions={
                id ? (
                  <Link href={`/admin/blog/${id}/preview`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    <Eye className="size-3.5" /> Preview
                  </Link>
                ) : undefined
              }
            >
              <div className="space-y-4">
                <SelectField
                  name="status"
                  label="Status"
                  options={POST_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))}
                />
                <PublishAtField />
              </div>
            </Panel>
            <Panel title="Organisation">
              <div className="space-y-4">
                <div className="space-y-2">
                  <TextField name="category" label="Category" list="post-categories" placeholder="Engineering" />
                  <datalist id="post-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <TagsField name="tags" label="Tags" max={15} placeholder="nextjs, performance…" />
              </div>
            </Panel>
            <Panel title="SEO">
              <SeoFields fallbackTitle={title} fallbackDescription={excerpt} url={`${siteUrl}/blog/${slug}`} />
            </Panel>
          </div>
        </div>
        <FormFooter isSubmitting={isSubmitting} isDirty={isDirty} cancelHref="/admin/blog" submitLabel={id ? "Save post" : "Create post"} />
      </form>
    </FormProvider>
  );
}
