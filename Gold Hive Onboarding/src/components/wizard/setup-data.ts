import { type ComponentType } from "react";
import {
  Layout,
  Box,
  Globe,
  Zap,
  MoreHorizontal,
  Anchor,
  FileText,
  Link as LinkIcon,
  Newspaper,
  Layers,
  Frame,
  ShoppingBag,
  Image as ImageIcon,
  Server,
  Compass,
  Ticket,
  type LucideProps,
} from "lucide-react";
import { buildTrackingSnippet } from "@/lib/tracking-snippet";

export type Platform = "Wix" | "Squarespace" | "Odoo" | "GoHighLevel" | "Other" | "FareHarbor";
export type BookingType =
  | "Form on my website"
  | "External Booking Link"
  | "FareHarbor";

export const PLATFORMS: {
  value: Exclude<Platform, "FareHarbor">;
  icon: ComponentType<LucideProps>;
}[] = [
  { value: "Wix", icon: Layout },
  { value: "Squarespace", icon: Box },
  { value: "Odoo", icon: Globe },
  { value: "GoHighLevel", icon: Zap },
  { value: "Other", icon: MoreHorizontal },
];

/**
 * Platform selector options (Task 2). Decoupled from the typed `Platform` union
 * that drives the detailed setup guide: `slug` is stored on `vendors.platform`,
 * `label` is what the vendor sees, and `setup` is the `Platform` key whose guide
 * to render — new platforms fall back to "Other" so the wizard never renders a
 * missing guide. The original five keep their own guides; FareHarbor uses its
 * existing FareHarbor-specific branch in SetupGuide.
 */
export interface PlatformOption {
  label: string;
  slug: string;
  icon: ComponentType<LucideProps>;
  setup: Platform; // which SetupGuide content to show
}

export const PLATFORM_OPTIONS: PlatformOption[] = [
  // Existing (own setup guides)
  { label: "Wix", slug: "wix", icon: Layout, setup: "Wix" },
  { label: "Squarespace", slug: "squarespace", icon: Box, setup: "Squarespace" },
  { label: "Odoo", slug: "odoo", icon: Globe, setup: "Odoo" },
  { label: "GoHighLevel", slug: "gohighlevel", icon: Zap, setup: "GoHighLevel" },
  // New (Task 2) — generic "Other" guide, own slug
  { label: "WordPress", slug: "wordpress", icon: Newspaper, setup: "Other" },
  { label: "Webflow", slug: "webflow", icon: Layers, setup: "Other" },
  { label: "Framer", slug: "framer", icon: Frame, setup: "Other" },
  { label: "Shopify", slug: "shopify", icon: ShoppingBag, setup: "Other" },
  { label: "Showit", slug: "showit", icon: ImageIcon, setup: "Other" },
  { label: "GoDaddy", slug: "godaddy", icon: Server, setup: "Other" },
  { label: "FareHarbor", slug: "fareharbor", icon: Anchor, setup: "FareHarbor" },
  { label: "Peek", slug: "peek", icon: Compass, setup: "Other" },
  { label: "Rezdy", slug: "rezdy", icon: Ticket, setup: "Other" },
  // Catch-all
  { label: "Other", slug: "other", icon: MoreHorizontal, setup: "Other" },
];

/** Find the option matching a value the scanner returns (a `Platform`). */
export function platformOptionForScan(scanned: string): PlatformOption | undefined {
  return PLATFORM_OPTIONS.find((o) => o.label === scanned);
}

export const BOOKING_TYPES: {
  value: BookingType;
  icon: ComponentType<LucideProps>;
  desc: string;
}[] = [
  { value: "Form on my website", icon: FileText, desc: "Native form embedded on your site" },
  {
    value: "External Booking Link",
    icon: LinkIcon,
    desc: "Redirects guests to a third-party booking page (Peek, Journey, Calendly, etc.)",
  },
  { value: "FareHarbor", icon: Anchor, desc: "FareHarbor reservation platform" },
];

// Single webhook tracking script. The deployed tracking.js reads its settings
// from `window.GoldHive.config = { vendorId, webhookEndpoint }` and POSTs to the
// webhook on page load + form submit (capturing the submitted form's fields).
// One script, one cookie (gh_partner_id), 30-day window — no hidden fields, no
// BCC, no raw-GitHub script. SetupGuide shows this EXAMPLE shape with a
// placeholder id; each vendor's personalized snippet (with their real vendorId)
// is rendered on the wizard completion screen and emailed to them.
export const TRACKING_BASE = "https://gold-hive-attribution.vercel.app";
export const TRACKING_SNIPPET_EXAMPLE = buildTrackingSnippet(
  "YOUR_VENDOR_ID",
  TRACKING_BASE,
);

export const TARGET_UTM_EXAMPLE =
  "https://www.yoursite.com/book-online?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social";

