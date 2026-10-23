import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Load .env.local / .env for CLI scripts (Next.js does this for the app itself). */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) process.loadEnvFile(path);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to .env.local or the environment first.");
    process.exit(1);
  }
}
