const monthFormatters = {
  long: new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }),
  short: new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }),
};

export function formatMonth(iso: string | null | undefined, style: "long" | "short" = "long") {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : monthFormatters[style].format(date);
}

/** Just the year — the experience and education tables in the design use one column for it. */
export function formatYear(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : String(date.getUTCFullYear());
}

export function formatPeriod(start: string | null, end: string | null, style: "long" | "short" = "long") {
  const from = formatMonth(start, style);
  const to = end ? formatMonth(end, style) : "Present";
  if (!from) return end ? to : "";
  return `${from} - ${to}`;
}

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormatter.format(date);
}

export function relativeTime(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** 45s · 2m 05s · 1h 03m */
export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${pad(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
}

export function readingMinutes(markdown: string) {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

/** `YYYY-MM` ⇄ ISO helpers for <input type="month">. */
export function isoToMonth(iso: string | null | undefined) {
  return iso ? iso.slice(0, 7) : "";
}

export function monthToDate(month: string) {
  return month ? new Date(`${month}-01T00:00:00.000Z`) : null;
}

// Built from char codes so no escaping layer can alter them.
const BACKSLASH = String.fromCharCode(92);
const SCRIPT_ESCAPES: [RegExp, string][] = [
  [/</g, `${BACKSLASH}u003c`],
  [new RegExp(String.fromCharCode(0x2028), "g"), `${BACKSLASH}u2028`],
  [new RegExp(String.fromCharCode(0x2029), "g"), `${BACKSLASH}u2029`],
];

/** Serialize JSON-LD safely inside a <script> tag (prevents `</script>` break-outs). */
export function jsonLd(data: unknown) {
  return SCRIPT_ESCAPES.reduce((json, [pattern, replacement]) => json.replace(pattern, replacement), JSON.stringify(data));
}
