import type {
  EducationData,
  ExperienceData,
  FaqData,
  MessageData,
  PageData,
  PostData,
  ProjectData,
  ServiceData,
  SkillData,
  TestimonialData,
} from "@/types/content";
import { daysAgo, monthsAgo, STARTER_EMAIL } from "./starter";

/**
 * The rest of the content the site ships with: case studies, the toolkit,
 * career history, services, testimonials, FAQs, articles, custom pages and a
 * few inbox messages — see the note at the top of `data/starter.ts`.
 *
 * Shapes leave out the fields MongoDB generates (`id`, timestamps); the seeder
 * in `scripts/seed.ts` converts the ISO date strings to real dates.
 */

export type StarterProject = Omit<ProjectData, "id" | "createdAt" | "updatedAt">;
export type StarterPost = Omit<PostData, "id" | "createdAt" | "updatedAt">;
export type StarterSkill = Omit<SkillData, "id">;
export type StarterService = Omit<ServiceData, "id">;
export type StarterTestimonial = Omit<TestimonialData, "id">;
export type StarterFaq = Omit<FaqData, "id">;
export type StarterEducation = Omit<EducationData, "id">;
export type StarterPage = Omit<PageData, "id" | "createdAt" | "updatedAt">;
export type StarterMessage = Omit<MessageData, "id" | "notes" | "replies"> & {
  notes: { body: string; authorEmail: string; createdAt: string }[];
  replies: { body: string; sentBy: string; sentAt: string }[];
};

// ----------------------------------------------------------------- Projects

const ROOFNEST_OVERVIEW = `Roofnest came to me with a site that read like a contractor's price list and converted like one too. The brief was to make a roofing company feel like a design studio without losing the trust a trade needs.

## The challenge

Visitors could not tell the difference between a repair, a replacement and a full re-roof, so almost every enquiry started with the same three questions. The old site also had no way to show finished work at a size where the craft was visible.

## What I designed

A quiet, image-led layout that puts completed roofs first and the service menu second. Each service has its own page with a fixed anatomy — what it covers, how long it takes, what it costs — so the enquiry form arrives after the questions are already answered.

## Outcome

Enquiries now arrive with the job type already chosen, and the team spends its first call on scheduling rather than explaining.`;

const ROOFNEST_PROCESS = `In partnership with The Global Citizen Academy and the Harvard Undergraduate Global Education Movement, the HUGEM Innovation Challenge Southeast Asia IV brings together delegates from across South East Asia and esteemed speakers for a 3-day conference in Singapore. This year, guided by the Sustainable Development Goals 11 — Sustainable Cities & Communities and 12 — Responsible Consumption & Production, we aspire to help our brightest-mind delegates think deeply about these global challenges and offer solutions on how young people may collaborate to foster a sustainable international development.`;

