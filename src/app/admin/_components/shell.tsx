"use client";

import { logout } from "@/app/admin/_actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpenText,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  GraduationCap,
  Handshake,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareQuote,
  Search,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

type NavItem = { href: string; label: string; icon: LucideIcon; hint: string; badge?: number };

export type ShellProps = {
  user: { name: string; email: string };
  siteName: string;
  logoText: string;
  unreadCount: number;
  notifications: { id: string; name: string; subject: string; createdAt: string }[];
  children: ReactNode;
};

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  analytics: "Analytics",
  visitors: "Visitors",
  profile: "Profile",
  projects: "Projects",
  blog: "Blog",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  resume: "Résumé",
  media: "Media library",
  messages: "Messages",
  seo: "SEO",
  settings: "Settings",
  system: "Account & system",
  activity: "Activity log",
  search: "Search",
  services: "Services",
  testimonials: "Testimonials",
  faqs: "FAQs",
  pages: "Pages",
  new: "New",
  preview: "Preview",
};

function navGroups(unread: number): { title: string; items: NavItem[] }[] {
  return [
    {
      title: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard, hint: "Visits, messages and what to do next" },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3, hint: "Traffic, sources and popular pages" },
        { href: "/admin/visitors", label: "Visitors", icon: UsersRound, hint: "Who visited: device, IP, location and clicks" },
      ],
    },
    {
      title: "Portfolio",
      items: [
        { href: "/admin/profile", label: "Profile", icon: UserRound, hint: "Name, hero text, photo, socials and CV" },
        { href: "/admin/projects", label: "Projects", icon: FolderKanban, hint: "Case studies shown under Work" },
        { href: "/admin/services", label: "Services", icon: Handshake, hint: "What you offer and how you work" },
        { href: "/admin/skills", label: "Skills", icon: Sparkles, hint: "The “Core stack” chips" },
        { href: "/admin/experience", label: "Experience", icon: BriefcaseBusiness, hint: "Jobs and internships" },
        { href: "/admin/education", label: "Education", icon: GraduationCap, hint: "Degrees, certificates, awards" },
        { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, hint: "Quotes from clients and colleagues" },
        { href: "/admin/resume", label: "Résumé", icon: ScrollText, hint: "Templates, layouts and which sections to show" },
      ],
    },
    {
      title: "Publishing",
      items: [
        { href: "/admin/blog", label: "Blog", icon: BookOpenText, hint: "Write and schedule articles" },
        { href: "/admin/pages", label: "Pages", icon: FileText, hint: "Extra pages like Privacy policy" },
        { href: "/admin/faqs", label: "FAQs", icon: CircleHelp, hint: "Questions shown on Home, Services, Contact" },
        { href: "/admin/media", label: "Media library", icon: ImageIcon, hint: "All uploaded images and PDFs" },
      ],
    },
    {
      title: "Inbox",
      items: [{ href: "/admin/messages", label: "Messages", icon: Inbox, hint: "Contact form submissions", badge: unread }],
    },
    {
      title: "Website",
      items: [
        { href: "/admin/seo", label: "SEO", icon: Globe, hint: "Google titles, descriptions, share images" },
        { href: "/admin/settings", label: "Settings", icon: Settings, hint: "Logo, colours, menu, homepage sections" },
        { href: "/admin/system", label: "Account & system", icon: ShieldCheck, hint: "Password, sessions, health" },
        { href: "/admin/activity", label: "Activity log", icon: Activity, hint: "Every change made in the admin" },
      ],
    },
  ];
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "admin";
  if (/^[a-f0-9]{24}$/i.test(last)) {
    const parent = segments[segments.length - 2];
    if (parent === "messages") return "Message";
    if (parent === "visitors") return "Visitor";
    return `Edit ${SEGMENT_LABELS[parent] ?? ""}`.trim();
  }
  if (last === "new") return `New ${(SEGMENT_LABELS[segments[segments.length - 2]] ?? "item").replace(/s$/, "").toLowerCase()}`;
  return SEGMENT_LABELS[last] ?? "Admin";
}

