"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/*
 * First-party tracker. Sends a beacon to /api/track for every page view and
 * every action (clicks, outbound links, downloads, form submits, copies), and
 * when a page is left or hidden: time spent, scroll depth and sections seen.
 * A random visitor id lives in localStorage; a session ends after 30 minutes
 * without activity. Form field values are never read.
 */

const ENDPOINT = "/api/track";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const KEYS = { visitor: "vt:vid", session: "vt:sid", seen: "vt:seen" };
const ID = /^[A-Za-z0-9-]{8,64}$/;
const CLICKABLE =
  "a[href], button, summary, input[type='submit'], input[type='button'], [role='button'], [role='tab'], [role='link'], [role='menuitem'], [data-track]";

type Page = { vid: string; sid: string; pid: string; path: string };
type UserAgentData = {
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platformVersion?: string }>;
};

// Fallback when localStorage is blocked (some private modes): ids last for this page load.
const memory = new Map<string, string>();

function read(key: string) {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; the in-memory copy is used.
  }
}

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10).padEnd(8, "0")).join("-");
  }
}

/** This browser's visitor id, if the tracker has assigned one (sent with the contact form). */
export function getVisitorId() {
  const vid = read(KEYS.visitor);
  return vid && ID.test(vid) ? vid : undefined;
}

/** Visitor and session ids. Calling it counts as activity and keeps the session alive. */
function identity() {
  let vid = read(KEYS.visitor);
  if (!vid || !ID.test(vid)) {
    vid = randomId();
    write(KEYS.visitor, vid);
  }
  const now = Date.now();
  let sid = read(KEYS.session);
  const newSession = !sid || !ID.test(sid) || now - Number(read(KEYS.seen) ?? 0) > SESSION_IDLE_MS;
  if (newSession || !sid) {
    sid = randomId();
    write(KEYS.session, sid);
  }
  write(KEYS.seen, String(now));
  return { vid, sid, newSession };
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
  } catch {
    // Analytics must never affect the page.
  }
}

let hints: Promise<Record<string, unknown>> | null = null;

/** Chromium's client hints: real OS version (e.g. Windows 11) and the Android phone model. */
function clientHints() {
  hints ??= (async () => {
    const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
    if (!data) return {};
    const base = { mobile: data.mobile, platform: data.platform };
    try {
      const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, 500));
      const high = await Promise.race([data.getHighEntropyValues?.(["model", "platformVersion"]), timeout]);
      return { ...base, model: high?.model, platformVersion: high?.platformVersion };
    } catch {
      return base;
    }
  })();
  return hints;
}

async function clientInfo() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
  let timezone = "";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    // Older browsers.
  }
  return {
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: Math.round(window.devicePixelRatio * 100) / 100,
    touchPoints: nav.maxTouchPoints ?? 0,
    cpuCores: nav.hardwareConcurrency,
    memoryGb: nav.deviceMemory,
    connection: nav.connection?.effectiveType ?? "",
    colorScheme: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    language: nav.language ?? "",
    languages: (nav.languages ?? []).slice(0, 5).join(", "),
    timezone,
    ...(await clientHints()),
  };
}

function utmParams() {
  const params = new URLSearchParams(window.location.search);
  const utm = { source: params.get("utm_source") ?? "", medium: params.get("utm_medium") ?? "", campaign: params.get("utm_campaign") ?? "" };
  return utm.source || utm.medium || utm.campaign ? utm : undefined;
}

function sectionOf(node: Node | null | undefined) {
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.closest("section[id]")?.id ?? "";
}

function labelOf(element: Element) {
  const text =
    element.getAttribute("data-track") ||
    element.getAttribute("aria-label") ||
    (element as HTMLElement).innerText ||
    element.getAttribute("title") ||
    (element instanceof HTMLInputElement ? element.value : "") ||
    element.querySelector("img")?.getAttribute("alt") ||
    element.tagName.toLowerCase();
  return text.replace(/\s+/g, " ").trim().slice(0, 160);
}