export const starterProjects: StarterProject[] = [
  {
    title: "Roofnest",
    slug: "roofnest",
    summary: "Hello, and welcome to",
    content: ROOFNEST_OVERVIEW,
    category: "Roofing",
    technologies: ["Web design", "Web Development", "Front-end / Back-end"],
    role: "Lead designer",
    client: "Roofnest",
    year: "2025",
    thumbnail: { url: "/images/work/roofnest.webp", alt: "Roofnest website design" },
    cover: { url: "/images/project/hero.webp", alt: "Roofnest homepage preview" },
    gallery: [
      { url: "/images/project/overview-1.webp", alt: "Roofnest homepage in full" },
      { url: "/images/project/overview-2.webp", alt: "Roofnest services page" },
      { url: "/images/project/overview-3.webp", alt: "Roofnest project detail" },
      { url: "/images/project/overview-3.webp", alt: "Roofnest enquiry flow" },
    ],
    process: {
      body: ROOFNEST_PROCESS,
      images: [
        { url: "/images/project/process-1.webp", alt: "Early wireframes" },
        { url: "/images/project/process-2.webp", alt: "Type and colour exploration" },
        { url: "/images/project/process-3.webp", alt: "High-fidelity screens" },
      ],
    },
    fullPreview: { url: "/images/project/full-preview.webp", alt: "Roofnest full page design" },
    liveUrl: "https://example.com",
    repoUrl: "",
    featured: true,
    order: 0,
    status: "published",
    publishedAt: monthsAgo(2),
    seo: {
      title: "Roofnest — roofing website design case study",
      description: "How a trade website was rebuilt around finished work, clear service pages and a shorter enquiry.",
      ogImage: "",
      noIndex: false,
    },
    viewCount: 412,
  },
  {
    title: "Pay.co Financial",
    slug: "payco-financial",
    summary: "A payments dashboard that puts the day's money first",
    content: `Pay.co's merchants open the dashboard to answer one question: did the money arrive? Everything else is secondary, so everything else moved down the page.

## What I designed

A single settlement timeline as the first thing on screen, with reconciliation, disputes and payouts as supporting views. Dense tables were rebuilt to stay readable at ten thousand rows, and every number can be traced back to the transaction behind it.`,
    category: "Fintech",
    technologies: ["UI Design", "UX Design"],
    role: "Product designer",
    client: "Pay.co",
    year: "2025",
    thumbnail: { url: "/images/work/payco.webp", alt: "Pay.co Financial dashboard design" },
    cover: { url: "/images/work/payco.webp", alt: "Pay.co Financial dashboard design" },
    gallery: [],
    process: { body: "", images: [] },
    fullPreview: { url: "", alt: "" },
    liveUrl: "",
    repoUrl: "",
    featured: true,
    order: 1,
    status: "published",
    publishedAt: monthsAgo(4),
    seo: { title: "", description: "", ogImage: "", noIndex: false },
    viewCount: 288,
  },
  {
    title: "Quickspace",
    slug: "quickspace",
    summary: "Workspace booking that takes four taps, not fourteen",
    content: `Quickspace lets teams book desks and rooms in shared offices. The old flow asked for the building, the floor, the zone and the time before it showed a single available seat.

## What I designed

Availability first. Pick a time, see what is free, tap it. The filters are still there for the people who want them, but nobody has to walk through them to book a desk for tomorrow morning.`,
    category: "SaaS",
    technologies: ["UI Design", "UX Design"],
    role: "Lead designer",
    client: "Quickspace",
    year: "2024",
    thumbnail: { url: "/images/work/quickspace.webp", alt: "Quickspace booking app design" },
    cover: { url: "/images/work/quickspace.webp", alt: "Quickspace booking app design" },
    gallery: [],
    process: { body: "", images: [] },
    fullPreview: { url: "", alt: "" },
    liveUrl: "",
    repoUrl: "",
    featured: true,
    order: 2,
    status: "published",
    publishedAt: monthsAgo(7),
    seo: { title: "", description: "", ogImage: "", noIndex: false },
    viewCount: 196,
  },
  {
    title: "Interior Studio",
    slug: "interior-studio",
    summary: "A studio portfolio where the rooms do the talking",
    content: `An interior design studio with beautiful work and a website that cropped it into thumbnails.

## What I designed

Full-bleed rooms, captions that stay out of the way, and a project page built around one long scroll instead of a gallery grid. The enquiry form asks for the room and the budget range, which is all the studio needs to reply properly.`,
    category: "Interior",
    technologies: ["UI Design", "UX Design"],
    role: "Designer",
    client: "Interior Studio",
    year: "2024",
    thumbnail: { url: "/images/work/interior.webp", alt: "Interior Studio website design" },
    cover: { url: "/images/work/interior.webp", alt: "Interior Studio website design" },
    gallery: [],
    process: { body: "", images: [] },
    fullPreview: { url: "", alt: "" },
    liveUrl: "",
    repoUrl: "",
    featured: true,
    order: 3,
    status: "published",
    publishedAt: monthsAgo(10),
    seo: { title: "", description: "", ogImage: "", noIndex: false },
    viewCount: 174,
  },
  {
    title: "Animator",
    slug: "animator",
    summary: "A brand identity and site for a motion studio",
    content: `A motion studio needed an identity that could sit still. Their work moves constantly, so the brand around it had to be quiet enough not to compete.

## What I designed

A monospaced wordmark, a two-colour system and a site that is mostly negative space, so each reel plays against nothing. The identity ships as a small design system the studio's own editors can apply.`,
    category: "Branding",
    technologies: ["Brand Design", "UI Design"],
    role: "Brand designer",
    client: "Animator",
    year: "2023",
    thumbnail: { url: "/images/work/animator.webp", alt: "Animator studio brand design" },
    cover: { url: "/images/work/animator.webp", alt: "Animator studio brand design" },
    gallery: [],
    process: { body: "", images: [] },
    fullPreview: { url: "", alt: "" },
    liveUrl: "",
    repoUrl: "",
    featured: false,
    order: 4,
    status: "published",
    publishedAt: monthsAgo(14),
    seo: { title: "", description: "", ogImage: "", noIndex: false },
    viewCount: 131,
  },
];

