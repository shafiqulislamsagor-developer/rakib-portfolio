/**
 * Verifies the MongoDB connection and prints what is stored (read-only).
 *
 *   pnpm db:check
 */
import { loadEnv } from "./_env";

loadEnv();

async function main() {
  const { connectDB, disconnectDB, pingDB } = await import("@/lib/db/connect");
  const started = Date.now();
  const ping = await pingDB();
  if (!ping.ok) {
    console.error(`✗ Cannot reach MongoDB (${ping.error}). Check MONGODB_URI and Atlas → Network Access.`);
    process.exit(1);
  }
  const conn = await connectDB();
  const db = conn.connection.db!;
  const info = await db.admin().command({ buildInfo: 1 }).catch(() => ({ version: "unknown" }));
  console.log(`✓ Connected in ${Date.now() - started} ms · MongoDB ${info.version} · database "${db.databaseName}" · ping ${ping.latencyMs} ms`);

  const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
  if (!collections.length) {
    console.log("  The database is empty. Run `pnpm db:seed` to import the starter content.");
  } else {
    const rows: Record<string, number> = {};
    for (const name of collections) rows[name] = await db.collection(name).estimatedDocumentCount();
    console.table(rows);
    const media = await db
      .collection("media")
      .aggregate<{ bytes: number; files: number }>([{ $group: { _id: null, bytes: { $sum: "$bytes" }, files: { $sum: 1 } } }])
      .toArray()
      .catch(() => []);
    if (media[0]) console.log(`  Media stored in MongoDB: ${media[0].files} file(s), ${(media[0].bytes / 1024 / 1024).toFixed(2)} MB`);
    const admins = collections.includes("adminusers") ? await db.collection("adminusers").countDocuments() : 0;
    console.log(admins ? `  Admin accounts: ${admins}` : "  No admin account yet. Run `pnpm admin:create --email … --name …`.");
  }
  await disconnectDB();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
