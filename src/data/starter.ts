import type { ProfileData, SiteSettingsData } from "@/types/content";

/**
 * The content the site ships with: the portfolio of **Rakib Khan**, written to
 * match the design exactly. `pnpm db:seed` loads it into MongoDB (see
 * scripts/seed.ts) and the rest of the dataset lives in
 * `data/starter-content.ts`.
 *
 * Every field here is editable at /admin — nothing is hard-coded into the
 * pages. The same values are served when MONGODB_URI is not set, so the design
 * renders identically with or without a database (see `data/defaults.ts`).
 */

export const STARTER_NAME = "Rakib Khan";
export const STARTER_EMAIL = "mr.uiuxmaestro@gmail.com";
export const STARTER_DESCRIPTION =
  "Rakib Khan is a UI/UX designer crafting websites, mobile apps, SaaS platforms and brand identities.";

/** Dates are relative to the seed run, so a fresh install never looks abandoned. */
const NOW = new Date();

/** First day of the month `months` back, as an ISO string. */
export function monthsAgo(months: number) {
  return new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - months, 1)).toISOString();
}

export function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

export function daysFromNow(days: number) {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString();
}

// ------------------------------------------------------------------ Profile

const BIO = `Hello, and welcome to my profile! I am Rakib Khan, an experienced UI/UX designer with a deep passion for creating seamless and engaging digital experiences.

## What I do

I specialise in designing intuitive and visually appealing interfaces that increase user satisfaction and improve digital interactions. My work spans **website design, mobile apps, SaaS platforms, branding and interactive prototyping** — turning ideas into interfaces that drive results.

## How I work

I follow a user-centric approach, starting with in-depth research and wireframing, then crafting intuitive, visually stunning designs. Through collaboration and iteration, every project ends up meeting both user needs and business goals.

## Beyond the pixels

I have multiple skills across graphic design, UI/UX design and IT support, which means I can speak to developers in their language and hand over work they are happy to build.`;

