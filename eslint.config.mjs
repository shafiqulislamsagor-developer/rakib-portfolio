import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Verification builds (NEXT_DIST_DIR), the local database and content
    // backups are generated, not authored.
    ".next-*/**",
    ".mongo-data/**",
    ".content-backups/**",
    "lint.json",
  ]),
]);

export default eslintConfig;
