"use client";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const trafficConfig = {
  pageview: { label: "Page views", color: "var(--viz-1)" },
  visitor: { label: "Daily unique visitors", color: "var(--viz-2)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function bucketLabel(bucket: string, granularity: "day" | "week" | "month", long = false) {
  const date = new Date(`${bucket.length === 7 ? `${bucket}-01` : bucket}T00:00:00.000Z`);
  if (granularity === "month") return date.toLocaleDateString("en", { month: long ? "long" : "short", year: "numeric", timeZone: "UTC" });
  const label = date.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
  return granularity === "week" ? (long ? `Week of ${label}` : label) : label;
}

/** Page views and daily unique visitors over time — two counts on one shared axis. */
export function TrafficChart({
  data,
  granularity,
  className,
}: {
  data: { bucket: string; pageview: number; visitor: number }[];
  granularity: "day" | "week" | "month";
  className?: string;
}) {
  return (
    <ChartContainer config={trafficConfig} className={className ?? "aspect-auto h-72 w-full"}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
        <XAxis
          dataKey="bucket"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(value: string) => bucketLabel(value, granularity)}
        />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={(value: number) => compact.format(value)} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={<ChartTooltipContent indicator="line" labelFormatter={(value) => bucketLabel(String(value), granularity, true)} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="pageview" type="monotone" stroke="var(--color-pageview)" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
        <Line dataKey="visitor" type="monotone" stroke="var(--color-visitor)" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </LineChart>
    </ChartContainer>
  );
}
