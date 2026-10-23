import { ASIDE_SECTIONS, RESUME_SECTION_LABELS, SOCIAL_LABELS, type ResumeSectionKey } from "@/lib/constants";
import { getEducation, getExperience, getProfile, getPublishedProjects, getServices, getSiteSettings, getSkills, getTestimonials } from "@/lib/content/public";
import { formatMonth, formatPeriod } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import type {
  Resume,
  ResumeContact,
  ResumeCredential,
  ResumeProject,
  ResumeQuote,
  ResumeRole,
  ResumeSection,
  ResumeSkillGroup,
} from "@/types/content";

export { ASIDE_SECTIONS };
export type {
  Resume,
  ResumeContact,
  ResumeCredential,
  ResumeProject,
  ResumeQuote,
  ResumeRole,
  ResumeSection,
  ResumeSkillGroup,
};

const TITLES = RESUME_SECTION_LABELS;

export function sectionTitle(key: ResumeSectionKey) {
  return TITLES[key];
}

export async function buildResume(): Promise<Resume> {
  const [settings, siteUrl] = await Promise.all([getSiteSettings(), getSiteUrl()]);
  const options = settings.resume;
  const shown = options.sections.filter((section) => section.visible).map((section) => section.key);
  const wants = (key: ResumeSectionKey) => shown.includes(key);
  const wantsCredentials = wants("education") || wants("certifications") || wants("achievements");

  // Only load what the chosen sections actually need.
  const [profile, experience, skills, projects, education, services, testimonials] = await Promise.all([
    getProfile(),
    wants("experience") ? getExperience() : [],
    wants("skills") ? getSkills() : [],
    wants("projects") ? getPublishedProjects() : [],
    wantsCredentials ? getEducation() : [],
    wants("services") ? getServices() : [],
    wants("testimonials") ? getTestimonials() : [],
  ]);

  const contacts: ResumeContact[] = [
    profile.email ? { label: profile.email, href: `mailto:${profile.email}` } : null,
    options.showPhone && profile.phone ? { label: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}` } : null,
    { label: siteUrl.replace(/^https?:\/\//, ""), href: siteUrl },
    ...(options.showSocials
      ? profile.socials.map((social) => ({ label: social.label || SOCIAL_LABELS[social.platform], href: social.url }))
      : []),
  ].filter((contact): contact is ResumeContact => Boolean(contact));

  const credentials = (kind: "education" | "certification" | "achievement"): ResumeCredential[] =>
    education
      .filter((item) => item.kind === kind)
      .map((item) => ({
        id: item.id,
        title: item.title,
        org: item.institution,
        // A course has a span; a certificate or an award has a single date.
        period: kind === "education" ? formatPeriod(item.startDate, item.endDate, "short") : formatMonth(item.endDate ?? item.startDate, "short"),
        description: item.description,
        url: item.credentialUrl,
      }));

  const build = (key: ResumeSectionKey): ResumeSection | null => {
    const title = TITLES[key];
    switch (key) {
      case "summary": {
        const body = options.summary || profile.aboutBody || profile.intro;
        return body ? { key, title, kind: "text", body } : null;
      }
      case "highlights":
        return profile.highlights.length ? { key, title, kind: "stats", items: profile.highlights } : null;
      case "experience":
        return experience.length
          ? {
              key,
              title,
              kind: "roles",
              items: experience.map((job) => ({
                id: job.id,
                title: job.title,
                org: job.company,
                orgUrl: job.companyUrl,
                period: formatPeriod(job.startDate, job.endDate, "short"),
                location: job.location,
                description: job.description,
                bullets: job.achievements,
              })),
            }
          : null;
      case "skills": {
        const categories = [...new Set(skills.map((skill) => skill.category || "Other"))];
        const groups = categories.map((category) => ({
          category,
          items: skills
            .filter((skill) => (skill.category || "Other") === category)
            .map((skill) => ({ name: skill.name, level: skill.level })),
        }));
        return groups.length ? { key, title, kind: "skills", groups, showLevels: options.showSkillLevels } : null;
      }
      case "projects": {
        const featured = projects.filter((project) => project.featured);
        const pool = options.featuredProjectsOnly && featured.length ? featured : projects;
        const items = pool.slice(0, options.projectLimit).map((project) => ({
          id: project.id,
          title: project.title,
          url: `${siteUrl}/projects/${project.slug}`,
          summary: project.summary,
          tech: project.technologies.slice(0, 6),
        }));
        return items.length ? { key, title, kind: "projects", items } : null;
      }
      case "education":
      case "certifications":
      case "achievements": {
        const items = credentials(key === "education" ? "education" : key === "certifications" ? "certification" : "achievement");
        return items.length ? { key, title, kind: "credentials", items } : null;
      }
      case "services": {
        const items = services.map((service) => ({ title: service.title, summary: service.summary }));
        return items.length ? { key, title, kind: "list", items } : null;
      }
      case "testimonials": {
        const items = testimonials.slice(0, 3).map((testimonial) => ({
          id: testimonial.id,
          quote: testimonial.quote,
          name: testimonial.name,
          role: [testimonial.role, testimonial.company].filter(Boolean).join(", "),
        }));
        return items.length ? { key, title, kind: "quotes", items } : null;
      }
    }
  };

  return {
    header: {
      name: profile.name,
      headline: options.headline || profile.title,
      location: options.showLocation ? profile.location : "",
      contacts,
      cvUrl: profile.cv.url,
    },
    // A section with nothing in it is dropped, so hiding content on the site hides it here too.
    sections: shown.map(build).filter((section): section is ResumeSection => section !== null),
  };
}