export const EXTERNAL_LINK_EXAMPLE =
  "https://your-booking-system.com/reserve/?utm_source=goldhive&utm_medium=referral";

export const SUPPORT_NAME = "Christopher Turpin";
export const SUPPORT_EMAIL = "cturpin@goldhive.org";
export const PARTNER_ID = "GOLDHIVE";

// ---------------------------------------------------------------------------
// Click-by-click platform setup
// Each step is one concrete action: open / click / type / save.
// "loc" = where in the dashboard (the breadcrumb the user is currently in).
// ---------------------------------------------------------------------------

export interface ClickStep {
  /** What to do — written as an imperative ("Click X", "Paste Y"). */
  do: string;
  /** Optional clarification rendered as muted helper text under the step. */
  hint?: string;
}

export interface PlatformSetup {
  /** "Where you'll be working" — shown above the script-install steps. */
  scriptLocation: string;
  scriptSteps: ClickStep[];
  scriptNote?: string;
}

export const PLATFORM_SETUP: Record<Exclude<Platform, "FareHarbor" | "Other">, PlatformSetup> = {
  // -------------------------------- Squarespace
  Squarespace: {
    scriptLocation: "Squarespace dashboard → Settings → Advanced → Code Injection",
    scriptSteps: [
      { do: "Log in at squarespace.com and open the site you want to connect." },
      { do: 'In the left sidebar click "Settings".' },
      { do: 'Scroll down and click "Advanced".' },
      { do: 'Click "Code Injection".' },
      {
        do: 'Click inside the "FOOTER" text area (NOT the Header box).',
        hint: "Footer injection ensures the script loads after page content, which is what we need.",
      },
      { do: "Paste the entire <script> tag shown above." },
      { do: 'Click "Save" in the top-left of the page.' },
    ],
    scriptNote:
      "Code Injection requires a Business plan or higher. On Squarespace 7.1 some accounts show this under Settings → Developer Tools instead — same field, same behavior.",
  },

  // -------------------------------- Wix
  Wix: {
    scriptLocation: "Wix Editor → Settings → Custom Code",
    scriptSteps: [
      { do: "Open editor.wix.com and select the site you want to connect." },
      { do: 'In the top bar of the Editor click "Settings".' },
      { do: 'In the left menu click "Custom Code".' },
      { do: 'Click the "+ Add Custom Code" button (top right).' },
      { do: "Paste the entire <script> tag into the large code box." },
      {
        do: 'Name: "Gold Hive Tracking". Add Code to Pages: "All pages — Load code once". Place Code in: "Body — end".',
      },
      { do: 'Click "Apply".' },
      { do: "Publish your site (top-right Publish button) for the script to go live." },
    ],
    scriptNote:
      "Custom Code requires a paid Wix Premium plan and a connected custom domain. Free Wix sites cannot install third-party scripts.",
  },

  // -------------------------------- GoHighLevel
  GoHighLevel: {
    scriptLocation: "Sub-Account → Sites → Tracking Code (or Settings → Business Profile)",
    scriptSteps: [
      { do: "Log in to your GHL agency, then open the Sub-Account for this client." },
      { do: 'In the left sidebar click "Sites".' },
      { do: 'Click "Tracking Code" (some accounts show it under Settings → Business Profile).' },
      { do: 'Scroll to the "Footer Tracking Code" / "Body End" box.' },
      { do: "Paste the entire <script> tag." },
      { do: 'Click "Save".' },
    ],
    scriptNote:
      "If the site uses a GHL Funnel, also paste the script into Funnel → Settings → Tracking Code → Footer.",
  },

  // -------------------------------- Odoo
  Odoo: {
    scriptLocation: "Website → Configuration → Custom Code (Footer)",
    scriptSteps: [
      { do: "Log in to Odoo with an Administrator account." },
      { do: "From the apps grid open the Website module." },
      { do: 'Top menu: click "Configuration" → "Settings".' },
      { do: 'Scroll to "Website Info" and enable "Custom Code" if it is not already on.' },
      { do: 'Now go back to the live site and click "Edit" → "Customize" → "Theme Options" → "Custom Code".' },
      { do: 'Paste the <script> tag into the "Footer" / "Before </body>" slot.' },
      { do: 'Click "Save".' },
    ],
    scriptNote:
      "On Odoo Online (SaaS) Custom Code is restricted on the lowest plan. If unavailable, paste the script via Website → Pages → Manage Pages → SEO/Properties → Footer Code instead.",
  },
};

