import { deleteCareerItem, reorderCareerItems, setCareerItemStatus, toggleSkillFeatured } from "@/app/admin/_actions/career";
import { DataTable } from "@/app/admin/_components/data-table";
import { RowActions } from "@/app/admin/_components/row-actions";
import { EmptyState, FilterTabs, PageHeader, StatusBadge } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Skill } from "@/lib/db/models";
import { toSkill } from "@/lib/db/serialize";
import { Sparkles, Star } from "lucide-react";
import type { Metadata } from "next";
import SkillDialog from "./skill-dialog";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await adminPage();
  const status = param((await searchParams).status) === "archived" ? "archived" : "active";
  const [docs, archivedCount, activeCount] = await Promise.all([
    Skill.find({ status }).sort({ order: 1, name: 1 }).lean(),
    Skill.countDocuments({ status: "archived" }),
    Skill.countDocuments({ status: "active" }),
  ]);
  const skills = docs.map(toSkill);
  const categories = [...new Set((await Skill.distinct("category")) as string[])].filter(Boolean).sort();

  return (
    <>
      <PageHeader
        title="Skills"
        icon={Sparkles}
        description="The “Core stack” chips on the About section, grouped by category. Drag to change their order; starred skills are highlighted."
        actions={<SkillDialog categories={categories} />}
      />
      <DataTable
        label="Skills"
        reorder={reorderCareerItems.bind(null, "skill")}
        actionsWidth="5rem"
        toolbar={
          <FilterTabs
            items={[
              { label: "Active", href: "/admin/skills", active: status === "active", count: activeCount },
              { label: "Archived", href: "/admin/skills?status=archived", active: status === "archived", count: archivedCount },
            ]}
          />
        }
        columns={[
          { key: "skill", label: "Skill", width: "minmax(0,1fr)" },
          { key: "category", label: "Category", width: "8rem", hideBelow: "sm" },
          { key: "level", label: "Level", width: "8rem", hideBelow: "md" },
          { key: "status", label: "Status", width: "6rem", hideBelow: "lg" },
        ]}
        rows={skills.map((skill) => ({
          id: skill.id,
          label: skill.name,
          dimmed: skill.status === "archived",
          cells: {
            skill: (
              <div className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5 font-medium">
                  {skill.featured && <Star className="size-3.5 shrink-0 fill-destructive text-destructive" aria-label="Highlighted" />}
                  <span className="truncate">{skill.name}</span>
                </span>
                <span className="text-[11px] text-muted-foreground @xl:hidden">{skill.category || "No category"}</span>
              </div>
            ),
            category: (
              <span className="inline-block max-w-full truncate rounded-[4px] bg-muted px-2 py-0.5 align-middle text-xs text-muted-foreground">{skill.category || "—"}</span>
            ),
            level:
              skill.level === null ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                <span className="flex w-full items-center gap-2" title={`${skill.level}%`}>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${skill.level}%` }} />
                  </span>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{skill.level}</span>
                </span>
              ),
            status: <StatusBadge status={skill.status} />,
          },
          actions: (
            <>
              <SkillDialog
                id={skill.id}
                categories={categories}
                initial={{
                  name: skill.name,
                  category: skill.category,
                  level: skill.level,
                  icon: skill.icon,
                  featured: skill.featured,
                  order: skill.order,
                  status: skill.status,
                }}
              />
              <RowActions
                label={`Actions for ${skill.name}`}
                actions={[
                  {
                    type: "action",
                    label: skill.featured ? "Remove highlight" : "Highlight",
                    icon: skill.featured ? "unfeature" : "feature",
                    action: toggleSkillFeatured.bind(null, skill.id),
                  },
                  { type: "separator" },
                  skill.status === "active"
                    ? { type: "action", label: "Archive", icon: "archive", action: setCareerItemStatus.bind(null, "skill", skill.id, "archived") }
                    : { type: "action", label: "Restore", icon: "restore", action: setCareerItemStatus.bind(null, "skill", skill.id, "active") },
                  {
                    type: "action",
                    label: "Delete",
                    icon: "delete",
                    destructive: true,
                    action: deleteCareerItem.bind(null, "skill", skill.id),
                    confirm: { title: `Delete “${skill.name}”?`, description: "This cannot be undone. Archive it to hide it instead.", confirmLabel: "Delete" },
                  },
                ]}
              />
            </>
          ),
        }))}
        empty={
          <EmptyState icon={Sparkles} title={status === "archived" ? "No archived skills" : "No skills yet"} description="Add the tools and technologies you work with." />
        }
        footer={
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{skills.length}</span> {status} skill{skills.length === 1 ? "" : "s"}
          </p>
        }
      />
    </>
  );
}
