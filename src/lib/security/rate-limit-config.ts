// Centralized rate-limiting configuration for the entire application.

export const LOGIN_MAX_ATTEMPTS = 20;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_EMAIL_MAX_FAILURES = 5;
export const LOGIN_EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const CONTACT_FORM_LIMIT = 5;
export const CONTACT_FORM_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const CONTACT_FORM_EMAIL_LIMIT = 3;
export const CONTACT_FORM_EMAIL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const CONTACT_FORM_MIN_FILL_MS = 2500; // Honeypot speed trap (minimum realistic time to submit form)

export const UPLOAD_MAX_ATTEMPTS = 60;
export const UPLOAD_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const TRACKING_MAX_EVENTS = 300;
export const TRACKING_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export const LOGIN_RATE_LIMITS = {
  perIp: { limit: LOGIN_MAX_ATTEMPTS, windowMs: LOGIN_WINDOW_MS },
  perEmailFailures: { limit: LOGIN_EMAIL_MAX_FAILURES, windowMs: LOGIN_EMAIL_WINDOW_MS },
} as const;

export const CONTACT_FORM_LIMITS = {
  perIp: { limit: CONTACT_FORM_LIMIT, windowMs: CONTACT_FORM_WINDOW_MS },
  perEmail: { limit: CONTACT_FORM_EMAIL_LIMIT, windowMs: CONTACT_FORM_EMAIL_WINDOW_MS },
  minFillMs: CONTACT_FORM_MIN_FILL_MS,
} as const;

export const UPLOAD_RATE_LIMITS = {
  maxUploadsPerHour: UPLOAD_MAX_ATTEMPTS,
  windowMs: UPLOAD_WINDOW_MS,
} as const;

export const TRACKING_RATE_LIMITS = {
  limit: TRACKING_MAX_EVENTS,
  windowMs: TRACKING_WINDOW_MS,
} as const;
