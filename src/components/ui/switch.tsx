"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-[#4e4e4e] bg-transparent transition-colors duration-300 ease-figma-out outline-none",
      "focus-visible:ring-1 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:border-white data-[state=checked]:bg-white",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block size-4 translate-x-1 rounded-full bg-g2 transition-transform duration-300 ease-figma-out data-[state=checked]:translate-x-6 data-[state=checked]:bg-ink" />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
