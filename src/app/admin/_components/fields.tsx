"use client";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/content";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, X } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, useId, useState, type ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

// Small, consistent building blocks for admin forms. Forms wrap these in
// <FormProvider>; validation uses the same Zod schemas as the server.

function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], source);
}

export function useFieldError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = getPath(errors, name) as { message?: string; root?: { message?: string } } | undefined;
  return error?.message ?? error?.root?.message;
}

import { FieldWrapper, type FieldWrapperProps } from "@/components/ui/field-wrapper";

export { FieldWrapper };
export type { FieldWrapperProps };

export const Field = FieldWrapper;

type TextFieldProps = {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">;

export function TextField({ name, label, hint, className, type, ...props }: TextFieldProps) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} className={className}>
      <Input
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        {...register(name, type === "number" ? { setValueAs: (value) => (value === "" || value === null ? null : Number(value)) } : {})}
      />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  className,
  rows = 4,
  ...props
}: { name: string; label: ReactNode; hint?: ReactNode; className?: string; rows?: number } & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name"
>) {
  const { register, watch } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const value = (watch(name) as string | undefined) ?? "";
  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      className={className}
      hint={
        props.maxLength ? (
          <span className="flex justify-between gap-4">
            <span>{hint}</span>
            <span className="tabular-nums">
              {value.length}/{props.maxLength}
            </span>
          </span>
        ) : (
          hint
        )
      }
    >
      <Textarea id={id} rows={rows} aria-invalid={!!error} {...props} {...register(name)} />
    </Field>
  );
}

export const NativeSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function NativeSelect({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[4px] border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

export function SelectField({
  name,
  label,
  hint,
  options,
  className,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  options: readonly { value: string; label: string }[];
  className?: string;
}) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} className={className}>
      <NativeSelect id={id} aria-invalid={!!error} {...register(name)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

export function SwitchField({ name, label, description }: { name: string; label: ReactNode; description?: ReactNode }) {
  const { control } = useFormContext();
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start justify-between gap-4 rounded-[4px] border border-border p-4">
          <div>
            <Label htmlFor={id} className="text-sm font-medium">
              {label}
            </Label>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

/** Chip input for string arrays (technologies, tags, keywords). */
export function TagsField({
  name,
  label,
  hint,
  placeholder = "Type and press Enter",
  max = 30,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  placeholder?: string;
  max?: number;
}) {
  const { control } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const [draft, setDraft] = useState("");

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const values: string[] = Array.isArray(field.value) ? field.value : [];
        const add = (raw: string) => {
          const items = raw
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          const next = [...values];
          for (const item of items) {
            if (!next.some((existing) => existing.toLowerCase() === item.toLowerCase()) && next.length < max) next.push(item);
          }
          field.onChange(next);
          setDraft("");
        };
        return (
          <Field label={label} htmlFor={id} hint={hint ?? `${values.length}/${max}`} error={error}>
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[4px] border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
              {values.map((value) => (
                <span key={value} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                  {value}
                  <button
                    type="button"
                    onClick={() => field.onChange(values.filter((item) => item !== value))}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${value}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                id={id}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
                    event.preventDefault();
                    add(draft);
                  } else if (event.key === "Backspace" && !draft && values.length) {
                    field.onChange(values.slice(0, -1));
                  }
                }}
                onBlur={() => draft.trim() && add(draft)}
                placeholder={values.length ? "" : placeholder}
                className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </Field>
        );
      }}
    />
  );
}

/** Editable list of strings, one input per row (e.g. achievements). */
export function StringListField({
  name,
  label,
  hint,
  placeholder,
  max = 12,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  placeholder?: string;
  max?: number;
}) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  // useFieldArray needs objects, so plain strings are edited through a controlled wrapper.
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const values: string[] = Array.isArray(field.value) ? field.value : [];
        const update = (next: string[]) => field.onChange(next);
        return (
          <Field label={label} hint={hint} error={error}>
            <div className="space-y-2">
              {values.map((value, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={value}
                    placeholder={placeholder}
                    aria-label={`${typeof label === "string" ? label : "Item"} ${index + 1}`}
                    onChange={(event) => update(values.map((item, i) => (i === index ? event.target.value : item)))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...values];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      update(next);
                    }}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => update(values.filter((_, i) => i !== index))} aria-label="Remove">
                    <X />
                  </Button>
                </div>
              ))}
              {values.length < max && (
                <Button type="button" variant="outline" size="sm" onClick={() => update([...values, ""])}>
                  <Plus /> Add item
                </Button>
              )}
            </div>
          </Field>
        );
      }}
    />
  );
}

