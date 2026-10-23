import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { UploadStudio } from "@/components/upload/UploadStudio";
import { getChrome } from "@/lib/chrome";

export const metadata: Metadata = {
  title: "Launch a project",
  robots: { index: false },
};

export default async function UploadPage() {
  const chrome = await getChrome();
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <UploadStudio />
      </main>
    </div>
  );
}
