import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { getChrome } from "@/lib/chrome";
import { builtInPageMetadata } from "@/lib/content/metadata";
import { getProfile, getPublishedProjects, getSiteSettings } from "@/lib/content/public";
import { works } from "@/lib/design";
import ProjectExplorer from "./project-explorer";

export const revalidate = 600;

export function generateMetadata(): Promise<Metadata> {
  return builtInPageMetadata("projects", "/projects", "Work");
}

export default async function ProjectsPage() {
  const [chrome, settings, profile, projects] = await Promise.all([
    getChrome(),
    getSiteSettings(),
    getProfile(),
    getPublishedProjects(),
  ]);
  const copy = settings.sectionCopy.projects;

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" {...chrome.nav} />
      <main>
        {/* The visible heading is the section copy; the SEO title is for the tab and search results. */}
        <PageHero
          eyebrow={copy.eyebrow || "Work"}
          heading={copy.heading || settings.pages.projects.title || "Selected Work"}
          intro={copy.intro}
        />
        <div className="mt-20">
          <Suspense fallback={<p className="mx-auto max-w-[1440px] px-10 text-[16px] text-g2">Loading work…</p>}>
            <ProjectExplorer projects={works(projects)} />
          </Suspense>
        </div>
        <div className="mt-[136px]">
          <Contact
            eyebrow={settings.sectionCopy.contact.eyebrow}
            heading={settings.sectionCopy.contact.heading}
            intro={settings.sectionCopy.contact.intro}
            formEnabled={settings.contact.formEnabled}
            email={profile.email}
          />
        </div>
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}
