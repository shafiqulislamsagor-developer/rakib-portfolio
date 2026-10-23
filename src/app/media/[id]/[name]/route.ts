import { connectDB } from "@/lib/db/connect";
import { Media } from "@/lib/db/models";
import { isDbConfigured } from "@/lib/env";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// File URLs are immutable: a replacement upload gets a new id, so browsers and
// the Vercel CDN may cache each file for a year.
const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

async function findFile(id: string) {
  await connectDB();
  // Hydrated (not lean) so `data` is a Node Buffer rather than a BSON Binary.
  return Media.findById(id).select("+data mimeType originalName url");
}

/** Serves a file stored in MongoDB (Media.data). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await params;
  if (!isDbConfigured() || !Types.ObjectId.isValid(id)) return notFound();

  const etag = `"${id}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": CACHE } });
  }

  // One retry: a cold or freshly thawed instance can hit a transient connection error,
  // and a failed image request shows up as a broken picture on the site.
  const media = await findFile(id).catch(async (error) => {
    console.warn("[media] first lookup failed, retrying", error);
    return findFile(id);
  });
  if (!media?.data) return notFound();

  const fileName = media.url.split("/").pop() ?? "file";
  const mimeType = media.mimeType || "application/octet-stream";
  const totalLength = media.data.length;
  const rangeHeader = request.headers.get("range");

  if (rangeHeader && rangeHeader.startsWith("bytes=")) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

    if (isNaN(start) || start >= totalLength || (parts[1] && (isNaN(end) || end < start))) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${totalLength}`,
        },
      });
    }

    const chunkEnd = Math.min(end, totalLength - 1);
    const chunkSize = chunkEnd - start + 1;
    const chunk = media.data.subarray(start, chunkEnd + 1);

    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${chunkEnd}/${totalLength}`,
        "Accept-Ranges": "bytes",
        "Content-Disposition": `inline; filename="${fileName.replace(/[^\w.-]/g, "")}"`,
        "Cache-Control": CACHE,
        ETag: etag,
      },
    });
  }

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(totalLength),
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${fileName.replace(/[^\w.-]/g, "")}"`,
      "Cache-Control": CACHE,
      ETag: etag,
    },
  });
}
