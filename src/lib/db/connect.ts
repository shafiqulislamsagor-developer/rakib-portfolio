import { attachDatabasePool } from "@vercel/functions";
import mongoose from "mongoose";
import { getMongoDbName, getMongoUri } from "@/lib/env";
import { ensureRuntimeConfig } from "./runtime-config";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not configured.");
    this.name = "DatabaseNotConfiguredError";
  }
}

type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse one connection per serverless instance (and across dev hot reloads).
const globalForMongoose = globalThis as typeof globalThis & {
  __mongoose?: ConnectionCache;
};
const cache: ConnectionCache =
  globalForMongoose.__mongoose ?? (globalForMongoose.__mongoose = { conn: null, promise: null });

mongoose.set("strictQuery", true);

function isSrvDnsFailure(error: unknown) {
  const { code, syscall, message } = (error ?? {}) as { code?: string; syscall?: string; message?: string };
  return /querySrv|queryTxt/.test(`${syscall ?? ""} ${message ?? ""}`) && ["ECONNREFUSED", "ETIMEOUT", "ESERVFAIL", "ECONNRESET"].includes(code ?? "");
}

/**
 * `mongodb+srv://` URIs need DNS SRV/TXT lookups. Some machines (local DNS
 * proxies, VPNs, some Windows setups) refuse those queries even though normal
 * DNS works. If that happens, retry once with public resolvers — this only
 * changes Node's `dns.resolve*` servers for this process, not hostname lookups.
 */
async function connectWithDnsFallback(uri: string) {
  const options = {
    dbName: getMongoDbName(),
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    // Close idle sockets before a serverless instance is frozen, so a thawed
    // instance never reuses dead connections (a cause of selection timeouts).
    maxIdleTimeMS: 5000,
  };
  try {
    return await mongoose.connect(uri, options);
  } catch (error) {
    if (!uri.startsWith("mongodb+srv://") || !isSrvDnsFailure(error)) throw error;
    const { setServers } = await import("node:dns");
    const servers = (process.env.MONGODB_DNS_SERVERS || "1.1.1.1,8.8.8.8").split(",").map((server) => server.trim()).filter(Boolean);
    console.warn(`[db] SRV DNS lookup failed with the system resolver; retrying with ${servers.join(", ")}`);
    setServers(servers);
    await mongoose.disconnect().catch(() => undefined);
    return mongoose.connect(uri, options);
  }
}

export async function connectDB() {
  const uri = getMongoUri();
  if (!uri) throw new DatabaseNotConfiguredError();
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    cache.promise = connectWithDnsFallback(uri).then((conn) => {
      // On Vercel, keeps the instance alive until idle connections are released (no-op elsewhere).
      attachDatabasePool(conn.connection.getClient());
      return conn;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  // Secrets and the analytics time zone live in the database, not the
  // environment. Loading them here guarantees they are warm before any model
  // is used (see lib/db/runtime-config).
  await ensureRuntimeConfig();
  return cache.conn;
}

export async function pingDB() {
  const started = Date.now();
  try {
    const conn = await connectDB();
    await conn.connection.db?.admin().command({ ping: 1 });
    return { ok: true as const, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false as const,
      latencyMs: Date.now() - started,
      error: error instanceof DatabaseNotConfiguredError ? "not_configured" : "unreachable",
    };
  }
}

/** Test helper: close and forget the cached connection. */
export async function disconnectDB() {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
