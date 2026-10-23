import { Schema } from "mongoose";

export const ImageSchema = new Schema(
  {
    url: { type: String, default: "", trim: true, maxlength: 2048 },
    alt: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { _id: false }
);

export const SeoSchema = new Schema(
  {
    title: { type: String, default: "", trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 320 },
    ogImage: { type: String, default: "", trim: true, maxlength: 2048 },
    noIndex: { type: Boolean, default: false },
  },
  { _id: false }
);

export const LinkSchema = new Schema(
  {
    label: { type: String, default: "", trim: true, maxlength: 60 },
    href: { type: String, default: "", trim: true, maxlength: 2048 },
  },
  { _id: false }
);

export const slugField = {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  maxlength: 120,
  match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

export const authorIdField = {
  type: Schema.Types.ObjectId,
  ref: "AdminUser",
  default: null,
};

export const baseContentFields = {
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: slugField,
  summary: { type: String, default: "", trim: true, maxlength: 1200 },
  authorId: authorIdField,
};

export const commonTimestamps = { timestamps: true } as const;

export const commonIndexes = {
  byStatusAndOrder: { status: 1, order: 1 } as const,
  byAuthor: { authorId: 1 } as const,
};
