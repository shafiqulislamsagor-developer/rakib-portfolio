import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Hairline field on the dark canvas: transparent box, 4px corners, and a
 * border that brightens on hover and turns white on focus — the same
 * treatment the public contact form gives its underlines.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.02] px-3 py-2 text-[14px] text-mist transition-colors duration-300 outline-none",
          "placeholder:text-g2/70 hover:border-[#4e4e4e] focus-visible:border-white/70 focus-visible:bg-white/[0.04]",
          "file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-[13px] file:text-g4",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
