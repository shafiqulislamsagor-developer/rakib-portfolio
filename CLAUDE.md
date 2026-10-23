@AGENTS.md

# CLAUDE.md — Architecture & development guidelines

Conventions, architecture map and command reference for this codebase.

---

## 1. What this project is

The portfolio of **Rakib Khan**, UI/UX designer. Two things are true at once,
and most decisions here follow from them:

1. **The design is fixed.** Every public page is a 1440px canvas taken from
   Figma: elements sit at measured coordinates, type is set in Segoe UI at
   exact pixel sizes, and the palette is ink `#020202` with a grey ramp and
   white as the only accent. A boot script in the root layout scales the canvas
   down on narrower screens (`zoom = viewport / 1440`), so a "670px card" is
   really ~47vw. **Do not** convert these values to responsive utilities or
   round them to Tailwind's scale — the layout depends on them.
2. **All of the content is editable.** Nothing readable is hard-coded in a
   page. Text, images, projects, posts, services and the rest come from
   MongoDB and are edited at `/admin`.

The admin panel follows the same design language as the public site: the same
ink canvas, the "`/     Label`" eyebrows, 4px corners, hairline borders and
white as the one accent.

### Tech stack

- **Framework**: Next.js 16 (App Router, React Server Components, Server Actions)
- **UI**: React 19, Tailwind CSS v4, Radix primitives, Lucide icons
- **Motion**: GSAP + ScrollTrigger, Lenis smooth scrolling
- **Language**: TypeScript (strict)
- **Database & storage**: MongoDB (Mongoose), with images, audio and documents
  stored as binary in the database itself
- **Forms & validation**: React Hook Form + Zod
- **Testing**: Vitest with an in-memory MongoDB

---

## 2. Directory map

```
src/
├── app/
│   ├── (site)/                  # Public pages — the design lives here
│   │   ├── page.tsx             #   home
│   │   ├── about/               #   about
│   │   ├── projects/            #   work index + [slug] case study
│   │   ├── blog/                #   article list + [slug]
│   │   ├── services/            #   services, process, FAQ
│   │   ├── contact/             #   contact details + form
│   │   ├── resume/              #   résumé, four layouts, print to A4
│   │   ├── [slug]/              #   pages written in the admin (privacy, terms…)
│   │   └── upload/              #   "Launch project" studio (design demo, no backend)
│   ├── admin/
│   │   ├── (panel)/             # The CMS: one folder per section
│   │   ├── _actions/            # Server Actions for every admin mutation
│   │   └── _components/         # Panel shell, data tables, form fields
│   ├── api/
│   │   ├── admin/               # Authenticated APIs (upload, media, exports)
│   │   ├── health/              # Health check
│   │   └── track/               # Anonymous visitor beacon
│   ├── media/[id]/[name]/       # Media served from MongoDB, with HTTP 206 ranges
│   ├── globals.css              # The design: tokens, trim, hover states, motion
│   └── panel.css                # Semantic tokens for the panel, prose, print
├── components/
│   ├── kit.tsx                  # Design primitives: OutlineButton, Eyebrow, DiscLink…
│   ├── home/ about/ project/    # The drawn sections, one file per block
│   ├── sections/                # Shared blocks: Nav, Contact, Footer, Testimonials…
│   ├── motion/                  # SmoothScroll, Reveals, SvgType (outlined display type)
│   └── ui/                      # Radix primitives, restyled to the design
├── data/
│   ├── glyphs.ts                # Outlined display type, generated from public/type/*.svg
│   ├── starter.ts               # Profile + settings the site ships with
│   ├── starter-content.ts       # Projects, posts, services, testimonials, FAQs…
│   └── defaults.ts              # The same content, served when there is no database
├── lib/
│   ├── design.ts                # Where the design's fixed slots meet the content
│   ├── chrome.ts                # Nav and footer props, shared by every page
│   ├── admin/ auth/ security/   # Action wrappers, sessions, rate limiting, CSRF
│   ├── db/models/               # Mongoose schemas
│   ├── content/                 # Read-only queries for the public site
│   ├── services/ analytics/     # Business logic, first-party visitor analytics
│   ├── storage/ validation/     # MIME sniffing, Zod schemas
│   ├── gsap.ts figma.ts         # Motion setup; Figma gradient → CSS
│   └── theme.ts                 # Legacy preset data, kept for the stored field
├── proxy.ts                     # Edge guard for /admin (Next 16 proxy convention)
└── types/content.ts             # Serialized shapes passed to components
```

