import type { SourceChannel } from "@/lib/constants";

/*
 * Where a visit came from. Worked out from the referring URL, the UTM tags on
 * the landing page and the in-app browser that opened the site (apps usually
 * strip the referrer), so it needs nothing beyond what the visitor's own
 * request already carries — no third-party service and no extra storage.
 */

export type VisitSource = { channel: SourceChannel; name: string };

// Host → channel. AI assistants come first: gemini.google.com would otherwise read as Google search.
const HOSTS: [SourceChannel, string, RegExp][] = [
  ["ai", "ChatGPT", /^(chatgpt\.com|chat\.openai\.com)$/],
  ["ai", "Perplexity", /(^|\.)perplexity\.ai$/],
  ["ai", "Claude", /(^|\.)claude\.ai$/],
  ["ai", "Gemini", /^gemini\.google\.com$/],
  ["ai", "Copilot", /^copilot\.microsoft\.com$/],
  ["ai", "Grok", /(^|\.)grok\.com$/],

  ["organic", "Google", /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/],
  ["organic", "Bing", /(^|\.)bing\.com$/],
  ["organic", "DuckDuckGo", /(^|\.)duckduckgo\.com$/],
  ["organic", "Yahoo", /(^|\.)search\.yahoo\.com$/],
  ["organic", "Yandex", /(^|\.)yandex\.[a-z.]+$/],
  ["organic", "Baidu", /(^|\.)baidu\.com$/],
  ["organic", "Ecosia", /(^|\.)ecosia\.org$/],
  ["organic", "Brave Search", /^search\.brave\.com$/],
  ["organic", "Startpage", /(^|\.)startpage\.com$/],
  ["organic", "Qwant", /(^|\.)qwant\.com$/],
  ["organic", "Naver", /(^|\.)naver\.com$/],

  ["social", "LinkedIn", /(^|\.)(linkedin\.com|lnkd\.in)$/],
  ["social", "Facebook", /(^|\.)(facebook\.com|fb\.com|fb\.me|fbredirect\.com)$/],
  ["social", "Messenger", /(^|\.)messenger\.com$/],
  ["social", "Instagram", /(^|\.)instagram\.com$/],
  ["social", "WhatsApp", /(^|\.)whatsapp\.com$/],
  ["social", "X (Twitter)", /^(t\.co|x\.com|twitter\.com|.*\.twitter\.com)$/],
  ["social", "Telegram", /(^|\.)(telegram\.(org|me)|t\.me)$/],
  ["social", "YouTube", /(^|\.)(youtube\.com|youtu\.be)$/],
  ["social", "Reddit", /(^|\.)reddit\.com$/],
  ["social", "TikTok", /(^|\.)tiktok\.com$/],
  ["social", "Pinterest", /(^|\.)pinterest\.[a-z.]+$/],
  ["social", "Threads", /(^|\.)threads\.(net|com)$/],
  ["social", "Discord", /(^|\.)discord\.(com|gg)$/],
  ["social", "Quora", /(^|\.)quora\.com$/],
  ["social", "Snapchat", /(^|\.)snapchat\.com$/],
  ["social", "VK", /(^|\.)vk\.com$/],

  ["email", "Gmail", /^mail\.google\.com$/],
  ["email", "Outlook", /^(outlook\.(live|office|office365)\.com|mail\.yahoo\.com)$/],
];

// utm_medium → channel, for the mediums analytics tools have standardised on.
const MEDIUMS: [SourceChannel, RegExp][] = [
  ["email", /^(e-?mail|newsletter)$/],
  ["social", /^(social|social-media|social_media|sm|paid-social|paid_social)$/],
  ["organic", /^organic$/],
  ["referral", /^referral$/],
  ["campaign", /^(cpc|ppc|paid|paidsearch|paid-search|paid_search|cpm|cpv|display|banner|retargeting|affiliate|sms|push)$/],
];

/** In-app browsers (parsed from the user agent) that mean the visit came from that app. */
const IN_APP_CHANNEL: Record<string, SourceChannel> = {
  Facebook: "social",
  Messenger: "social",
  Instagram: "social",
  LinkedIn: "social",
  WhatsApp: "social",
  Telegram: "social",
  "X (Twitter)": "social",
  TikTok: "social",
  Snapchat: "social",
  "Google app": "organic",
};

export function referrerHost(referrer: string) {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (!/^https?:$/.test(url.protocol)) return "";
    return url.hostname.replace(/^www\./, "").toLowerCase().slice(0, 120);
  } catch {
    return "";
  }
}

function knownHost(host: string) {
  return HOSTS.find(([, , pattern]) => pattern.test(host));
}

/**
 * The channel and name to record for a visit. `ownHost` is the site's own
 * hostname, so an internal referrer does not read as someone else's traffic.
 */
export function classifySource(input: {
  referrer?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  inApp?: string;
  ownHost?: string | null;
}): VisitSource {
  const utm = {
    source: (input.utm?.source ?? "").trim().toLowerCase().slice(0, 100),
    medium: (input.utm?.medium ?? "").trim().toLowerCase().slice(0, 100),
    campaign: (input.utm?.campaign ?? "").trim().toLowerCase().slice(0, 100),
  };
  const host = referrerHost(input.referrer ?? "");
  const own = (input.ownHost ?? "").replace(/^www\./, "").split(":")[0].toLowerCase();
  const external = host && host !== own ? host : "";
  const match = external ? knownHost(external) : undefined;

  // UTM tags are the visitor's own query string and say what the link was for, so they win.
  if (utm.source || utm.medium || utm.campaign) {
    const medium = MEDIUMS.find(([, pattern]) => pattern.test(utm.medium))?.[0];
    const name = utm.source || match?.[1] || external || utm.campaign || "campaign";
    return { channel: medium ?? (utm.source && !utm.medium && match ? match[0] : "campaign"), name: name.slice(0, 120) };
  }

  if (match) return { channel: match[0], name: match[1] };
  if (external) return { channel: "referral", name: external };

  // No referrer: an in-app browser still tells us which app the link was opened from.
  const inApp = input.inApp ? IN_APP_CHANNEL[input.inApp] : undefined;
  if (inApp) return { channel: inApp, name: input.inApp as string };

  return { channel: "direct", name: "" };
}
