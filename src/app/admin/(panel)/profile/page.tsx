import { PageHeader } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { Profile } from "@/lib/db/models";
import { toProfile } from "@/lib/db/serialize";
import { omit } from "@/lib/utils";
import { ExternalLink, UserRound } from "lucide-react";
import type { Metadata } from "next";
import ProfileForm from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileAdminPage() {
  await adminPage();
  const profile = toProfile(await Profile.findOne({ key: "main" }).lean());
  return (
    <>
      <PageHeader icon={UserRound}
        title="Profile"
        description="Your name, hero section, biography, social links, contact details and CV."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink /> View homepage
            </a>
          </Button>
        }
      />
      <ProfileForm initial={{ ...omit(profile, ["updatedAt"]), cv: { url: profile.cv.url, fileName: profile.cv.fileName } }} cvUpdatedAt={profile.cv.updatedAt} />
    </>
  );
}
