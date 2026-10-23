/**
 * End-to-end smoke test against a running production build.
 *
 * It drives the real Server Actions, so it covers the write path too:
 * publishing, slug redirects, revalidation, uploads, the inbox and the
 * audit log. SMOKE_WRITE=1 enables those; it creates and removes its own data.
 *
 *   BASE_URL=http://localhost:3100 SMOKE_EMAIL=… SMOKE_PASSWORD=… node scripts/smoke.mjs
 *
 * Signs in through the real login Server Action, then checks public pages,
 * every admin page, authorization boundaries, tracking, CV downloads,
 * uploads and security headers. Exits non-zero on any failure.
 */
import { readFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";

/** A real (decodable) RGB PNG of the given size. */
function makePng(width, height) {
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x8b)]);
  const pixels = deflateSync(Buffer.concat(Array.from({ length: height }, () => row)));
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", header), chunk("IDAT", pixels), chunk("IEND", Buffer.alloc(0))]));
}

const BASE = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const EMAIL = process.env.SMOKE_EMAIL;
const PASSWORD = process.env.SMOKE_PASSWORD;
const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(path, init = {}) {
  return fetch(BASE + path, { redirect: "manual", ...init, headers: { "User-Agent": "Mozilla/5.0 SmokeTest Chrome/130", ...(init.headers ?? {}) } });
}

function findActionId(name) {
  const manifest = JSON.parse(readFileSync(`${process.env.NEXT_DIST_DIR || ".next"}/server/server-reference-manifest.json`, "utf8"));
  for (const [id, entry] of Object.entries(manifest.node ?? {})) {
    if (entry.exportedName === name && Object.keys(entry.workers ?? {}).some((worker) => worker.includes("admin/login"))) return id;
  }
  for (const [id, entry] of Object.entries(manifest.node ?? {})) if (entry.exportedName === name) return id;
  throw new Error(`Server action ${name} not found in manifest`);
}

async function login(email, password) {
  return request("/admin/login", {
    method: "POST",
    headers: {
      "Next-Action": findActionId("login"),
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      Origin: BASE,
    },
    body: JSON.stringify([{ email, password, next: "/admin" }]),
  });
}