function actionType(element: Element) {
  if (!(element instanceof HTMLAnchorElement) || !element.href) return "click";
  let url: URL;
  try {
    url = new URL(element.href, window.location.href);
  } catch {
    return "click";
  }
  if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return "outbound"; // incl. mailto:, tel:
  if (element.hasAttribute("download") || url.pathname === "/cv" || /\.(pdf|zip|docx?|pptx?|xlsx?)$/i.test(url.pathname)) return "download";
  return "click";
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const isLanding = useRef(true);
  const page = useRef<Page | null>(null);

  // One page view per route, plus time on page, scroll depth and sections seen.
  useEffect(() => {
    if (!pathname) return;
    const landing = isLanding.current;
    isLanding.current = false;
    const { vid, sid, newSession } = identity();
    const current: Page = { vid, sid, pid: randomId(), path: pathname };
    page.current = current;

    const referrer = landing ? document.referrer : "";
    void clientInfo().then((client) =>
      send({ type: "pageview", ...current, referrer, landing, newSession, utm: landing ? utmParams() : undefined, client })
    );

    let activeMs = 0;
    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let depth = 0;
    const seen = new Set<string>();
    let lastSent = "0|0|0";

    const report = () => {
      const duration = Math.min(86_400, Math.round((activeMs + (visibleSince ? Date.now() - visibleSince : 0)) / 1000));
      const key = `${duration}|${depth}|${seen.size}`;
      if (key === lastSent) return;
      lastSent = key;
      send({ type: "engage", ...current, duration, depth, sections: [...seen].slice(0, 30) });
    };

    const measureDepth = () => {
      const total = document.documentElement.scrollHeight;
      const reached = total > 0 ? Math.round(((window.scrollY + window.innerHeight) / total) * 100) : 100;
      depth = Math.max(depth, Math.min(100, reached));
    };

    // A section counts as seen once it crosses the middle of the screen.
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) if (entry.isIntersecting && entry.target.id) seen.add(entry.target.id);
            },
            { rootMargin: "-45% 0px -45% 0px" }
          )
        : null;
    const observed = new WeakSet<Element>();
    const observeSections = () => {
      document.querySelectorAll("section[id]").forEach((section) => {
        if (observed.has(section)) return;
        observed.add(section);
        observer?.observe(section);
      });
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measureDepth();
        observeSections();
      });
    };
    const onHide = () => {
      if (visibleSince) activeMs += Date.now() - visibleSince;
      visibleSince = 0;
      report();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") return onHide();
      visibleSince = Date.now();
      identity();
    };

    observeSections();
    // Content streams in after navigation; measure again once it has settled.
    const settle = window.setTimeout(() => {
      measureDepth();
      observeSections();
    }, 1000);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      onHide(); // route change: report the page being left
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [pathname]);

  // Actions anywhere on the page, attributed to the current page view.
  useEffect(() => {
    const track = (type: string, details: { label: string; href?: string; section: string }) => {
      if (!page.current) return;
      write(KEYS.seen, String(Date.now()));
      send({ type, ...page.current, href: "", ...details });
    };

    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest?.(CLICKABLE);
      if (!element || element.closest("[data-track-ignore]")) return;
      track(actionType(element), {
        label: labelOf(element),
        href: element instanceof HTMLAnchorElement ? element.href : "",
        section: sectionOf(element),
      });
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const label = form.getAttribute("data-track") || form.getAttribute("aria-label") || form.getAttribute("name") || form.getAttribute("id") || "Form";
      track("form_submit", { label, section: sectionOf(form) });
    };
    const onCopy = () => {
      const selection = window.getSelection();
      const text = selection?.toString().replace(/\s+/g, " ").trim();
      if (text) track("copy", { label: text.slice(0, 160), section: sectionOf(selection?.anchorNode) });
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("copy", onCopy, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("copy", onCopy, true);
    };
  }, []);

  return null;
}
