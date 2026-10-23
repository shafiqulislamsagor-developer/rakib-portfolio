import { Schema, Types, model, models, type InferSchemaType, type Model } from "mongoose";
import {
  HOME_SECTIONS,
  RESUME_SECTIONS,
  RESUME_TEMPLATES,
  SOCIAL_PLATFORMS,
  STRENGTH_ICONS,
  THEME_MODES,
  VISITOR_RETENTION_CHOICES,
} from "@/lib/constants";
import { DEFAULT_THEME_PRESET, THEME_PRESET_KEYS } from "@/lib/theme";
import { ImageSchema, LinkSchema, SeoSchema } from "./shared";

const ProfileSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true },
    name: { type: String, default: "", trim: true, maxlength: 80 },
    shortName: { type: String, default: "", trim: true, maxlength: 40 },
    title: { type: String, default: "", trim: true, maxlength: 80 },
    availability: { type: String, default: "", trim: true, maxlength: 140 },
    location: { type: String, default: "", trim: true, maxlength: 120 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    headline: { type: String, default: "", trim: true, maxlength: 160 },
    headlineHighlight: { type: String, default: "", trim: true, maxlength: 60 },
    intro: { type: String, default: "", trim: true, maxlength: 600 },
    aboutBody: { type: String, default: "", trim: true, maxlength: 1200 },
    bio: { type: String, default: "", maxlength: 10000 },
    strengths: [
      {
        _id: false,
        title: { type: String, trim: true, maxlength: 80 },
        copy: { type: String, trim: true, maxlength: 300 },
        icon: { type: String, enum: STRENGTH_ICONS, default: "layers" },
      },
    ],
    highlights: [
      {
        _id: false,
        value: { type: String, trim: true, maxlength: 20 },
        label: { type: String, trim: true, maxlength: 80 },
      },
    ],
    avatar: { type: ImageSchema, default: () => ({}) },
    cv: {
      url: { type: String, default: "", trim: true, maxlength: 2048 },
      fileName: { type: String, default: "", trim: true, maxlength: 160 },
      updatedAt: { type: Date, default: null },
    },
    socials: [
      {
        _id: false,
        platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
        label: { type: String, trim: true, maxlength: 80 },
        url: { type: String, trim: true, maxlength: 2048 },
      },
    ],
    primaryCta: { type: LinkSchema, default: () => ({}) },
    secondaryCta: { type: LinkSchema, default: () => ({}) },
    heroCode: {
      focus: { type: String, default: "", trim: true, maxlength: 60 },
      craft: { type: [String], default: [] },
      backend: { type: String, default: "", trim: true, maxlength: 60 },
      status: { type: String, default: "", trim: true, maxlength: 40 },
    },
  },
  { timestamps: true }
);

export type ProfileDoc = InferSchemaType<typeof ProfileSchema> & { _id: Types.ObjectId };
export const Profile: Model<ProfileDoc> =
  (models.Profile as Model<ProfileDoc>) || model<ProfileDoc>("Profile", ProfileSchema);

const SectionCopySchema = new Schema(
  {
    eyebrow: { type: String, default: "", trim: true, maxlength: 60 },
    heading: { type: String, default: "", trim: true, maxlength: 140 },
    intro: { type: String, default: "", trim: true, maxlength: 400 },
  },
  { _id: false }
);

const SettingsSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true },
    siteName: { type: String, default: "", trim: true, maxlength: 80 },
    siteDescription: { type: String, default: "", trim: true, maxlength: 320 },
    /** Canonical public URL (no trailing slash). Empty falls back to the Vercel/host URL. */
    siteUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    logoText: { type: String, default: "", trim: true, maxlength: 12 },
    logo: { type: ImageSchema, default: () => ({}) },
    faviconUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    theme: {
      defaultMode: { type: String, enum: THEME_MODES, default: "dark" },
      preset: { type: String, enum: THEME_PRESET_KEYS, default: DEFAULT_THEME_PRESET },
    },
    navigation: [
      {
        _id: false,
        label: { type: String, trim: true, maxlength: 40 },
        href: { type: String, trim: true, maxlength: 300 },
        visible: { type: Boolean, default: true },
      },
    ],
    footer: {
      eyebrow: { type: String, default: "", trim: true, maxlength: 80 },
      headline: { type: String, default: "", trim: true, maxlength: 160 },
      highlight: { type: String, default: "", trim: true, maxlength: 60 },
      blurb: { type: String, default: "", trim: true, maxlength: 300 },
      ctaLabel: { type: String, default: "", trim: true, maxlength: 40 },
      ctaHref: { type: String, default: "", trim: true, maxlength: 2048 },
    },
    homeSections: [
      {
        _id: false,
        key: { type: String, enum: HOME_SECTIONS, required: true },
        visible: { type: Boolean, default: true },
      },
    ],
    sectionCopy: {
      about: { type: SectionCopySchema, default: () => ({}) },
      experience: { type: SectionCopySchema, default: () => ({}) },
      education: { type: SectionCopySchema, default: () => ({}) },
      projects: { type: SectionCopySchema, default: () => ({}) },
      blog: { type: SectionCopySchema, default: () => ({}) },
      contact: { type: SectionCopySchema, default: () => ({}) },
      highlights: { type: SectionCopySchema, default: () => ({}) },
      services: { type: SectionCopySchema, default: () => ({}) },
      process: { type: SectionCopySchema, default: () => ({}) },
      testimonials: { type: SectionCopySchema, default: () => ({}) },
      faq: { type: SectionCopySchema, default: () => ({}) },
    },
    process: [
      {
        _id: false,
        title: { type: String, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 400 },
      },
    ],
    seo: {
      titleDefault: { type: String, default: "", trim: true, maxlength: 120 },
      titleTemplate: { type: String, default: "", trim: true, maxlength: 120 },
      description: { type: String, default: "", trim: true, maxlength: 320 },
      keywords: { type: [String], default: [] },
      ogImage: { type: String, default: "", trim: true, maxlength: 2048 },
      twitterHandle: { type: String, default: "", trim: true, maxlength: 40 },
      googleSiteVerification: { type: String, default: "", trim: true, maxlength: 120 },
      allowIndexing: { type: Boolean, default: true },
    },
    pages: {
      projects: { type: SeoSchema, default: () => ({}) },
      blog: { type: SeoSchema, default: () => ({}) },
      about: { type: SeoSchema, default: () => ({}) },
      services: { type: SeoSchema, default: () => ({}) },
      contact: { type: SeoSchema, default: () => ({}) },
      resume: { type: SeoSchema, default: () => ({}) },
    },
    contact: {
      formEnabled: { type: Boolean, default: true },
    },
    /**
     * A short spoken welcome, uploaded in Admin → Settings. Browsers block
     * audio that starts on its own, so the player always offers a visible
     * control and falls back to the visitor's first tap (see VoiceIntro).
     */
    voiceIntro: {
      enabled: { type: Boolean, default: false },
      url: { type: String, default: "", trim: true, maxlength: 2048 },
      label: { type: String, default: "", trim: true, maxlength: 60 },
      transcript: { type: String, default: "", trim: true, maxlength: 600 },
      autoplay: { type: Boolean, default: true },
      oncePerSession: { type: Boolean, default: true },
    },
    // Which blocks the résumé shows, in which order, and in which layout. The
    // content itself always comes from the live collections.
    resume: {
      template: { type: String, enum: RESUME_TEMPLATES, default: "classic" },
      sections: [
        {
          _id: false,
          key: { type: String, enum: RESUME_SECTIONS, required: true },
          visible: { type: Boolean, default: true },
        },
      ],
      headline: { type: String, default: "", trim: true, maxlength: 160 },
      summary: { type: String, default: "", trim: true, maxlength: 1200 },
      projectLimit: { type: Number, default: 4, min: 1, max: 12 },
      featuredProjectsOnly: { type: Boolean, default: true },
      showPhone: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true },
      showSocials: { type: Boolean, default: true },
      showSkillLevels: { type: Boolean, default: false },
    },
    analytics: {
      firstPartyEnabled: { type: Boolean, default: true },
      visitorLogEnabled: { type: Boolean, default: true },
      visitorRetention: { type: String, enum: VISITOR_RETENTION_CHOICES, default: "365" },
      gaMeasurementId: { type: String, default: "", trim: true, maxlength: 30 },
      /** IANA zone used for analytics day boundaries and admin timestamps. */
      timezone: { type: String, default: "UTC", trim: true, maxlength: 60 },
    },
  },
  { timestamps: true }
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema> & { _id: Types.ObjectId };
export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) || model<SettingsDoc>("Settings", SettingsSchema);