export const OTHER_PLATFORM_SETUP: PlatformSetup = {
  scriptLocation: "Your site's global footer template (footer.html, base.html, or theme settings)",
  scriptSteps: [
    {
      do: "Open the file or settings panel that controls your site's global footer.",
      hint: "Common locations: footer.html, base.html, _layouts/default.html, or a 'Custom Code / Footer Scripts' settings field.",
    },
    {
      do: "Paste the entire <script> tag immediately BEFORE the closing </body> tag.",
    },
    { do: "Save the file and deploy / publish the change." },
    {
      do: "Load any page on your site with ?gh_partner=YOUR_VENDOR_ID-style test link, open DevTools → Application → Cookies, and confirm the gh_partner_id cookie appears.",
      hint: "The script only sends data when that cookie is present, so this confirms it's live.",
    },
  ],
};

// -------------------------------- FareHarbor (Path C)
export const FAREHARBOR_SETUP = {
  affiliateName: "Gold Hive",
  partnerId: PARTNER_ID,
  steps: [
    { do: "Log in at fareharbor.com/dashboard with an account that has Admin permissions." },
    { do: 'In the top navigation click "Settings".' },
    { do: 'In the left sidebar click "Affiliates".' },
    { do: 'Click the green "+ Add Affiliate" button (top right).' },
    {
      do: 'Affiliate Name: "Gold Hive". Affiliate Code / Short Name: "GOLDHIVE" (uppercase, no spaces).',
      hint: "The code becomes the URL parameter (?fh_code=GOLDHIVE) used to attribute bookings.",
    },
    {
      do: "Commission: enter the rate from your Gold Hive partner agreement (FareHarbor will calculate per-booking automatically).",
    },
    { do: 'Click "Save".' },
  ] as ClickStep[],
};

// ---------------------------------------------------------------------------
// Interactive Coach additions: visual location hints, common mistakes, glossary
// ---------------------------------------------------------------------------

export interface VisualHint {
  /** Short headline like "Look for the gear icon" */
  headline: string;
  /** Bullet points describing landmarks (icon name, label, position) */
  landmarks: string[];
}

export interface Mistake {
  q: string;
  a: string;
}

export interface PlatformCoach {
  scriptWhere: VisualHint;
  scriptMistakes: Mistake[];
}

export const PLATFORM_COACH: Record<Exclude<Platform, "FareHarbor" | "Other">, PlatformCoach> = {
  Wix: {
    scriptWhere: {
      headline: "In the Wix Editor, look at the very top toolbar.",
      landmarks: [
        'Top of the screen, between "Pages" and "Tools" — the word "Settings" (no icon, just text).',
        'Click it, then on the LEFT sidebar that appears, find a code icon (</> shape) labeled "Custom Code".',
        'On the next screen, the button you want is in the TOP-RIGHT corner: a black "+ Add Custom Code" button.',
        'After pasting, the "Apply" button is in the bottom-right of the popup.',
      ],
    },
    scriptMistakes: [
      {
        q: "Help! I don't see Custom Code anywhere.",
        a: 'Wix only shows Custom Code if you have (1) a paid Premium plan AND (2) a custom domain connected. Free Wix sites and unpublished sites do not have this menu. Upgrade at wix.com/upgrade, then refresh.',
      },
      {
        q: "I pasted the script but nothing happens on the live site.",
        a: 'Wix requires you to PUBLISH after every Custom Code change — the editor preview won\'t fire it. Click the blue "Publish" button top-right of the editor.',
      },
    ],
  },

  Squarespace: {
    scriptWhere: {
      headline: "Settings is at the bottom of the home menu.",
      landmarks: [
        'From your dashboard click "Home" if not already there.',
        'Left rail, very bottom: gear icon labeled "Settings".',
        'Inside Settings, scroll the panel until you see "Advanced" (wrench icon, near the bottom).',
        'The next panel shows "Code Injection" — click it. Two big text areas appear: HEADER and FOOTER. You want FOOTER.',
      ],
    },
    scriptMistakes: [
      {
        q: "I don't see Code Injection under Advanced.",
        a: "Code Injection requires a Squarespace Business plan or higher. On Personal plans the menu is hidden. Upgrade under Settings → Billing.",
      },
      {
        q: "Squarespace 7.1 — there's no Advanced section.",
        a: "On 7.1 the same option lives under Settings → Developer Tools → Code Injection. Same field, same behavior.",
      },
    ],
  },

  GoHighLevel: {
    scriptWhere: {
      headline: "Tracking Code lives inside the Sub-Account, not the Agency view.",
      landmarks: [
        'Top-left dropdown: switch from "Agency View" to the specific Sub-Account for this client.',
        'Left sidebar: "Sites" (globe icon).',
        'Inside Sites, top tabs: "Funnels", "Websites", "Tracking Code". Click "Tracking Code".',
        'Two large text areas: HEADER and FOOTER (Body End). Use the FOOTER one.',
      ],
    },
    scriptMistakes: [
      {
        q: "I pasted the script but it's not loading.",
        a: "GHL caches aggressively. After saving Tracking Code, also republish each Funnel/Website that uses it (Sites → Funnels → ⋯ → Publish). For pure Funnels, also paste the script in Funnel → Settings → Tracking Code → Footer.",
      },
    ],
  },

  Odoo: {
    scriptWhere: {
      headline: "Custom Code is a theme option you have to enable first.",
      landmarks: [
        'From the apps grid pick the "Website" module (globe icon).',
        'Top menu of Website module: "Configuration" → "Settings".',
        'Toggle "Custom Code" ON, save.',
        'Now back on the live site, top-right: "Edit" → "Customize" tab → "Theme Options" → "Custom Code".',
      ],
    },
    scriptMistakes: [
      {
        q: "The Custom Code toggle isn't there.",
        a: "On Odoo Online's lowest plan, Custom Code is locked. As a workaround, paste the script via Website → Pages → (your page) → SEO/Properties → Footer Code.",
      },
    ],
  },
};

