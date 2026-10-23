"use client";

import { Check, Facebook, Link2, Linkedin, Twitter } from "lucide-react";
import { useState } from "react";

/** Circular hairline icon button, matching the "Download CV" control on the public pages. */
const iconLink =
  "grid size-10 place-items-center rounded-full border border-[#4e4e4e] text-g2 transition-colors duration-300 ease-figma-out hover:border-white hover:text-white";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const links = [
    { label: "Share on LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "Share on X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(title)}` },
    { label: "Share on Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[12px] tracking-[0.9px] text-g2 uppercase">Share</span>
      {links.map(({ label, icon: Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label={label}>
          <Icon className="size-4" />
        </a>
      ))}
      <button
        type="button"
        className={iconLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard unavailable (e.g. insecure context) — the share links still work.
          }
        }}
      >
        {copied ? <Check className="size-4 text-white" /> : <Link2 className="size-4" />}
      </button>
    </div>
  );
}
