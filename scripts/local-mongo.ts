/**
 * Starts a local MongoDB for development without installing MongoDB or
 * creating an Atlas cluster. Data persists in ./.mongo-data.
 *
 *   pnpm db:local        # then set MONGODB_URI=mongodb://127.0.0.1:27017/rk_portfolio
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const dbPath = resolve(process.cwd(), ".mongo-data");
  mkdirSync(dbPath, { recursive: true });
  const port = Number(process.env.MONGO_PORT ?? 27017);
  const server = await MongoMemoryServer.create({
    instance: { port, dbPath, storageEngine: "wiredTiger", ip: "127.0.0.1" },
  });
  console.log(`MongoDB running at ${server.getUri()}rk_portfolio (data: ${dbPath})`);
  console.log("Press Ctrl+C to stop.");

  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
