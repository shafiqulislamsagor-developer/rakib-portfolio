import { createHash, createHmac, randomBytes } from "node:crypto";
import { getAuthSecret } from "@/lib/env";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hmac(value: string, secret = getAuthSecret()) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