async function main() {
  // ---------- Public site
  // Assertions are deliberately content-agnostic: whatever is in the database
  // (the starter content or whatever the owner has replaced it with), the
  // structure below has to hold.
  const sitemapXml = await (await request("/sitemap.xml")).text();
  const firstProjectPath = /<loc>[^<]*(\/projects\/[a-z0-9-]+)<\/loc>/.exec(sitemapXml)?.[1];
  check("Sitemap contains at least one project", Boolean(firstProjectPath), firstProjectPath ?? "none");

  for (const path of ["/", "/about", "/services", "/contact", "/resume", "/projects", firstProjectPath, "/blog", "/feed.xml", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/opengraph-image", "/api/health"]) {
    if (!path) continue;
    const response = await request(path);
    check(`GET ${path}`, response.status === 200, String(response.status));
  }
  const home = await (await request("/")).text();
  check("Home includes Person JSON-LD", home.includes('"@type":"Person"'));
  // The name in the structured data must also be rendered somewhere on the page.
  const personName = /"@type":"Person","name":"([^"]+)"/.exec(home)?.[1];
  check("Home renders the owner's name", Boolean(personName) && home.includes(personName), personName ?? "no name in JSON-LD");
  check("Home renders a hero heading", /<h1[\s>]/.test(home));
  const robots = await (await request("/robots.txt")).text();
  check("robots.txt disallows /admin", robots.includes("Disallow: /admin"));
  check("Sitemap lists projects but not admin", sitemapXml.includes("/projects/") && !sitemapXml.includes("/admin"));
  const services = await (await request("/services")).text();
  check("Services page has FAQ structured data", services.includes('"@type":"FAQPage"'));
  check("Services page has ProfessionalService structured data", services.includes('"@type":"ProfessionalService"'));
  check("Homepage shows the work section", home.includes('id="work"'));
  const resume = await (await request("/resume")).text();
  check("Résumé renders its sections", resume.includes("Experience") && resume.includes("Skills"));
  check("Unknown custom page is not public", (await request("/definitely-not-a-page")).status === 404);
  check("Sitemap includes the new pages", sitemapXml.includes("/about") && sitemapXml.includes("/services") && sitemapXml.includes("/resume"));
  const missing = await request("/projects/definitely-not-a-project");
  check("Unknown project returns 404", missing.status === 404, String(missing.status));

  const headers = (await request("/")).headers;
  for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"]) {
    check(`Security header ${header}`, Boolean(headers.get(header)));
  }
  check("No X-Powered-By header", !headers.get("x-powered-by"));

  // ---------- Authorization boundaries (no session)
  const adminRedirect = await request("/admin/projects");
  check("Anonymous /admin/* redirects to login", [307, 308].includes(adminRedirect.status) && (adminRedirect.headers.get("location") ?? "").includes("/admin/login"));
  check("Admin responses are noindex", (adminRedirect.headers.get("x-robots-tag") ?? "").includes("noindex"));
  for (const path of ["/api/admin/media", "/api/admin/analytics/export"]) {
    const response = await request(path);
    check(`Anonymous GET ${path} → 401`, response.status === 401, String(response.status));
  }
  const forged = await request("/admin", { headers: { Cookie: "__Host-portfolio_admin=forged-token; portfolio_admin=forged-token" } });
  check("Forged session cookie is rejected", [307, 308].includes(forged.status), String(forged.status));
  const forgedApi = await request("/api/admin/media", { headers: { Cookie: "__Host-portfolio_admin=forged-token; portfolio_admin=forged-token" } });
  check("Forged cookie on admin API → 401", forgedApi.status === 401, String(forgedApi.status));
  const uploadAnon = await request("/api/admin/upload", { method: "POST", body: new FormData() });
  check("Anonymous upload → 401", uploadAnon.status === 401, String(uploadAnon.status));

  // ---------- Login
  const bad = await login(EMAIL, "definitely-wrong-password-1");
  const badText = await bad.text();
  check("Wrong password does not set a session", !(bad.headers.get("set-cookie") ?? "").includes("portfolio_admin="));
  check("Wrong password returns generic error", badText.includes("Invalid email or password"));

  const good = await login(EMAIL, PASSWORD);
  const setCookie = good.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  check("Valid login sets session cookie", cookie.includes("portfolio_admin="), setCookie.slice(0, 40));
  check("Session cookie is HttpOnly", /httponly/i.test(setCookie));
  check("Session cookie is SameSite=Lax", /samesite=lax/i.test(setCookie));
  check("Session cookie is Secure in production", /secure/i.test(setCookie));
  if (!cookie) throw new Error("Login failed; cannot continue");
  const authed = (path, init = {}) => request(path, { ...init, headers: { Cookie: cookie, ...(init.headers ?? {}) } });
  authed.cookie = cookie;

  // ---------- Every admin page renders for a signed-in admin
  const adminPages = [
    "/admin",
    "/admin?range=7d",
    "/admin/analytics",
    "/admin/analytics?range=90d&granularity=week",
    "/admin/profile",
    "/admin/projects",
    "/admin/projects?status=published&q=roofnest",
    "/admin/projects/new",
    "/admin/blog",
    "/admin/blog/new",
    "/admin/skills",
    "/admin/experience",
    "/admin/experience/new",
    "/admin/education",
    "/admin/education/new",
    "/admin/media",
    "/admin/messages",
    "/admin/messages?view=spam",
    "/admin/seo",
    "/admin/settings",
    "/admin/system",
    "/admin/activity",
    "/admin/search?q=figma",
    "/admin/services",
    "/admin/services/new",
    "/admin/testimonials",
    "/admin/testimonials/new",
    "/admin/faqs",
    "/admin/faqs/new",
    "/admin/pages",
    "/admin/pages/new",
  ];
  for (const path of adminPages) {
    const response = await authed(path);
    check(`Admin ${path}`, response.status === 200, String(response.status));
  }
  const projectsHtml = await (await authed("/admin/projects")).text();
  const editMatch = projectsHtml.match(/\/admin\/projects\/([a-f0-9]{24})/);
  check("Projects list links to seeded project", Boolean(editMatch));
  if (editMatch) {
    const edit = await authed(`/admin/projects/${editMatch[1]}`);
    check("Project editor renders", edit.status === 200, String(edit.status));
  }
  /*
   * The panel streams its shell (it has a loading.tsx), so the status is
   * already committed by the time the page segment calls notFound(): the
   * admin shows the not-found screen with a 200. Public routes, which do not
   * stream a shell, return a real 404 — checked above.
   */
  const badId = await authed("/admin/projects/not-an-id");
  const badIdHtml = await badId.text();
  check("Invalid project id shows the not-found screen", /Error 404/.test(badIdHtml), String(badId.status));

  // ---------- Upload guards (nothing is stored by these checks)
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
  form.append("accept", "image");
  const noOrigin = await authed("/api/admin/upload", { method: "POST", body: form });
  check("Upload without matching Origin → 403 (CSRF)", noOrigin.status === 403, String(noOrigin.status));
  const svgForm = new FormData();
  svgForm.append("file", new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: "image/svg+xml" }), "x.svg");
  const svg = await authed("/api/admin/upload", { method: "POST", body: svgForm, headers: { Origin: BASE } });
  check("SVG upload rejected", svg.status === 400, String(svg.status));

  // ---------- Analytics beacon, CV download, export
  const beacon = await request("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify({ path: "/projects/roofnest", referrer: "https://www.google.com/", landing: true }),
  });
  check("Tracking beacon accepted", beacon.status === 204, String(beacon.status));
  const bot = await fetch(BASE + "/api/track", { method: "POST", headers: { "User-Agent": "Googlebot/2.1", "Content-Type": "application/json" }, body: JSON.stringify({ path: "/" }) });
  check("Bot beacon ignored quietly", bot.status === 204);
  const cv = await request("/cv");
  check("CV route redirects to the file", cv.status === 302 && (cv.headers.get("location") ?? "").includes(".pdf"), cv.headers.get("location") ?? "");
  const csv = await authed("/api/admin/analytics/export?range=7d");
  const csvText = await csv.text();
  check("CSV export works", csv.status === 200 && csvText.startsWith('"day","metric"'), csvText.split("\n")[0]);
  check("CSV contains the tracked project view", csvText.includes("project_view") && csvText.includes("cv_download"));

  const dashboard = await (await authed("/admin")).text();
  check("Dashboard shows real counts (5 seeded projects)", dashboard.includes("5 / 5") || dashboard.includes("5<!-- --> / <!-- -->5"));

  if (process.env.SMOKE_WRITE === "1") await writeChecks(authed);

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

