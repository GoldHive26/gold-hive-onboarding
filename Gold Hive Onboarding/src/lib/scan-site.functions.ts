import { createServerFn } from "@tanstack/react-start";

export interface SiteScanResult {
  ok: boolean;
  url: string;
  finalUrl?: string;
  status?: number;
  error?: string;
  platform: "" | "Wix" | "Squarespace" | "Odoo" | "GoHighLevel" | "FareHarbor" | "Other";
  platformConfidence: "high" | "medium" | "low" | "none";
  bookingType: "" | "Form on my website" | "External Booking Link" | "FareHarbor";
  bookingConfidence: "high" | "medium" | "low" | "none";
  pathLabel: string;
  pagesScanned: string[];
  signals: {
    generator?: string;
    title?: string;
    description?: string;
    hasForm: boolean;
    formCount: number;
    hasMailto: boolean;
    bookingProviders: string[]; // e.g. ['FareHarbor', 'Peek']
    bookingButtonHints: string[]; // text snippets like "Book Now"
    externalBookingLinks: string[]; // outbound booking links
    iframeProviders: string[]; // booking providers found in iframes
    schemaTypes: string[]; // JSON-LD @type values (Reservation, Event, …)
    scripts: string[]; // recognizable third-party script hosts
    cms: string[]; // platform fingerprints found
    candidatePagesFound: string[]; // booking-page URLs we discovered
  };
  recommendations: string[];
}

const PLATFORM_FINGERPRINTS: Array<{ name: SiteScanResult["platform"]; patterns: RegExp[] }> = [
  { name: "Wix", patterns: [/static\.parastorage\.com/i, /wixstatic\.com/i, /<meta\s+name=["']generator["']\s+content=["']Wix\.com/i, /_wixCIDX/i] },
  { name: "Squarespace", patterns: [/static1\.squarespace\.com/i, /squarespace-cdn/i, /<meta\s+name=["']generator["']\s+content=["']Squarespace/i, /Static\.SQUARESPACE_CONTEXT/i] },
  { name: "Odoo", patterns: [/\/web\/assets\//i, /odoo\.com/i, /<meta\s+name=["']generator["']\s+content=["']Odoo/i] },
  { name: "GoHighLevel", patterns: [/leadconnectorhq/i, /msgsndr\.com/i, /highlevel/i, /gohighlevel/i] },
  { name: "FareHarbor", patterns: [/fareharbor\.com/i, /fhcdn\.co/i] },
];

const BOOKING_PROVIDERS: Array<{ name: string; patterns: RegExp[]; type: SiteScanResult["bookingType"] }> = [
  { name: "FareHarbor", patterns: [/fareharbor\.com/i, /fhcdn\.co/i], type: "FareHarbor" },
  { name: "Peek", patterns: [/peek\.com/i, /book\.peek\.com/i], type: "External Booking Link" },
  { name: "Rezdy", patterns: [/rezdy\.com/i], type: "External Booking Link" },
  { name: "Checkfront", patterns: [/checkfront\.com/i], type: "External Booking Link" },
  { name: "Bokun", patterns: [/bokun\.io/i, /bokun\.com/i], type: "External Booking Link" },
  { name: "Bookeo", patterns: [/bookeo\.com/i], type: "External Booking Link" },
  { name: "Xola", patterns: [/xola\.com/i], type: "External Booking Link" },
  { name: "TripWorks", patterns: [/tripworks\.com/i], type: "External Booking Link" },
  { name: "TourCMS", patterns: [/tourcms\.com/i], type: "External Booking Link" },
  { name: "TrekkSoft", patterns: [/trekksoft\.com/i], type: "External Booking Link" },
  { name: "Ventrata", patterns: [/ventrata\.com/i], type: "External Booking Link" },
  { name: "Droplet", patterns: [/droplet\.io/i, /dropletpay/i], type: "External Booking Link" },
  { name: "Journey", patterns: [/journeyapp/i, /bookingplatform/i], type: "External Booking Link" },
  { name: "Calendly", patterns: [/calendly\.com/i], type: "External Booking Link" },
  { name: "Acuity", patterns: [/acuityscheduling\.com/i, /squarespacescheduling/i], type: "External Booking Link" },
  { name: "Mindbody", patterns: [/mindbodyonline\.com/i, /mindbody\.io/i, /healcode\.com/i], type: "External Booking Link" },
  { name: "Resy", patterns: [/resy\.com/i], type: "External Booking Link" },
  { name: "OpenTable", patterns: [/opentable\.com/i], type: "External Booking Link" },
  { name: "Tock", patterns: [/exploretock\.com/i], type: "External Booking Link" },
  { name: "SevenRooms", patterns: [/sevenrooms\.com/i], type: "External Booking Link" },
  { name: "Square Appointments", patterns: [/squareup\.com\/appointments/i, /book\.squareup/i], type: "External Booking Link" },
  { name: "Setmore", patterns: [/setmore\.com/i], type: "External Booking Link" },
  { name: "Booksy", patterns: [/booksy\.com/i], type: "External Booking Link" },
  { name: "Vagaro", patterns: [/vagaro\.com/i], type: "External Booking Link" },
  { name: "Eventbrite", patterns: [/eventbrite\.com/i], type: "External Booking Link" },
  { name: "GetYourGuide", patterns: [/getyourguide\.com/i], type: "External Booking Link" },
  { name: "Viator", patterns: [/viator\.com/i], type: "External Booking Link" },
  { name: "Hostfully", patterns: [/hostfully\.com/i], type: "External Booking Link" },
  { name: "Cloudbeds", patterns: [/cloudbeds\.com/i], type: "External Booking Link" },
  { name: "Lodgify", patterns: [/lodgify\.com/i], type: "External Booking Link" },
  { name: "LeadConnector", patterns: [/leadconnectorhq\.com/i, /msgsndr\.com/i, /api\.leadconnectorhq/i], type: "External Booking Link" },
];

const CANDIDATE_PATHS = [
  "/book", "/book-online", "/book-now", "/booking", "/bookings",
  "/reserve", "/reservations", "/reservation",
  "/tickets", "/buy-tickets",
  "/schedule", "/appointments", "/appointment",
  "/tours", "/experiences",
];

const BOOKING_LINK_RE = /book|reserv|ticket|schedul|appointment|tour/i;

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url;
}
function extractMeta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  return html.match(re)?.[1];
}
function extractTitle(html: string): string | undefined {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
}