// ------------------------------------------------------------------- Skills
// Featured skills with a logo become the floating tool discs on the About page.

const skillSeeds: [name: string, category: string, level: number, icon: string][] = [
  ["Figma", "Design", 95, "/images/tools/figma.png"],
  ["Framer", "Design", 85, "/images/tools/framer.png"],
  ["laravel/PHP", "Development", 60, "/images/tools/laravel.png"],
  ["webflow", "No-code", 80, "/images/tools/webflow.png"],
  ["React", "Development", 70, "/images/tools/react.png"],
  ["wordpress", "No-code", 75, "/images/tools/wordpress.png"],
];

export const starterSkills: StarterSkill[] = [
  ...skillSeeds.map(([name, category, level, icon], index) => ({
    name,
    category,
    level,
    icon: { url: icon, alt: `${name} logo` },
    featured: true,
    order: index,
    status: "active" as const,
  })),
  // Not featured: part of the toolkit and the résumé, but not one of the discs.
  ...["UX Research", "Wireframing", "Prototyping", "Design Systems", "Adobe Illustrator", "Adobe Photoshop"].map(
    (name, index) => ({
      name,
      category: "Design",
      level: null,
      icon: { url: "", alt: "" },
      featured: false,
      order: skillSeeds.length + index,
      status: "active" as const,
    }),
  ),
];

// --------------------------------------------------------------- Experience

export const starterExperience: Omit<ExperienceData, "id">[] = [
  {
    type: "work",
    title: "Lead Designer",
    company: "Originative-lab",
    companyUrl: "",
    location: "Dhaka, Bangladesh",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2025-01-01T00:00:00.000Z",
    description:
      "Leading design on client websites and SaaS platforms, from research through to the handover developers build from.",
    achievements: [
      "Set up the studio's design system, cutting new-page design time roughly in half",
      "Ran the research and testing that reshaped two client onboarding flows",
    ],
    progression: [],
    technologies: ["Figma", "Framer", "Design Systems"],
    order: 0,
    status: "active",
  },
  {
    type: "work",
    title: "UIUX Designer",
    company: "Oyolloo",
    companyUrl: "",
    location: "Dhaka, Bangladesh",
    startDate: "2023-01-01T00:00:00.000Z",
    endDate: "2024-01-01T00:00:00.000Z",
    description: "Designed marketing sites and product interfaces for clients across commerce, finance and education.",
    achievements: ["Redesigned a storefront that lifted checkout completion for the client's own reported numbers"],
    progression: [],
    technologies: ["Figma", "Webflow"],
    order: 1,
    status: "active",
  },
  {
    type: "work",
    title: "Junior Designer",
    company: "Zovo Team",
    companyUrl: "",
    location: "Dhaka, Bangladesh",
    startDate: "2021-01-01T00:00:00.000Z",
    endDate: "2023-01-01T00:00:00.000Z",
    description: "Interface and graphic work across web and mobile, alongside day-to-day brand production.",
    achievements: [],
    progression: [],
    technologies: ["Figma", "Adobe Illustrator"],
    order: 2,
    status: "active",
  },
  {
    type: "internship",
    title: "Intern",
    company: "Zovo Team",
    companyUrl: "",
    location: "Dhaka, Bangladesh",
    startDate: "2021-01-01T00:00:00.000Z",
    endDate: "2022-01-01T00:00:00.000Z",
    description: "First year in a studio: production design, asset libraries and learning how handover actually works.",
    achievements: [],
    progression: [],
    technologies: [],
    order: 3,
    status: "active",
  },
];

