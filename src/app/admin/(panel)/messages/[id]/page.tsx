import { deleteMessage, setMessageRead, setMessageStatus } from "@/app/admin/_actions/messages";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { PageHeader, Panel, StatusBadge } from "@/app/admin/_components/ui";
import { plural, whatsappLink } from "@/app/admin/_components/visitor-ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Message, Visitor } from "@/lib/db/models";
import { toMessage } from "@/lib/db/serialize";
import { formatDateTime } from "@/lib/format";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyEmailButton, MarkRepliedButton, MarkViewed, NotesPanel } from "./message-client";

export const metadata: Metadata = { title: "Message" };

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await adminPage();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  // Ownership & role authorization check: ensure caller has admin/owner privileges
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "owner")) {
    notFound();
  }
  const doc = await Message.findById(id).lean();
  if (!doc) notFound();
  const message = toMessage(doc);
  const inactive = message.status === "archived" || message.status === "spam";
  const visitor = message.meta.visitorId
    ? await Visitor.findOne({ vid: message.meta.visitorId }).select("deviceName browser os ip city country pageviews").lean()
    : null;
  const whatsapp = message.phone ? whatsappLink(message.phone) : "";

  return (
    <>
      <MarkViewed id={id} read={message.read} />
      <Link href="/admin/messages" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to inbox
      </Link>
      <PageHeader
        title={message.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={message.status} label={message.status === "pending" ? "awaiting reply" : undefined} />
            <span>Received {formatDateTime(message.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <ActionButton action={setMessageRead.bind(null, id, false)} label="Mark unread" icon="read" />
            {inactive ? (
              <>
                <ActionButton action={setMessageStatus.bind(null, id, "pending")} label="Move to inbox" icon="restore" />
                <ActionButton
                  action={deleteMessage.bind(null, id)}
                  label="Delete"
                  icon="delete"
                  variant="destructive"
                  redirectTo="/admin/messages"
                  confirm={{ title: "Delete this message permanently?", description: "This cannot be undone.", confirmLabel: "Delete" }}
                />
              </>
            ) : (
              <>
                <ActionButton action={setMessageStatus.bind(null, id, "archived")} label="Archive" icon="archive" />
                <ActionButton action={setMessageStatus.bind(null, id, "spam")} label="Spam" icon="spam" />
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Panel>
            <div className="mb-5 border-b border-border pb-4">
              <p className="font-semibold">{message.name}</p>
              <p className="text-sm text-muted-foreground">
                {[message.email, message.phone].filter(Boolean).join(" · ")}
              </p>
              {message.address && <p className="text-sm text-muted-foreground">{message.address}</p>}
            </div>
            {/* Plain text rendering: sender content is never interpreted as HTML. */}
            <p className="whitespace-pre-wrap break-words text-[15px] leading-7">{message.message}</p>
          </Panel>

          {message.status !== "spam" && (
            <Panel
              title="Follow up"
              description="Contact the sender yourself, then mark the message as replied so the inbox stays accurate."
            >
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}>
                    <Mail /> Write email
                  </a>
                </Button>
                <CopyEmailButton email={message.email} />
                {message.phone && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`}>
                      <Phone /> Call
                    </a>
                  </Button>
                )}
                {whatsapp && (
                  <Button asChild variant="outline" size="sm">
                    <a href={whatsapp} target="_blank" rel="noreferrer">
                      <MessageCircle /> WhatsApp
                    </a>
                  </Button>
                )}
                <MarkRepliedButton id={id} again={message.status === "replied"} />
              </div>
              {message.replies.length > 0 && (
                <ol className="mt-5 space-y-3 border-t border-border pt-4">
                  {message.replies.map((reply) => (
                    <li key={reply.id} className="rounded-[4px] border border-border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Marked as replied by {reply.sentBy}</span>
                        <time dateTime={reply.sentAt}>{formatDateTime(reply.sentAt)}</time>
                      </div>
                      {reply.body && <p className="mt-1.5 whitespace-pre-wrap">{reply.body}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <Row label="Received">{formatDateTime(message.createdAt)}</Row>
              <Row label="Read">{message.readAt ? formatDateTime(message.readAt) : "Not yet"}</Row>
              <Row label="Replied">{message.repliedAt ? formatDateTime(message.repliedAt) : "No"}</Row>
              <Row label="Country">{message.meta.country || "Unknown"}</Row>
              {message.phone && <Row label="Phone">{message.phone}</Row>}
              {message.address && <Row label="Address">{message.address}</Row>}
              <Row label="Visitor">
                {visitor ? (
                  <Link href={`/admin/visitors/${visitor._id.toString()}`} className="text-primary hover:underline">
                    {visitor.deviceName || "Device"} · {visitor.ip || "IP unknown"}
                    {visitor.city ? ` · ${visitor.city}` : ""} · {plural(visitor.pageviews ?? 0, "page view")} — open full activity →
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Not in the visitor log</span>
                )}
              </Row>
              {message.meta.spamScore > 0 && <Row label="Spam score">{message.meta.spamScore}</Row>}
              <Row label="Browser">
                <span className="line-clamp-2 break-all text-xs">{message.meta.userAgent || "—"}</span>
              </Row>
            </dl>
          </Panel>
          <Panel title="Internal notes">
            <NotesPanel id={id} notes={message.notes} />
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
