import { deleteMessage, setMessageRead, setMessageStatus } from "@/app/admin/_actions/messages";
import { RowActions, type RowAction } from "@/app/admin/_components/row-actions";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchBox, StatusBadge, buildHref } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate, param, searchRegex } from "@/lib/admin/paginate";
import { Message } from "@/lib/db/models";
import { toMessage } from "@/lib/db/serialize";
import { formatDateTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageData } from "@/types/content";
import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Messages" };

const VIEWS = {
  inbox: { label: "Inbox", filter: { status: { $in: ["pending", "replied"] } } },
  unread: { label: "Unread", filter: { read: false, status: { $in: ["pending", "replied"] } } },
  pending: { label: "Awaiting reply", filter: { status: "pending" } },
  replied: { label: "Replied", filter: { status: "replied" } },
  spam: { label: "Spam", filter: { status: "spam" } },
  archived: { label: "Archived", filter: { status: "archived" } },
} as const;
type View = keyof typeof VIEWS;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPage();
  const params = await searchParams;
  const view: View = (param(params.view) in VIEWS ? param(params.view) : "inbox") as View;
  const q = param(params.q);
  const page = pageFromParam(params.page);

  const search = q
    ? {
        $or: [
          { name: searchRegex(q) },
          { email: searchRegex(q) },
          { phone: searchRegex(q) },
          { address: searchRegex(q) },
          { subject: searchRegex(q) },
          { message: searchRegex(q) },
        ],
      }
    : {};
  const [result, counts] = await Promise.all([
    paginate(Message, { ...VIEWS[view].filter, ...search }, { page, sort: { createdAt: -1 }, select: "-notes -replies.body", map: toMessage }),
    Promise.all((Object.keys(VIEWS) as View[]).map(async (key) => [key, await Message.countDocuments(VIEWS[key].filter)] as const)),
  ]);
  const countFor = Object.fromEntries(counts) as Record<View, number>;

  const actionsFor = (message: MessageData): RowAction[] => [
    { type: "link", label: "Open", icon: "edit", href: `/admin/messages/${message.id}` },
    message.read
      ? { type: "action", label: "Mark unread", icon: "read", action: setMessageRead.bind(null, message.id, false) }
      : { type: "action", label: "Mark read", icon: "read", action: setMessageRead.bind(null, message.id, true) },
    { type: "separator" },
    ...(message.status === "archived" || message.status === "spam"
      ? [
          { type: "action" as const, label: "Move to inbox", icon: "restore" as const, action: setMessageStatus.bind(null, message.id, "pending") },
          {
            type: "action" as const,
            label: "Delete",
            icon: "delete" as const,
            destructive: true,
            action: deleteMessage.bind(null, message.id),
            confirm: { title: "Delete this message?", description: `The message from ${message.email} will be permanently deleted.`, confirmLabel: "Delete" },
          },
        ]
      : [
          { type: "action" as const, label: "Archive", icon: "archive" as const, action: setMessageStatus.bind(null, message.id, "archived") },
          { type: "action" as const, label: "Mark as spam", icon: "spam" as const, action: setMessageStatus.bind(null, message.id, "spam") },
        ]),
  ];

  return (
    <>
      <PageHeader icon={Inbox}
        title="Messages"
        description="Messages from the contact form land here. Contact the sender yourself, then mark the message as replied."
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          items={(Object.keys(VIEWS) as View[]).map((key) => ({
            label: VIEWS[key].label,
            href: buildHref("/admin/messages", { view: key === "inbox" ? undefined : key, q }),
            active: view === key,
            count: countFor[key],
          }))}
        />
        <SearchBox action="/admin/messages" defaultValue={q} placeholder="Search name, email, phone, text…" hidden={{ view: view === "inbox" ? undefined : view }} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={q ? "No messages match your search" : view === "inbox" ? "Your inbox is empty" : `No ${VIEWS[view].label.toLowerCase()} messages`}
          description={view === "inbox" && !q ? "New contact form submissions will appear here." : undefined}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-[4px] border border-border bg-card">
          {result.items.map((message) => (
            <li key={message.id} className={cn("flex items-start gap-3 px-4 py-3.5", !message.read && "bg-primary/[.04]")}>
              <span className={cn("mt-2 size-2 shrink-0 rounded-full", message.read ? "bg-transparent" : "bg-primary")} aria-label={message.read ? undefined : "Unread"} />
              <Link href={`/admin/messages/${message.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className={cn("truncate text-sm", !message.read ? "font-semibold" : "font-medium")}>
                    {message.name} <span className="font-normal text-muted-foreground">&lt;{message.email}&gt;</span>
                  </p>
                  <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(message.createdAt)}
                  </time>
                </div>
                <p className={cn("truncate text-sm", !message.read ? "text-foreground" : "text-muted-foreground")}>{message.subject}</p>
                <p className="truncate text-xs text-muted-foreground">{message.message}</p>
              </Link>
              <div className="hidden shrink-0 sm:block">
                <StatusBadge status={message.status} label={message.status === "pending" ? "awaiting reply" : undefined} />
              </div>
              <RowActions actions={actionsFor(message)} label={`Actions for message from ${message.name}`} />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        href={(target) => buildHref("/admin/messages", { view: view === "inbox" ? undefined : view, q, page: target })}
      />
    </>
  );
}
