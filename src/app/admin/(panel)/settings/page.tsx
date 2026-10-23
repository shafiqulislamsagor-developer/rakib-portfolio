import { revalidateSiteNow } from "@/app/admin/_actions/site";
import { ActionButton } from "@/app/admin/_components/row-actions";
import { PageHeader } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { Settings } from "@/lib/db/models";
import { toSettings } from "@/lib/db/serialize";
import type { Metadata } from "next";
import SettingsForm from "./settings-form";
import { Settings as SettingsIcon } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await adminPage();
  const settings = toSettings(await Settings.findOne({ key: "main" }).lean());
  return (
    <>
      <PageHeader icon={SettingsIcon}
        title="Website settings"
        description="Branding, navigation, homepage layout, footer and site-wide options. SEO lives on its own page."
        actions={<ActionButton action={revalidateSiteNow} label="Refresh public pages" icon="restore" />}
      />
      <SettingsForm
        initial={{
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          siteUrl: settings.siteUrl,
          logoText: settings.logoText,
          logo: settings.logo,
          faviconUrl: settings.faviconUrl,
          theme: settings.theme,
          navigation: settings.navigation,
          footer: settings.footer,
          homeSections: settings.homeSections,
          sectionCopy: settings.sectionCopy,
          contact: settings.contact,
          voiceIntro: settings.voiceIntro,
          analytics: settings.analytics,
        }}
      />
    </>
  );
}
