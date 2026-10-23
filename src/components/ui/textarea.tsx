import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.02] px-3 py-2 text-[14px] leading-[22px] text-mist transition-colors duration-300 outline-none",
          "placeholder:text-g2/70 hover:border-[#4e4e4e] focus-visible:border-white/70 focus-visible:bg-white/[0.04]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
