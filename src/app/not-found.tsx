import type { Metadata } from "next";
import { OutlineButton } from "@/components/kit";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-10">
      {/* Hairlines and a glass card, as on the public sections. */}
      <div className="relative w-full max-w-[670px]">
        <span aria-hidden className="absolute -top-px inset-x-0 h-px bg-[#4e4e4e]/50" />
        <div className="flex flex-col items-center gap-6 rounded-[4px] border border-[#989898]/30 bg-[#989898]/10 px-10 py-16 text-center backdrop-blur-[27.5px]">
          <p className="text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">{"/     Error 404"}</p>
          <h1 className="text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
            This page shipped
            <br />
            <em className="text-[#515151] italic">elsewhere.</em>
          </h1>
          <p className="max-w-[420px] text-[16px] leading-[24px] text-g2">
            The address may be outdated, but the rest of the portfolio is ready to explore.
          </p>
          <OutlineButton label="Return home" href="/" className="mt-2 w-[226px]" />
        </div>
      </div>
    </main>
  );
}
