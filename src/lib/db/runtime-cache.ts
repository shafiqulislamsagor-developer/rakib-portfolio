/*
 * Process-wide cache for the server settings that live in the database
 * (the HMAC secret and the analytics time zone). Kept free of Mongoose so the
 * synchronous getters can be imported from anywhere, including lib/env.
 * The loader that fills it is lib/db/runtime-config.
 */

export type RuntimeConfig = { authSecret: string; timezone: string; loadedAt: number };

const globalForRuntime = globalThis as typeof globalThis & { __runtimeConfig?: RuntimeConfig | null };

/** How long a loaded config is trusted before the next connect re-reads it. */
export const RUNTIME_CONFIG_TTL_MS = 60_000;

export function getRuntimeConfig() {
  return globalForRuntime.__runtimeConfig ?? null;
}

export function setRuntimeConfig(config: RuntimeConfig) {
  globalForRuntime.__runtimeConfig = config;
}

/** The stored HMAC secret, or "" before the first successful load. */
export function cachedAuthSecret() {
  return globalForRuntime.__runtimeConfig?.authSecret ?? "";
}

/** The analytics time zone from Admin → Settings. "UTC" before the first load. */
export function cachedTimeZone() {
  return globalForRuntime.__runtimeConfig?.timezone ?? "UTC";
}

/** Called after Settings are saved so a new zone applies without waiting for the TTL. */
export function invalidateRuntimeConfig() {
  if (globalForRuntime.__runtimeConfig) globalForRuntime.__runtimeConfig.loadedAt = 0;
}

export function isValidTimeZone(zone: string | undefined | null): zone is string {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
