"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[4px] border border-[#4e4e4e] px-5 text-[14px] text-g4 uppercase transition-colors duration-300 ease-figma-out hover:border-white hover:bg-white hover:text-ink"
    >
      <Printer className="size-4" /> Print / save as PDF
    </button>
  );
}
