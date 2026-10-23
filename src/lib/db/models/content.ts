import {
  EDUCATION_KINDS,
  EXPERIENCE_TYPES,
  FAQ_PLACEMENTS,
  ITEM_STATUSES,
  POST_STATUSES,
  PROJECT_STATUSES,
  STRENGTH_ICONS,
} from "@/lib/constants";
import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  ImageSchema,
  SeoSchema,
  authorIdField,
  commonTimestamps,
  slugField,
} from "./shared";

// ---------------------------------------------------------------- Projects

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: slugField,
    previousSlugs: { type: [String], default: [], index: true },
    summary: { type: String, default: "", trim: true, maxlength: 1200 },
    content: { type: String, default: "", maxlength: 50000 },
    category: { type: String, default: "", trim: true, maxlength: 60 },
    technologies: { type: [String], default: [] },
    role: { type: String, default: "", trim: true, maxlength: 120 },
    client: { type: String, default: "", trim: true, maxlength: 120 },
    year: { type: String, default: "", trim: true, maxlength: 20 },
    thumbnail: { type: ImageSchema, default: () => ({}) },
    cover: { type: ImageSchema, default: () => ({}) },
    gallery: { type: [ImageSchema], default: [] },
    /*
     * The case-study page lays its shots out in fixed slots (see the project
     * sections in the design): `gallery` fills the Overview grid, `process`
     * the Design Process block, and `fullPreview` the one tall screenshot at
     * the end.
     */
    process: {
      body: { type: String, default: "", trim: true, maxlength: 4000 },
      images: { type: [ImageSchema], default: [] },
    },
    fullPreview: { type: ImageSchema, default: () => ({}) },
    liveUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    repoUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft" },
    publishedAt: { type: Date, default: null },
    seo: { type: SeoSchema, default: () => ({}) },
    viewCount: { type: Number, default: 0 },
    authorId: authorIdField,
  },
  commonTimestamps,
);
ProjectSchema.index({ status: 1, order: 1 });
ProjectSchema.index({ status: 1, featured: 1, order: 1 });
ProjectSchema.index({ authorId: 1 });
ProjectSchema.index({
  title: "text",
  summary: "text",
  technologies: "text",
  category: "text",
});

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & {
  _id: Types.ObjectId;
};
export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) ||
  model<ProjectDoc>("Project", ProjectSchema);

// ---------------------------------------------------------------- Blog posts

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: slugField,
    previousSlugs: { type: [String], default: [], index: true },
    excerpt: { type: String, default: "", trim: true, maxlength: 400 },
    content: { type: String, default: "", maxlength: 100000 },
    coverImage: { type: ImageSchema, default: () => ({}) },
    category: { type: String, default: "", trim: true, maxlength: 60 },
    tags: { type: [String], default: [] },
    status: { type: String, enum: POST_STATUSES, default: "draft" },
    publishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    readingMinutes: { type: Number, default: 1 },
    seo: { type: SeoSchema, default: () => ({}) },
    viewCount: { type: Number, default: 0 },
    authorId: authorIdField,
  },
  commonTimestamps,
);
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ status: 1, publishAt: 1 });
PostSchema.index({ authorId: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({
  title: "text",
  excerpt: "text",
  tags: "text",
  category: "text",
});

export type PostDoc = InferSchemaType<typeof PostSchema> & {
  _id: Types.ObjectId;
};
export const Post: Model<PostDoc> =
  (models.Post as Model<PostDoc>) || model<PostDoc>("Post", PostSchema);

// ---------------------------------------------------------------- Skills

const SkillSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 60,
    },
    category: { type: String, default: "Other", trim: true, maxlength: 60 },
    level: { type: Number, default: null, min: 0, max: 100 },
    /** Tool logo, shown inside the floating disc on the About page. */
    icon: { type: ImageSchema, default: () => ({}) },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUSES, default: "active" },
    authorId: authorIdField,
  },
  commonTimestamps,
);
SkillSchema.index({ status: 1, order: 1 });
SkillSchema.index({ authorId: 1 });

export type SkillDoc = InferSchemaType<typeof SkillSchema> & {
  _id: Types.ObjectId;
};
export const Skill: Model<SkillDoc> =
  (models.Skill as Model<SkillDoc>) || model<SkillDoc>("Skill", SkillSchema);

// ---------------------------------------------------------------- Experience

const ExperienceSchema = new Schema(
  {
    type: { type: String, enum: EXPERIENCE_TYPES, default: "work" },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    companyUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    achievements: { type: [String], default: [] },
    progression: [
      {
        _id: false,
        title: { type: String, trim: true, maxlength: 120 },
        startDate: { type: Date },
        endDate: { type: Date, default: null },
      },
    ],
    technologies: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUSES, default: "active" },
    authorId: authorIdField,
  },
  commonTimestamps,
);
ExperienceSchema.index({ status: 1, startDate: -1 });
ExperienceSchema.index({ authorId: 1 });

