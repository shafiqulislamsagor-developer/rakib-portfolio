import type { SortOrder } from "mongoose";
import type { AnyModel } from "@/lib/db/types";

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number; pageCount: number };

export function pageFromParam(value: string | string[] | undefined) {
  const page = Number.parseInt(Array.isArray(value) ? value[0] : value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, 10000) : 1;
}

export async function paginate<TOut>(
  model: AnyModel,
  filter: Record<string, unknown>,
  options: {
    page: number;
    pageSize?: number;
    sort: Record<string, SortOrder>;
    select?: string;
    map: (doc: unknown) => TOut;
  }
): Promise<Paginated<TOut>> {
  const pageSize = options.pageSize ?? 20;
  const [total, docs] = await Promise.all([
    model.countDocuments(filter),
    model
      .find(filter)
      .sort(options.sort)
      .skip((options.page - 1) * pageSize)
      .limit(pageSize)
      .select(options.select ?? "")
      .lean(),
  ]);
  return {
    items: docs.map(options.map),
    total,
    page: options.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Escape user input for use inside a MongoDB $regex. */
export function searchRegex(query: string) {
  return new RegExp(query.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}
