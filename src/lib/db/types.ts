import type { Model } from "mongoose";

/**
 * Generic helpers (pagination, ordering, slug checks) work across models whose
 * inferred schema types differ; Mongoose's generics do not unify them, so these
 * helpers accept any model and stay type-safe at their call sites instead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyModel = Model<any>;
