import { ArrowLeft, BarChart3, FolderKanban, Inbox, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/content/public";
import { isDbConfigured } from "@/lib/env";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const PANEL_FEATURES: { icon: LucideIcon; title: string; copy: string }[] = [
  {
    icon: FolderKanban,
    title: "Everything is content",
    copy: "Projects, posts, services, testimonials and pages — edited here, live in seconds.",
  },
  {
    icon: BarChart3,
    title: "Your own analytics",
    copy: "Cookie-less visitor numbers and a per-visitor log, stored in your database alone.",
  },
  { icon: Inbox, title: "One inbox", copy: "Contact messages with notes, reply tracking and spam handling." },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSession()) redirect("/admin");
  const [{ next }, settings] = await Promise.all([searchParams, getSiteSettings().catch(() => null)]);
  const siteName = settings?.siteName ?? "Rakib Khan";

  return (
    <main className="auth-shell admin-root grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand side. Decorative only, so it is dropped entirely on small screens. */}
      <aside className="relative hidden flex-col justify-between border-r border-[#4e4e4e]/40 p-10 lg:flex xl:p-14">
        <span className="auth-orb top-[12%] left-[8%] size-72 bg-[#696969]" aria-hidden="true" />
        <span className="auth-orb right-[10%] bottom-[6%] size-64 bg-[#4e4e4e]" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static vector at an exact size */}
          <img src="/brand/logo.svg" alt="" width={21} height={24} className="block h-6 w-[21px]" />
          <span>
            <span className="block text-[14px] text-g4">{siteName}</span>
            <span className="block text-[10px] tracking-[1.26px] text-g3 uppercase">Admin console</span>
          </span>
        </div>

        <div className="relative max-w-md">
          {/* The oversized light-grey heading of the public sections. */}
          <h2 className="text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
            Your portfolio,
            <br />
            <em className="text-[#515151] italic">entirely yours to run.</em>
          </h2>
          <ul className="mt-12 space-y-7">
            {PANEL_FEATURES.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[4px] border border-[#989898]/30 bg-[#989898]/10 text-g4 backdrop-blur-[10px]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[16px] text-g4">{title}</span>
                  <span className="mt-1 block text-[14px] leading-[22px] text-g2">{copy}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[11px] tracking-[1.26px] text-g3 uppercase">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Rate limited · attempts logged
        </p>
      </aside>

      {/* Form side */}
      <div className="relative flex flex-col px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#4e4e4e]/60 px-3 py-1.5 text-[11px] tracking-[0.4px] text-g2 uppercase transition-colors duration-300 ease-figma-out hover:border-white hover:bg-white hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to the site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[25.5rem]">
            {/* Repeats the brand mark for small screens, where the panel is hidden. */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- static vector at an exact size */}
              <img src="/brand/logo.svg" alt="" width={21} height={24} className="block h-6 w-[21px]" />
              <span>
                <span className="block text-[14px] text-g4">{siteName}</span>
                <span className="block text-[10px] tracking-[1.26px] text-g3 uppercase">Admin console</span>
              </span>
            </div>

            <div className="auth-card p-7 sm:p-9">
              <p className="text-[11px] tracking-[1.26px] whitespace-pre text-g3 uppercase">{"/     Sign in"}</p>
              <h1 className="mt-3 text-[40px] leading-[1.1] tracking-[-1.2px] text-g1">Welcome back</h1>
              <p className="mt-2 text-[14px] leading-[22px] text-g2">Sign in to manage your portfolio.</p>

              {!isDbConfigured() && (
                <p
                  role="alert"
                  className="mt-6 rounded-[4px] border border-destructive/40 bg-destructive/[0.08] p-3 text-[13px] leading-[20px] text-destructive"
                >
                  The database is not configured. Set <code className="font-mono text-[.9em] text-mist">MONGODB_URI</code> in your
                  environment, then run <code className="font-mono text-[.9em] text-mist">pnpm db:seed --yes</code>.
                </p>
              )}

              <LoginForm next={typeof next === "string" ? next : undefined} />
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12px] text-g2">
              <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
              Protected area. Sign-in attempts are rate limited and logged.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
