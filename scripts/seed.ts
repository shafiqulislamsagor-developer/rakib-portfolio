/**
 * Loads the starter portfolio into MongoDB — every section of the public site
 * plus a populated admin panel (inbox, analytics, audit log) and the owner
 * account you sign in with.
 *
 *   pnpm db:seed                      # dry run: prints exactly what would be replaced
 *   pnpm db:seed --yes                # do it
 *   pnpm db:seed --admin-only         # just create/reset the sign-in, no content changes
 *   pnpm db:seed --yes --password …   # choose the owner password instead of generating one
 *
 * This REPLACES the content collections (profile, settings, projects, posts,
 * skills, experience, education, services, testimonials, FAQs, pages, inbox
 * and analytics), after saving what was there to .content-backups/. Uploaded
 * media, sign-in history and the application secret are left alone.
 *
 * Everything it writes is then editable at /admin — the content in data/ is
 * only the starting point, and the site reads from the database, never from
 * these files (except as a fallback when MONGODB_URI is not set).
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { STARTER_EMAIL, STARTER_NAME } from "../src/data/starter";
import { loadEnv } from "./_env";

loadEnv();

const flag = (name: string) => process.argv.includes(`--${name}`);

/** Value of a `--name value` argument, if it was given. */
function option(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

/**
 * The first owner account. The password is generated unless one is supplied
 * (`--password …` or ADMIN_PASSWORD), so a seeded site never goes up with a
 * known default; it is printed once at the end of the run.
 */
const OWNER = {
  email: option("email") || process.env.ADMIN_EMAIL || STARTER_EMAIL,
  password: option("password") || process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url"),
  name: STARTER_NAME,
};

function iso(value: string | null) {
  return value ? new Date(value) : null;
}

/** Creates the owner account, or resets its password if it already exists. */
async function upsertOwner() {
  const models = await import("@/lib/db/models");
  const { hashPassword } = await import("@/lib/auth/password");
  // Hashed directly rather than through the admin CLI, so the starting
  // password is not held to the 12-character policy that applies in the panel.
  const passwordHash = await hashPassword(OWNER.password);
  const admin = await models.AdminUser.findOneAndUpdate(
    { email: OWNER.email },
    {
      $set: {
        email: OWNER.email,
        name: OWNER.name,
        passwordHash,
        role: "owner",
        active: true,
        passwordChangedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  // Changing a password always invalidates the existing sessions.
  await models.Session.deleteMany({ userId: admin._id });
  return admin;
}

async function main() {
  const confirmed = flag("yes") || flag("force");
  const adminOnly = flag("admin-only");

  if (adminOnly) {
    const { connectDB, disconnectDB } = await import("@/lib/db/connect");
    await connectDB();
    const admin = await upsertOwner();
    console.log(`\nAdmin ready: ${admin.email} / ${OWNER.password} (role: ${admin.role})`);
    console.log("No content was changed. Other sessions for this account were signed out.\n");
    await disconnectDB();
    return;
  }

  const { starterProfile, starterSettings } = await import("@/data/starter");
  const {
    starterEducation,
    starterExperience,
    starterFaqs,
    starterMessages,
    starterPages,
    starterPosts,
    starterProjects,
    starterServices,
    starterSkills,
    starterTestimonials,
  } = await import("@/data/starter-content");
  const { connectDB, disconnectDB } = await import("@/lib/db/connect");
  const models = await import("@/lib/db/models");

  await connectDB();

  // Collections this script owns: emptied and rebuilt from the starter dataset.
  const owned = [
    ["profile", models.Profile],
    ["settings", models.Settings],
    ["projects", models.Project],
    ["posts", models.Post],
    ["skills", models.Skill],
    ["experience", models.Experience],
    ["education", models.Education],
    ["services", models.Service],
    ["testimonials", models.Testimonial],
    ["faqs", models.Faq],
    ["pages", models.Page],
    ["messages (inbox)", models.Message],
    ["analytics (daily)", models.AnalyticsDaily],
    ["activity log", models.ActivityLog],
  ] as const;

  const existing = await Promise.all(
    owned.map(async ([label, model]) => [label, await (model as typeof models.Project).countDocuments()] as const)
  );
  const totalExisting = existing.reduce((sum, [, count]) => sum + count, 0);

  if (!confirmed) {
    console.log("\nDRY RUN — nothing has been changed.\n");
    console.log(`Database: ${process.env.MONGODB_DB || "(from the connection string, or rk_portfolio)"}`);
    console.log("\nThese collections would be emptied and replaced with the starter content:\n");
    console.table(Object.fromEntries(existing.map(([label, count]) => [label, { documentsNow: count }])));
    console.log(`Documents that would be deleted: ${totalExisting} (all of them saved to .content-backups/ first)`);
    console.log("\nLeft untouched: uploaded media, visitor log, sign-in history, error log, application secret.");
    console.log(`An admin account for ${OWNER.email} would be created (or have its password reset).`);
    console.log("\nRun it for real with:  pnpm db:seed --yes\n");
    await disconnectDB();
    return;
  }

  // Indexes first: unique slugs, TTLs and text search must exist before inserting.
  await Promise.all(
    [
      models.AdminUser, models.Session, models.LoginEvent, models.RateLimit, models.Profile, models.Settings,
      models.Project, models.Post, models.Skill, models.Experience, models.Education, models.Message,
      models.Media, models.ActivityLog, models.AnalyticsDaily, models.VisitorMark, models.ErrorEvent,
      models.Service, models.Testimonial, models.Faq, models.Page,
    ].map((model) => (model as typeof models.Project).createIndexes())
  );

  // Back up everything that is about to go, so seeding is reversible.
  if (totalExisting > 0) {
    const backup: Record<string, unknown[]> = {};
    for (const [label, model] of owned) {
      const docs = await (model as typeof models.Project).find({}).lean();
      if (docs.length) backup[label] = docs;
    }
    const dir = resolve(process.cwd(), ".content-backups");
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, `before-seed-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`\nBacked up ${totalExisting} document(s) to ${file}`);
  }

  for (const [, model] of owned) await (model as typeof models.Project).deleteMany({});

  // Counters left from before the reseed would throttle the fresh inbox and
  // sign-in for the rest of their window, so a full seed clears them too.
  await models.RateLimit.deleteMany({});

  const summary: Record<string, number> = {};
  const count = (label: string, value: number) => {
    summary[label] = value;
  };

  await models.Profile.create({ key: "main", ...starterProfile, cv: { ...starterProfile.cv, updatedAt: iso(starterProfile.cv.updatedAt) } });
  count("profile", 1);

  await models.Settings.create({ key: "main", ...starterSettings });
  count("settings", 1);

  const projects = await models.Project.insertMany(
    starterProjects.map((project) => ({ ...project, publishedAt: iso(project.publishedAt) }))
  );
  count("projects", projects.length);

  const posts = await models.Post.insertMany(
    starterPosts.map((post) => ({ ...post, publishAt: iso(post.publishAt), publishedAt: iso(post.publishedAt) }))
  );
  count("posts", posts.length);

  count("skills", (await models.Skill.insertMany(starterSkills)).length);

  count(
    "experience",
    (
      await models.Experience.insertMany(
        starterExperience.map((job) => ({
          ...job,
          startDate: new Date(job.startDate),
          endDate: iso(job.endDate),
          progression: job.progression.map((step) => ({ ...step, startDate: new Date(step.startDate), endDate: iso(step.endDate) })),
        }))
      )
    ).length
  );

  count(
    "education",
    (await models.Education.insertMany(starterEducation.map((item) => ({ ...item, startDate: iso(item.startDate), endDate: iso(item.endDate) })))).length
  );

  count("services", (await models.Service.insertMany(starterServices)).length);
  count("testimonials", (await models.Testimonial.insertMany(starterTestimonials)).length);
  count("faqs", (await models.Faq.insertMany(starterFaqs)).length);
  count("pages", (await models.Page.insertMany(starterPages.map((page) => ({ ...page, publishedAt: iso(page.publishedAt) })))).length);

  const messages = await models.Message.insertMany(
    starterMessages.map((message) => ({
      ...message,
      readAt: iso(message.readAt),
      repliedAt: iso(message.repliedAt),
      notes: message.notes.map((note) => ({ ...note, createdAt: new Date(note.createdAt) })),
      replies: message.replies.map((reply) => ({ ...reply, sentAt: new Date(reply.sentAt) })),
    }))
  );
  // Mongoose's timestamps overwrite `createdAt` on insert, so backdate the
  // inbox afterwards through the driver to spread it over the last month.
  await models.Message.collection.bulkWrite(
    messages.map((doc, index) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { createdAt: new Date(starterMessages[index].createdAt), updatedAt: new Date(starterMessages[index].createdAt) } },
      },
    }))
  );
  count("messages", messages.length);

  // ----- Analytics, so the dashboard and reports are not an empty state -----
  const analytics = buildAnalytics(
    projects.map((project) => project.slug),
    posts.filter((post) => post.status === "published").map((post) => post.slug)
  );
  count("analytics rows", (await models.AnalyticsDaily.insertMany(analytics)).length);

  // ----- Owner account -----
  const admin = await upsertOwner();
  count("admin accounts", 1);

  count(
    "activity log",
    (
      await models.ActivityLog.insertMany(
        [
          { action: "site.seed", entityType: "settings", summary: "Loaded the starter content" },
          { action: "settings.update", entityType: "settings", summary: "Updated website settings (colour theme: Violet)" },
          { action: "project.create", entityType: "project", summary: "Created “Cobalt POS — restaurant operations dashboard”" },
          { action: "post.publish", entityType: "post", summary: "Published “A performance budget that survives the deadline”" },
          { action: "testimonial.create", entityType: "testimonial", summary: "Added a testimonial from Farhana Chowdhury" },
        ].map((entry) => ({ ...entry, actorId: admin._id, actorEmail: OWNER.email, ip: "127.0.0.1" }))
      )
    ).length
  );

  console.log("\nStarter content loaded.\n");
  console.table(summary);
  console.log(`\nSign in at /admin/login — ${OWNER.email} / ${OWNER.password}`);
  console.log("This password is shown once: save it now, or change it under Admin → System.");
  console.log("Then set your public website address, favicon and analytics time zone under Admin → Settings.\n");

  await disconnectDB();
}

/**
 * Plausible daily aggregates for the last 150 days: a slow upward trend, a
 * weekday/weekend rhythm and a little noise, so the charts look like a real
 * site rather than a straight line.
 */
function buildAnalytics(projectSlugs: string[], postSlugs: string[]) {
  const rows: { day: string; metric: string; key: string; count: number }[] = [];
  const today = new Date();
  const referrers = [
    ["google.com", 0.34],
    ["linkedin.com", 0.18],
    ["github.com", 0.11],
    ["news.ycombinator.com", 0.08],
    ["x.com", 0.07],
    ["bing.com", 0.04],
  ] as const;
  const countries = [
    ["BD", 0.28],
    ["US", 0.17],
    ["IN", 0.12],
    ["GB", 0.09],
    ["DE", 0.07],
    ["AE", 0.06],
    ["SE", 0.04],
    ["CA", 0.04],
  ] as const;

  // Deterministic pseudo-random, so re-running produces the same numbers.
  let seed = 20_260_418;
  const random = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed / 2_147_483_648;
  };

  for (let back = 149; back >= 0; back--) {
    const date = new Date(today.getTime() - back * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    const weekday = date.getUTCDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.62 : 1;
    const growth = 0.55 + (149 - back) / 149; // roughly triples across the window
    const pageviews = Math.max(8, Math.round((38 + random() * 46) * weekendDip * growth));
    const visitors = Math.max(5, Math.round(pageviews * (0.52 + random() * 0.12)));

    rows.push({ day, metric: "pageview", key: "", count: pageviews });
    rows.push({ day, metric: "visitor", key: "", count: visitors });

    const downloads = random() < 0.55 ? Math.round(random() * 4) : 0;
    if (downloads) rows.push({ day, metric: "cv_download", key: "", count: downloads });

    const submits = random() < 0.22 ? 1 : 0;
    if (submits) rows.push({ day, metric: "contact_submit", key: "", count: submits });

    // Spread a share of the day's views across individual projects and posts.
    let remaining = Math.round(pageviews * 0.45);
    for (const slug of projectSlugs) {
      if (remaining <= 0) break;
      const share = Math.round(remaining * (0.18 + random() * 0.22));
      if (share > 0) {
        rows.push({ day, metric: "project_view", key: slug, count: share });
        remaining -= share;
      }
    }
    remaining = Math.round(pageviews * 0.3);
    for (const slug of postSlugs) {
      if (remaining <= 0) break;
      const share = Math.round(remaining * (0.2 + random() * 0.3));
      if (share > 0) {
        rows.push({ day, metric: "post_view", key: slug, count: share });
        remaining -= share;
      }
    }

    for (const [host, weight] of referrers) {
      const value = Math.round(visitors * weight * (0.7 + random() * 0.6));
      if (value > 0) rows.push({ day, metric: "referrer", key: host, count: value });
    }
    for (const [code, weight] of countries) {
      const value = Math.round(visitors * weight * (0.7 + random() * 0.6));
      if (value > 0) rows.push({ day, metric: "country", key: code, count: value });
    }
  }
  return rows;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
