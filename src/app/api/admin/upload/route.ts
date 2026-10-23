import { logActivity } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { UPLOAD_LIMIT_BYTES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Media } from "@/lib/db/models";
import { toMedia } from "@/lib/db/serialize";
import { rateLimit } from "@/lib/security/rate-limit";
import { UPLOAD_MAX_ATTEMPTS, UPLOAD_WINDOW_MS } from "@/lib/security/rate-limit-config";
import { getClientIp, isSameOrigin } from "@/lib/security/request";
import { UploadError, imageDimensions, mediaFileName, validateUpload } from "@/lib/storage";
import { omit } from "@/lib/utils";
import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Authenticated upload: validates the file by content and stores the bytes in MongoDB. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > UPLOAD_LIMIT_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Files must be 4 MB or smaller." }, { status: 413 });
  }

  const limit = await rateLimit(`upload:${session.user.id}`, UPLOAD_MAX_ATTEMPTS, UPLOAD_WINDOW_MS);
  if (!limit.allowed) return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  const requested = String(form.get("accept") ?? "");
  const accept = (["document", "audio", "any"] as const).find((value) => value === requested) ?? "image";
  const alt = String(form.get("alt") ?? "").trim().slice(0, 300);
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = validateUpload(buffer, accept);
    const id = new Types.ObjectId();
    const name = mediaFileName(file.name, mimeType);
    const dimensions = mimeType.startsWith("image/") ? imageDimensions(buffer, mimeType) : null;
    await connectDB();
    const media = await Media.create({
      _id: id,
      url: `/media/${id}/${name}`,
      data: buffer,
      resourceType: mimeType.startsWith("audio/") ? "audio" : mimeType === "application/pdf" ? "raw" : "image",
      mimeType,
      bytes: buffer.length,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      originalName: file.name.replace(/[^\w.\- ]+/g, "").slice(0, 200),
      alt,
      uploadedBy: session.user.email,
    });
    await logActivity({ id: session.user.id, email: session.user.email }, "media.upload", {
      entityType: "media",
      entityId: id.toString(),
      summary: `Uploaded ${media.originalName || name}`,
      ip: getClientIp(request.headers),
    });
    return NextResponse.json({ media: toMedia(omit(media.toObject(), ["data"])) }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[upload] failed", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
