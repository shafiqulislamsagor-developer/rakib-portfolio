import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { getChrome } from "@/lib/chrome";
import { RESUME_TEMPLATES, type ResumeTemplate } from "@/lib/constants";
import { builtInPageMetadata } from "@/lib/content/metadata";
import { getSiteSettings } from "@/lib/content/public";
import { buildResume } from "@/lib/content/resume";
import { cn } from "@/lib/utils";
import PrintButton from "./print-button";
import { RESUME_TEMPLATE_COMPONENTS } from "./templates";

export const revalidate = 600;

export function generateMetadata(): Promise<Metadata> {
  return builtInPageMetadata("resume", "/resume", "Résumé");
}

/**
 * The résumé is assembled from the live site content (lib/content/resume) and
 * drawn by whichever template the admin picked, so it never needs editing of
 * its own: change the profile, a job or a project and this page follows.
 * Everything but the sheet is marked `no-print`, and the print rules in
 * panel.css turn the sheet into ink on A4 paper.
 */
export default async function ResumePage({ searchParams }: PageProps<"/resume">) {
  const [chrome, params, resume, settings] = await Promise.all([
    getChrome(),
    searchParams,
    buildResume(),
    getSiteSettings(),
  ]);

  const requested = typeof params?.template === "string" ? params.template : null;
  const activeTemplate: ResumeTemplate =
    requested && (RESUME_TEMPLATES as readonly string[]).includes(requested)
      ? (requested as ResumeTemplate)
      : settings.resume.template;

  const Template = RESUME_TEMPLATE_COMPONENTS[activeTemplate] ?? RESUME_TEMPLATE_COMPONENTS.classic;

  return (
    <div className="relative overflow-x-clip">
      <div className="no-print">
        <Nav variant="inner" {...chrome.nav} />
      </div>
      <main className="resume-page mx-auto w-full max-w-[1440px] px-10 pt-[200px] pb-24">
        <div className="mx-auto w-[900px]">
          <div className="no-print mb-10 flex flex-col gap-6">
            <p className="text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">{"/     Résumé"}</p>
            <h1 className="text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">{resume.header.name}</h1>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] tracking-[0.9px] text-g3 uppercase">Layout</span>
                <div className="inline-flex gap-1 rounded-[4px] border border-[#4e4e4e]/50 bg-white/[0.02] p-1">
                  {RESUME_TEMPLATES.map((tpl) => (
                    <Link
                      key={tpl}
                      href={tpl === settings.resume.template ? "/resume" : `/resume?template=${tpl}`}
                      className={cn(
                        "rounded-[4px] px-3 py-1.5 text-[13px] capitalize transition-colors duration-300 ease-figma-out",
                        activeTemplate === tpl ? "bg-white/[0.1] text-mist" : "text-g2 hover:bg-white/[0.04] hover:text-g4",
                      )}
                    >
                      {tpl}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrintButton />
                {resume.header.cvUrl && (
                  <a
                    href="/cv"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-white bg-white px-5 text-[14px] text-ink uppercase transition-colors duration-300 ease-figma-out hover:bg-g4"
                  >
                    <Download className="size-4" /> Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>

          <Template resume={resume} />
        </div>
      </main>
      <div className="no-print mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}
