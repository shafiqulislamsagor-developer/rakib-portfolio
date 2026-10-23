import "server-only";

import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";

/**
 * Call at the top of every admin page. Layouts are not re-rendered on
 * client-side navigation, so each page must authorize itself.
 */
export async function adminPage() {
  const session = await requireAdmin();
  await connectDB();
  return session;
}