async function fetchHtml(url: string, timeoutMs = 8000): Promise<{ html: string; finalUrl: string; status: number } | { error: string; status: number }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; GoldHiveScanner/1.1; +https://goldhive.org)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };
    const html = (await res.text()).slice(0, 600_000);
    return { html, finalUrl: res.url || url, status: res.status };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "fetch failed", status: 0 };
  }
}

interface PageAnalysis {
  cms: string[];
  platform: SiteScanResult["platform"];
  platformConfidence: SiteScanResult["platformConfidence"];
  generator?: string;
  title?: string;
  description?: string;
  bookingProviders: string[];
  bookingType: SiteScanResult["bookingType"];
  bookingConfidence: SiteScanResult["bookingConfidence"];
  formCount: number;
  hasMailto: boolean;
  buttonHints: string[];
  externalBookingLinks: string[];
  iframeProviders: string[];
  schemaTypes: string[];
  scripts: string[];
  internalBookingPaths: string[]; // discovered candidate paths
}

function analyzeHtml(html: string, finalUrl: string): PageAnalysis {
  const out: PageAnalysis = {
    cms: [], platform: "", platformConfidence: "none",
    bookingProviders: [], bookingType: "", bookingConfidence: "none",
    formCount: 0, hasMailto: false, buttonHints: [],
    externalBookingLinks: [], iframeProviders: [], schemaTypes: [],
    scripts: [], internalBookingPaths: [],
  };

  // Platform fingerprints
  for (const fp of PLATFORM_FINGERPRINTS) {
    const hits = fp.patterns.filter((p) => p.test(html)).length;
    if (hits > 0) {
      out.cms.push(fp.name as string);
      if (!out.platform || hits >= 2) {
        out.platform = fp.name;
        out.platformConfidence = hits >= 2 ? "high" : "medium";
      }
    }
  }
  out.generator = extractMeta(html, "generator");
  if (!out.platform && out.generator) {
    const g = out.generator.toLowerCase();
    if (g.includes("wix")) { out.platform = "Wix"; out.platformConfidence = "high"; out.cms.push("Wix"); }
    else if (g.includes("squarespace")) { out.platform = "Squarespace"; out.platformConfidence = "high"; out.cms.push("Squarespace"); }
    else if (g.includes("odoo")) { out.platform = "Odoo"; out.platformConfidence = "high"; out.cms.push("Odoo"); }
  }

  out.title = extractTitle(html);
  out.description = extractMeta(html, "description");

  // Booking providers (scripts + raw HTML)
  for (const bp of BOOKING_PROVIDERS) {
    if (bp.patterns.some((p) => p.test(html))) {
      out.bookingProviders.push(bp.name);
      if (!out.bookingType) {
        out.bookingType = bp.type;
        out.bookingConfidence = "high";
      }
    }
  }

  // Forms
  const formMatches = html.match(/<form[\s>]/gi);
  out.formCount = formMatches?.length ?? 0;
  out.hasMailto = /href=["']mailto:/i.test(html);

  // Iframes — many WIX/SS sites embed booking widgets
  const iframeRe = /<iframe[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = iframeRe.exec(html))) {
    for (const bp of BOOKING_PROVIDERS) {
      if (bp.patterns.some((p) => p.test(m![1]))) {
        if (!out.iframeProviders.includes(bp.name)) out.iframeProviders.push(bp.name);
        if (!out.bookingProviders.includes(bp.name)) out.bookingProviders.push(bp.name);
        if (!out.bookingType) {
          out.bookingType = bp.type;
          out.bookingConfidence = "high";
        }
      }
    }
  }

  // JSON-LD schema
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = ldRe.exec(html))) {
    try {
      const json = JSON.parse(m[1].trim());
      const collect = (n: unknown) => {
        if (!n || typeof n !== "object") return;
        const obj = n as Record<string, unknown>;
        const t = obj["@type"];
        if (typeof t === "string" && !out.schemaTypes.includes(t)) out.schemaTypes.push(t);
        if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && !out.schemaTypes.includes(x) && out.schemaTypes.push(x));
        Object.values(obj).forEach((v) => Array.isArray(v) ? v.forEach(collect) : collect(v));
      };
      Array.isArray(json) ? json.forEach(collect) : collect(json);
    } catch { /* ignore */ }
  }

  // Booking buttons + internal booking-page links
  const host = (() => { try { return new URL(finalUrl).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seenButton = new Set<string>();
  const seenInternal = new Set<string>();
  while ((m = anchorRe.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text && BOOKING_LINK_RE.test(text) && text.length <= 40 && !seenButton.has(text.toLowerCase())) {
      seenButton.add(text.toLowerCase());
      if (out.buttonHints.length < 8) out.buttonHints.push(text);
    }
    // External booking provider links
    if (/^https?:\/\//i.test(href)) {
      try {
        const h = new URL(href).hostname.replace(/^www\./, "");
        if (h && h !== host && BOOKING_PROVIDERS.some((bp) => bp.patterns.some((p) => p.test(h)))) {
          if (!out.externalBookingLinks.includes(href) && out.externalBookingLinks.length < 6) {
            out.externalBookingLinks.push(href);
          }
        }
      } catch { /* ignore */ }
    } else if (BOOKING_LINK_RE.test(href)) {
      // Internal candidate booking page
      try {
        const u = new URL(href, finalUrl);
        if (u.hostname.replace(/^www\./, "") === host) {
          const path = u.pathname.toLowerCase();
          if (!seenInternal.has(path) && out.internalBookingPaths.length < 4) {
            seenInternal.add(path);
            out.internalBookingPaths.push(u.toString().split("#")[0]);
          }
        }
      } catch { /* ignore */ }
    }
  }
  // Button text from <button> too
  const btnRe = /<button[^>]*>([^<]{1,60})<\/button>/gi;
  while ((m = btnRe.exec(html)) && out.buttonHints.length < 8) {
    const txt = m[1].replace(/\s+/g, " ").trim();
    if (BOOKING_LINK_RE.test(txt) && !seenButton.has(txt.toLowerCase())) {
      seenButton.add(txt.toLowerCase());
      out.buttonHints.push(txt);
    }
  }

  // Scripts
  const scriptHosts = new Set<string>();
  const scriptRe = /<script[^>]+src=["']([^"']+)["']/gi;
  while ((m = scriptRe.exec(html))) {
    try {
      const u = m[1].startsWith("//") ? "https:" + m[1] : m[1];
      const h = new URL(u, finalUrl).hostname;
      if (h && h !== host) scriptHosts.add(h);
    } catch { /* ignore */ }
  }
  Array.from(scriptHosts).slice(0, 10).forEach((h) => out.scripts.push(h));

  // Form fallback (lower confidence, only if nothing else found yet)
  if (!out.bookingType && out.formCount > 0) {
    out.bookingType = "Form on my website";
    out.bookingConfidence = "medium";
  }

  return out;
}

function mergeAnalysis(base: PageAnalysis, extra: PageAnalysis): PageAnalysis {
  const merged: PageAnalysis = { ...base };
  if (!merged.platform && extra.platform) {
    merged.platform = extra.platform;
    merged.platformConfidence = extra.platformConfidence;
  }
  for (const c of extra.cms) if (!merged.cms.includes(c)) merged.cms.push(c);
  for (const p of extra.bookingProviders) if (!merged.bookingProviders.includes(p)) merged.bookingProviders.push(p);
  for (const p of extra.iframeProviders) if (!merged.iframeProviders.includes(p)) merged.iframeProviders.push(p);
  for (const t of extra.schemaTypes) if (!merged.schemaTypes.includes(t)) merged.schemaTypes.push(t);
  for (const b of extra.buttonHints) if (!merged.buttonHints.includes(b) && merged.buttonHints.length < 8) merged.buttonHints.push(b);
  for (const l of extra.externalBookingLinks) if (!merged.externalBookingLinks.includes(l) && merged.externalBookingLinks.length < 6) merged.externalBookingLinks.push(l);
  for (const s of extra.scripts) if (!merged.scripts.includes(s) && merged.scripts.length < 12) merged.scripts.push(s);

  // booking type — upgrade if a stronger signal arrived
  if (extra.bookingType && (!merged.bookingType || (merged.bookingConfidence === "medium" && extra.bookingConfidence === "high"))) {
    merged.bookingType = extra.bookingType;
    merged.bookingConfidence = extra.bookingConfidence;
  }
  merged.formCount = Math.max(merged.formCount, extra.formCount);
  merged.hasMailto = merged.hasMailto || extra.hasMailto;
  return merged;
}

export const scanSite = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input || typeof input.url !== "string" || !input.url.trim()) throw new Error("url required");
    if (input.url.length > 500) throw new Error("url too long");
    return { url: input.url };
  })
  .handler(async ({ data }): Promise<SiteScanResult> => {
    const url = normalizeUrl(data.url);
    const empty: SiteScanResult = {
      ok: false, url, platform: "", platformConfidence: "none",
      bookingType: "", bookingConfidence: "none",
      pathLabel: "Manual Selection Required",
      pagesScanned: [],
      signals: {
        hasForm: false, formCount: 0, hasMailto: false,
        bookingProviders: [], bookingButtonHints: [],
        externalBookingLinks: [], iframeProviders: [], schemaTypes: [],
        scripts: [], cms: [], candidatePagesFound: [],
      },
      recommendations: [],
    };

    // ---------- Step 1: fetch homepage
    const home = await fetchHtml(url);
    if ("error" in home) {
      return {
        ...empty,
        error: `Couldn't reach ${url}: ${home.error}`,
        recommendations: ["Double-check the URL (or try with/without www) and rescan, or skip to manual."],
      };
    }
    const finalUrl = home.finalUrl;
    const pagesScanned = [finalUrl];
    let merged = analyzeHtml(home.html, finalUrl);

    // ---------- Step 2: when booking detection is weak, scan candidate booking pages
    const needDeep = !merged.bookingType || merged.bookingConfidence !== "high";
    if (needDeep) {
      const origin = (() => { try { return new URL(finalUrl).origin; } catch { return ""; } })();
      // Combine discovered internal booking paths + canonical guesses
      const seen = new Set<string>([finalUrl.toLowerCase()]);
      const candidates: string[] = [];
      for (const u of merged.internalBookingPaths) {
        if (!seen.has(u.toLowerCase())) { seen.add(u.toLowerCase()); candidates.push(u); }
      }
      if (origin) {
        for (const p of CANDIDATE_PATHS) {
          const u = origin + p;
          if (!seen.has(u.toLowerCase())) { seen.add(u.toLowerCase()); candidates.push(u); }
        }
      }
      // Cap deep crawl
      const toFetch = candidates.slice(0, 4);
      const results = await Promise.all(toFetch.map((u) => fetchHtml(u, 6000).then((r) => ({ u, r }))));
      for (const { u, r } of results) {
        if ("error" in r) continue;
        pagesScanned.push(r.finalUrl);
        const a = analyzeHtml(r.html, r.finalUrl);
        merged = mergeAnalysis(merged, a);
        if (merged.bookingType && merged.bookingConfidence === "high") break; // good enough
        // Avoid re-using the discovered path twice
        void u;
      }
    }

    // ---------- Step 3: derive path + recommendations
    let pathLabel = "Manual Selection Required";
    const recommendations: string[] = [];
    if (merged.bookingType === "FareHarbor") {
      pathLabel = "Path C — FareHarbor Affiliate";
      recommendations.push("FareHarbor handles attribution natively — no script. We'll show you the affiliate setup.");
    } else if (merged.bookingType === "External Booking Link") {
      pathLabel = "Path B — External Booking Link";
      const provider = merged.bookingProviders[0] || merged.iframeProviders[0];
      recommendations.push(
        provider
          ? `Detected ${provider}. We'll generate a UTM-tagged booking link to swap into your Book Now buttons.`
          : "We'll generate a UTM-tagged booking link to swap into your Book Now buttons.",
      );
    } else if (merged.bookingType === "Form on my website") {
      pathLabel = "Path A — Native Form";
      recommendations.push("Inject the tracking script + add a hidden referral_source field to your booking form.");
    }
    if (!merged.platform) recommendations.push("We couldn't fingerprint your CMS — pick it manually on the next step.");
    if (!merged.bookingType) {
      recommendations.push(
        pagesScanned.length > 1
          ? `We scanned ${pagesScanned.length} pages but couldn't find a booking system. Try entering the exact URL of your Book Now / Reservations page.`
          : "Try entering the exact URL of your Book Now / Reservations page (e.g. yoursite.com/book).",
      );
    }

    return {
      ok: true,
      url,
      finalUrl,
      status: home.status,
      platform: merged.platform,
      platformConfidence: merged.platformConfidence,
      bookingType: merged.bookingType,
      bookingConfidence: merged.bookingConfidence,
      pathLabel,
      pagesScanned,
      signals: {
        generator: merged.generator,
        title: merged.title,
        description: merged.description,
        hasForm: merged.formCount > 0,
        formCount: merged.formCount,
        hasMailto: merged.hasMailto,
        bookingProviders: merged.bookingProviders,
        bookingButtonHints: merged.buttonHints,
        externalBookingLinks: merged.externalBookingLinks,
        iframeProviders: merged.iframeProviders,
        schemaTypes: merged.schemaTypes,
        scripts: merged.scripts,
        cms: merged.cms,
        candidatePagesFound: merged.internalBookingPaths,
      },
      recommendations,
    };
  });
