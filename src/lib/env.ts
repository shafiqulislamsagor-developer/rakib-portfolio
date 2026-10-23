/**
 * Server-side environment access.
 *
 * MONGODB_URI is the only variable a deployment has to set. Everything else
 * that used to live here — the public site URL, the HMAC secret, the Google
 * Analytics ID, the analytics time zone, Search Console verification and the
 * favicon — is now stored in the database and edited in the admin panel
 * (see lib/db/runtime-config and Admin → Settings / SEO).
 */

import { cachedAuthSecret } from "@/lib/db/runtime-cache";

function read(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export const isProduction = process.env.NODE_ENV === "production";

export function isDbConfigured() {
  return Boolean(read("MONGODB_URI"));
}

export function getMongoUri() {
  return read("MONGODB_URI");
}

/**
 * Database name. Optional: a name in the connection string wins, and
 * MONGODB_DB overrides both. Fixed default so a one-line .env still lands in
 * the same place every time.
 */
export function getMongoDbName() {
  const explicit = read("MONGODB_DB");
  if (explicit) return explicit;
  return uriHasDatabase(getMongoUri()) ? undefined : "rk_portfolio";
}

/** True when the connection string already names a database (…mongodb.net/mydb?…). */
function uriHasDatabase(uri: string) {
  const afterHost = uri.replace(/^mongodb(\+srv)?:\/\/[^/]*/, "");
  const path = afterHost.split("?")[0];
  return path.length > 1;
}

let warnedAboutSecret = false;

/**
 * Secret used for HMAC hashing (IP addresses, daily analytics salts). It is
 * generated once and stored in the database; AUTH_SECRET still overrides it so
 * an existing deployment keeps its hashes stable.
 */
export function getAuthSecret() {
  const fromEnv = read("AUTH_SECRET");
  if (fromEnv) return fromEnv;
  const stored = cachedAuthSecret();
  if (stored) return stored;
  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn("[env] the stored application secret is not loaded yet; using a temporary development secret.");
  }
  return "development-only-insecure-secret-change-me";
}

export function deploymentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    vercelEnv: read("VERCEL_ENV") || null,
    region: read("VERCEL_REGION") || null,
    commitSha: read("VERCEL_GIT_COMMIT_SHA").slice(0, 7) || null,
    commitRef: read("VERCEL_GIT_COMMIT_REF") || null,
    nodeVersion: process.version,
  };
}

/** The host URL Vercel gives us, used when no site URL is set in the admin. */
export function platformSiteUrl() {
  const configured = read("NEXT_PUBLIC_SITE_URL");
  if (configured) return configured.replace(/\/$/, "");
  const vercel = read("VERCEL_PROJECT_PRODUCTION_URL");
  return vercel ? `https://${vercel}` : "";
}
