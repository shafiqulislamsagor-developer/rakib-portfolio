import type { Instrumentation } from "next";

/**
 * Captures unhandled server errors into MongoDB so they are visible under
 * Admin → System. The NEXT_RUNTIME check is resolved at build time, which
 * keeps Mongoose out of the edge bundle. Swap in Sentry here for alerting.
 */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { captureRequestError } = await import("./lib/observability/capture-error");
    await captureRequestError(...args);
  }
};
