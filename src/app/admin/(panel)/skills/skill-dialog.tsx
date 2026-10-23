"use client";

import { saveSkill } from "@/app/admin/_actions/career";
import { SelectField, SwitchField, TextField, applyServerErrors } from "@/app/admin/_components/fields";
import { ImageField } from "@/app/admin/_components/media-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { skillSchema, type SkillInput } from "@/lib/validation/content";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

const empty: SkillInput = {
  name: "",
  category: "",
  level: null,
  icon: { url: "", alt: "" },
  featured: false,
  order: 0,
  status: "active",
};

export default function SkillDialog({
  id,
  initial,
  categories,
}: {
  id?: string;
  initial?: SkillInput;
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<SkillInput>({ resolver: zodResolver(skillSchema), defaultValues: initial ?? empty });

  const onSubmit = async (values: SkillInput) => {
    const result = await saveSkill(id ?? null, values);
    if (!result.ok) {
      applyServerErrors(form, result);
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved");
    setOpen(false);
    if (!id) form.reset(empty);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(initial ?? empty);
      }}
    >
      <DialogTrigger asChild>
        {id ? (
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${initial?.name ?? "skill"}`}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus /> Add skill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{id ? "Edit skill" : "Add skill"}</DialogTitle>
          <DialogDescription>Featured skills with a logo appear as the floating tool discs on the About page.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextField name="name" label="Name" maxLength={60} autoFocus />
            <TextField name="category" label="Category" list="skill-categories" placeholder="Frontend, Backend, Database…" maxLength={60} />
            <datalist id="skill-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <TextField name="level" label="Proficiency (0–100)" type="number" min={0} max={100} hint="Optional. Shown on the résumé when skill levels are enabled." />
            <ImageField name="icon" label="Logo" hint="The tool mark drawn inside the disc on the About page." aspect="aspect-square" />
            <SelectField name="status" label="Status" options={[{ value: "active", label: "Active" }, { value: "archived", label: "Archived (hidden)" }]} />
            <SwitchField name="featured" label="Highlight" description="Featured skills get an accent border." />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {id ? "Save" : "Add skill"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
