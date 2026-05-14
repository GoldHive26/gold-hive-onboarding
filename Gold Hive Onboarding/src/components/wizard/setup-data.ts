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
  type LucideProps,
} from "lucide-react";

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

// EXACT script from Gold Hive Partner Integration Protocol v1.2 (canonical)
export const TRACKING_SCRIPT = `<script src="https://raw.githubusercontent.com/GoldHive26/partner-tracking/refs/heads/main/tracking.js"></script>`;

export const TARGET_UTM_EXAMPLE =
  "https://www.yoursite.com/book-online?utm_source=goldhive&utm_medium=referral&utm_campaign=YourBrand%26goldhive&utm_id=YourBrand_Social";

export const EXTERNAL_LINK_EXAMPLE =
  "https://your-booking-system.com/reserve/?utm_source=goldhive&utm_medium=referral";

export const HIDDEN_FIELD_HTML = `<input type="hidden" name="referral_source" id="referral_source" value="" />`;

export const BCC_EMAIL = "bookings@goldhive.org";
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

  /** Where to add the hidden referral_source field. */
  fieldLocation: string;
  fieldSteps: ClickStep[];
  fieldNote?: string;

  /** Conditional BCC rule wiring. */
  bccLocation: string;
  bccSteps: ClickStep[];
  bccNote?: string;
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

    fieldLocation: "Edit page → Form Block → Edit Form Fields",
    fieldSteps: [
      { do: "From the dashboard, click Pages and open the page that contains your booking form." },
      { do: 'Hover over the form and click "Edit".' },
      { do: 'Click the form block, then click "Edit Form Fields".' },
      { do: 'Click "+ Add Field" and choose the "Text" field type.' },
      {
        do: 'In the Field Title type "referral_source" exactly (lowercase, underscore).',
        hint: "Squarespace uses the title to generate the field name — spelling matters.",
      },
      {
        do: 'Open the "Advanced" tab on the field and toggle "Hidden" ON. Leave the default value blank.',
      },
      { do: 'Click "Apply", then "Save" on the page.' },
    ],
    fieldNote: "Hidden form fields require the Business plan or higher.",

    bccLocation: "Settings → Email & Notifications (or Selling → Customer Notifications)",
    bccSteps: [
      { do: 'Squarespace does not support conditional BCC natively. Instead, connect Zapier (free tier works).' },
      { do: 'In Zapier create a new Zap. Trigger: "Squarespace → New Form Submission".' },
      { do: 'Add a Filter step: only continue if "referral_source" exactly matches "goldhive".' },
      {
        do: `Action: "Email by Zapier → Send Outbound Email" → To: ${BCC_EMAIL}, Subject: "GH Booking — {{form.name}}", Body: include all form fields.`,
      },
      { do: "Turn the Zap ON." },
    ],
    bccNote: "If you already use a Squarespace Scheduling/Acuity flow, set up the BCC filter inside Acuity's Automations instead.",
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

    fieldLocation: "Wix Editor → your booking form → Add Field → Hidden Field",
    fieldSteps: [
      { do: "In the Editor, click the booking/contact form on the page." },
      { do: 'Click "Edit Form" (or "Manage Fields").' },
      { do: 'Click "+ Add New Field" and scroll to the "Advanced" section.' },
      { do: 'Choose "Hidden Field".' },
      {
        do: 'Field Name: type "referral_source" exactly. Default Value: leave blank.',
      },
      { do: 'Click "Done", then publish the site.' },
    ],

    bccLocation: "Wix dashboard → Automations",
    bccSteps: [
      { do: "From your Wix dashboard click Automations in the left rail." },
      { do: '"+ New Automation" → choose "Start from Scratch".' },
      { do: 'Trigger: "Wix Forms → Form is submitted". Select your booking form.' },
      { do: 'Add Condition: field "referral_source" equals "goldhive".' },
      { do: `Action: "Send an Email" → BCC field: ${BCC_EMAIL}. Include all form fields in the body.` },
      { do: 'Click "Activate".' },
    ],
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

    fieldLocation: "Sites → Forms → your booking form → Add Field",
    fieldSteps: [
      { do: 'In the sub-account sidebar click "Sites" → "Forms".' },
      { do: "Open the booking form you want guests to use." },
      { do: 'From the right-hand "Custom Fields" panel drag a "Single Line" field onto the form.' },
      { do: 'Field Label: "referral_source". Field Key (auto-generates): make sure it reads "referral_source".' },
      { do: 'Open the field settings (gear icon) and toggle "Hidden Field" ON.' },
      { do: "Save the form, then re-embed it on the page if you copied an embed snippet." },
    ],

    bccLocation: "Automation → Workflows",
    bccSteps: [
      { do: "Sub-Account sidebar → Automation → Workflows → + Create Workflow." },
      { do: 'Trigger: "Form Submitted" → choose your booking form.' },
      { do: 'Add a Filter on the trigger: "referral_source" — Equals — "goldhive".' },
      { do: `Add Action "Send Email". To: ${BCC_EMAIL}. Subject: "GH Booking — {{contact.first_name}}". Body: include {{form.*}} fields.` },
      { do: "Save and publish the workflow (toggle from Draft → Published)." },
    ],
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

    fieldLocation: "Website Form Builder → your booking form",
    fieldSteps: [
      { do: "Open the page with the booking form on the public site." },
      { do: 'Click "Edit" in the top right.' },
      { do: "Click the form, then in the right panel click + Field." },
      { do: 'Set Type to "Custom Field" → "Hidden".' },
      { do: 'Label: "referral_source". Default value: leave blank.' },
      { do: 'Click Save (top-right cloud icon).' },
    ],

    bccLocation: "Settings → Technical → Email → Outgoing Mail Servers + Automated Actions",
    bccSteps: [
      { do: "Enable Developer Mode (Settings → Activate the developer mode at bottom)." },
      { do: "Go to Settings → Technical → Automation → Automated Actions." },
      { do: 'Create new: Model = "Form Submission" (or your booking model). Trigger = "On Creation".' },
      {
        do: 'Add a Filter: referral_source = "goldhive".',
      },
      {
        do: `Action Type: "Send Email". Template: create one with To/BCC = ${BCC_EMAIL}, body containing the form fields.`,
      },
      { do: "Save the rule." },
    ],
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
      do: "Load any page on your site, open DevTools → Console, type document.cookie, and confirm 'gh_referral' appears (after visiting with ?utm_source=goldhive).",
    },
  ],

  fieldLocation: "The HTML of your booking form",
  fieldSteps: [
    { do: "Open the HTML file or template that renders your booking / contact form." },
    {
      do: 'Inside the <form> tag, paste: <input type="hidden" name="referral_source" id="referral_source" value="" />',
    },
    {
      do: 'Make sure the field name is exactly "referral_source" (lowercase, underscore — not camelCase or hyphen).',
    },
    { do: "Save and deploy." },
  ],

  bccLocation: "Your booking system's email / notification settings",
  bccSteps: [
    { do: "Open the admin settings for whatever sends your customer confirmation emails." },
    {
      do: `Add a conditional BCC rule: IF the booking's "referral_source" field equals "goldhive", BCC ${BCC_EMAIL}.`,
    },
    {
      do: 'If your platform cannot do conditional BCC, build the same logic in Zapier or Make.com (trigger on submission → filter on referral_source = "goldhive" → email).',
      hint: "We can help — email cturpin@goldhive.org with your stack and we'll send a tested workflow template.",
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
    {
      do: 'Optional but recommended: under "Email Notifications" add bookings@goldhive.org so we receive the booking copy automatically.',
    },
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
  fieldWhere: VisualHint;
  bccWhere: VisualHint;
  scriptMistakes: Mistake[];
  fieldMistakes: Mistake[];
  bccMistakes: Mistake[];
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
    fieldWhere: {
      headline: "On your form, the field menu is on the right.",
      landmarks: [
        'Click the form once on the canvas — a floating toolbar appears with "Add New Field".',
        'A right-side panel slides out with field categories. Scroll to "Advanced" — "Hidden Field" is the last option, marked with an eye-with-slash icon.',
      ],
    },
    bccWhere: {
      headline: "Automations live in the Wix dashboard, NOT the editor.",
      landmarks: [
        'Go to manage.wix.com (the dashboard, not the editor) and pick your site.',
        'Left rail: scroll until you see "Automations" — lightning-bolt icon, near "Marketing & SEO".',
        'Top-right: orange "+ New Automation" button.',
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
    fieldMistakes: [
      {
        q: "My form doesn't have a Hidden Field option.",
        a: "Add a normal Single Line Text field, then in its right-panel settings open the 'Advanced' tab and toggle 'Hide on Form' ON. Same end result.",
      },
      {
        q: "The field name has a weird suffix like referral_source_a3f2.",
        a: "Wix sometimes appends a hash. Click the field, open Settings → Field Name, and manually type 'referral_source' (lowercase, underscore). Save and republish.",
      },
    ],
    bccMistakes: [
      {
        q: "Automation runs but no email arrives at bookings@goldhive.org.",
        a: "Check the Condition step — the value 'goldhive' is case-sensitive and must be exact. Also confirm your form's hidden field is named 'referral_source' (Step 2) — the automation reads from that exact field name.",
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
    fieldWhere: {
      headline: "Form fields are edited from the page editor.",
      landmarks: [
        'Pages menu → click the page with your form → "Edit" (top-right).',
        'Hover the form on the canvas — a pencil icon appears. Click it.',
        'A modal opens. Click "Edit Form Fields", then "+ Add Field".',
        'After adding the field, click it and use the "Advanced" tab inside the field settings to mark it Hidden.',
      ],
    },
    bccWhere: {
      headline: "Squarespace doesn't do conditional BCC natively — use Zapier.",
      landmarks: [
        'Go to zapier.com and sign in (free tier works).',
        '"+ Create Zap" button, top-left.',
        'Trigger app: "Squarespace". Trigger event: "New Form Submission".',
        'Then "+ Filter" step → only continue if referral_source = goldhive.',
        'Action app: "Email by Zapier" → "Send Outbound Email".',
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
    fieldMistakes: [
      {
        q: "There's no 'Hidden' toggle on my field.",
        a: "Squarespace hidden fields require the Business plan. On Personal plans, use a regular text field and hide it with custom CSS instead — email cturpin@goldhive.org and we'll send the snippet.",
      },
    ],
    bccMistakes: [
      {
        q: "My Zap isn't triggering.",
        a: "Squarespace's Zapier integration requires you to submit the form once after connecting it — Zapier needs a 'sample' submission to map fields. Submit a test entry, then re-publish the Zap.",
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
    fieldWhere: {
      headline: "Custom fields are dragged in from the right panel.",
      landmarks: [
        'Sites → Forms → open your booking form.',
        'Right side: "Custom Fields" panel with a search bar.',
        'Drag "Single Line" onto the form canvas. Then click the field — its settings (gear icon) open on the right.',
        'Toggle "Hidden Field" inside the field settings.',
      ],
    },
    bccWhere: {
      headline: "Workflows are in the Automation menu.",
      landmarks: [
        'Left sidebar: "Automation" (lightning icon).',
        '"Workflows" tab → "+ Create Workflow" → start blank.',
        'Add Trigger: search "Form Submitted" — pick your booking form.',
        'On the trigger card itself, click "Filter" and add referral_source = goldhive.',
        'Then "+ Add Action" → "Send Email".',
      ],
    },
    scriptMistakes: [
      {
        q: "I pasted the script but it's not loading.",
        a: "GHL caches aggressively. After saving Tracking Code, also republish each Funnel/Website that uses it (Sites → Funnels → ⋯ → Publish). For pure Funnels, also paste the script in Funnel → Settings → Tracking Code → Footer.",
      },
    ],
    fieldMistakes: [
      {
        q: "My field key shows as 'contact.referral_source_xyz' — different from the others.",
        a: "GHL auto-generates field keys. Open the field's gear icon → Field Key → manually rename to 'referral_source'. Save and re-embed the form on the page.",
      },
    ],
    bccMistakes: [
      {
        q: "Workflow is published but emails aren't sending.",
        a: "Check that the workflow status is 'Published' (not 'Draft') — top-right toggle. Also confirm your sub-account has a verified sending domain under Settings → Email Services.",
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
    fieldWhere: {
      headline: "Edit the form on the public page itself.",
      landmarks: [
        'Open the live page with the booking form.',
        'Top-right: "Edit" button.',
        'Click the form — a right panel appears with form blocks.',
        '"+ Field" button → choose Type "Custom Field" → then change to "Hidden".',
      ],
    },
    bccWhere: {
      headline: "Automated Actions only show when Developer Mode is on.",
      landmarks: [
        'Settings module → scroll to bottom → "Activate Developer Mode".',
        'Now Settings → Technical → Automation → "Automated Actions".',
        '"Create" button (top-left).',
      ],
    },
    scriptMistakes: [
      {
        q: "The Custom Code toggle isn't there.",
        a: "On Odoo Online's lowest plan, Custom Code is locked. As a workaround, paste the script via Website → Pages → (your page) → SEO/Properties → Footer Code.",
      },
    ],
    fieldMistakes: [
      {
        q: "I can't change the field type to Hidden.",
        a: "After dragging the field, you must click it ONCE and use the right-panel 'Type' dropdown. If it's grayed out, the form is a system form (e.g. Contact Us) — duplicate it as a Custom Form first.",
      },
    ],
    bccMistakes: [
      {
        q: "My Automated Action runs but doesn't send.",
        a: "Check Settings → Technical → Email → Outgoing Mail Servers. Without a configured outgoing server, Odoo silently drops the email. Use your existing SMTP creds or Sendgrid.",
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
  fieldWhere: {
    headline: "Open the HTML or template that renders your booking form.",
    landmarks: [
      'Look for a <form> tag in your page template.',
      'Paste the hidden input anywhere INSIDE the <form>...</form> tags.',
      'If using a form builder (Typeform, Tally, Jotform), look for "Hidden Fields" in the form settings.',
    ],
  },
  bccWhere: {
    headline: "Open your booking system's notification settings.",
    landmarks: [
      'Most booking platforms have Settings → Notifications or Settings → Email Templates.',
      'If conditional BCC is not supported, build the same logic in Zapier or Make.com.',
    ],
  },
  scriptMistakes: [
    {
      q: "I pasted the script but the gh_referral cookie doesn't appear.",
      a: "Visit your site with ?utm_source=goldhive in the URL (e.g. yoursite.com/?utm_source=goldhive), then check cookies. The script only sets the cookie when that parameter is present.",
    },
  ],
  fieldMistakes: [
    {
      q: "My form builder doesn't support hidden fields.",
      a: "Add a regular short-text field and hide it with CSS: <style>input[name='referral_source']{display:none}</style>. Email us if you need help wiring this for your specific tool.",
    },
  ],
  bccMistakes: [
    {
      q: "I don't know how to set up a conditional BCC.",
      a: "Use Zapier as a universal bridge: Trigger = your form/booking tool's 'New Submission'. Filter = referral_source equals goldhive. Action = Email by Zapier → BCC bookings@goldhive.org.",
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
  bcc: {
    short: "Blind Carbon Copy",
    long: "BCC means Blind Carbon Copy. It sends a silent digital receipt to us automatically so we can pay you commission, without the customer ever seeing our email address on their booking confirmation.",
  },
  "persistence script": {
    short: "30-day attribution cookie",
    long: "A tiny piece of code that acts like a digital bookmark — when a guest clicks your Gold Hive link, it remembers them for 30 days so we can correctly attribute the booking even if they come back later.",
  },
  utm: {
    short: "URL tracking parameters",
    long: "UTM parameters are little tags added to the end of a link (?utm_source=goldhive...) that tell our system 'this visitor came from Gold Hive'. They are invisible to the guest.",
  },
  "hidden field": {
    short: "Invisible form input",
    long: "A form field that exists in the page's code but is not visible to the guest. Our script silently writes 'goldhive' into it so we know the booking came from us.",
  },
  "conditional bcc": {
    short: "Smart BCC rule",
    long: "A rule that only BCCs us when a SPECIFIC condition is true (in this case: the guest came from Gold Hive). Bookings from other sources are never sent to us — your customer data stays private.",
  },
  cookie: {
    short: "Browser memory",
    long: "A small piece of data stored in the guest's browser. We use one named gh_referral that lives for 30 days and remembers they came from a Gold Hive link.",
  },
  devtools: {
    short: "Browser inspector",
    long: "DevTools is the developer panel built into every browser. Open it with F12 (or right-click → Inspect). You'll use it once to verify the script is running.",
  },
  affiliate: {
    short: "Tracked partner",
    long: "FareHarbor's built-in system for tracking which partner sent a booking. Adding Gold Hive as an affiliate is all you need — no scripts, no form fields, no BCC.",
  },
  workflow: {
    short: "Automated rule",
    long: "An automated 'if this happens, do that' rule inside your platform. We use one to BCC us only when a Gold Hive guest books.",
  },
  trigger: {
    short: "Starting event",
    long: "The event that kicks off an automated workflow — for us, it's 'a new booking form was submitted'.",
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
