import { AUDIO_MIME_TYPES, DOCUMENT_MIME_TYPES, IMAGE_MIME_TYPES, UPLOAD_LIMIT_BYTES } from "@/lib/constants";

/*
 * Uploaded files are stored inside MongoDB (Media.data, BSON binary) and
 * served by the /media/[id]/[name] route. Nothing is written to disk, so this
 * works the same locally and on Vercel. Files are capped at 4 MB, well below
 * MongoDB's 16 MB document limit and Vercel's 4.5 MB request limit.
 */

export class UploadError extends Error {}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "weba",
};

/** Detect the real file type from its first bytes; the browser-supplied type is not trusted. SVG is never accepted. */
export function sniffMimeType(buffer: Buffer): string | null {
  const ascii = (start: number, end: number) => buffer.subarray(start, end).toString("latin1");
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  if (ascii(0, 5) === "%PDF-") return "application/pdf";

  // Audio. WebM and Matroska share a magic number; the browser only ever
  // produces audio-only WebM here, and the type is re-checked on playback.
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "audio/wav";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "audio/webm";
  if (ascii(4, 8) === "ftyp" && ["M4A ", "mp42", "isom", "M4B "].includes(ascii(8, 12))) return "audio/mp4";
  if (ascii(0, 3) === "ID3") return "audio/mpeg";
  // A bare MP3 frame header: 11 sync bits, then a valid version/layer pair.
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0 && (buffer[1] & 0x18) !== 0x08 && (buffer[1] & 0x06) !== 0x00) return "audio/mpeg";
  return null;
}

export function validateUpload(buffer: Buffer, accept: "image" | "document" | "audio" | "any") {
  if (buffer.length === 0) throw new UploadError("The file is empty.");
  if (buffer.length > UPLOAD_LIMIT_BYTES) {
    throw new UploadError(`Files must be ${Math.round(UPLOAD_LIMIT_BYTES / 1024 / 1024)} MB or smaller.`);
  }
  const mimeType = sniffMimeType(buffer);
  const allowed: readonly string[] =
    accept === "image"
      ? IMAGE_MIME_TYPES
      : accept === "document"
        ? DOCUMENT_MIME_TYPES
        : accept === "audio"
          ? AUDIO_MIME_TYPES
          : [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES, ...AUDIO_MIME_TYPES];
  if (!mimeType || !allowed.includes(mimeType)) {
    throw new UploadError(
      accept === "document"
        ? "Only PDF documents are allowed."
        : accept === "audio"
          ? "Only MP3, M4A, OGG, WAV or WebM audio files are allowed."
          : accept === "image"
            ? "Only JPEG, PNG, WebP, GIF or AVIF images are allowed."
            : "Only JPEG, PNG, WebP, GIF, AVIF images, PDF documents or audio files are allowed."
    );
  }
  return mimeType;
}

/** URL-safe file name with the extension that matches the detected type. */
export function mediaFileName(originalName: string, mimeType: string) {
  const extension = EXTENSIONS[mimeType] ?? "bin";
  const base = originalName
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `${base || "file"}.${extension}`;
}

/** Image width/height from the file header (PNG, GIF, JPEG, WebP); null when unknown. */
export function imageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png") return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    if (mimeType === "image/gif") return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    if (mimeType === "image/webp") {
      const chunk = buffer.subarray(12, 16).toString("latin1");
      if (chunk === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
      if (chunk === "VP8L") {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) return null;
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        // SOF0–SOF15, excluding DHT (C4), JPG (C8) and DAC (CC)
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + length;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Total files and bytes stored in MongoDB (shown in Media and System so the Atlas quota can be watched). */
export async function mediaStorageUsage() {
  const { connectDB } = await import("@/lib/db/connect");
  const { Media } = await import("@/lib/db/models");
  await connectDB();
  const [row] = await Media.aggregate<{ files: number; bytes: number }>([
    { $group: { _id: null, files: { $sum: 1 }, bytes: { $sum: "$bytes" } } },
  ]);
  return { files: row?.files ?? 0, bytes: row?.bytes ?? 0 };
}