/** Invoke a Server Action the way the browser does. Returns the raw RSC response text. */
async function callAction(name, args, { cookie, page = "/admin" } = {}) {
  const response = await request(page, {
    method: "POST",
    headers: {
      "Next-Action": findActionId(name),
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      Origin: BASE,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(args),
  });
  return { status: response.status, text: await response.text(), headers: response.headers };
}

const ok = (text) => text.includes('"ok":true');
const idFrom = (text) => text.match(/"id":"([a-f0-9]{24})"/)?.[1];

/** Write-path checks (opt-in: SMOKE_WRITE=1). Creates and then removes its own test data. */
async function writeChecks(authed) {
  const sessionCookie = authed.cookie;
  const project = {
    title: "E2E Test Project",
    slug: "e2e-test-project",
    summary: "Created by the end-to-end smoke test to verify publishing.",
    content: "## Challenge\n\nVerifying **markdown** <script>alert(1)</script> rendering.",
    category: "Testing",
    technologies: ["Playwright-free", "Fetch"],
    role: "Tester",
    client: "",
    year: "2026",
    thumbnail: { url: "/images/work/roofnest.webp", alt: "Thumb" },
    cover: { url: "", alt: "" },
    gallery: [],
    process: { body: "", images: [] },
    fullPreview: { url: "", alt: "" },
    liveUrl: "https://example.com",
    repoUrl: "",
    featured: true,
    order: 0,
    status: "published",
    seo: { title: "", description: "", ogImage: "", noIndex: false },
  };

  // Anonymous callers cannot run admin actions.
  const anon = await callAction("saveProject", [null, project]);
  check("Anonymous saveProject is refused", !ok(anon.text), String(anon.status));
  check("Anonymous action created nothing", (await request("/projects/e2e-test-project")).status === 404);

  // Validation runs on the server too.
  const invalid = await callAction("saveProject", [null, { ...project, liveUrl: "javascript:alert(1)" }], { cookie: sessionCookie });
  check("Server rejects javascript: URLs", invalid.text.includes('"ok":false') && invalid.text.includes("liveUrl"));

  const created = await callAction("saveProject", [null, project], { cookie: sessionCookie });
  const projectId = idFrom(created.text);
  check("saveProject creates a project", ok(created.text) && Boolean(projectId));
  const duplicateSlug = await callAction("saveProject", [null, { ...project, title: "Other" }], { cookie: sessionCookie });
  check("Duplicate slug is rejected", duplicateSlug.text.includes("slug"));

  const live = await request("/projects/e2e-test-project");
  const liveHtml = await live.text();
  check("Published project is live immediately (revalidated)", live.status === 200 && liveHtml.includes("E2E Test Project"));
  check("Markdown renders without executing raw HTML", liveHtml.includes("<strong>markdown</strong>") && !liveHtml.includes("<script>alert(1)</script>"));
  check("New featured project appears on the homepage", (await (await request("/")).text()).includes("E2E Test Project"));

  const renamed = await callAction("saveProject", [projectId, { ...project, slug: "e2e-test-project-renamed" }], { cookie: sessionCookie });
  check("Slug change saves", ok(renamed.text));
  const redirect = await request("/projects/e2e-test-project");
  check("Old slug permanently redirects", redirect.status === 308 && (redirect.headers.get("location") ?? "").endsWith("/projects/e2e-test-project-renamed"), `${redirect.status} ${redirect.headers.get("location")}`);

  const draft = await callAction("setProjectStatus", [projectId, "draft"], { cookie: sessionCookie });
  check("Unpublish works", ok(draft.text));
  check("Unpublished project disappears from the site", (await request("/projects/e2e-test-project-renamed")).status === 404);

  const duplicate = await callAction("duplicateProject", [projectId], { cookie: sessionCookie });
  const duplicateId = idFrom(duplicate.text);
  check("Duplicate creates a draft copy", ok(duplicate.text) && Boolean(duplicateId));

  for (const id of [projectId, duplicateId].filter(Boolean)) {
    const deleted = await callAction("deleteProject", [id], { cookie: sessionCookie });
    check(`Delete project ${id.slice(-6)}`, ok(deleted.text));
  }

  // Blog: publish → visible in listing, article page and nav.
  const post = {
    title: "E2E Test Post",
    slug: "e2e-test-post",
    excerpt: "Smoke-test article.",
    content: "This article verifies the blog publishing flow end to end. It has enough words to publish.",
    coverImage: { url: "", alt: "" },
    category: "Testing",
    tags: ["e2e"],
    status: "published",
    publishAt: "",
    seo: { title: "", description: "", ogImage: "", noIndex: false },
  };
  const savedPost = await callAction("savePost", [null, post], { cookie: sessionCookie });
  const postId = idFrom(savedPost.text);
  check("savePost publishes an article", ok(savedPost.text) && Boolean(postId));
  check("Article page is live", (await request("/blog/e2e-test-post")).status === 200);
  check("Blog link appears in navigation", (await (await request("/")).text()).includes('href="/blog"'));
  const scheduled = await callAction("savePost", [postId, { ...post, status: "scheduled", publishAt: "2099-01-01T00:00:00.000Z" }], { cookie: sessionCookie });
  check("Scheduling a future date saves", ok(scheduled.text));
  check("Future-scheduled article is hidden", (await request("/blog/e2e-test-post")).status === 404);
  if (postId) check("Delete post", ok((await callAction("deletePost", [postId], { cookie: sessionCookie })).text));

  // Testimonial → homepage section; custom page → public URL + footer link.
  const testimonial = await callAction(
    "saveTestimonial",
    [
      null,
      {
        name: "E2E Reviewer",
        role: "CTO",
        company: "Example Co",
        avatar: { url: "", alt: "" },
        quote: "Smoke-test testimonial — delivered a fast, polished product.",
        rating: 5,
        sourceUrl: "",
        projectSlug: "roofnest",
        featured: true,
        order: 0,
        status: "active",
      },
    ],
    { cookie: sessionCookie }
  );
  const testimonialId = idFrom(testimonial.text);
  check("Testimonial is created", ok(testimonial.text) && Boolean(testimonialId));
  check("Testimonial appears in the admin list", (await (await authed("/admin/testimonials")).text()).includes("E2E Reviewer"));
  /*
   * The design has exactly three testimonial cards, and a new entry is added
   * at the end of the order — so it is not on the page until it is moved into
   * the first three. Reordering it to the front is what publishes it.
   */
  check("A fourth testimonial is not on the homepage yet", !(await (await request("/")).text()).includes("E2E Reviewer"));
  // Each row links to itself more than once, so the ids have to be de-duplicated:
  // applyOrder rejects a list that does not match the stored items exactly.
  const listedIds = [...(await (await authed("/admin/testimonials")).text()).matchAll(/\/admin\/testimonials\/([a-f0-9]{24})/g)].map((m) => m[1]);
  const existingIds = [...new Set(listedIds)];
  const ordered = [testimonialId, ...existingIds.filter((id) => id !== testimonialId)];
  const reordered = await callAction("reorderCareerItems", ["testimonial", ordered], { cookie: sessionCookie });
  check("Reordering testimonials saves", ok(reordered.text), reordered.text.slice(-120));
  check("Reordered testimonial appears on the homepage", (await (await request("/")).text()).includes("E2E Reviewer"));
  check("Reordered testimonial appears on the about page", (await (await request("/about")).text()).includes("E2E Reviewer"));
  if (testimonialId) check("Delete testimonial", ok((await callAction("deleteCareerItem", ["testimonial", testimonialId], { cookie: sessionCookie })).text));

  const pageInput = { title: "E2E Uses", slug: "e2e-uses", intro: "Tools I use.", content: ["## Hardware", "", "A laptop."].join(String.fromCharCode(10)), status: "published", showInFooter: true, seo: { title: "", description: "", ogImage: "", noIndex: false } };
  const reserved = await callAction("savePage", [null, { ...pageInput, slug: "about" }], { cookie: sessionCookie });
  check("Reserved page URLs are rejected", reserved.text.includes('"ok":false'));
  const createdPage = await callAction("savePage", [null, pageInput], { cookie: sessionCookie });
  const pageId = idFrom(createdPage.text);
  check("Custom page is created", ok(createdPage.text) && Boolean(pageId));
  const pageHtml = await (await request("/e2e-uses")).text();
  check("Custom page is live with rendered Markdown", pageHtml.includes("E2E Uses") && pageHtml.includes('id="hardware"'));
  check("Custom page is linked in the footer", (await (await request("/")).text()).includes('href="/e2e-uses"'));
  if (pageId) check("Delete custom page", ok((await callAction("deletePage", [pageId], { cookie: sessionCookie })).text));
  check("Deleted page is gone", (await request("/e2e-uses")).status === 404);

  // Upload → stored in MongoDB → served from /media → deleted.
  const png = makePng(2, 3);
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "E2E Pixel.png");
  form.append("accept", "image");
  const upload = await request("/api/admin/upload", { method: "POST", body: form, headers: { Origin: BASE, Cookie: sessionCookie } });
  const uploaded = (await upload.json().catch(() => ({}))).media;
  check("Upload stores the file in MongoDB", upload.status === 201 && /^\/media\/[a-f0-9]{24}\/e2e-pixel\.png$/.test(uploaded?.url ?? ""), uploaded?.url);
  check("Upload records image dimensions", uploaded?.width === 2 && uploaded?.height === 3, `${uploaded?.width}x${uploaded?.height}`);
  if (uploaded?.url) {
    const file = await request(uploaded.url);
    const bytes = new Uint8Array(await file.arrayBuffer());
    check("Uploaded file is served with its type", file.status === 200 && file.headers.get("content-type") === "image/png" && bytes.length === png.length);
    check("Uploaded file is cached long-term", (file.headers.get("cache-control") ?? "").includes("immutable"));
    const cached = await request(uploaded.url, { headers: { "If-None-Match": file.headers.get("etag") ?? "" } });
    check("Repeat request returns 304", cached.status === 304, String(cached.status));
    const optimized = await request(`/_next/image?url=${encodeURIComponent(uploaded.url)}&w=64&q=75`);
    check("next/image can optimize stored images", optimized.status === 200, String(optimized.status));
    check("Delete uploaded file", ok((await callAction("deleteMedia", [uploaded.id, false], { cookie: sessionCookie })).text));
    check("Deleted file is gone", (await request(uploaded.url)).status === 404);
  }

  // Contact form → inbox → reply tracking.
  const contact = await callAction(
    "sendContactMessage",
    [{ name: "E2E Visitor", email: "visitor@example.com", subject: "E2E inquiry", message: "Hello from the smoke test, please ignore.", startedAt: Date.now() - 30_000 }],
    { page: "/" }
  );
  check("Contact form submission succeeds", contact.text.includes('"success":true'), contact.text.slice(-120));
  const inbox = await (await authed("/admin/messages")).text();
  const messageId = inbox.match(/\/admin\/messages\/([a-f0-9]{24})/)?.[1];
  check("Message appears in the admin inbox", inbox.includes("E2E inquiry") && Boolean(messageId));
  if (messageId) {
    const notReplied = await (await authed(`/admin/messages/${messageId}`)).text();
    check("Opening a message does not mark it replied", !notReplied.includes("Marked as replied by") && notReplied.includes("awaiting reply"));
    const deleteActive = await callAction("deleteMessage", [messageId], { cookie: sessionCookie });
    check("Active messages cannot be deleted", deleteActive.text.includes("Archive the message"));
    const replied = await callAction("markMessageReplied", [messageId, "Called on WhatsApp"], { cookie: sessionCookie });
    check("Mark as replied works", ok(replied.text));
    const afterReply = await (await authed(`/admin/messages/${messageId}`)).text();
    check("Reply note is shown in the message", afterReply.includes("Called on WhatsApp") && afterReply.includes("Marked as replied by"));
    const archived = await callAction("setMessageStatus", [messageId, "archived"], { cookie: sessionCookie });
    check("Archive message", ok(archived.text));
    check("Delete archived message", ok((await callAction("deleteMessage", [messageId], { cookie: sessionCookie })).text));
  }

  const activity = await (await authed("/admin/activity?type=project")).text();
  check("Audit log recorded project actions", activity.includes("project.create") && activity.includes("project.delete"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
