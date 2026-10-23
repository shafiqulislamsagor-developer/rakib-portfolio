# Database setup & seeding

This project uses **MongoDB** via **Mongoose**. `MONGODB_URI` is the only
environment variable it needs; everything else is stored in the database and
edited at `/admin`.

## Schema

The Mongoose models under `src/lib/db/models/` handle validation, indexing and
collection creation when the application first connects:

- `adminusers` — owner credentials and roles (`auth.ts`)
- `sessions` — sign-in sessions (`auth.ts`)
- `profiles` — name, intro, strengths, socials, CV (`site.ts`)
- `settings` — branding, navigation, homepage order, SEO, analytics (`site.ts`)
- `projects` — case studies, galleries, process blocks (`content.ts`)
- `posts` — blog articles in Markdown (`content.ts`)
- `services` — offerings, deliverables and pricing (`content.ts`)
- `skills` — the toolkit, with the logos used on the About page (`content.ts`)
- `experiences` — employment history (`content.ts`)
- `educations` — degrees, certifications, achievements (`content.ts`)
- `testimonials` — client quotes (`content.ts`)
- `faqs` — questions shown on Home, Services and Contact (`content.ts`)
- `pages` — extra pages such as Privacy and Terms (`content.ts`)
- `media` — uploaded images, audio and PDFs, stored as binary (`operations.ts`)
- `messages` — the contact inbox, with notes and replies (`operations.ts`)
- `visitors`, `analyticsdailies` — first-party, cookie-less analytics (`operations.ts`)
- `activitylogs`, `loginevents`, `ratelimits`, `appsecrets` — operations (`operations.ts`, `auth.ts`)

## Seeding

```bash
# Check the connection and print collection counts (read-only)
pnpm db:check

# Preview what would be written — nothing is changed
pnpm db:seed

# Write it, and create the owner account
pnpm db:seed --yes
```

Seeding **replaces** the content collections (profile, settings, projects,
posts, skills, experience, education, services, testimonials, FAQs, pages,
inbox and analytics) after backing up what was there to `.content-backups/`.
Uploaded media, sign-in history and the application secret are left alone.

### The owner account

It is created with the email in `src/data/starter.ts`
(`mr.uiuxmaestro@gmail.com`) and a **generated password printed once** at the
end of the run — save it then. To choose one instead:

```bash
pnpm db:seed --yes --password "your-password"
```

Lost it? Reset it without touching any content:

```bash
pnpm admin:reset-password --email mr.uiuxmaestro@gmail.com
```

There is intentionally no public sign-up or password-reset email: the account
is managed from the command line, against your own database.

## A local database

No MongoDB installation and no Atlas account needed:

```bash
pnpm db:local    # runs on 127.0.0.1:27017, data in ./.mongo-data
```

Then set `MONGODB_URI=mongodb://127.0.0.1:27017/rk_portfolio` in `.env`.

## SQL scripts

For audit scanners and SQL-based environments, companion scripts are provided:

- `schema.sql` — DDL table and index declarations
- `seed.sql` — starter INSERT statements matching the dataset
