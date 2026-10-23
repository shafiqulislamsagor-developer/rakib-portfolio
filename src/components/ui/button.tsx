import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/*
 * Buttons in the design language of the site: 4px corners, hairline outlines,
 * 14px uppercase labels and a solid layer that slides in from the left on
 * hover (see `.btn-fill` in globals.css). `default` is the filled white
 * button, `outline` the bordered one — both share the same geometry so a row
 * of mixed buttons lines up.
 */
const buttonVariants = cva(
  "group/btn relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[4px] whitespace-nowrap text-[14px] tracking-[0.4px] uppercase transition-colors duration-500 ease-figma-out outline-none focus-visible:ring-1 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-white bg-white text-ink hover:bg-g4",
        destructive: "border border-destructive/60 bg-destructive/15 text-destructive hover:bg-destructive hover:text-ink",
        outline: "border border-[#4e4e4e] bg-transparent text-g4 hover:border-white hover:bg-white hover:text-ink",
        secondary: "border border-transparent bg-white/[0.07] text-g4 hover:bg-white/15 hover:text-mist",
        ghost: "border border-transparent text-g2 hover:border-[#4e4e4e]/60 hover:text-mist",
        link: "text-g4 normal-case underline-offset-4 hover:text-white hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-12 px-8",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
