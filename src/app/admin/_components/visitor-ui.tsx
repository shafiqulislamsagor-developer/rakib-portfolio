import { countryName } from "@/lib/admin/analytics";
import { analyticsTimeZone } from "@/lib/analytics/days";
import { classifySource, type VisitSource } from "@/lib/analytics/source";
import { STATUS_HINTS, STATUS_LABELS, visitorStatus } from "@/lib/analytics/status";
import { ONLINE_WINDOW_MS, type DeviceType, type SourceChannel, type VisitorEventType, type VisitorStatus } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CircleHelp, Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";

export type VisitorRow = {
  id: string;
  vid: string;
  ip: string;
  ips: string[];
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: DeviceType;
  deviceVendor: string;
  deviceModel: string;
  deviceName: string;
  inApp: string;
  screen: string;
  viewport: string;
  pixelRatio: number | null;
  touchPoints: number | null;
  cpuCores: number | null;
  memoryGb: number | null;
  connection: string;
  colorScheme: string;
  language: string;
  languages: string;
  timezone: string;
  country: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
  firstReferrer: string;
  firstLanding: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  source?: { channel?: SourceChannel; name?: string };
  lastPath: string;
  contact?: { name?: string; email?: string; phone?: string; address?: string; messageId?: string | null; at?: string | null };
  reachedOutAt?: string | null;
  customer?: boolean;
  customerAt?: string | null;
  sessions: number;
  pageviews: number;
  actions: number;
  /** Total seconds with the tab visible. Missing on visitors logged before it was recorded. */
  seconds?: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type VisitorEventRow = {
  id: string;
  sid: string;
  type: VisitorEventType;
  path: string;
  referrer: string;
  label: string;
  href: string;
  section: string;
  duration: number;
  depth: number;
  sections: string[];
  ip: string;
  createdAt: string;
};

export { ONLINE_WINDOW_MS };

export function isOnline(lastSeenAt: string, now = Date.now()) {
  return now - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

const DEVICE_ICONS: Record<DeviceType, LucideIcon> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet, unknown: CircleHelp };

export function DeviceIcon({ type, className }: { type: DeviceType; className?: string }) {
  const Icon = DEVICE_ICONS[type] ?? CircleHelp;
  return <Icon className={className} aria-label={type} />;
}

export function browserLabel(visitor: Pick<VisitorRow, "browser" | "browserVersion" | "os" | "osVersion">) {
  const browser = [visitor.browser, visitor.browserVersion].filter(Boolean).join(" ");
  const os = [visitor.os, visitor.osVersion].filter(Boolean).join(" ");
  return [browser, os].filter(Boolean).join(" on ") || "Unknown browser";
}

export function locationLabel(visitor: Pick<VisitorRow, "city" | "country">) {
  return [visitor.city, visitor.country ? countryName(visitor.country) : ""].filter(Boolean).join(", ");
}

/** wa.me needs an international number; local Bangladeshi mobiles (01XXXXXXXXX) get the 88 prefix. */
export function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "";
  return `https://wa.me/${/^01\d{9}$/.test(digits) ? `88${digits}` : digits}`;
}

export function plural(count: number, word: string) {
  return `${formatNumber(count)} ${word}${count === 1 ? "" : "s"}`;
}

// Shown in the analytics time zone (Admin -> Settings) with its abbreviation, so times are unambiguous.
const stampFormatter = () =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: analyticsTimeZone(),
    timeZoneName: "short",
  });
const clockFormatter = () =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: analyticsTimeZone() });

export function formatStamp(iso: string) {
  return iso ? stampFormatter().format(new Date(iso)) : "";
}

export function formatClock(iso: string) {
  return iso ? clockFormatter().format(new Date(iso)) : "";
}

/** Label/value list; rows with an empty value are left out. */
export function Details({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value !== "" && value !== null && value !== undefined && value !== false);
  if (!shown.length) return <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>;
  return (
    <dl className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
      {shown.map(([label, value]) => (
        <Fragment key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/**
 * Personal details are only ever here because the visitor typed them in, so
 * most rows have none. Say so plainly rather than leaving a blank cell.
 */
export function NotProvided({ children = "Not provided" }: { children?: ReactNode }) {
  return <span className="text-muted-foreground/60">{children}</span>;
}

const STATUS_STYLES: Record<VisitorStatus, string> = {
  new: "border-g1/40 bg-white/[0.06] text-g1 dark:text-g1",
  returning: "border-white/40 bg-white/[0.12] text-mist dark:text-mist",
  lead: "border-destructive/40 bg-destructive/[0.1] text-destructive dark:text-destructive",
  customer: "border-white/40 bg-white/[0.12] text-mist dark:text-mist",
};

export function statusOf(visitor: Pick<VisitorRow, "customer" | "sessions" | "contact" | "reachedOutAt">) {
  return visitorStatus({
    customer: visitor.customer,
    sessions: visitor.sessions,
    contact: visitor.contact ?? null,
    reachedOutAt: visitor.reachedOutAt ?? null,
  });
}

export function StatusChip({ status, className }: { status: VisitorStatus; className?: string }) {
  return (
    <span
      title={STATUS_HINTS[status]}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const CHANNEL_LABELS: Record<SourceChannel, string> = {
  direct: "Direct",
  organic: "Search",
  social: "Social",
  ai: "AI assistant",
  campaign: "Campaign",
  email: "Email",
  referral: "Referral",
};

/**
 * How this visitor arrived. Uses the channel stored on their first visit, and
 * works it out from the referrer for records saved before that was kept.
 */
export function sourceOf(visitor: Pick<VisitorRow, "source" | "firstReferrer" | "utm" | "inApp">): VisitSource {
  if (visitor.source?.channel) return { channel: visitor.source.channel, name: visitor.source.name ?? "" };
  return classifySource({ referrer: visitor.firstReferrer, utm: visitor.utm, inApp: visitor.inApp });
}

/** One-line traffic source, e.g. "Google (Search)" or "Direct". */
export function sourceLabel(visitor: Parameters<typeof sourceOf>[0]) {
  const { channel, name } = sourceOf(visitor);
  if (!name) return CHANNEL_LABELS[channel];
  return name === CHANNEL_LABELS[channel] ? name : `${name} (${CHANNEL_LABELS[channel]})`;
}
