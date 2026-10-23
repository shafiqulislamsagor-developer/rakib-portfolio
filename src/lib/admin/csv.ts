import "server-only";

import { NextResponse } from "next/server";

/*
 * CSV for the admin exports. Every field is quoted, and anything a spreadsheet
 * would read as a formula is prefixed with an apostrophe, so a visitor who
 * types "=cmd|…" into the contact form cannot turn the download into an
 * attack on whoever opens it.
 */

export type CsvValue = string | number | null | undefined;

/** A plain number is never a formula, so negative coordinates stay numbers instead of becoming text. */
const NUMERIC = /^-?\d+(\.\d+)?$/;

export function csvCell(value: CsvValue) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = !NUMERIC.test(text) && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function csvBody(headers: readonly string[], rows: readonly CsvValue[][]) {
  return [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\r\n");
}

/** A downloadable CSV. The byte-order mark makes Excel read UTF-8 names and places correctly. */
export function csvResponse(filename: string, headers: readonly string[], rows: readonly CsvValue[][]) {
  return new NextResponse(`﻿${csvBody(headers, rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.-]/g, "-")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
