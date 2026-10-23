import { slugify } from "@/lib/validation/common";

/** Returns a function producing unique heading ids ("intro", "intro-1", …) in document order. */
export function createHeadingSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };
}

/**
 * The opening paragraph of a Markdown document as plain text.
 *
 * The case study's Overview is one oversized paragraph in the design, so it
 * takes the lead of the stored content; everything from the first heading
 * onwards is rendered as Markdown further down the page.
 */
export function leadParagraph(markdown: string) {
  const body = markdown.replace(/```[\s\S]*?```/g, "").trimStart();
  const [first = ""] = body.split(/\n\s*\n/);
  if (/^#{1,6}\s/.test(first)) return "";
  return first
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Everything after the opening paragraph, still as Markdown.
 *
 * The case study sets its opening paragraph in display type (see
 * `leadParagraph`); the rest of what the author wrote is rendered normally
 * below it, so nothing typed into the admin is lost.
 */
export function bodyAfterLead(markdown: string) {
  const body = markdown.trimStart();
  const [first = "", ...rest] = body.split(/\n\s*\n/);
  // A document that opens with a heading has no separate lead to remove.
  if (/^#{1,6}\s/.test(first)) return body;
  return rest.join("\n\n").trim();
}

/** Headings (## / ###) found in Markdown, with the same ids the renderer assigns. */
export function markdownHeadings(markdown: string) {
  const slug = createHeadingSlugger();
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .map((line) => /^(#{2,3})\s+(.+?)\s*#*$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => {
      const text = match[2].replace(/[*_`~[\]]/g, "").replace(/\(([^)]*)\)/g, "").trim();
      return { level: match[1].length as 2 | 3, text, id: slug(text) };
    });
}
