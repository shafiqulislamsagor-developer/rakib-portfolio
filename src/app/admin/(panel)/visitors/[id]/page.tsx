import { deleteVisitor, setVisitorCustomer } from "@/app/admin/_actions/visitors";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { buildHref, PageHeader, Pagination, Panel, StatCard, StatusBadge } from "@/app/admin/_components/ui";
import {
  Details,
  DeviceIcon,
  NotProvided,
  StatusChip,
  browserLabel,
  formatClock,
  formatStamp,
  isOnline,
  locationLabel,
  plural,
  sourceLabel,
  statusOf,
  whatsappLink,
  type VisitorEventRow,
  type VisitorRow,
} from "@/app/admin/_components/visitor-ui";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate } from "@/lib/admin/paginate";
import type { VisitorEventType } from "@/lib/constants";
import { Visitor, VisitorEvent } from "@/lib/db/models";
import { toPlain } from "@/lib/db/serialize";
import { formatDuration, formatNumber, relativeTime } from "@/lib/format";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  MousePointerClick,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Visitor" };

const EVENT_ICONS: Record<VisitorEventType, LucideIcon> = {
  pageview: Eye,
  click: MousePointerClick,
  outbound: ExternalLink,
  download: Download,
  form_submit: Send,
  copy: Copy,
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Same-site links show as a path; others in full. */
function shortHref(href: string) {
  try {
    const url = new URL(href);
    if (url.protocol === "mailto:" || url.protocol === "tel:") return url.pathname;
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return href;
  }
}

function Quote({ children }: { children: ReactNode }) {
  return <span className="font-medium">“{children}”</span>;
}

function PathLink({ path }: { path: string }) {
  return (
    <Link href={path} target="_blank" className="font-mono text-[13px] text-primary hover:underline">
      {path}
    </Link>
  );
}

function describe(event: VisitorEventRow): ReactNode {
  switch (event.type) {
    case "pageview":
      return (
        <>
          Viewed <PathLink path={event.path} />
        </>
      );
    case "outbound":
      if (event.href.startsWith("mailto:")) return <>Opened the email link {event.href.slice(7).split("?")[0]}</>;
      if (event.href.startsWith("tel:")) return <>Tapped the phone link {event.href.slice(4)}</>;
      if (/\/\/(?:wa\.me|(?:api|web|chat)\.whatsapp\.com)\//i.test(event.href)) return <>Opened WhatsApp to message you</>;
      if (/\/\/m\.me\//i.test(event.href)) return <>Opened Messenger to message you</>;
      if (/\/\/t\.me\//i.test(event.href)) return <>Opened Telegram to message you</>;
      return (
        <>
          Left to <span className="font-mono text-[13px]">{shortHref(event.href)}</span>
          {event.label && (
            <>
              {" "}
              via <Quote>{event.label}</Quote>
            </>
          )}
        </>
      );
    case "download":
      return (
        <>
          Downloaded <Quote>{event.label || shortHref(event.href)}</Quote>
        </>
      );
    case "form_submit":
      return (
        <>
          Submitted the <Quote>{event.label}</Quote>
        </>
      );
    case "copy":
      return (
        <>
          Copied <Quote>{event.label}</Quote>
        </>
      );
    default:
      return (
        <>
          Clicked <Quote>{event.label || "an element"}</Quote>
          {event.href && hostOf(event.href) && (
            <span className="text-muted-foreground"> → {new URL(event.href).pathname}</span>
          )}
        </>
      );
  }
}

function eventMeta(event: VisitorEventRow, visitorIp: string) {
  const meta: string[] = [formatClock(event.createdAt)];
  if (event.type === "pageview") {
    if (event.duration) meta.push(`stayed ${formatDuration(event.duration)}`);
    if (event.depth) meta.push(`scrolled ${event.depth}%`);
    if (event.sections.length) meta.push(`saw ${event.sections.map((id) => `#${id}`).join(", ")}`);
    if (event.referrer) meta.push(`came from ${hostOf(event.referrer) || event.referrer}`);
  } else {
    meta.push(`on ${event.path}${event.section ? ` #${event.section}` : ""}`);
  }
  if (event.ip && event.ip !== visitorIp) meta.push(`IP ${event.ip}`);
  return meta;
}

export default async function VisitorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  // Ownership & role authorization check: ensure caller has admin/owner privileges
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "owner")) {
    notFound();
  }
  const doc = await Visitor.findById(id).lean();
  if (!doc) notFound();
  const visitor = toPlain<VisitorRow>(doc);
  const page = pageFromParam((await searchParams).page);

  const [events, timeTotals, sameIp] = await Promise.all([
    paginate(VisitorEvent, { vid: visitor.vid }, { page, pageSize: 100, sort: { createdAt: -1 }, map: (event) => toPlain<VisitorEventRow>(event) }),
    VisitorEvent.aggregate<{ seconds: number }>([
      { $match: { vid: visitor.vid, type: "pageview" } },
      { $group: { _id: null, seconds: { $sum: "$duration" } } },
    ]),
    visitor.ip ? Visitor.countDocuments({ ips: visitor.ip, _id: { $ne: doc._id } }) : Promise.resolve(0),
  ]);

  // Consecutive events from one session form a visit (events are newest first).
  const visits: { sid: string; events: VisitorEventRow[] }[] = [];
  for (const event of events.items) {
    const current = visits[visits.length - 1];
    if (current && current.sid === event.sid) current.events.push(event);
    else visits.push({ sid: event.sid, events: [event] });
  }

  const online = isOnline(visitor.lastSeenAt);
  const otherIps = visitor.ips.filter((ip) => ip !== visitor.ip);
  const campaign = [visitor.utm?.source, visitor.utm?.medium, visitor.utm?.campaign].filter(Boolean).join(" / ");
  const hasCoordinates = Boolean(visitor.latitude && visitor.longitude);
  const contact = visitor.contact?.at ? visitor.contact : null;
  const whatsapp = contact?.phone ? whatsappLink(contact.phone) : "";
  const status = statusOf(visitor);

  return (
    <>
      <Link href="/admin/visitors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to visitors
      </Link>
      <PageHeader
        title={contact?.name || visitor.deviceName || "Unknown device"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusChip status={status} />
            {online && <StatusBadge status="live" label="Online now" />}
            {contact?.name && <span>{visitor.deviceName} ·</span>}
            <span>{browserLabel(visitor)}</span>
            <span>· {visitor.ip || "IP unknown"}</span>
            {locationLabel(visitor) && <span>· {locationLabel(visitor)}</span>}
          </span>
        }
        actions={
          <>
            <ActionButton
              action={setVisitorCustomer.bind(null, id, !visitor.customer)}
              label={visitor.customer ? "Not a customer" : "Mark as customer"}
              icon={visitor.customer ? "unfeature" : "feature"}
              variant="outline"
            />
            <ActionButton
              action={deleteVisitor.bind(null, id)}
              label="Delete"
              icon="delete"
              variant="destructive"
              redirectTo="/admin/visitors"
              confirm={{ title: "Delete this visitor permanently?", description: "Their device details and every recorded action will be removed.", confirmLabel: "Delete" }}
            />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visits" value={formatNumber(visitor.sessions)} hint={`first ${relativeTime(visitor.firstSeenAt)}`} icon={CalendarDays} />
        <StatCard label="Page views" value={formatNumber(visitor.pageviews)} icon={Eye} />
        <StatCard label="Actions" value={formatNumber(visitor.actions)} hint="clicks, downloads, forms" icon={MousePointerClick} />
        <StatCard label="Time on site" value={formatDuration(timeTotals[0]?.seconds ?? 0)} hint="while the tab was visible" icon={Clock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="min-w-0 space-y-6">
          {/* Personal details exist only because the visitor typed them in, so the rows stay and say "Not provided". */}
          <Panel
            title="Contact details"
            description={
              contact
                ? "What this visitor typed into the contact form. Phone and address are optional there, so they are often empty."
                : "Filled in only when a visitor sends the contact form. Nothing here is looked up or guessed."
            }
          >
            <Details
              rows={[
                ["Name", contact?.name || <NotProvided key="name" />],
                [
                  "Email",
                  contact?.email ? (
                    <a key="email" href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  ) : (
                    <NotProvided key="email" />
                  ),
                ],
                [
                  "Phone",
                  contact?.phone ? (
                    <span key="phone" className="flex flex-wrap gap-x-3">
                      <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                      {whatsapp && (
                        <a href={whatsapp} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          WhatsApp ↗
                        </a>
                      )}
                    </span>
                  ) : (
                    <NotProvided key="phone" />
                  ),
                ],
                ["Address", contact?.address || <NotProvided key="address" />],
                [
                  "Message",
                  contact?.messageId ? (
                    <Link key="message" href={`/admin/messages/${contact.messageId}`} className="text-primary hover:underline">
                      Open message · {formatStamp(contact.at ?? "")}
                    </Link>
                  ) : (
                    ""
                  ),
                ],
                ["Asked to be contacted", visitor.reachedOutAt ? formatStamp(visitor.reachedOutAt) : ""],
                [
                  "Status",
                  <span key="status" className="inline-flex items-center gap-2">
                    <StatusChip status={status} />
                    {visitor.customer && visitor.customerAt && (
                      <span className="text-xs text-muted-foreground">marked {formatStamp(visitor.customerAt)}</span>
                    )}
                  </span>,
                ],
              ]}
            />
          </Panel>

          <Panel title="Device">
            <Details
              rows={[
                ["Device", <span key="device" className="inline-flex items-center gap-1.5"><DeviceIcon type={visitor.deviceType} className="size-4 text-muted-foreground" />{visitor.deviceName}</span>],
                ["Type", visitor.deviceType === "unknown" ? "" : visitor.deviceType[0].toUpperCase() + visitor.deviceType.slice(1)],
                ["Maker", visitor.deviceVendor],
                ["Model", visitor.deviceModel],
                ["Browser", [visitor.browser, visitor.browserVersion].filter(Boolean).join(" ") + (visitor.inApp ? ` (inside the ${visitor.inApp} app)` : "")],
                ["System", [visitor.os, visitor.osVersion].filter(Boolean).join(" ")],
                ["Screen", visitor.screen ? `${visitor.screen}${visitor.pixelRatio ? ` @${visitor.pixelRatio}x` : ""}` : ""],
                ["Window", visitor.viewport],
                ["Touch points", visitor.touchPoints ?? ""],
                ["CPU cores", visitor.cpuCores ?? ""],
                ["Memory", visitor.memoryGb ? `≈ ${visitor.memoryGb} GB` : ""],
                ["Connection", visitor.connection ? visitor.connection.toUpperCase() : ""],
                ["Theme", visitor.colorScheme],
                ["Languages", visitor.languages || visitor.language],
                ["Time zone", visitor.timezone],
                ["User agent", visitor.userAgent ? <span key="ua" className="font-mono text-xs text-muted-foreground">{visitor.userAgent}</span> : ""],
              ]}
            />
          </Panel>

          <Panel title="Network & location" description="Location is approximate (city level) and comes from the IP address.">
            <Details
              rows={[
                ["IP address", visitor.ip ? <span key="ip" className="font-mono">{visitor.ip}</span> : ""],
                ["Earlier IPs", otherIps.length ? <span key="ips" className="font-mono text-xs">{otherIps.join(", ")}</span> : ""],
                ["Location", locationLabel(visitor)],
                ["Region code", visitor.region],
                [
                  "Map",
                  hasCoordinates ? (
                    <a
                      key="map"
                      href={`https://www.google.com/maps?q=${encodeURIComponent(`${visitor.latitude},${visitor.longitude}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {visitor.latitude}, {visitor.longitude} ↗
                    </a>
                  ) : (
                    ""
                  ),
                ],
                [
                  "Same IP",
                  sameIp ? (
                    <Link key="same" href={buildHref("/admin/visitors", { q: visitor.ip })} className="text-primary hover:underline">
                      {plural(sameIp, "other visitor")}
                    </Link>
                  ) : (
                    ""
                  ),
                ],
              ]}
            />
          </Panel>

          <Panel title="How they found you">
            <Details
              rows={[
                ["First seen", formatStamp(visitor.firstSeenAt)],
                ["Last seen", `${formatStamp(visitor.lastSeenAt)} (${relativeTime(visitor.lastSeenAt)})`],
                ["Traffic source", sourceLabel(visitor)],
                ["Came from", visitor.firstReferrer ? hostOf(visitor.firstReferrer) || visitor.firstReferrer : "Direct (typed the address, a bookmark or an app)"],
                ["Landing page", visitor.firstLanding],
                ["Campaign", campaign],
                ["Visitor id", <span key="vid" className="font-mono text-xs text-muted-foreground">{visitor.vid}</span>],
              ]}
            />
          </Panel>
        </div>

        <Panel title="Activity" description="Every page and action, newest first." className="min-w-0 self-start">
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded.</p>
          ) : (
            <ol className="space-y-6">
              {visits.map((visit, index) => (
                <li key={`${visit.sid}-${index}`}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Visit · {formatStamp(visit.events[visit.events.length - 1].createdAt)}
                  </p>
                  <ol className="space-y-3.5 border-l border-border pl-5">
                    {visit.events.map((event) => {
                      const Icon = EVENT_ICONS[event.type] ?? MousePointerClick;
                      return (
                        <li key={event.id} className="relative">
                          <span className="absolute -left-[31px] top-0 grid size-5 place-items-center rounded-full border border-border bg-card text-muted-foreground">
                            <Icon className="size-3" />
                          </span>
                          <p className="break-words text-sm">{describe(event)}</p>
                          <p className="mt-0.5 break-words text-xs text-muted-foreground">{eventMeta(event, visitor.ip).join(" · ")}</p>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              ))}
            </ol>
          )}
          <Pagination
            page={events.page}
            pageCount={events.pageCount}
            total={events.total}
            pageSize={events.pageSize}
            href={(target) => buildHref(`/admin/visitors/${id}`, { page: target })}
          />
        </Panel>
      </div>
    </>
  );
}
