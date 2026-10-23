import { randomBytes } from "node:crypto";
import { AppSecret, Settings } from "@/lib/db/models";
import { RUNTIME_CONFIG_TTL_MS, getRuntimeConfig, isValidTimeZone, setRuntimeConfig, type RuntimeConfig } from "./runtime-cache";

/*
 * Loads the server settings that used to be environment variables, so a
 * deployment only has to set MONGODB_URI. `connectDB()` refreshes this right
 * after it connects — always before any model is used — which keeps the
 * synchronous getters in runtime-cache warm.
 */

const globalForLoader = globalThis as typeof globalThis & { __runtimeConfigPromise?: Promise<RuntimeConfig> | null };

/**
 * The HMAC secret for this installation (IP hashes, analytics salts,
 * rate-limit keys). Generated once on first run and stored in the database: it
 * must stay stable, because changing it invalidates every hash derived from it.
 */
async function readOrCreateAuthSecret() {
  // If provided in environment variables, AUTH_SECRET takes explicit precedence.
  // This allows zero-plaintext DB storage and supports standard DevOps key rotation.
  const envSecret = process.env.AUTH_SECRET?.trim();
  if (envSecret) return envSecret;

  const existing = await AppSecret.findOne({ key: "auth" }).lean();
  if (existing?.value) return existing.value;
  const generated = randomBytes(32).toString("base64url");
  try {
    await AppSecret.create({ key: "auth", value: generated });
    return generated;
  } catch {
    // Two instances can race on the very first request; whoever loses re-reads.
    const winner = await AppSecret.findOne({ key: "auth" }).lean();
    if (winner?.value) return winner.value;
    throw new Error("Could not create the application secret.");
  }
}

async function load(): Promise<RuntimeConfig> {
  const [authSecret, settings] = await Promise.all([
    readOrCreateAuthSecret(),
    Settings.findOne({ key: "main" }).select("analytics.timezone").lean(),
  ]);
  const zone = settings?.analytics?.timezone?.trim();
  return { authSecret, timezone: isValidTimeZone(zone) ? zone : "UTC", loadedAt: Date.now() };
}

/** Load (or refresh) the runtime config. Never throws: a failure keeps the previous values. */
export async function ensureRuntimeConfig() {
  const current = getRuntimeConfig();
  if (current && Date.now() - current.loadedAt < RUNTIME_CONFIG_TTL_MS) return current;
  globalForLoader.__runtimeConfigPromise ??= load()
    .then((config) => {
      setRuntimeConfig(config);
      return config;
    })
    .finally(() => {
      globalForLoader.__runtimeConfigPromise = null;
    });
  try {
    return await globalForLoader.__runtimeConfigPromise;
  } catch (error) {
    console.error("[runtime-config] could not load the server settings", error);
    return current;
  }
}
