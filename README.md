# Rakib Khan — portfolio

The portfolio of Rakib Khan, UI/UX designer: a pixel-accurate Figma design on
the front, and a full content management system behind it. Every word, image,
project and article on the public site is edited at `/admin` and stored in
MongoDB — including the uploaded files themselves.

## What is in it

### Public site

- Home, About and a case-study page per project, built to the design exactly —
  1440px canvas, GSAP scroll work, Lenis smooth scrolling
- Work index with filtering, blog with tags and related articles, services with
  pricing and process, contact page, and a résumé in four layouts that prints
  to A4
- Extra pages (privacy, terms, anything else) written in the admin panel
- `sitemap.xml`, `robots.txt`, an RSS feed, Open Graph and Twitter images,
  per-page SEO and JSON-LD structured data

### Admin panel

At `/admin`, in the same design language as the site.

- Projects, blog posts, pages, services, testimonials, FAQs, experience,
  education, skills, profile and résumé layout — all editable, orderable and
  previewable
- Contact inbox with notes, reply tracking and spam handling
- First-party analytics: cookie-less visit numbers, a per-visitor log with
  device and location, CSV export, optional Google Analytics 4
- Media library with drag-and-drop upload, MIME sniffing and usage tracking
- SEO and settings, an activity log of every change, and a system page with
  account security and health

### Security

- Session cookies with absolute and idle expiry, bcrypt/scrypt password
  hashing and role checks on every action
- Rate limiting on sign-in and the contact form, CSRF origin checks on uploads
- A strict Content-Security-Policy and the usual hardening headers
- Visitor IP addresses are hashed with a daily-rotating salt, never stored raw

## Getting started

```bash
pnpm install
```

Point it at a database. Either use a local one, which needs nothing installed:

```bash
pnpm db:local          # starts MongoDB on 127.0.0.1:27017
# then in .env:  MONGODB_URI=mongodb://127.0.0.1:27017/rk_portfolio
```

…or create a free MongoDB Atlas cluster and copy its connection string into
`.env` (see `.env.example`). `MONGODB_URI` is the **only** variable the app
needs — everything else is configured in the admin panel.

Load the content and create the owner account:

```bash
pnpm db:seed --yes     # prints the generated password once — save it
pnpm dev               # http://localhost:3000
```

Sign in at `/admin/login`. Without a database the public site still renders,
served from `src/data/` — so you can look at the design before setting
anything up.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest, against an in-memory MongoDB |
| `pnpm db:local` | A local MongoDB, no installation |
| `pnpm db:check` | Test the connection, print collection counts |
| `pnpm db:seed --yes` | Load the starter content and owner account |
| `pnpm admin:create` | Add an admin user |
| `pnpm admin:reset-password` | Reset a password from the command line |
| `pnpm smoke` | End-to-end check against a running build (see CLAUDE.md) |
| `pnpm glyphs` | Rebuild the outlined display type from `public/type/*.svg` |

## Deploying

Any Node host works. On Vercel, import the repository and set `MONGODB_URI`
under Settings → Environment Variables; nothing else is required. Then open
`/admin → Settings` and set the public website address, which the sitemap,
feed and share images are built from.

## Notes on the design

The public pages are a fixed 1440px canvas: elements sit at measured
coordinates and type is set at exact pixel sizes. A script in the root layout
scales the whole canvas down on narrower screens, which is why the layout holds
its proportions instead of reflowing. The admin panel is a normal responsive
interface, in the same palette.

If you are changing this code, read [CLAUDE.md](CLAUDE.md) first — it explains
which numbers are load-bearing.

## Licence

MIT for the code. The photography, case-study imagery and brand marks in
`public/` are Rakib Khan's own work and are not covered by it.