export const starterProfile: ProfileData = {
  name: STARTER_NAME,
  shortName: "Rakib",
  title: "UI/UX Designer",
  availability: "Open for new projects",
  location: "Dhaka, Bangladesh",
  email: STARTER_EMAIL,
  phone: "+8801821-981000",
  // The statement under the hero: `headline` is set in light grey and
  // `headlineHighlight` continues it in the darker tone.
  headline: "Create innovative designs for modern websites, mobile apps,",
  headlineHighlight: "and web platforms across a wide range of industries.",
  intro:
    "I craft seamless digital experiences by blending creativity with strategy. From UX research to web & mobile UI, I design intuitive interfaces that enhance usability. Whether it’s a SaaS platform or brand identity, my goal is to make every interaction engaging and impactful.",
  aboutBody:
    "With 05 years of experience in the design industry I have been helping to bring brands to life through thoughtful design that resonates.",
  bio: BIO,
  // The scattered glass cards under "Why consider me".
  strengths: [
    {
      icon: "users",
      title: "User's\nValentine",
      copy: "I make users happy and your KPIs happier. Great design isn’t just pretty— it gets results",
    },
    {
      icon: "smartphone",
      title: "Mobile\nManiac",
      copy: "Designed for thumbs because people scroll like their lives depends on it.",
    },
    {
      icon: "code",
      title: 'Developer\n"friendly"',
      copy: "Ended the 200 year war between designers and developers. Later I rejected knighthood",
    },
    {
      icon: "palette",
      title: "Redesign Master",
      copy: "Client's can't believe it's their old website. They also call me their \"Sensai\"",
    },
    {
      icon: "search",
      title: "UX Expert",
      copy: "No dark UX patterns nor dark arts were used. No animals were harmed in this process",
    },
    {
      icon: "cloud",
      title: "Accessible for all",
      copy: "Yes --- including those who wear double lens spectacles",
    },
  ],
  highlights: [
    { value: "05", label: "Years designing digital products" },
    { value: "40+", label: "Websites, apps and platforms shipped" },
    { value: "20+", label: "Brands and product teams worked with" },
    { value: "100%", label: "Projects delivered with a dev handover" },
  ],
  avatar: { url: "/images/profile-home.webp", alt: "Portrait of Rakib Khan" },
  cv: { url: "/cv/rakib-khan-cv.pdf", fileName: "Rakib-Khan-CV.pdf", updatedAt: daysAgo(21) },
  socials: [
    { platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" },
    { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/" },
    { platform: "twitter", label: "Twitter", url: "https://x.com/" },
  ],
  primaryCta: { label: "View All", href: "/projects" },
  secondaryCta: { label: "Download CV", href: "/cv" },
  heroCode: {
    focus: "user experience",
    craft: ["UX Research", "UI Design", "Prototyping", "Brand Design"],
    backend: "Figma + Framer",
    status: "available",
  },
};

// ----------------------------------------------------------------- Settings

export const starterSettings: SiteSettingsData = {
  siteName: "Rakib Khan",
  siteDescription: STARTER_DESCRIPTION,
  // Left empty on purpose: the deployment's own URL is used until a domain is
  // saved in Admin → Settings.
  siteUrl: "",
  logoText: "RK",
  logo: { url: "", alt: "" },
  faviconUrl: "",
  theme: { defaultMode: "dark", preset: "violet" },
  // The menu panel lays these out in two columns, in this order.
  navigation: [
    { label: "Home", href: "/", visible: true },
    { label: "About Me", href: "/about", visible: true },
    { label: "Portfolio", href: "/projects", visible: true },
    { label: "Services", href: "/services", visible: true },
    { label: "Blog", href: "/blog", visible: true },
    { label: "Contact", href: "/contact", visible: true },
  ],
  footer: {
    eyebrow: "Open for new projects",
    headline: "Let’s work together",
    highlight: "",
    blurb:
      "Have a project in mind or just want to say hello? I’m always open to discussing new ideas, collaborations, or opportunities.",
    ctaLabel: "Get in Touch",
    ctaHref: "/contact",
  },
  homeSections: [
    { key: "hero", visible: true },
    { key: "services", visible: true },
    { key: "projects", visible: true },
    { key: "about", visible: true },
    { key: "highlights", visible: true },
    { key: "process", visible: true },
    { key: "testimonials", visible: true },
    { key: "blog", visible: false },
    { key: "faq", visible: false },
    { key: "experience", visible: false },
    { key: "education", visible: false },
    { key: "contact", visible: true },
  ],
  sectionCopy: {
    about: {
      eyebrow: "About Me",
      heading: "I build visually striking designs\nthat prioritize seamless user experiences.",
      intro:
        "With 05 years of experience in the design industry I have been helping to bring brands to life through thoughtful design that resonates.",
    },
    experience: {
      eyebrow: "Experience",
      heading: "Experiences",
      intro:
        "I’ve worked on a range of web, mobile, and SaaS projects—bringing ideas to life with clean, user-focused design and real-world experience.",
    },
    education: {
      eyebrow: "education",
      heading: "Education & Qualification",
      intro:
        "I’ve worked on a range of web, mobile, and SaaS projects—bringing ideas to life with clean, user-focused design and real-world experience.",
    },
    projects: {
      eyebrow: "Work",
      heading: "Selected Work",
      intro: "Websites, mobile apps, SaaS platforms and brand identities — each one shipped and still running.",
    },
    blog: {
      eyebrow: "Blog",
      heading: "Notes on design",
      intro: "Short pieces on research, interface craft and working with developers.",
    },
    contact: {
      eyebrow: "Contact",
      heading: "LET'S WORK TOGETHER",
      intro:
        "Have a project in mind or just want to say hello? I’m always open to discussing new ideas, collaborations, or opportunities. Let’s connect and create something great together.",
    },
    highlights: {
      eyebrow: "Expertise",
      heading: "My Advantages",
      intro:
        "From wireframing to high-fidelity prototyping, I use industry-leading tools like Figma, Framer, Adobe Suite, and more to bring ideas to life—ensuring smooth workflows, pixel-perfect designs, and efficient collaboration.",
    },
    services: {
      eyebrow: "What i Do",
      heading: "Services",
      intro:
        "I craft seamless digital experiences by blending creativity with strategy. From UX research to web & mobile UI, I design intuitive interfaces that enhance usability. Whether it’s a SaaS platform or brand identity, my goal is to make every interaction engaging and impactful.",
    },
    process: {
      eyebrow: "Process",
      heading: "Work Process",
      intro:
        "I follow a clear, user-focused process—from research to delivery—that ensures every design is purposeful, effective, and aligned with project goals.",
    },
    testimonials: {
      eyebrow: "Testimonials",
      heading: "What say my client",
      intro:
        "Here's what some of my clients have said about working with me—real stories from real projects, highlighting the value, collaboration, and results delivered through thoughtful design.",
    },
    faq: {
      eyebrow: "FAQ",
      heading: "Questions, answered.",
      intro: "Availability, pricing, process and what happens after handover.",
    },
  },
  // The five numbered cards in the Work Process section.
  process: [
    {
      title: "Discovery",
      description:
        "Throughout my career  I’ve had the privilege of working with some very talented people at a great bunch of companies.",
    },
    {
      title: "Research",
      description:
        "We uncover underutilized market possibilities and develop a plan to profit from them. We identify a successful plan by first grasping your markets, consumer motivations, competition strategies, and execution.",
    },
    {
      title: "Strategy",
      description:
        "Everything begins with a plan. We will describe your project, establish milestones, and agree on project priorities. We will then have a strategic plan that is consistent with your original vision and makes your objectives attainable.",
    },
    {
      title: "Execute",
      description:
        "At this stage, I bring the design to life by creating clean, high-fidelity interfaces using tools like Figma and Framer. Every element is crafted with purpose, ensuring it aligns with user needs and brand goals.",
    },
    {
      title: "Deliver",
      description:
        "I prepare all final assets, design systems, and prototypes for handoff, ensuring a smooth transition to development. I stay involved to make sure the final product matches the design vision.",
    },
  ],
  seo: {
    titleDefault: "Rakib Khan — UI/UX Designer",
    titleTemplate: "%s — Rakib Khan",
    description: STARTER_DESCRIPTION,
    keywords: [
      "Rakib Khan",
      "UI/UX Designer",
      "UX Research",
      "Web Design",
      "Mobile App Design",
      "SaaS Design",
      "Brand Design",
      "Figma Designer",
      "Framer Designer",
      "Product Designer Dhaka",
      "Freelance UI Designer",
      "Portfolio",
    ],
    ogImage: "",
    twitterHandle: "",
    // Paste a real code in Admin → SEO to verify the site in Search Console.
    googleSiteVerification: "",
    allowIndexing: true,
  },
  pages: {
    projects: {
      title: "Work & Case Studies",
      description:
        "Case studies of websites, mobile apps, SaaS platforms and brand identities designed by Rakib Khan.",
      ogImage: "",
      noIndex: false,
    },
    blog: {
      title: "Blog — Notes on design",
      description: "Practical articles on UX research, interface craft and design handover.",
      ogImage: "",
      noIndex: false,
    },
    about: {
      title: "About",
      description: "Experience, education and toolkit of UI/UX designer Rakib Khan.",
      ogImage: "",
      noIndex: false,
    },
    services: {
      title: "Design Services",
      description: "UX research, web and mobile UI, SaaS design and brand identity work.",
      ogImage: "",
      noIndex: false,
    },
    contact: {
      title: "Contact",
      description: "Tell me about your project. I reply within one business day.",
      ogImage: "",
      noIndex: false,
    },
    resume: {
      title: "Résumé",
      description: "Online résumé: experience, toolkit, selected work and education, with a PDF download.",
      ogImage: "",
      noIndex: false,
    },
  },
  contact: { formEnabled: true },
  voiceIntro: {
    enabled: false,
    url: "",
    label: "Play my welcome",
    transcript: "",
    autoplay: true,
    oncePerSession: true,
  },
  resume: {
    template: "sidebar",
    sections: [
      { key: "summary", visible: true },
      { key: "highlights", visible: true },
      { key: "experience", visible: true },
      { key: "skills", visible: true },
      { key: "projects", visible: true },
      { key: "education", visible: true },
      { key: "certifications", visible: true },
      { key: "achievements", visible: true },
      { key: "services", visible: false },
      { key: "testimonials", visible: false },
    ],
    headline: "UI/UX Designer · Web, Mobile, SaaS & Brand",
    summary:
      "Five years designing digital products end to end — UX research, interface design, prototyping and the handover that gets them built. Currently lead designer at Originative-lab.",
    projectLimit: 4,
    featuredProjectsOnly: true,
    showPhone: true,
    showLocation: true,
    showSocials: true,
    showSkillLevels: false,
  },
  analytics: {
    firstPartyEnabled: true,
    visitorLogEnabled: true,
    visitorRetention: "365",
    gaMeasurementId: "",
    timezone: "Asia/Dhaka",
  },
};