/** Badge, or a spinner while this link's navigation is in flight (must render inside <Link>). */
function NavItemStatus({ badge }: { badge?: number }) {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 className="size-3.5 shrink-0 animate-spin" aria-label="Loading" />;
  if (!badge) return null;
  return (
    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
      {badge > 99 ? "99+" : badge}
    </span>
  );
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function SidebarNav({
  unread,
  onNavigate,
  pendingHref,
  onPending,
  showHints = false,
}: {
  unread: number;
  onNavigate?: () => void;
  pendingHref: string | null;
  onPending: (href: string) => void;
  /** Mobile drawer: show a one-line explanation under each item. */
  showHints?: boolean;
}) {
  const pathname = usePathname();
  // Highlight the clicked item immediately, before the server responds.
  const current = pendingHref ?? pathname;
  return (
    <nav aria-label="Admin navigation" className="space-y-7">
      {navGroups(unread).map((group) => (
        <div key={group.title}>
          {/* Group label in the "/     Label" eyebrow of the public sections. */}
          <p className="px-3 text-[11px] tracking-[1.26px] whitespace-pre text-g3 uppercase">{`/     ${group.title}`}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, badge, hint }) => {
              const active = isActive(current, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={showHints ? undefined : hint}
                    onClick={(event) => {
                      if (!isPlainLeftClick(event)) return;
                      if (href !== pathname) onPending(href);
                      onNavigate?.();
                    }}
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                    className={cn(
                      "group/nav relative flex select-none items-center gap-3 rounded-[4px] px-3 text-[14px] outline-none transition-[background-color,color] duration-300 ease-figma-out focus-visible:ring-1 focus-visible:ring-white/70",
                      showHints ? "py-2.5" : "py-2",
                      // A white hairline marks the current section, as the lines do on the public pages.
                      "before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-white before:transition-[opacity,transform] before:duration-300",
                      active
                        ? "bg-white/[0.06] text-mist before:scale-y-100 before:opacity-100"
                        : "text-g2 before:scale-y-0 before:opacity-0 hover:bg-white/[0.03] hover:text-g4"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-[4px] border transition-colors duration-300 ease-figma-out",
                        active ? "border-white/40 bg-white/10 text-mist" : "border-[#4e4e4e]/50 text-g2 group-hover/nav:border-[#4e4e4e] group-hover/nav:text-g4"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{label}</span>
                      {showHints && <span className="block truncate text-[11px] font-normal text-muted-foreground">{hint}</span>}
                    </span>
                    <NavItemStatus badge={badge} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ siteName, logoText }: { siteName: string; logoText: string }) {
  return (
    <Link href="/admin" className="group flex items-center gap-3 px-3">
      {/* The site mark itself, so the panel opens on the same brand as the front page. */}
      <span className="grid size-10 shrink-0 place-items-center rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.03] transition-colors duration-300 ease-figma-out group-hover:border-white/50">
        {/* eslint-disable-next-line @next/next/no-img-element -- static vector at an exact size */}
        <img src="/brand/logo.svg" alt="" width={18} height={21} className="block h-[21px] w-[18px]" />
        <span className="sr-only">{logoText}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] leading-tight text-mist">{siteName}</span>
        <span className="mt-0.5 block text-[9px] tracking-[1.26px] text-g3 uppercase">Admin panel</span>
      </span>
    </Link>
  );
}

function UserCard({ user }: { user: ShellProps["user"] }) {
  return (
    <div className="mx-3 rounded-[4px] border border-[#4e4e4e]/40 bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-[13px] text-mist uppercase">
          {user.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] text-g4">{user.name}</span>
          <span className="block truncate text-[11px] text-g2">{user.email}</span>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-[#4e4e4e]/60 px-2 py-1.5 text-[11px] tracking-[0.4px] text-g2 uppercase transition-colors duration-300 ease-figma-out hover:border-white hover:bg-white hover:text-ink"
        >
          <ExternalLink className="size-3.5" /> Live site
        </a>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border border-[#4e4e4e]/60 px-2 py-1.5 text-[11px] tracking-[0.4px] text-g2 uppercase transition-colors duration-300 ease-figma-out hover:border-destructive/60 hover:text-destructive"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    href: "/" + segments.slice(0, index + 1).join("/"),
    label:
      SEGMENT_LABELS[segment] ??
      (/^[a-f0-9]{24}$/i.test(segment) ? (segments[index - 1] === "messages" ? "Message" : "Edit") : segment),
  }));
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {index === crumbs.length - 1 ? (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="truncate hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SearchForm({ autoFocus = false, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (!query.trim()) return;
        router.push(`/admin/search?q=${encodeURIComponent(query.trim())}`);
        onDone?.();
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search projects, posts, messages…"
        aria-label="Search admin"
        className="h-10 w-full rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.02] pl-9 pr-3 text-[14px] text-mist outline-none transition-colors duration-300 placeholder:text-g2/70 focus:border-white/70 focus:bg-white/[0.04]"
      />
    </form>
  );
}

/** Phones: the most used sections one tap away, plus the full menu. */
function BottomTabs({ unread, onMenu, pendingHref, onPending }: { unread: number; onMenu: () => void; pendingHref: string | null; onPending: (href: string) => void }) {
  const pathname = usePathname();
  const current = pendingHref ?? pathname;
  const tabs: { href: string; label: string; icon: LucideIcon; badge?: number }[] = [
    { href: "/admin", label: "Home", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/blog", label: "Blog", icon: BookOpenText },
    { href: "/admin/messages", label: "Inbox", icon: Inbox, badge: unread },
  ];
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#4e4e4e]/40 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[10px] lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(current, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={(event) => {
                  if (isPlainLeftClick(event) && href !== pathname) onPending(href);
                }}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-mist" : "text-g2"
                )}
              >
                <span className={cn("relative grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-white/10")}>
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {badge ? (
                    <span className="absolute -right-0.5 -top-1 min-w-4 rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={onMenu} className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <Menu className="size-[18px]" aria-hidden="true" />
            </span>
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default function AdminShell({ user, siteName, logoText, unreadCount, notifications, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  /*
   * Both of these end when the route changes, so each remembers the page it
   * started on and is derived rather than reset from an effect: once
   * `pathname` moves on, the optimistic nav highlight and the mobile search
   * bar switch themselves off.
   */
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const pendingHref = pending && pending.from === pathname ? pending.href : null;
  const onPending = (href: string) => setPending({ href, from: pathname });

  const [searchOpenAt, setSearchOpenAt] = useState<string | null>(null);
  const searchOpen = searchOpenAt === pathname;

  // A navigation that never lands (an error, a blocked route) stops pending too.
  useEffect(() => {
    if (!pendingHref) return;
    const timer = setTimeout(() => setPending(null), 10_000);
    return () => clearTimeout(timer);
  }, [pendingHref]);

  return (
    <div className="admin-root min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col border-r border-[#4e4e4e]/40 bg-[#040404] pb-4 pt-5 lg:flex">
        <Brand siteName={siteName} logoText={logoText} />
        <div className="admin-scroll mt-6 flex-1 overflow-y-auto px-3 pb-6">
          <SidebarNav unread={unreadCount} pendingHref={pendingHref} onPending={onPending} />
        </div>
        <UserCard user={user} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-[86vw] max-w-80 flex-col gap-0 overflow-hidden p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="border-b border-border py-4">
            <Brand siteName={siteName} logoText={logoText} />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <SidebarNav
              unread={unreadCount}
              onNavigate={() => setMobileOpen(false)}
              pendingHref={pendingHref}
              onPending={onPending}
              showHints
            />
          </div>
          <div className="border-t border-border py-3">
            <UserCard user={user} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 border-b border-[#4e4e4e]/40 bg-ink/90 backdrop-blur-[10px]">
          <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0 lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <Menu />
            </Button>
            <p className="min-w-0 flex-1 truncate text-[16px] text-g4 md:hidden">{pageTitle(pathname)}</p>
            <Breadcrumbs />

            <SearchForm className="ml-auto hidden w-full max-w-xs md:block" />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label={searchOpen ? "Close search" : "Search"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpenAt(searchOpen ? null : pathname)}
            >
              {searchOpen ? <X /> : <Search />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative shrink-0" aria-label={`Notifications (${unreadCount} unread)`}>
                  <Bell />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" aria-hidden="true" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  <span className="text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length ? (
                  notifications.map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link href={`/admin/messages/${item.id}`} className="flex flex-col items-start gap-0.5">
                        <span className="w-full truncate text-sm font-medium">{item.subject}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.name} · {relativeTime(item.createdAt)}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/messages" className="justify-center text-sm font-medium">
                    Open inbox
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden shrink-0 rounded-full sm:inline-flex" aria-label="Account menu">
                  <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary">
                    {user.name.slice(0, 1)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm font-medium">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/system">
                    <ShieldCheck /> Account & security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/" target="_blank" rel="noreferrer">
                    <ExternalLink /> View live site
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void logout()} className="text-destructive focus:text-destructive">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {searchOpen && (
            <div className="border-t border-border px-4 py-3 md:hidden">
              <SearchForm autoFocus onDone={() => setSearchOpenAt(null)} />
            </div>
          )}
        </header>

        <main id="admin-main" className="w-full px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>

      <BottomTabs unread={unreadCount} onMenu={() => setMobileOpen(true)} pendingHref={pendingHref} onPending={onPending} />
    </div>
  );
}
