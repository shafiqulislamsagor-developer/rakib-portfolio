import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Nav } from "@/components/Nav";
import {
  DesignProcess,
  FullPreview,
  NextProject,
  Overview,
  ProjectHero,
} from "@/components/project/ProjectSections";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { getChrome } from "@/lib/chrome";
import { getProfile, getProjectBySlug, getPublishedProjects, getSiteSettings } from "@/lib/content/public";
import { nextProjects } from "@/lib/design";
import { bodyAfterLead, leadParagraph } from "@/lib/markdown";

export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  if (!found || !("item" in found)) return {};
  const { item } = found;
  const title = item.seo.title || `${item.title} — Case study`;
  const description = item.seo.description || item.summary;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${item.slug}` },
    openGraph: {
      title,
      description,
      url: `/projects/${item.slug}`,
      images: [item.seo.ogImage || item.cover.url || item.thumbnail.url].filter(Boolean),
    },
    ...(item.seo.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  if (!found) notFound();
  // The slug changed in the admin panel: the old address keeps working.
  if ("redirectTo" in found) permanentRedirect(found.redirectTo);

  const project = found.item;
  const [chrome, settings, profile, projects] = await Promise.all([
    getChrome(),
    getSiteSettings(),
    getProfile(),
    getPublishedProjects(),
  ]);
  const next = nextProjects(projects, project);
  const caseStudyBody = bodyAfterLead(project.content);

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <div className="pt-[114px]">
          <ProjectHero project={project} />
        </div>
        <div className="mt-32">
          <Overview project={project} body={leadParagraph(project.content)} />
        </div>
        {/*
         * The rest of the case study as it was written in the admin panel. The
         * opening paragraph is already set in display type by Overview, so this
         * picks up after it, in the reading measure the blog and custom pages use.
         */}
        {caseStudyBody && (
          <section aria-label="Case study" className="relative mx-auto mt-32 w-full max-w-[1440px]">
            <div className="ml-[46px] w-[1360px]">
              <div data-reveal="up" className="w-[820px]">
                <Markdown content={caseStudyBody} />
              </div>
            </div>
          </section>
        )}
        {(project.process.body || project.process.images.length > 0) && (
          <div className="mt-32">
            <DesignProcess project={project} />
          </div>
        )}
        {project.fullPreview.url && (
          <div className="mt-32">
            <FullPreview project={project} />
          </div>
        )}
        {next && (
          <div className="mt-32">
            <NextProject next={next} />
          </div>
        )}
        <div className="mt-32">
          <Contact
            className="left-[6px]"
            eyebrow={settings.sectionCopy.contact.eyebrow}
            heading={settings.sectionCopy.contact.heading}
            intro="Throughout my career  I’ve had the privilege of working with some very talented people at a great bunch of companies."
            headingGap={12}
            headingPadRight={111}
            placeholders={{
              name: "John Doe",
              email: "hello@example.com",
              company: "Company name",
              details: "My project is about...",
            }}
            formEnabled={settings.contact.formEnabled}
            email={profile.email}
          />
        </div>
      </main>
      <div className="mt-32">
        <Footer variant="inner" contentX={44} discX={632} letsTalkX={51.71} {...chrome.footer} />
      </div>
    </div>
  );
}