// ---------------------------------------------------------------- Education

export const starterEducation: StarterEducation[] = [
  {
    kind: "education",
    title: "BSc in Computer Science",
    institution: "National University",
    location: "Dhaka, Bangladesh",
    startDate: "2017-01-01T00:00:00.000Z",
    endDate: "2021-01-01T00:00:00.000Z",
    credentialId: "",
    credentialUrl: "",
    description: "Where the interest in interfaces started, somewhere between an HCI module and a very ugly group project.",
    order: 0,
    status: "active",
  },
  {
    kind: "certification",
    title: "Google UX Design Professional Certificate",
    institution: "Google / Coursera",
    location: "",
    startDate: null,
    endDate: "2022-06-01T00:00:00.000Z",
    credentialId: "",
    credentialUrl: "",
    description: "The research-to-prototype loop, done properly end to end.",
    order: 1,
    status: "active",
  },
  {
    kind: "certification",
    title: "Interaction Design Foundation — UX Management",
    institution: "IxDF",
    location: "",
    startDate: null,
    endDate: "2023-03-01T00:00:00.000Z",
    credentialId: "",
    credentialUrl: "",
    description: "Running design work inside a team rather than beside one.",
    order: 2,
    status: "active",
  },
  {
    kind: "achievement",
    title: "Designer of the Year — Originative-lab",
    institution: "Originative-lab",
    location: "",
    startDate: null,
    endDate: "2024-12-01T00:00:00.000Z",
    credentialId: "",
    credentialUrl: "",
    description: "Internal award, voted by the engineering team — which is the one I wanted.",
    order: 3,
    status: "active",
  },
];

// ----------------------------------------------------------------- Services
// `image` is the shot revealed when a row expands on the home page.

export const starterServices: StarterService[] = [
  {
    title: "UX Research",
    summary:
      "Enhancing user experiences through in-depth research, usability testing, and data-driven insights.",
    icon: "search",
    image: { url: "/images/services/ux.webp", alt: "UX research artefacts" },
    deliverables: [
      "Stakeholder and user interviews",
      "Usability testing with a written findings report",
      "Journey maps and prioritised problem list",
      "Wireframes for the flows that need rework",
    ],
    price: { amount: "From $900", unit: "per study", note: "2–3 weeks · 50% up front" },
    details:
      "Research that ends in decisions rather than a slide deck. I run the sessions, write up what actually blocked people, and turn it into a ranked list you can build against.",
    popular: false,
    featured: true,
    order: 0,
    status: "active",
  },
  {
    title: "Web/Mobile App UI",
    summary: "Creating visually stunning and intuitive interfaces for web and mobile applications.",
    icon: "smartphone",
    image: { url: "/images/services/web.webp", alt: "Web and mobile interface designs" },
    deliverables: [
      "High-fidelity screens for every state",
      "Responsive layouts from 360px up",
      "Interactive prototype",
      "Developer handover with specs and assets",
    ],
    price: { amount: "From $1,800", unit: "per project", note: "3–6 weeks · milestones" },
    details:
      "The whole interface, not just the happy path: empty, loading, error and edge states included, so nothing has to be invented during the build.",
    popular: true,
    featured: true,
    order: 1,
    status: "active",
  },
  {
    title: "SaaS Design",
    summary: "Designing scalable and conversion-focused SaaS platforms with seamless user flows.",
    icon: "layout-dashboard",
    image: { url: "/images/services/saas.webp", alt: "SaaS platform interface design" },
    deliverables: [
      "Information architecture and navigation model",
      "Dashboard, settings and billing flows",
      "A component library your developers can reuse",
      "Onboarding designed for first-run success",
    ],
    price: { amount: "From $3,200", unit: "per platform", note: "6–10 weeks · milestones" },
    details:
      "Dense product surfaces that stay usable as they grow. I design the system, not a set of screens, so the tenth feature does not break the first nine.",
    popular: false,
    featured: true,
    order: 2,
    status: "active",
  },
  {
    title: "Brand Design",
    summary: "Building unique brand identities with impactful visuals, typography, and design systems.",
    icon: "palette",
    image: { url: "/images/services/brand.webp", alt: "Brand identity design" },
    deliverables: [
      "Wordmark and mark in every needed format",
      "Type scale and colour system",
      "Usage guidelines",
      "Social and presentation templates",
    ],
    price: { amount: "From $1,200", unit: "per identity", note: "3–5 weeks" },
    details:
      "An identity that holds together across a website, an app and a pitch deck — delivered as a small system rather than a logo file.",
    popular: false,
    featured: true,
    order: 3,
    status: "active",
  },
];

