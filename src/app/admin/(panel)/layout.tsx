import AdminShell from "@/app/admin/_components/shell";
import { requireAdmin } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/content/public";
import { connectDB } from "@/lib/db/connect";
import { Message } from "@/lib/db/models";
import type React from "react";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  await connectDB();
  const [settings, unreadCount, latest] = await Promise.all([
    getSiteSettings(),
    Message.countDocuments({ read: false, status: { $nin: ["spam", "archived"] } }),
    Message.find({ read: false, status: { $nin: ["spam", "archived"] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name subject createdAt")
      .lean(),
  ]);

  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      siteName={settings.siteName}
      logoText={settings.logoText}
      unreadCount={unreadCount}
      notifications={latest.map((message) => ({
        id: message._id.toString(),
        name: message.name,
        subject: message.subject,
        createdAt: message.createdAt.toISOString(),
      }))}
    >
      {children}
    </AdminShell>
  );
}
