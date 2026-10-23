import { connectDB } from "@/lib/db/connect";
import { RateLimit } from "@/lib/db/models";

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

export * from "./rate-limit-config";

/**
 * Fixed-window rate limiter backed by MongoDB, so limits hold across
 * serverless instances. Expired windows are reset atomically in the update
 * pipeline; a TTL index cleans up old keys.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  await connectDB();
  const now = new Date();
  const expired = { $or: [{ $not: ["$expiresAt"] }, { $lte: ["$expiresAt", now] }] };

  const run = () =>
    RateLimit.findOneAndUpdate(
      { key },
      [
        {
          $set: {
            count: { $cond: [expired, 1, { $add: ["$count", 1] }] },
            expiresAt: { $cond: [expired, new Date(now.getTime() + windowMs), "$expiresAt"] },
          },
        },
      ],
      { upsert: true, new: true }
    ).lean();

  let doc;
  try {
    doc = await run();
  } catch (error) {
    // Two concurrent upserts can race on the unique key; the retry hits the existing doc.
    if ((error as { code?: number }).code !== 11000) throw error;
    doc = await run();
  }

  const count = doc?.count ?? 1;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: doc?.expiresAt ?? new Date(now.getTime() + windowMs),
  };
}

export async function clearRateLimit(key: string) {
  await connectDB();
  await RateLimit.deleteOne({ key });
}
