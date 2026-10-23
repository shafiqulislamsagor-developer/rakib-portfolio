"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Toasts on the dark canvas: hairline frame, 4px corners, grey body text. */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:rounded-[4px] group-[.toaster]:border group-[.toaster]:border-[#4e4e4e]/60 group-[.toaster]:bg-[#0a0a0a] group-[.toaster]:text-mist group-[.toaster]:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]",
        description: "group-[.toast]:text-g2",
        actionButton: "group-[.toast]:rounded-[4px] group-[.toast]:bg-white group-[.toast]:text-ink",
        cancelButton: "group-[.toast]:rounded-[4px] group-[.toast]:bg-white/10 group-[.toast]:text-g2",
        error: "group-[.toaster]:border-destructive/50 group-[.toaster]:text-destructive",
      },
    }}
    {...props}
  />
);

export { Toaster };
