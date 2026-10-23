import type { VisitorStatus } from "@/lib/constants";

/*
 * What a visitor is to the business. Derived from what the visitor did, so it
 * is always in step with the log and never needs recalculating:
 *
 *   customer  — the admin marked them as one (the only field a human sets)
 *   lead      — they asked to be contacted: sent the form, or tapped your
 *               WhatsApp, phone or email link
 *   returning — they came back in a later session
 *   new       — everything else: one session so far, no details given
 *
 * The same rules exist twice on purpose: `visitorStatus` labels a document
 * that has been loaded, `STATUS_FILTERS` selects them in the database. The
 * tests check the two agree.
 */

export type VisitorStatusInput = {
  customer?: boolean | null;
  sessions?: number | null;
  contact?: { at?: string | Date | null } | null;
  reachedOutAt?: string | Date | null;
};

export function visitorStatus(visitor: VisitorStatusInput): VisitorStatus {
  if (visitor.customer) return "customer";
  if (visitor.contact?.at || visitor.reachedOutAt) return "lead";
  return (visitor.sessions ?? 0) > 1 ? "returning" : "new";
}

/** Mongo filters matching `visitorStatus`. Earlier statuses are excluded so the four never overlap. */
export const STATUS_FILTERS: Record<VisitorStatus, Record<string, unknown>> = {
  customer: { customer: true },
  lead: { customer: { $ne: true }, $or: [{ "contact.at": { $ne: null } }, { reachedOutAt: { $ne: null } }] },
  returning: { customer: { $ne: true }, "contact.at": null, reachedOutAt: null, sessions: { $gt: 1 } },
  new: { customer: { $ne: true }, "contact.at": null, reachedOutAt: null, sessions: { $lte: 1 } },
};

export const STATUS_LABELS: Record<VisitorStatus, string> = {
  new: "New",
  returning: "Returning",
  lead: "Lead",
  customer: "Customer",
};

export const STATUS_HINTS: Record<VisitorStatus, string> = {
  new: "First visit, no details given",
  returning: "Came back in a later session",
  lead: "Asked to be contacted",
  customer: "Marked as a customer by you",
};
