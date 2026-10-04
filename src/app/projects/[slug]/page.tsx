import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { getProject, projects } from "@/data/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return project ? { title: `${project.name} — Case study` } : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" />
      <main>
        <div className="pt-[114px]">
          <ProjectHero project={project} />
        </div>
        <div className="mt-32">
          <Overview project={project} />
        </div>
        <div className="mt-32">
          <DesignProcess project={project} />
        </div>
        <div className="mt-32">
          <FullPreview project={project} />
        </div>
        <div className="mt-32">
          <NextProject project={project} />
        </div>
        <div className="mt-32">
          <Contact
            className="left-[6px]"
            intro="Throughout my career  I’ve had the privilege of working with some very talented people at a great bunch of companies."
            headingGap={12}
            headingPadRight={111}
            placeholders={{
              name: "John Doe",
              email: "hello@example.com",
              company: "Company name",
              details: "My project is about...",
            }}
          />
        </div>
      </main>
      <div className="mt-32">
        <Footer variant="inner" contentX={44} discX={632} letsTalkX={51.71} />
      </div>
    </div>
  );
}