/** Generic repeater for arrays of objects using useFieldArray. */
export function Repeater<T extends FieldValues>({
  name,
  label,
  hint,
  max = 10,
  emptyItem,
  renderItem,
  addLabel = "Add",
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  max?: number;
  emptyItem: Record<string, unknown>;
  renderItem: (index: number, prefix: string) => ReactNode;
  addLabel?: string;
}) {
  const { control } = useFormContext<T>();
  const { fields, append, remove, move } = useFieldArray({ control, name: name as never });
  const error = useFieldError(name);
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="space-y-3">
        {fields.map((item, index) => (
          <div key={item.id} className="rounded-[4px] border border-border bg-muted/20 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">{index + 1}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Move up">
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Move down"
                >
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} aria-label="Remove">
                  <X />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{renderItem(index, `${name}.${index}`)}</div>
          </div>
        ))}
        {fields.length < max && (
          <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem as never)}>
            <Plus /> {addLabel}
          </Button>
        )}
      </div>
    </Field>
  );
}

export function MarkdownField({
  name,
  label,
  hint,
  rows = 16,
  placeholder,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  rows?: number;
  placeholder?: string;
}) {
  const { register, watch } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const value = (watch(name) as string | undefined) ?? "";
  const words = value.split(/\s+/).filter(Boolean).length;

  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      hint={
        <span className="flex justify-between gap-4">
          <span>{hint ?? "Markdown supported: ## headings, **bold**, lists, links, `code`, tables, images."}</span>
          <span className="tabular-nums">{words} words</span>
        </span>
      }
    >
      <div className="overflow-hidden rounded-[4px] border border-input">
        <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5" role="tablist">
          {(["write", "preview"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={cn(
                "rounded-[4px] px-3 py-1 text-xs font-semibold capitalize",
                tab === item ? "bg-white/[0.1] text-mist" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <Textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          className={cn("rounded-none border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0", tab !== "write" && "hidden")}
          aria-invalid={!!error}
          {...register(name)}
        />
        {tab === "preview" && (
          <div className="min-h-48 bg-background p-5">
            {value.trim() ? <Markdown content={value} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
    </Field>
  );
}

export function FormFooter({
  isSubmitting,
  isDirty,
  submitLabel = "Save changes",
  cancelHref,
  extra,
}: {
  isSubmitting: boolean;
  isDirty?: boolean;
  submitLabel?: string;
  cancelHref?: string;
  extra?: ReactNode;
}) {
  return (
    // On phones it sits just above the bottom tab bar (h-16 + safe area).
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:gap-3 sm:px-6 sm:py-4 lg:bottom-0 lg:-mx-8 lg:px-8">
      {isDirty ? (
        <span className="mr-auto inline-flex items-center gap-2 text-xs font-medium text-destructive dark:text-destructive">
          <span className="size-2 rounded-full bg-destructive" aria-hidden="true" /> Unsaved changes
        </span>
      ) : (
        <span className="mr-auto hidden text-xs text-muted-foreground sm:inline">All changes saved</span>
      )}
      {extra}
      {cancelHref && (
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}

/** Push server-side field errors (dot paths) into react-hook-form. */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, result: ActionResult<unknown>) {
  if (result.ok || !result.fieldErrors) return;
  for (const [path, messages] of Object.entries(result.fieldErrors)) {
    if (messages?.length) form.setError(path as Path<T>, { type: "server", message: messages[0] });
  }
}

/** Warn before leaving a page with unsaved changes. */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
