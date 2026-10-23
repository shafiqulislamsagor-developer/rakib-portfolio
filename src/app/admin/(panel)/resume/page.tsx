import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import type { ResumeSectionKey } from "@/lib/constants";
import { getProfile, getSiteSettings } from "@/lib/content/public";
import { Education, Experience, Project, Service, Skill, Testimonial } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { ExternalLink, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import ResumeForm from "./resume-form";

export const metadata: Metadata = { title: "Résumé" };

export default async function ResumeAdminPage() {
  await adminPage();
  const [settings, profile, experienceCount, skillsCount, projectsCount, educationItems, servicesCount, testimonialsCount] =
    await Promise.all([
      getSiteSettings(),
      getProfile(),
      Experience.countDocuments(),
      Skill.countDocuments(),
      Project.countDocuments({ status: "published" }),
      Education.find().select("kind").lean(),
      Service.countDocuments(),
      Testimonial.countDocuments(),
    ]);

  const available: Record<ResumeSectionKey, number> = {
    summary: profile.aboutBody || profile.intro ? 1 : 0,
    highlights: profile.highlights.length,
    experience: experienceCount,
    skills: skillsCount,
    projects: projectsCount,
    education: educationItems.filter((item) => item.kind === "education").length,
    certifications: educationItems.filter((item) => item.kind === "certification").length,
    achievements: educationItems.filter((item) => item.kind === "achievement").length,
    services: servicesCount,
    testimonials: testimonialsCount,
  };

  return (
    <>
      <PageHeader
        icon={ScrollText}
        title="Résumé"
        description="Choose a template and configure which blocks appear on your public résumé. Any updates to your profile, jobs, skills, or projects automatically update your live résumé."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/resume" target="_blank" rel="noopener">
              <ExternalLink className="mr-1.5 size-4" /> View live résumé
            </Link>
          </Button>
        }
      />
      <ResumeForm initial={{ resume: settings.resume }} available={available} />
    </>
  );
}

