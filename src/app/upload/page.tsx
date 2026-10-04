import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { UploadStudio } from "@/components/upload/UploadStudio";

export const metadata: Metadata = {
  title: "Launch a project",
  robots: { index: false },
};

export default function UploadPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Nav variant="inner" />
      <main>
        <UploadStudio />
      </main>
    </div>
  );
}
