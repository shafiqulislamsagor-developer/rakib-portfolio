import "server-only";

import { Types, type Model } from "mongoose";
import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { ActionError, adminAction, invalid, revalidatePublicSite, type AdminContext } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import type { ActionResult } from "@/types/content";

export function assertValidId(id: string, entityName = "Item"): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new ActionError(`${entityName} not found.`);
  }
}

export type CrudOptions = {
  entityType: string;
  revalidatePaths?: string[];
  revalidatePublic?: boolean;
};

/**
 * Generic reusable CRUD creator for admin Server Actions.
 * Enforces Zod schema validation, admin authorization, database persistence,
 * structured audit logging, and route revalidation.
 */
export async function createItem<TInput, TDoc extends { _id: Types.ObjectId }>(
  model: Model<TDoc>,
  input: TInput,
  schema: ZodType<TInput>,
  options: CrudOptions & {
    transformData?: (data: TInput, context: AdminContext) => Promise<Record<string, unknown>> | Record<string, unknown>;
    getSummary?: (created: TDoc) => string;
  }
): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async (context) => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const payload = options.transformData
      ? await options.transformData(parsed.data, context)
      : (parsed.data as Record<string, unknown>);

    const created = await model.create(payload);
    const id = created._id.toString();

    await logActivity(context.actor, "create", {
      entityType: options.entityType,
      entityId: id,
      summary: options.getSummary ? options.getSummary(created as TDoc) : `Created ${options.entityType}`,
      ip: context.ip,
    });

    if (options.revalidatePublic !== false) revalidatePublicSite();
    if (options.revalidatePaths) {
      for (const p of options.revalidatePaths) revalidatePath(p);
    }

    return { ok: true, data: { id } };
  });
}

/**
 * Generic reusable CRUD updater for admin Server Actions.
 */
export async function updateItem<TInput, TDoc extends { _id: Types.ObjectId }>(
  model: Model<TDoc>,
  id: string,
  input: TInput,
  schema: ZodType<TInput>,
  options: CrudOptions & {
    transformData?: (data: TInput, existing: TDoc, context: AdminContext) => Promise<Record<string, unknown>> | Record<string, unknown>;
    getSummary?: (updated: TDoc) => string;
  }
): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async (context) => {
    assertValidId(id, options.entityType);
    const parsed = schema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const existing = await model.findById(id);
    if (!existing) throw new ActionError(`${options.entityType} not found.`);

    const payload = options.transformData
      ? await options.transformData(parsed.data, existing as unknown as TDoc, context)
      : (parsed.data as Record<string, unknown>);

    existing.set(payload);
    await existing.save();

    await logActivity(context.actor, "update", {
      entityType: options.entityType,
      entityId: id,
      summary: options.getSummary ? options.getSummary(existing as unknown as TDoc) : `Updated ${options.entityType}`,
      ip: context.ip,
    });

    if (options.revalidatePublic !== false) revalidatePublicSite();
    if (options.revalidatePaths) {
      for (const p of options.revalidatePaths) revalidatePath(p);
    }

    return { ok: true, data: { id } };
  });
}

/**
 * Generic reusable CRUD deleter for admin Server Actions.
 */
export async function deleteItem<TDoc extends { _id: Types.ObjectId }>(
  model: Model<TDoc>,
  id: string,
  options: CrudOptions & {
    beforeDelete?: (item: TDoc, context: AdminContext) => Promise<void> | void;
    getSummary?: (item: TDoc) => string;
  }
): Promise<ActionResult<void>> {
  return adminAction<void>(async (context) => {
    assertValidId(id, options.entityType);
    const existing = await model.findById(id);
    if (!existing) throw new ActionError(`${options.entityType} not found.`);

    if (options.beforeDelete) {
      await options.beforeDelete(existing as unknown as TDoc, context);
    }

    await model.findByIdAndDelete(id);

    await logActivity(context.actor, "delete", {
      entityType: options.entityType,
      entityId: id,
      summary: options.getSummary ? options.getSummary(existing as unknown as TDoc) : `Deleted ${options.entityType}`,
      ip: context.ip,
    });

    if (options.revalidatePublic !== false) revalidatePublicSite();
    if (options.revalidatePaths) {
      for (const p of options.revalidatePaths) revalidatePath(p);
    }

    return { ok: true, data: undefined };
  });
}

/**
 * Generic reusable create-or-update handler.
 */
export async function saveItem<TInput, TDoc extends { _id: Types.ObjectId }>(
  model: Model<TDoc>,
  id: string | null | undefined,
  input: TInput,
  schema: ZodType<TInput>,
  options: CrudOptions & {
    transformData?: (data: TInput, existing: TDoc | null, context: AdminContext) => Promise<Record<string, unknown>> | Record<string, unknown>;
    getSummary?: (item: TDoc) => string;
  }
): Promise<ActionResult<{ id: string }>> {
  if (id) {
    return updateItem(model, id, input, schema, {
      ...options,
      transformData: options.transformData
        ? (data, existing, ctx) => options.transformData!(data, existing, ctx)
        : undefined,
    });
  }
  return createItem(model, input, schema, {
    ...options,
    transformData: options.transformData
      ? (data, ctx) => options.transformData!(data, null, ctx)
      : undefined,
  });
}

