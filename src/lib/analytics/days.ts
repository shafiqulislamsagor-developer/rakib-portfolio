// Day keys ("YYYY-MM-DD") for analytics aggregates, in a configurable time zone.

import { cachedTimeZone } from "@/lib/db/runtime-cache";

/** The zone chosen in Admin → Settings → Analytics ("UTC" until it is loaded). */
export function analyticsTimeZone() {
  return cachedTimeZone();
}

export function dayKey(date = new Date(), timeZone = analyticsTimeZone()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function addDays(day: string, amount: number) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function dayRange(from: string, to: string) {
  const days: string[] = [];
  for (let day = from; day <= to && days.length < 800; day = addDays(day, 1)) days.push(day);
  return days;
}

export function isDayKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export type RangePreset = "7d" | "30d" | "90d" | "365d";

/** Resolve `?range=30d` or `?from=YYYY-MM-DD&to=YYYY-MM-DD` into an inclusive day range (max 2 years). */
export function resolveRange(params: { range?: string; from?: string; to?: string }) {
  const today = dayKey();
  if (isDayKey(params.from) && isDayKey(params.to) && params.from <= params.to) {
    const to = params.to > today ? today : params.to;
    const earliest = addDays(to, -730);
    const from = params.from < earliest ? earliest : params.from;
    return { from, to, preset: "custom" as const, days: dayRange(from, to).length };
  }
  const preset = (["7d", "30d", "90d", "365d"] as const).includes(params.range as RangePreset)
    ? (params.range as RangePreset)
    : "30d";
  const days = Number.parseInt(preset, 10);
  return { from: addDays(today, -(days - 1)), to: today, preset, days };
}

/** The equally long period immediately before a range, for trend comparisons. */
export function previousRange(from: string, to: string) {
  const length = dayRange(from, to).length;
  return { from: addDays(from, -length), to: addDays(from, -1) };
}

export function bucketKey(day: string, granularity: "day" | "week" | "month") {
  if (granularity === "month") return day.slice(0, 7);
  if (granularity === "week") {
    const date = new Date(`${day}T00:00:00.000Z`);
    const weekday = (date.getUTCDay() + 6) % 7; // Monday = 0
    date.setUTCDate(date.getUTCDate() - weekday);
    return date.toISOString().slice(0, 10);
  }
  return day;
}

/**
 * Minutes that `timeZone` is ahead of UTC at that instant. Used to turn a day
 * key into the window of real time it covers.
 */
function zoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "longOffset" }).formatToParts(date);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

/**
 * The first instant of a day key, in the analytics time zone. The offset is
 * read at UTC midnight, so a range that starts on the day a zone changes to or
 * from summer time can be an hour out — close enough for reporting windows.
 */
export function dayStart(day: string, timeZone = analyticsTimeZone()) {
  const utcMidnight = new Date(`${day}T00:00:00.000Z`);
  return new Date(utcMidnight.getTime() - zoneOffsetMinutes(utcMidnight, timeZone) * 60_000);
}

/** The last instant of a day key (inclusive). */
export function dayEnd(day: string, timeZone = analyticsTimeZone()) {
  return new Date(dayStart(addDays(day, 1), timeZone).getTime() - 1);
}