export const OTHER_PLATFORM_COACH: PlatformCoach = {
  scriptWhere: {
    headline: "Find your site's global footer template.",
    landmarks: [
      'For static sites: a file named footer.html, base.html, _layouts/default.html, or partials/footer.* in your repo.',
      'For Webflow / Framer / Carrd: Project Settings → Custom Code → Footer Code.',
      'For WordPress: Appearance → Theme File Editor → footer.php (paste before </body>).',
      'For Shopify: Online Store → Themes → Edit Code → theme.liquid (paste before </body>).',
    ],
  },
  scriptMistakes: [
    {
      q: "I pasted the script but the gh_partner_id cookie doesn't appear.",
      a: "Visit your site through a Gold Hive partner link (one carrying ?gh_partner=<id>), then check cookies. The script only sets the cookie — and only sends any data — when that partner parameter is present.",
    },
  ],
};

export const FAREHARBOR_COACH = {
  where: {
    headline: "Affiliates is in the FareHarbor Settings menu.",
    landmarks: [
      'Top navigation bar of fareharbor.com/dashboard: click "Settings" (gear icon, far right).',
      'Left sidebar of Settings: scroll to "Affiliates" — handshake icon, under "Sales & Marketing".',
      'Top-right green button: "+ Add Affiliate".',
    ],
  } as VisualHint,
  mistakes: [
    {
      q: "I don't see the Affiliates option.",
      a: "Affiliates requires Admin permissions. If you're a Manager or Staff role, ask your account owner to either grant you Admin access or add the affiliate themselves.",
    },
    {
      q: "Where do I find my commission rate?",
      a: "Use the rate from your signed Gold Hive partner agreement. If you can't find it, email cturpin@goldhive.org and we'll send you a copy.",
    },
  ] as Mistake[],
};

// ---------------------------------------------------------------------------
// Plain-English glossary — used by <Term> tooltips
// ---------------------------------------------------------------------------

export const GLOSSARY: Record<string, { short: string; long: string }> = {
  "persistence script": {
    short: "30-day attribution cookie",
    long: "A tiny piece of code that acts like a digital bookmark — when a guest clicks your Gold Hive link, it remembers them for 30 days so we can correctly attribute the booking even if they come back later.",
  },
  utm: {
    short: "URL tracking parameters",
    long: "UTM parameters are little tags added to the end of a link (?utm_source=goldhive...) that tell our system 'this visitor came from Gold Hive'. They are invisible to the guest.",
  },
  cookie: {
    short: "Browser memory",
    long: "A small piece of data stored in the guest's browser. We use one named gh_partner_id that lives for 30 days and remembers they came from a Gold Hive link. The script only sends anything to us while that cookie is present.",
  },
  devtools: {
    short: "Browser inspector",
    long: "DevTools is the developer panel built into every browser. Open it with F12 (or right-click → Inspect). You'll use it once to verify the script is running.",
  },
  affiliate: {
    short: "Tracked partner",
    long: "FareHarbor's built-in system for tracking which partner sent a booking. Adding Gold Hive as an affiliate is all you need — no scripts, no form fields.",
  },
  "code injection": {
    short: "Custom HTML slot",
    long: "Squarespace's name for the boxes where you can paste custom HTML or JavaScript. The Footer box loads code on every page after the rest of the page has rendered.",
  },
};

// ---------------------------------------------------------------------------
// Per-provider EXTERNAL BOOKING instructions (Path B)
// Used when the user's bookings happen on a third-party checkout we cannot
// inject scripts into. Each entry tells the partner exactly how to grab their
// own provider booking URL and where UTM tagging is preserved (or lost).
// ---------------------------------------------------------------------------

export interface ProviderSetup {
  /** Friendly provider name as we display it. */
  displayName: string;
  /** Where in their dashboard the bookable URL lives. */
  locationLabel: string;
  /** Click-by-click steps to (a) get the canonical booking URL and (b) confirm UTMs pass through. */
  steps: ClickStep[];
  /** Plain-English visual landmarks for the "Show me where this is" panel. */
  where: VisualHint;
  /** Provider-specific gotchas. */
  mistakes: Mistake[];
  /** Optional one-line note about UTM forwarding behavior on this provider. */
  utmNote?: string;
}