---

## 3. Commands

```bash
pnpm dev                   # http://localhost:3000
pnpm build                 # production build
pnpm start                 # run the production build

pnpm typecheck             # tsc --noEmit
pnpm lint                  # eslint
pnpm test                  # vitest (in-memory MongoDB)

pnpm db:local              # a local MongoDB on 127.0.0.1:27017, no install needed
pnpm db:check              # test the connection, print collection counts
pnpm db:seed               # dry run: print what would be replaced
pnpm db:seed --yes         # load the starter content and create the owner account
pnpm admin:create          # add an admin user
pnpm admin:reset-password  # reset one

pnpm glyphs                # rebuild src/data/glyphs.ts from public/type/*.svg
```

### End-to-end smoke test

`pnpm test` covers the units; `scripts/smoke.mjs` drives a running production
build the way a browser does — including the real Server Actions, so it covers
publishing, slug redirects, revalidation, uploads, the inbox and the audit log.

```bash
pnpm db:local &                      # a database to work against
pnpm db:seed --yes --password secret123
NEXT_DIST_DIR=.next-verify pnpm build
NEXT_DIST_DIR=.next-verify pnpm start -- -p 3125 &

BASE_URL=http://127.0.0.1:3125 NEXT_DIST_DIR=.next-verify \
  SMOKE_EMAIL=mr.uiuxmaestro@gmail.com SMOKE_PASSWORD=secret123 \
  SMOKE_WRITE=1 pnpm smoke
```

Without `SMOKE_WRITE=1` it only reads. With it, the suite creates and then
removes its own test data. Reseed before a repeat run: the contact form is rate
limited per email, and a full seed clears those counters.


---

## 4. Conventions

### The design is the specification

- Pixel values, offsets and the hard-coded section heights come from Figma.
  Changing one moves the artwork; if a section has to grow, derive its height
  from the data (as `Process` and `WhyConsider` do) rather than guessing.
- `globals.css` holds the design: the colour ramp (`ink`, `g1`–`g6`, `paper`,
  `mist`), the Figma easing curves, the `.trim` cap-height utility, every hover
  state taken from the prototype, and the motion bootstrapping.
- `html.motion` is set before first paint when the visitor has not asked for
  reduced motion. Without it the page renders the static design exactly, so
  every animated component must check `motionEnabled()` before it animates.
- Outlined display type (the name, "WORK", "ABOUT") is real SVG artwork in
  `data/glyphs.ts`, split into one `<g data-glyph>` per letter so letters can
  be animated individually.

### Content never lives in a component

- Public pages read through `lib/content/public` and pass plain props down. A
  component in `components/home`, `about`, `project` or `sections` takes its
  text and images as props and knows nothing about the database.
- `lib/design.ts` is the single place where "this design slot" meets "this
  content field". Fixed geometry — card positions, the six tool discs, the
  three nav previews — is declared there, next to the mapping that fills it.
- Without `MONGODB_URI` the site serves `data/defaults.ts`, which is the same
  content the seeder writes. The design therefore renders identically with or
  without a database.

### Server Actions & security

- Every mutating action in `app/admin/_actions/` must be wrapped with
  `adminAction()` from `@/lib/admin/action`, which guarantees authentication
  and the admin role (`requireAdmin()`), a live database connection, context
  logging (actor, IP) and error catching that cannot leak database internals.
- All input is validated with the Zod schemas in `lib/validation/`.
- Never trust a client-provided file type: uploads are checked by binary
  magic-byte sniffing (`sniffMimeType` in `lib/storage/index.ts`).

### Media & audio

- Files live in the MongoDB `Media` collection as binary.
- `app/media/[id]/[name]/route.ts` serves them with `Accept-Ranges: bytes` and
  HTTP 206 Partial Content, which is what makes audio and video play natively
  in Safari, iOS and Chrome.

---

## 5. Environment

`MONGODB_URI` is the only variable the app needs. Everything else — the public
site URL, favicon, logo, Google Analytics ID, Search Console verification and
the analytics time zone — is stored in the database and edited at `/admin`. The
HMAC secret used for IP hashes is generated on first run and stored there too.

See `.env.example` for the optional overrides.