// ------------------------------------------------------------- Testimonials

export const starterTestimonials: StarterTestimonial[] = [
  {
    name: "Sumit Saha",
    role: "CEO and Co-founder",
    company: "ABC Comapny",
    avatar: { url: "/images/testimonials/home-1.webp", alt: "Portrait of Sumit Saha" },
    quote:
      "He took our vision and transformed it into a clean, user-friendly design that our users love. Communication was smooth, and delivery was on point.",
    rating: 5,
    sourceUrl: "",
    projectSlug: "",
    featured: true,
    order: 0,
    status: "active",
  },
  {
    name: "Sarah",
    role: "SaaS Startup Founder",
    company: "",
    avatar: { url: "/images/testimonials/client-2.webp", alt: "Portrait of Sarah" },
    quote:
      "Working with Rakib was a game-changer. His design sense is sharp, and he understood our brand from day one",
    rating: 5,
    sourceUrl: "",
    projectSlug: "",
    featured: true,
    order: 1,
    status: "active",
  },
  {
    name: "Amira",
    role: "CEO",
    company: "Glamii Beauty App",
    avatar: { url: "/images/testimonials/home-3.webp", alt: "Portrait of Amira" },
    quote:
      "Rakib nailed the UI for our mobile app, and the results have been amazing. We’ve seen a noticeable boost in user engagement since launch.",
    rating: 5,
    sourceUrl: "",
    projectSlug: "",
    featured: true,
    order: 2,
    status: "active",
  },
];

// -------------------------------------------------------------------- FAQs

export const starterFaqs: StarterFaq[] = [
  {
    question: "How do we start?",
    answer:
      "Send a short note about the project — what it is, roughly when you need it and what good looks like. If it fits, I reply with a proposal, a milestone plan and a price within two business days.",
    placements: ["home", "services", "contact"],
    order: 0,
    status: "active",
  },
  {
    question: "What does a project cost?",
    answer:
      "Each service page lists a starting price. The final number depends on the number of screens and how much research the work needs; you get a fixed figure before anything begins.",
    placements: ["services", "contact"],
    order: 1,
    status: "active",
  },
  {
    question: "Do you work with developers?",
    answer:
      "Always. Handover includes specs, assets and a walkthrough, and I stay available while the build happens so the result matches the design.",
    placements: ["home", "services"],
    order: 2,
    status: "active",
  },
  {
    question: "Can you redesign an existing product?",
    answer:
      "Yes — that is most of what I do. I start by testing what you already have, so the redesign fixes real problems rather than refreshing the surface.",
    placements: ["home", "services"],
    order: 3,
    status: "active",
  },
  {
    question: "What do you need from me?",
    answer:
      "Access to whoever knows the product best, any research or analytics you already hold, and one person who can approve work. That is enough to get going.",
    placements: ["contact"],
    order: 4,
    status: "active",
  },
];

// -------------------------------------------------------------------- Blog

