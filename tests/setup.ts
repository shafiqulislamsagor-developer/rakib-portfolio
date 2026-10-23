import { randomBytes } from "node:crypto";
import { afterAll, inject } from "vitest";

// Each test file gets its own database on the shared in-memory server.
process.env.MONGODB_URI = inject("mongoUri");
process.env.MONGODB_DB = `test_${randomBytes(4).toString("hex")}`;
process.env.AUTH_SECRET = "test-secret-with-enough-entropy-0123456789";

afterAll(async () => {
  const { default: mongoose } = await import("mongoose");
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db?.dropDatabase();
  }
  const { disconnectDB } = await import("@/lib/db/connect");
  await disconnectDB();
});