export type ExperienceDoc = InferSchemaType<typeof ExperienceSchema> & {
  _id: Types.ObjectId;
};
export const Experience: Model<ExperienceDoc> =
  (models.Experience as Model<ExperienceDoc>) ||
  model<ExperienceDoc>("Experience", ExperienceSchema);

// ---------------------------------------------------------------- Education, certifications, achievements

const EducationSchema = new Schema(
  {
    kind: { type: String, enum: EDUCATION_KINDS, default: "education" },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    institution: { type: String, default: "", trim: true, maxlength: 160 },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    credentialId: { type: String, default: "", trim: true, maxlength: 120 },
    credentialUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUSES, default: "active" },
    authorId: authorIdField,
  },
  commonTimestamps,
);
EducationSchema.index({ status: 1, kind: 1, order: 1 });
EducationSchema.index({ authorId: 1 });

export type EducationDoc = InferSchemaType<typeof EducationSchema> & {
  _id: Types.ObjectId;
};
export const Education: Model<EducationDoc> =
  (models.Education as Model<EducationDoc>) ||
  model<EducationDoc>("Education", EducationSchema);

// ---------------------------------------------------------------- Services

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    summary: { type: String, default: "", trim: true, maxlength: 400 },
    icon: { type: String, enum: STRENGTH_ICONS, default: "code" },
    /** Preview shot revealed when the service row expands on the home page. */
    image: { type: ImageSchema, default: () => ({}) },
    deliverables: { type: [String], default: [] },
    price: {
      amount: { type: String, default: "", trim: true, maxlength: 40 },
      unit: { type: String, default: "", trim: true, maxlength: 40 },
      note: { type: String, default: "", trim: true, maxlength: 140 },
    },
    details: { type: String, default: "", maxlength: 8000 },
    popular: { type: Boolean, default: false },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUSES, default: "active" },
    authorId: authorIdField,
  },
  commonTimestamps,
);
ServiceSchema.index({ status: 1, order: 1 });
ServiceSchema.index({ authorId: 1 });

export type ServiceDoc = InferSchemaType<typeof ServiceSchema> & {
  _id: Types.ObjectId;
};
export const Service: Model<ServiceDoc> =
  (models.Service as Model<ServiceDoc>) ||
  model<ServiceDoc>("Service", ServiceSchema);

// ---------------------------------------------------------------- Testimonials

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, default: "", trim: true, maxlength: 100 },
    company: { type: String, default: "", trim: true, maxlength: 100 },
    avatar: { type: ImageSchema, default: () => ({}) },
    quote: { type: String, required: true, trim: true, maxlength: 1200 },
    rating: { type: Number, default: null, min: 1, max: 5 },
    sourceUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    projectSlug: { type: String, default: "", trim: true, maxlength: 120 },
    // Indexed below with the others, so it is declared only once.
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUSES, default: "active" },
    authorId: authorIdField,
  },
  commonTimestamps,
);
TestimonialSchema.index({ status: 1, order: 1 });
TestimonialSchema.index({ authorId: 1 });
TestimonialSchema.index({ projectId: 1 });

export type TestimonialDoc = InferSchemaType<typeof TestimonialSchema> & {
  _id: Types.ObjectId;
};
export const Testimonial: Model<TestimonialDoc> =
  (models.Testimonial as Model<TestimonialDoc>) ||
  model<TestimonialDoc>("Testimonial", TestimonialSchema);

// ---------------------------------------------------------------- FAQs

const FaqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, maxlength: 3000 },
    placements: { type: [String], enum: FAQ_PLACEMENTS, default: ["home"] },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUSES, default: "active" },
    authorId: authorIdField,
  },
  commonTimestamps,
);
FaqSchema.index({ status: 1, order: 1 });
FaqSchema.index({ authorId: 1 });

export type FaqDoc = InferSchemaType<typeof FaqSchema> & {
  _id: Types.ObjectId;
};
export const Faq: Model<FaqDoc> =
  (models.Faq as Model<FaqDoc>) || model<FaqDoc>("Faq", FaqSchema);

// ---------------------------------------------------------------- Custom pages (/[slug])

const PageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: slugField,
    previousSlugs: { type: [String], default: [], index: true },
    intro: { type: String, default: "", trim: true, maxlength: 400 },
    content: { type: String, default: "", maxlength: 100000 },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft" },
    showInFooter: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
    seo: { type: SeoSchema, default: () => ({}) },
    authorId: authorIdField,
  },
  commonTimestamps,
);
PageSchema.index({ status: 1, title: 1 });
PageSchema.index({ authorId: 1 });

export type PageDoc = InferSchemaType<typeof PageSchema> & {
  _id: Types.ObjectId;
};
export const Page: Model<PageDoc> =
  (models.Page as Model<PageDoc>) || model<PageDoc>("Page", PageSchema);
