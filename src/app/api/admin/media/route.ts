import { searchRegex } from "@/lib/admin/paginate";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { Media } from "@/lib/db/models";
import { toMedia } from "@/lib/db/serialize";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Media list for the picker dialog. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const query = params.get("q")?.trim();
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = 24;

  await connectDB();
  const filter = {
    ...(type === "image"
      ? { resourceType: "image" }
      : type === "document"
        ? { resourceType: "raw" }
        : type === "audio"
          ? { resourceType: "audio" }
          : {}),
    ...(query ? { $or: [{ originalName: searchRegex(query) }, { alt: searchRegex(query) }] } : {}),
  };
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Media.countDocuments(filter),
  ]);
  return NextResponse.json(
    { items: items.map(toMedia), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
