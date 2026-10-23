"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const navButton = cn(
  buttonVariants({ variant: "outline" }),
  "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
)

/**
 * react-day-picker v9 styles the day cell (`<td>`) and its button separately, so
 * the range background lives on the cell and the selected "pill" on the button.
 * The `day-range-middle` marker keeps the middle of a range from picking up the
 * selected pill without needing `!important`.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row sm:gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-7 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 rounded-[4px] text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20 data-[selected]:bg-accent data-[outside]:data-[selected]:bg-accent/50",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal"
        ),
        selected:
          "[&:not(.day-range-middle)>button]:bg-primary [&:not(.day-range-middle)>button]:text-primary-foreground [&:not(.day-range-middle)>button]:hover:bg-primary [&:not(.day-range-middle)>button]:hover:text-primary-foreground [&:not(.day-range-middle)>button]:focus:bg-primary [&:not(.day-range-middle)>button]:focus:text-primary-foreground",
        range_start: "rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        range_middle:
          "day-range-middle [&>button]:bg-transparent [&>button]:text-accent-foreground [&>button]:hover:bg-background/50",
        today:
          "[&:not([data-selected])>button]:bg-accent [&:not([data-selected])>button]:text-accent-foreground",
        outside:
          "day-outside text-muted-foreground [&>button]:text-muted-foreground [&>button]:opacity-50",
        disabled: "[&>button]:text-muted-foreground [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className={cn("size-4", chevronClassName)} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