const postSeeds: {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  minutes: number;
  days: number;
  content: string;
}[] = [
  {
    title: "Design handover that developers do not dread",
    slug: "design-handover-developers-dont-dread",
    excerpt:
      "Most handover problems are not missing specs — they are missing states. Here is the checklist I run before a file leaves my hands.",
    category: "Process",
    tags: ["handover", "design systems", "collaboration"],
    minutes: 6,
    days: 12,
    content: `A developer does not need a prettier file. They need to know what happens when the list is empty, when the request fails, and when somebody pastes four hundred characters into a field built for twenty.

## The checklist

1. **Every state drawn.** Empty, loading, error, partial, too much content. If it is not drawn, it will be invented.
2. **Spacing from a scale.** Four or eight, pick one. Arbitrary gaps turn into arbitrary code.
3. **Components named like code.** If the design calls it a chip and the codebase calls it a tag, one of you will rename it badly.
4. **Interaction notes beside the frame**, not in a separate document nobody opens.
5. **One source of truth for type and colour**, published as styles rather than described in a comment.

## Why it works

None of this is about discipline for its own sake. Each item removes a question that would otherwise arrive as a message at six in the evening, and every question answered in the file is a decision made by the person who thought about it longest.`,
  },
  {
    title: "Research you can run in a week",
    slug: "research-you-can-run-in-a-week",
    excerpt:
      "You do not need a quarter and a research team. Five interviews and one usability session will already change what you build next.",
    category: "UX Research",
    tags: ["research", "usability", "interviews"],
    minutes: 5,
    days: 34,
    content: `The most common reason teams skip research is that they picture the expensive version of it. The cheap version still works.

## A week that pays for itself

**Monday and Tuesday:** five interviews, thirty minutes each, with people who actually use the thing. Ask what they did last time, not what they would like.

**Wednesday:** one usability session on the current product, with three tasks and no hints.

**Thursday:** write up what blocked people, ranked by how often it happened and how badly it hurt.

**Friday:** turn the top three into design work.

## What you get

A list of problems with evidence attached. It is harder to argue with "four of five people could not find the invoice" than with a strong opinion, and that is the real output of research — not insight, but agreement.`,
  },
  {
    title: "Dark interfaces that stay readable",
    slug: "dark-interfaces-that-stay-readable",
    excerpt:
      "Pure black and pure white is the easy mistake. A dark interface needs a measured greyscale ramp and one accent that means something.",
    category: "UI Design",
    tags: ["dark mode", "accessibility", "colour"],
    minutes: 7,
    days: 61,
    content: `A dark interface is not a light one with the colours flipped. Contrast behaves differently, weight reads heavier, and saturated colour glows.

## Build a ramp, not a palette

Pick one near-black for the canvas and four or five greys above it. Body text sits around the middle of the ramp; headings go one step lighter; borders live at the bottom as hairlines. That alone gives a dark layout depth without a single shadow.

## Keep one accent

If white is the accent, then white means "this is the thing to do". Spend it on primary actions and the current state, and nowhere else. The moment three colours carry meaning, none of them do.

## Check the real numbers

Body text needs 4.5:1 against its own background, not against the darkest one in the file. Test on a phone at low brightness in daylight — the place where dark interfaces usually fail.`,
  },
];

export const starterPosts: StarterPost[] = postSeeds.map((post) => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  coverImage: { url: "", alt: "" },
  category: post.category,
  tags: post.tags,
  status: "published",
  publishAt: null,
  publishedAt: daysAgo(post.days),
  readingMinutes: post.minutes,
  seo: { title: "", description: post.excerpt, ogImage: "", noIndex: false },
  viewCount: Math.round(900 / (post.days + 6)) * 7,
}));

// ------------------------------------------------------------- Custom pages

