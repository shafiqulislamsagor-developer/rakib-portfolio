import type { DeviceType } from "@/lib/constants";

/** Extra device details the tracker reads from navigator.userAgentData (Chromium only). */
export type ClientHints = {
  model?: string;
  platform?: string;
  platformVersion?: string;
  mobile?: boolean;
  touchPoints?: number;
};

export type ParsedDevice = {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: DeviceType;
  deviceVendor: string;
  deviceModel: string;
  /** Human-readable label, e.g. "Samsung SM-S918B", "Apple iPhone", "Windows PC". */
  deviceName: string;
  /** App whose built-in browser opened the site (Facebook, Instagram…), if any. */
  inApp: string;
};

// Order matters: Chromium-based browsers also say "Chrome", and almost everything says "Safari".
const BROWSERS: [string, RegExp][] = [
  ["Edge", /Edg(?:e|A|iOS)?\/([\d.]+)/],
  ["Opera", /(?:OPR|OPiOS|OPT)\/([\d.]+)/],
  ["Samsung Internet", /SamsungBrowser\/([\d.]+)/],
  ["UC Browser", /UCBrowser\/([\d.]+)/],
  ["Yandex", /YaBrowser\/([\d.]+)/],
  ["Vivaldi", /Vivaldi\/([\d.]+)/],
  ["Mi Browser", /MiuiBrowser\/([\d.]+)/],
  ["DuckDuckGo", /DuckDuckGo\/([\d.]+)/],
  ["Chrome", /(?:CriOS|Chrome)\/([\d.]+)/],
  ["Firefox", /(?:FxiOS|Firefox)\/([\d.]+)/],
  ["Safari", /Version\/([\d.]+).*Safari/],
];

