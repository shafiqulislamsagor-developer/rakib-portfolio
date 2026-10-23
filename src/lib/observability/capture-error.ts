import type { Instrumentation } from "next";
import { connectDB } from "@/lib/db/connect";
import { ErrorEvent } from "@/lib/db/models";

type Args = Parameters<Instrumentation.onRequestError>;

/** Persist an unhandled server error (30-day TTL) for Admin → System. Never throws. */
export async function captureRequestError(...[error, request, context]: Args) {
  if (!process.env.MONGODB_URI) return;
  try {
    await connectDB();
    const err = error as Error & { digest?: string };
    await ErrorEvent.create({
      message: String(err?.message ?? error).slice(0, 1000),
      digest: err?.digest ?? "",
      path: request.path.split("?")[0].slice(0, 500),
      method: request.method,
      routeType: context.routeType,
      stack: String(err?.stack ?? "").slice(0, 4000),
    });
  } catch (captureError) {
    console.error("[instrumentation] failed to record error", captureError);
  }
}