export const starterPages: StarterPage[] = [
  {
    title: "Privacy policy",
    slug: "privacy",
    intro: "What this site stores about your visit, and what it does not.",
    content: `This site is run by Rakib Khan. It collects as little as it can.

## What is stored

When you open a page, the site records the page address, roughly where the request came from, the kind of device and browser, and how long the page was open. IP addresses are hashed before they are stored and the hash changes daily, so visits cannot be tied back to you.

There are no advertising cookies and no third-party trackers. A single identifier is kept in your browser's local storage so repeat visits are not counted twice; clearing site data removes it.

## The contact form

The name, email, company and message you send are stored so I can reply, along with the time and country of the request. Nothing is passed to a third party and nothing is used for marketing.

## Keeping and removing data

Visit records are kept for a year and then deleted. Contact messages are kept while the conversation is useful. Write to ${STARTER_EMAIL} to see or delete anything held about you.`,
    status: "published",
    showInFooter: true,
    publishedAt: monthsAgo(6),
    seo: { title: "Privacy policy", description: "What this site stores about your visit.", ogImage: "", noIndex: false },
  },
  {
    title: "Terms",
    slug: "terms",
    intro: "The short version of how project work runs.",
    content: `## Working together

Every project starts with a written scope, a milestone plan and a fixed price. Work begins once the first milestone is paid.

## Revisions

Each milestone includes two rounds of revisions. Anything beyond the agreed scope is quoted separately before it is started — there are no surprise invoices.

## Ownership

On final payment, the designs and the files behind them are yours, including the right to change them. I keep the right to show the work in this portfolio unless we agree otherwise in writing before launch.

## Timelines

Dates in the plan assume feedback within three working days. Longer gaps move the remaining milestones by the same amount.`,
    status: "published",
    showInFooter: true,
    publishedAt: monthsAgo(6),
    seo: { title: "Terms", description: "How project work runs.", ogImage: "", noIndex: false },
  },
];

// ------------------------------------------------------------------- Inbox

export const starterMessages: StarterMessage[] = [
  {
    name: "Nadia Islam",
    email: "nadia@brightlayer.io",
    subject: "SaaS dashboard redesign",
    message:
      "Hi Rakib — we run a scheduling tool for clinics and our dashboard has grown badly. Six years of features and no information architecture. Could you look at a redesign starting next month?",
    phone: "+8801711000111",
    address: "Dhaka, Bangladesh",
    status: "pending",
    read: false,
    readAt: null,
    repliedAt: null,
    notes: [],
    replies: [],
    meta: { country: "Bangladesh", userAgent: "Mozilla/5.0 (Macintosh)", spamScore: 0, visitorId: "" },
    createdAt: daysAgo(1),
  },
  {
    name: "Tom Whitfield",
    email: "tom@roofnest.fr",
    subject: "Thanks — and phase two",
    message:
      "The new site has been live for a month and enquiries now arrive with the job type already picked. We would like to talk about the customer portal next.",
    phone: "",
    address: "Lyon, France",
    status: "replied",
    read: true,
    readAt: daysAgo(9),
    repliedAt: daysAgo(9),
    notes: [{ body: "Phase two scoped at 6 weeks — proposal sent.", authorEmail: STARTER_EMAIL, createdAt: daysAgo(9) }],
    replies: [
      {
        body: "Glad to hear it, Tom. I have sent a scope for the portal — happy to walk through it this week.",
        sentBy: STARTER_EMAIL,
        sentAt: daysAgo(9),
      },
    ],
    meta: { country: "France", userAgent: "Mozilla/5.0 (Windows NT 10.0)", spamScore: 0, visitorId: "" },
    createdAt: daysAgo(10),
  },
  {
    name: "Amira Chowdhury",
    email: "amira@glamii.app",
    subject: "Brand refresh for the app",
    message:
      "We launched with the identity you designed and it has held up well. Now that we are on iOS as well, could you extend the system to cover the app store assets?",
    phone: "",
    address: "Chattogram, Bangladesh",
    status: "pending",
    read: true,
    readAt: daysAgo(3),
    repliedAt: null,
    notes: [{ body: "Small piece of work — quote as a two-week extension.", authorEmail: STARTER_EMAIL, createdAt: daysAgo(3) }],
    replies: [],
    meta: { country: "Bangladesh", userAgent: "Mozilla/5.0 (iPhone)", spamScore: 0, visitorId: "" },
    createdAt: daysAgo(4),
  },
];