export const PROVIDER_SETUP: Record<string, ProviderSetup> = {
  // ----------------------------------------------------------- Peek
  Peek: {
    displayName: "Peek Pro",
    locationLabel: "Peek Pro dashboard → Marketing → Book Now Button / Direct Booking Link",
    steps: [
      { do: "Log in at peekpro.com (the back-office, not peek.com)." },
      { do: 'Top navigation: click "Marketing" → "Book Now Button".' },
      {
        do: "Find the activity (or 'All Activities') you want to send Gold Hive guests to and copy the Direct Booking Link shown next to it.",
        hint: "It usually looks like https://book.peek.com/{your-shortname}/...",
      },
      {
        do: "On the URL we generated for you (the gold box above), REPLACE the example domain with your Peek booking link, keeping the ?utm_source=goldhive&utm_medium=referral&utm_campaign=...&utm_id=... query string at the end.",
        hint: "Final shape: https://book.peek.com/your-shortname/activity-id?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' button on your website." },
      {
        do: "Test in incognito: open one Book Now button, then click View Cart on Peek and confirm the URL still contains ?utm_source=goldhive.",
        hint: "Peek preserves UTM params through checkout natively — no extra config needed.",
      },
    ],
    where: {
      headline: "Direct Booking Links live in Peek's Marketing menu.",
      landmarks: [
        'Top nav (dark blue bar): "Marketing" — second from the right, between "Reports" and "Settings".',
        'Sub-menu drops down — pick "Book Now Button".',
        'A table of all your activities appears with a column called "Direct Link" and a copy icon at the right edge of each row.',
      ],
    },
    mistakes: [
      {
        q: "Peek wraps my link in their 'Trip Builder' redirect and the UTMs disappear.",
        a: "That's the Peek widget URL, not the Direct Booking Link. Use the link from Marketing → Book Now Button (it points to book.peek.com directly). The widget redirect strips query strings; the Direct Booking Link does not.",
      },
      {
        q: "I have many activities — do I need a different link per activity?",
        a: "No. Use your account-level booking page (book.peek.com/{your-shortname}) and the same UTM tail. Peek attributes the activity the guest ends up purchasing automatically.",
      },
    ],
    utmNote: "Peek preserves UTM query parameters through their entire checkout flow — no extra setup required.",
  },

  // ----------------------------------------------------------- Rezdy
  Rezdy: {
    displayName: "Rezdy",
    locationLabel: "Rezdy dashboard → Channel Manager → Marketplace / Direct Booking",
    steps: [
      { do: "Log in at app.rezdy.com." },
      { do: 'Left sidebar: click "Channel Manager" (it has a globe icon).' },
      {
        do: 'Click the "Direct Booking Page" tab and copy the URL shown — it looks like https://app.rezdy.com/booking?supplierId=12345',
      },
      {
        do: "Append the Gold Hive UTM tail to that URL: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social (use & if a ? is already in the URL).",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' button." },
      {
        do: "Test in incognito and confirm the UTM params survive on the checkout page.",
        hint: "If they're stripped, contact Rezdy support and ask them to enable 'Pass-through UTM parameters' on your account — it's a one-click setting on their side.",
      },
    ],
    where: {
      headline: "Channel Manager has the Direct Booking URL.",
      landmarks: [
        'Left rail: globe icon labeled "Channel Manager".',
        'Top tabs once you click in: "Marketplace", "Direct Booking", "Reseller Network".',
        '"Direct Booking" is the second tab. Your URL is the big copy-to-clipboard box at the top.',
      ],
    },
    mistakes: [
      {
        q: "My UTMs disappear at checkout.",
        a: "Rezdy strips query parameters by default unless 'Pass-through UTM parameters' is enabled. It's a free toggle — open a support ticket and ask them to flip it on (takes 24 hrs).",
      },
    ],
    utmNote: "Rezdy requires 'Pass-through UTM parameters' to be enabled (free, one-time support ticket).",
  },

  // ----------------------------------------------------------- Checkfront
  Checkfront: {
    displayName: "Checkfront",
    locationLabel: "Checkfront dashboard → Manage → Bookings → Booking Page URL",
    steps: [
      { do: "Log in at your Checkfront subdomain (yourname.checkfront.com)." },
      { do: 'Top menu: click "Manage" → "Bookings".' },
      {
        do: 'In the right panel under "Booking Page", copy the URL — it looks like https://yourname.checkfront.com/reserve/',
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL on every 'Book Now' button on your website." },
      {
        do: "Open Checkfront → Setup → Layout → Tracking → enable 'Forward URL Parameters'. This makes UTMs persist through the entire checkout.",
        hint: "Without this toggle, UTMs are dropped on the second page of checkout.",
      },
    ],
    where: {
      headline: "Forward URL Parameters is buried in Setup → Layout → Tracking.",
      landmarks: [
        'Top menu: "Setup" (gear icon).',
        'Sub-menu: "Layout".',
        'Inside Layout, the rightmost tab is "Tracking" — Google Analytics + URL Parameters live here.',
        '"Forward URL Parameters" toggle — flip ON, then click Save.',
      ],
    },
    mistakes: [
      {
        q: "Where is the Tracking tab?",
        a: "Setup → Layout → Tracking. If you only see Setup → Layout (no Tracking tab), your account plan doesn't include it. Upgrade to Soar+ or use the Checkfront-built widget which preserves UTMs by default.",
      },
    ],
    utmNote: "Checkfront preserves UTMs only if 'Forward URL Parameters' is enabled in Setup → Layout → Tracking.",
  },

  // ----------------------------------------------------------- Bokun
  Bokun: {
    displayName: "Bokun",
    locationLabel: "Bokun dashboard → Sales Tools → Booking Channels → Direct Sales",
    steps: [
      { do: "Log in at bokun.io." },
      { do: 'Left sidebar: click "Sales Tools" → "Booking Channels".' },
      {
        do: 'Click the "Direct Sales" channel — your booking URL is at the top: https://widgets.bokun.io/online-sales/{your-id}',
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' button." },
      {
        do: "Bokun preserves UTMs through checkout by default — no extra config. Test in incognito to confirm.",
      },
    ],
    where: {
      headline: "Direct Sales channel has the URL.",
      landmarks: [
        'Left sidebar: "Sales Tools" (cart icon).',
        'Sub-menu: "Booking Channels".',
        'A list of channels appears — "Direct Sales" is always the first one. Click in.',
        'The URL field is at the very top with a copy button.',
      ],
    },
    mistakes: [
      {
        q: "I don't see Direct Sales in my channels.",
        a: "Direct Sales is enabled by default on every Bokun account. If it's missing, click '+ New Channel' and create one of type 'Direct Sales' — takes 30 seconds.",
      },
    ],
    utmNote: "Bokun preserves UTM parameters through checkout natively.",
  },

  // ----------------------------------------------------------- Calendly
  Calendly: {
    displayName: "Calendly",
    locationLabel: "Calendly dashboard → Event Type → Share → Add to Website / Copy Link",
    steps: [
      { do: "Log in at calendly.com." },
      { do: 'On the home dashboard, find the event type you want guests to book and click "Share".' },
      {
        do: 'Copy the "Calendly Link" — it looks like https://calendly.com/yourname/intro-call',
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' / 'Schedule' button." },
      {
        do: "In Calendly: Account → Integrations & Apps → 'UTM Tracking' — turn it ON.",
        hint: "When enabled, UTMs from the link land on the booking record and survive every redirect.",
      },
    ],
    where: {
      headline: "UTM Tracking is in your Account, not the Event Type.",
      landmarks: [
        'Top-right: avatar dropdown → "Account Settings".',
        'Left sidebar: "Integrations & Apps".',
        'Scroll the integrations grid — "UTM Tracking" is in the bottom row, marked with a chart icon.',
        'Toggle it ON and click "Save".',
      ],
    },
    mistakes: [
      {
        q: "UTMs aren't showing up on the booking confirmation.",
        a: "Make sure UTM Tracking is toggled ON under Account → Integrations & Apps. Calendly drops UTMs by default. Once enabled, you'll see a UTM Source column in the bookings export and on each booking record.",
      },
      {
        q: "Can I bake the UTM into the link permanently?",
        a: "Yes — that's exactly what we did above. The link with the ?utm_source=goldhive tail is the only one that should appear on your site for Gold Hive referrals.",
      },
    ],
    utmNote: "Enable Account → Integrations & Apps → UTM Tracking — it's free but OFF by default.",
  },

  // ----------------------------------------------------------- Acuity
  Acuity: {
    displayName: "Acuity Scheduling",
    locationLabel: "Acuity dashboard → Client's Scheduling Page link / Direct Scheduling URL",
    steps: [
      { do: "Log in at acuityscheduling.com (or via Squarespace → Scheduling)." },
      { do: 'Left sidebar: "Client\'s Scheduling Page".' },
      {
        do: 'Copy the "Scheduling page link" — it looks like https://yourname.as.me/ or https://app.acuityscheduling.com/schedule.php?owner=12345',
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' button." },
      {
        do: "Acuity preserves UTM query parameters in the booking confirmation email automatically — they show up in the 'Source' field of each appointment.",
      },
    ],
    where: {
      headline: "The scheduling link is the first thing on the page.",
      landmarks: [
        'Left sidebar: calendar icon labeled "Client\'s Scheduling Page".',
        'A blue box at the top contains the URL with a "Copy" button next to it.',
        'Below that is a long list of embed code options — IGNORE those. You only want the plain URL.',
      ],
    },
    mistakes: [
      {
        q: "The 'Source' field on my appointments is blank.",
        a: "Acuity only records the source when the visitor lands on the scheduling page WITH the UTM in the URL. If your Book Now button strips the query string, the source will be blank. Test in incognito.",
      },
    ],
    utmNote: "Acuity natively records UTM source on every appointment — no extra setup.",
  },

  // ----------------------------------------------------------- Mindbody
  Mindbody: {
    displayName: "Mindbody",
    locationLabel: "Mindbody Business → Marketing → Branded Web → Healcode link",
    steps: [
      { do: "Log in to your Mindbody Business account at clients.mindbodyonline.com." },
      { do: 'Top menu: "Marketing" → "Branded Web".' },
      {
        do: "Copy your studio's branded scheduling URL — it looks like https://clients.mindbodyonline.com/classic/ws?studioid=12345",
        hint: "If you use Healcode widgets, the URL is at clients.mindbodyonline.com/Asp/su1.asp?studioid=12345",
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social (use & if the URL already has a ?).",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' button." },
      {
        do: "In Mindbody: Settings → Online Settings → 'Tracking & Analytics' → enable 'Pass URL Parameters'.",
        hint: "Without this, Mindbody drops query strings between the catalog page and checkout.",
      },
    ],
    where: {
      headline: "Tracking & Analytics is under Online Settings.",
      landmarks: [
        'Top menu: "Settings" (gear icon).',
        'Left sub-menu: "Online Settings" (NOT "Business Information").',
        'Scroll to the bottom — "Tracking & Analytics" section.',
        '"Pass URL Parameters" toggle, then "Save Changes" at the very bottom of the page.',
      ],
    },
    mistakes: [
      {
        q: "I see TWO scheduling URLs (Healcode and the legacy one) — which?",
        a: "Use the one that matches what's currently on your site. If you embed Healcode widgets, use the Healcode URL. If you redirect guests off-site, use the Branded Web URL. Both accept the same UTM tail.",
      },
      {
        q: "UTMs disappear on the payment screen.",
        a: "Mindbody requires 'Pass URL Parameters' to be ON in Settings → Online Settings → Tracking & Analytics. It's free but OFF by default.",
      },
    ],
    utmNote: "Enable Settings → Online Settings → Tracking & Analytics → 'Pass URL Parameters'.",
  },

  // ----------------------------------------------------------- Vagaro
  Vagaro: {
    displayName: "Vagaro",
    locationLabel: "Vagaro dashboard → Settings → Online Booking → Direct Booking URL",
    steps: [
      { do: "Log in at pros.vagaro.com." },
      { do: 'Left sidebar: "Settings" (gear icon).' },
      { do: 'In the Settings menu: "Online Settings" → "Online Booking".' },
      {
        do: "Copy your business's direct booking URL — it looks like https://www.vagaro.com/yourbusinessname (the friendly URL) or https://www.vagaro.com/Users/BusinessWidget.aspx?eid=12345",
        hint: "Use the friendly URL (vagaro.com/yourbusinessname) wherever possible — UTMs survive cleanly on it.",
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' button on your website." },
      {
        do: "In Vagaro: Settings → Marketing → Tracking → enable 'Pass-through Marketing Parameters'.",
        hint: "Vagaro drops UTMs after the service-selection page unless this toggle is ON.",
      },
      {
        do: "Test in incognito: click your Book Now button, walk through to the appointment-time picker, and confirm the URL still contains ?utm_source=goldhive.",
      },
    ],
    where: {
      headline: "Online Booking lives in Settings → Online Settings.",
      landmarks: [
        'Left sidebar (dark purple): bottom item — "Settings" (gear icon).',
        'A second panel slides out — pick "Online Settings".',
        'Inside Online Settings, top tab: "Online Booking".',
        'Your direct URL is in the box labeled "Direct Booking URL" with a Copy icon to its right.',
        'For the UTM toggle: Settings → Marketing → Tracking (different menu).',
      ],
    },
    mistakes: [
      {
        q: "I have BOTH a friendly URL and a long widget URL — which?",
        a: "Use the friendly URL (vagaro.com/yourbusinessname) — it's cleaner, easier to QA, and UTMs survive on it more reliably than on the BusinessWidget.aspx variant.",
      },
      {
        q: "UTMs disappear when guests pick a service.",
        a: "Vagaro strips query parameters between the landing page and the booking funnel unless 'Pass-through Marketing Parameters' is ON. Find it under Settings → Marketing → Tracking.",
      },
      {
        q: "I can't find the Tracking section under Marketing.",
        a: "On older Vagaro plans, this lives under Settings → Online Settings → Online Booking → 'Advanced Settings' instead. The toggle name is the same. If neither location exists, contact Vagaro support and ask for the 'UTM pass-through' feature flag — it's free but sometimes hidden behind enablement.",
      },
    ],
    utmNote: "Vagaro requires Settings → Marketing → Tracking → 'Pass-through Marketing Parameters' to be enabled.",
  },

  // ----------------------------------------------------------- LeadConnector / GHL Calendar
  LeadConnector: {
    displayName: "LeadConnector (GoHighLevel) Calendar",
    locationLabel: "GHL Sub-Account → Calendars → {your calendar} → Share → Permanent Link",
    steps: [
      { do: "Log in to your LeadConnector / GoHighLevel sub-account (the one that owns the calendar guests book on)." },
      { do: 'Left sidebar: click "Calendars" (calendar icon, near the bottom).' },
      { do: 'Top tabs: "Calendar Settings" → click the calendar guests use to book Gold Hive referrals.' },
      {
        do: 'In the calendar drawer, click the "Share" tab and copy the "Permanent Link" — it looks like https://api.leadconnectorhq.com/widget/booking/{calendarId} or https://link.{your-subdomain}.com/widget/bookings/{slug}',
        hint: "Use the Permanent Link, NOT the embed code. The embed code is an iframe and strips UTMs across the iframe boundary.",
      },
      {
        do: "Append the Gold Hive UTM tail: ?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social",
      },
      { do: "Use that finished URL as the destination of every 'Book Now' / 'Schedule' button on your website." },
      {
        do: "In GHL: Settings → URL Redirects is NOT what you want. Instead, open Calendars → {your calendar} → Advanced → Forms & Payment → enable 'Pass URL Parameters to Custom Fields'.",
        hint: "Then add a Custom Field named 'Referral Source' (Field Key: referral_source) on the booking form. The UTM source will land in that field on every booking record.",
      },
      {
        do: "Test in incognito: click your Book Now button, walk through to the confirmation, and check the booking record in GHL → Conversations / Contacts → Custom Fields. You should see 'goldhive' in Referral Source.",
      },
    ],
    where: {
      headline: "The Permanent Link is on the calendar's Share tab — UTM toggle is on the calendar's Advanced tab.",
      landmarks: [
        'Left sidebar (dark): calendar icon labeled "Calendars".',
        'Top tabs: "Calendar Settings" — pick the calendar from the list.',
        'A right-side drawer slides out with tabs: "Meeting Details", "Availability", "Forms & Payment", "Notifications", "Confirmation", "Advanced", "Share".',
        'Permanent Link: the "Share" tab — first big copy box.',
        'UTM pass-through: the "Advanced" tab → "Pass URL Parameters to Custom Fields" toggle.',
      ],
    },
    mistakes: [
      {
        q: "I only see an embed iframe code, no Permanent Link.",
        a: "On the Share tab, scroll past the iframe code — the Permanent Link is the URL field above (or below, depending on GHL version). If your plan only shows the iframe, switch the calendar's 'Widget Type' to 'Neo' on the Advanced tab — Neo widgets expose a Permanent Link.",
      },
      {
        q: "UTMs don't appear on the booking record.",
        a: "Two things must be true: (1) 'Pass URL Parameters to Custom Fields' is ON in Calendar → Advanced, and (2) a Custom Field with Field Key 'referral_source' exists on the booking form. GHL auto-generates field keys — open the field's gear icon and rename the key manually if needed.",
      },
      {
        q: "Should I use my white-label link.{subdomain}.com URL or the raw api.leadconnectorhq.com URL?",
        a: "Use whichever appears in the Permanent Link box. The white-label one is friendlier; both pass UTMs identically. Don't mix and match — pick one and use it everywhere.",
      },
      {
        q: "Our site IS built on GoHighLevel. Should I be on this guide?",
        a: "No — go back to Step 1 and pick 'GoHighLevel' as your platform. That path uses the agency-wide tracking script and is much faster. This LeadConnector guide is only for sites NOT built on GHL that embed/link to a GHL calendar.",
      },
    ],
    utmNote: "LeadConnector requires Calendar → Advanced → 'Pass URL Parameters to Custom Fields' ON, plus a Custom Field with key 'referral_source' on the booking form.",
  },
};

/**
 * Look up provider-specific setup data by detected provider name.
 * Returns null if we don't have a custom guide — caller should fall back to
 * the generic external-link instructions.
 */
export function getProviderSetup(provider: string | undefined): ProviderSetup | null {
  if (!provider) return null;
  // Case-insensitive lookup; tolerate partial matches like "Square Appointments".
  const key = Object.keys(PROVIDER_SETUP).find(
    (k) => provider.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? PROVIDER_SETUP[key] : null;
}
