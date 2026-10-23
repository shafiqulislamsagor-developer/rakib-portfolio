import { pingDB } from "@/lib/db/connect";
import { isDbConfigured } from "@/lib/env";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public liveness probe for uptime monitors. Reports status only — no configuration details. */
export async function GET() {
  const database = isDbConfigured() ? await pingDB() : null;
  const healthy = !database || database.ok;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database: database ? (database.ok ? "up" : "down") : "not_configured",
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