const IN_APP: [string, RegExp][] = [
  ["Messenger", /MessengerForiOS|Orca-Android|MessengerLite/],
  ["Instagram", /Instagram/],
  ["Facebook", /FBAN|FBAV|FB_IAB|FBIOS/],
  ["LinkedIn", /LinkedInApp/],
  ["WhatsApp", /WhatsApp/],
  ["Telegram", /Telegram/],
  ["X (Twitter)", /Twitter/],
  ["TikTok", /musical_ly|TikTok|BytedanceWebview/],
  ["Snapchat", /Snapchat/],
  ["Google app", /GSA\//],
];

// Android model codes → maker. Covers the brands most portfolio visitors use.
const VENDORS: [string, RegExp][] = [
  ["Samsung", /^(?:SAMSUNG|SM-|GT-|SCH-|SGH-|Galaxy)/i],
  ["Google", /^Pixel/i],
  ["Xiaomi", /^(?:Xiaomi|Redmi|POCO|Mi |MI |M2\d{3}[A-Z0-9]+|2\d{3}[A-Z0-9]{4,})/i],
  ["Realme", /^(?:realme|RMX\d)/i],
  ["OnePlus", /^(?:OnePlus|IN20|KB20|LE21|NE22)/i],
  ["OPPO", /^(?:OPPO|CPH\d|PH[A-Z]M\d)/i],
  ["vivo", /^(?:vivo|V2\d{3})/i],
  ["Infinix", /^Infinix/i],
  ["Tecno", /^TECNO/i],
  ["itel", /^itel/i],
  ["Honor", /^(?:HONOR|HRY-)/i],
  ["Huawei", /^(?:HUAWEI|[A-Z]{3}-(?:L|AL|TL)\d{2})/],
  ["Motorola", /^(?:moto|Motorola|XT\d{4})/i],
  ["Nokia", /^Nokia/i],
  ["Symphony", /^Symphony/i],
  ["Walton", /^(?:Walton|Primo)/i],
  ["Sony", /^(?:Xperia|SO-|XQ-)/i],
  ["LG", /^(?:LG|LM-)/i],
  ["Lenovo", /^Lenovo/i],
];

// Placeholders that browsers put where the Android model would be (reduced UA, Firefox).
const NOT_A_MODEL = /^(?:K|Mobile|Tablet|wv|U|Linux)$/i;

function shortVersion(version: string | undefined, parts = 2) {
  if (!version) return "";
  return version
    .replace(/_/g, ".")
    .split(".")
    .slice(0, parts)
    .join(".")
    .replace(/(\.0)+$/, "");
}

function parseBrowser(ua: string) {
  for (const [name, pattern] of BROWSERS) {
    const match = pattern.exec(ua);
    if (match) return { browser: name, browserVersion: shortVersion(match[1], 1) };
  }
  return { browser: "", browserVersion: "" };
}

function parseOs(ua: string, hints: ClientHints) {
  const platformVersion = hints.platformVersion ?? "";
  const windows = /Windows NT ([\d.]+)/.exec(ua);
  if (windows) {
    const legacy: Record<string, string> = { "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP" };
    // Windows 11 still reports "NT 10.0"; only the platformVersion client hint tells them apart.
    const version = windows[1] === "10.0" ? (Number.parseInt(platformVersion, 10) >= 13 ? "11" : "10") : (legacy[windows[1]] ?? windows[1]);
    return { os: "Windows", osVersion: version };
  }
  if (/iPhone|iPod/.test(ua)) return { os: "iOS", osVersion: shortVersion(/OS ([\d_]+)/.exec(ua)?.[1]) };
  if (/iPad/.test(ua)) return { os: "iPadOS", osVersion: shortVersion(/OS ([\d_]+)/.exec(ua)?.[1]) };
  if (/Android/.test(ua)) {
    // Chrome freezes the UA at "Android 10"; the client hint has the real version.
    const version = hints.platform === "Android" && platformVersion ? platformVersion : /Android ([\d.]+)/.exec(ua)?.[1];
    return { os: "Android", osVersion: shortVersion(version) };
  }
  if (/CrOS/.test(ua)) return { os: "ChromeOS", osVersion: "" };
  const mac = /Mac OS X ([\d_.]+)/.exec(ua);
  if (mac || /Macintosh/.test(ua)) {
    // iPads request desktop sites with a Mac user agent; touch support gives them away.
    if ((hints.touchPoints ?? 0) > 1) return { os: "iPadOS", osVersion: "" };
    const version = hints.platform === "macOS" && platformVersion ? platformVersion : mac?.[1];
    return { os: "macOS", osVersion: shortVersion(version) };
  }
  if (/Linux|X11/.test(ua)) return { os: "Linux", osVersion: "" };
  return { os: "", osVersion: "" };
}

function parseDeviceType(ua: string, os: string, hints: ClientHints): DeviceType {
  if (!ua) return "unknown";
  if (hints.mobile === true) return "mobile";
  if (os === "iPadOS" || /iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  if (os === "Android") return "tablet"; // Android without "Mobile" is a tablet.
  return "desktop";
}

function parseModel(ua: string, os: string, hints: ClientHints) {
  const hinted = hints.model?.trim();
  if (hinted) return { vendor: "", model: hinted };

  // Facebook / Instagram in-app browsers include the exact device.
  const instagram = /Instagram [\d.]+ Android \([^;]*;[^;]*;[^;]*; ([^;]+); ([^;]+);/.exec(ua);
  if (instagram) return { vendor: instagram[1].trim(), model: instagram[2].trim() };
  const apple = /\b((?:iPhone|iPad|iPod)\d+,\d+)/.exec(ua)?.[1];
  if (apple) return { vendor: "Apple", model: apple };

  if (os === "iOS") return { vendor: "Apple", model: /iPod/.test(ua) ? "iPod" : "iPhone" };
  if (os === "iPadOS") return { vendor: "Apple", model: "iPad" };
  if (os === "macOS") return { vendor: "Apple", model: "Mac" };
  if (os === "Android") {
    const match = /Android[\s\d.]*;(?:\s*[a-z]{2}[-_][a-z]{2};)?\s*([^;)]+?)\s*(?:Build\/[^;)]*)?[;)]/i.exec(ua);
    const model = match?.[1].replace(/^SAMSUNG[ -]/i, "").trim() ?? "";
    if (model && !NOT_A_MODEL.test(model)) return { vendor: "", model: model.slice(0, 60) };
  }
  return { vendor: "", model: "" };
}

function vendorFor(model: string) {
  return VENDORS.find(([, pattern]) => pattern.test(model))?.[0] ?? "";
}

function capitalise(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

/** Best-effort browser, OS and device from a user-agent string plus optional client hints. */
export function parseUserAgent(userAgent: string, hints: ClientHints = {}): ParsedDevice {
  const ua = userAgent ?? "";
  const { browser, browserVersion } = parseBrowser(ua);
  const { os, osVersion } = parseOs(ua, hints);
  const deviceType = parseDeviceType(ua, os, hints);
  const { vendor: knownVendor, model } = parseModel(ua, os, hints);
  const deviceVendor = capitalise(knownVendor || (model ? vendorFor(model) : ""));
  const inApp = IN_APP.find(([, pattern]) => pattern.test(ua))?.[0] ?? "";

  let deviceName: string;
  if (model) {
    deviceName = deviceVendor && !model.toLowerCase().startsWith(deviceVendor.toLowerCase()) ? `${deviceVendor} ${model}` : model;
  } else if (os === "Windows" || os === "Linux") {
    deviceName = `${os} PC`;
  } else if (os === "ChromeOS") {
    deviceName = "Chromebook";
  } else if (os === "Android") {
    deviceName = deviceType === "tablet" ? "Android tablet" : "Android phone";
  } else {
    deviceName = deviceType === "unknown" ? "Unknown device" : capitalise(deviceType);
  }

  return { browser, browserVersion, os, osVersion, deviceType, deviceVendor, deviceModel: model, deviceName, inApp };
}
