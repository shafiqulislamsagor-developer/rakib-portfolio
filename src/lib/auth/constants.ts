// Edge-safe constants (imported by middleware, so no Node APIs here).

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-portfolio_admin" : "portfolio_admin";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days absolute lifetime
export const SESSION_IDLE_MS = 1000 * 60 * 60 * 24; // signed out after 24h of inactivity
export const SESSION_TOUCH_MS = 1000 * 60 * 5; // refresh lastSeenAt at most every 5 minutes
export const TOKEN_LENGTH = 32; // Default session and security token byte length
