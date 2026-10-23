import { clearErrorEvents, revokeOtherSessionsAction, revokeSessionAction } from "@/app/admin/_actions/system";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { PageHeader, Panel, StatusBadge } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { getSiteSettings } from "@/lib/content/public";
import { pingDB } from "@/lib/db/connect";
import { AdminUser, ErrorEvent, LoginEvent, Session } from "@/lib/db/models";
import { cachedAuthSecret } from "@/lib/db/runtime-cache";
import { deploymentInfo } from "@/lib/env";
import { getSiteUrl } from "@/lib/site";
import { formatBytes, formatDateTime, relativeTime } from "@/lib/format";
import { maskIp } from "@/lib/security/request";
import { mediaStorageUsage } from "@/lib/storage";
import type { Metadata } from "next";
import { AccountNameForm, ChangePasswordForm } from "./account-forms";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "System" };

function describeAgent(userAgent: string) {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const os = /Windows/.test(userAgent) ? "Windows" : /Mac OS X/.test(userAgent) ? "macOS" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Linux/.test(userAgent) ? "Linux" : "";
  return [browser, os].filter(Boolean).join(" on ");
}

export default async function SystemPage() {
  const current = await adminPage();
  const [user, sessions, logins, errors, db, settings, siteUrl] = await Promise.all([
    AdminUser.findById(current.user.id).lean(),
    Session.find({ userId: current.user.id, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).lean(),
    LoginEvent.find({}).sort({ createdAt: -1 }).limit(25).lean(),
    ErrorEvent.find({}).sort({ createdAt: -1 }).limit(20).lean(),
    pingDB(),
    getSiteSettings(),
    getSiteUrl(),
  ]);
  const storage = await mediaStorageUsage();
  const deployment = deploymentInfo();
  const hasSecret = Boolean(process.env.AUTH_SECRET?.trim() || cachedAuthSecret());

  const checks: { label: string; ok: boolean; detail: string }[] = [
    { label: "Database (MongoDB)", ok: db.ok, detail: db.ok ? `Connected · ${db.latencyMs} ms` : "Unreachable" },
    {
      label: "Application secret",
      ok: hasSecret,
      detail: process.env.AUTH_SECRET?.trim() ? "From AUTH_SECRET" : hasSecret ? "Generated and stored in your database" : "Not loaded yet",
    },
    {
      label: "Public site URL",
      ok: Boolean(settings.siteUrl),
      detail: settings.siteUrl ? settings.siteUrl : `Not set — using ${siteUrl}`,
    },
    { label: "File storage (in MongoDB)", ok: db.ok, detail: `${storage.files} file(s) · ${formatBytes(storage.bytes)}` },
    {
      label: "Google Analytics 4",
      ok: Boolean(settings.analytics.gaMeasurementId),
      detail: settings.analytics.gaMeasurementId || "Optional — not configured",
    },
    {
      label: "Google Search Console",
      ok: Boolean(settings.seo.googleSiteVerification),
      detail: settings.seo.googleSiteVerification ? "Verification tag set" : "Optional — not configured",
    },
    { label: "Favicon", ok: Boolean(settings.faviconUrl), detail: settings.faviconUrl ? "Custom icon" : "Using the built-in icon" },
    { label: "Analytics time zone", ok: true, detail: settings.analytics.timezone },
  ];

  return (
    <>
      <PageHeader icon={ShieldCheck} title="System" description="Your account, sessions, sign-in activity and the health of the platform." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Account">
          <div className="space-y-5">
            <dl className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user?.email}</dd>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize">{user?.role}</dd>
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd>{user?.lastLoginAt ? formatDateTime(user.lastLoginAt.toISOString()) : "—"}</dd>
              <dt className="text-muted-foreground">Password set</dt>
              <dd>{user?.passwordChangedAt ? formatDateTime(user.passwordChangedAt.toISOString()) : "—"}</dd>
            </dl>
            <AccountNameForm name={user?.name ?? ""} />
          </div>
        </Panel>
        <Panel title="Change password" description="Changing your password signs out all other sessions.">
          <ChangePasswordForm />
        </Panel>

        <Panel
          title="Active sessions"
          description="Sessions expire after 7 days, or 24 hours without activity."
          actions={sessions.length > 1 ? <ActionButton action={revokeOtherSessionsAction} label="Sign out others" icon="delete" /> : undefined}
          className="xl:col-span-2"
        >
          <ul className="divide-y divide-border">
            {sessions.map((item) => {
              const id = item._id.toString();
              const isCurrent = id === current.sessionId;
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {describeAgent(item.userAgent)} {isCurrent && <StatusBadge status="active" label="this device" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP {maskIp(item.ip)} · signed in {formatDateTime(item.createdAt.toISOString())} · active {relativeTime(item.lastSeenAt.toISOString())}
                    </p>
                  </div>
                  {!isCurrent && <ActionButton action={revokeSessionAction.bind(null, id)} label="Sign out" variant="ghost" />}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Platform health">
          <ul className="divide-y divide-border text-sm">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center justify-between gap-3 py-2.5">
                <span>{check.label}</span>
                <span className="flex items-center gap-2 text-right text-xs text-muted-foreground">
                  {check.detail}
                  <span className={check.ok ? "size-2 rounded-full bg-white" : "size-2 rounded-full bg-destructive"} aria-label={check.ok ? "OK" : "Attention"} />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Public uptime probe: <code>/api/health</code>. Secrets are never displayed here.
          </p>
        </Panel>

        <Panel title="Deployment">
          <dl className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Environment</dt>
            <dd>{deployment.vercelEnv ?? deployment.nodeEnv}</dd>
            <dt className="text-muted-foreground">Region</dt>
            <dd>{deployment.region ?? "—"}</dd>
            <dt className="text-muted-foreground">Commit</dt>
            <dd className="font-mono text-xs">{deployment.commitSha ? `${deployment.commitSha} (${deployment.commitRef ?? "?"})` : "—"}</dd>
            <dt className="text-muted-foreground">Node.js</dt>
            <dd>{deployment.nodeVersion}</dd>
          </dl>
        </Panel>

        <Panel title="Sign-in activity" description="Last 25 attempts across all accounts (kept for 90 days)." className="xl:col-span-2">
          {logins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sign-in attempts recorded.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {logins.map((event) => (
                <li key={event._id.toString()} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="flex items-center gap-2">
                    <StatusBadge status={event.success ? "active" : "spam"} label={event.success ? "success" : event.reason.replace(/_/g, " ")} />
                    <span>{event.email || "—"}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {describeAgent(event.userAgent)} · IP {maskIp(event.ip)} · {formatDateTime(event.createdAt.toISOString())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Server errors"
          description="Unhandled server errors captured automatically (kept 30 days)."
          actions={errors.length ? <ActionButton action={clearErrorEvents} label="Clear" icon="delete" confirm={{ title: "Clear the error log?", description: "Captured errors will be deleted.", confirmLabel: "Clear" }} /> : undefined}
          className="xl:col-span-2"
        >
          {errors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No server errors captured. 🎉</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {errors.map((error) => (
                <li key={error._id.toString()} className="py-2.5">
                  <p className="font-medium">{error.message || "Unknown error"}</p>
                  <p className="text-xs text-muted-foreground">
                    {error.method} {error.path} · {error.routeType} · {formatDateTime(error.createdAt.toISOString())}
                    {error.digest && ` · digest ${error.digest}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
