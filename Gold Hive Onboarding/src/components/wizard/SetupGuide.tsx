import { type ReactNode, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BadgeCheck, Sparkles, Check, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./CodeBlock";
import { buildTrackingSnippet } from "@/lib/tracking-snippet";
import {
  PLATFORM_SETUP,
  OTHER_PLATFORM_SETUP,
  FAREHARBOR_SETUP,
  TRACKING_SNIPPET_EXAMPLE,
  SUPPORT_EMAIL,
  getProviderSetup,
  type Platform,
  type BookingType,
  type ClickStep,
} from "./setup-data";

export type VerifyState = "idle" | "checking" | "installed" | "notyet";

interface Props {
  platform: Platform | "";
  bookingType: BookingType | "";
  companyName?: string;
  websiteUrl?: string;
  provider?: string;
  // Self-serve install verification (tracking-script path only). vendorId is set
  // once the vendor is registered at Step 1; with it we render their real,
  // copy-ready snippet plus a one-click "Check installation" button.
  vendorId?: string | null;
  trackingBase?: string;
  verifyState?: VerifyState;
  verifyLink?: string;
  onCheckInstall?: () => void;
}

function buildUtmLink(websiteUrl: string, businessName: string) {
  const safeUrl = websiteUrl?.trim()
    ? websiteUrl.replace(/\/$/, "")
    : "https://[YourSiteURL]";
  const safeName = (businessName?.trim() || "[BusinessName]").replace(
    /\s+/g,
    "",
  );
  return `${safeUrl}?utm_source=goldhive&utm_medium=referral&utm_campaign=${safeName}%26goldhive&utm_id=${safeName}_Social`;
}

// Fallback steps for an external booking link when we can't detect the provider.
function defaultExternalSteps(utmLink: string): ClickStep[] {
  return [
    {
      do: "Find every 'Book Now' / 'Reserve' button on your site (header, hero, pricing, footer).",
    },
    {
      do: "Edit each button's link and replace it with your Gold Hive booking link above.",
    },
    { do: "Save and publish each page." },
    {
      do: "Test: open an incognito window, click a Book Now button, and confirm the address still contains ?utm_source=goldhive.",
      hint: `If the tag is stripped, your booking provider may need a redirect rule — email ${SUPPORT_EMAIL} and we'll help.`,
    },
  ];
}

// ============================================================================
// Setup guide — Google-Analytics-style: lead with the code, then a clean
// numbered list. No simulation, no per-step cards, no AI-screenshare prompt.
// The detail we used to show inline (privacy, technical specs, troubleshooting)
// now lives in the full doc behind the "Learn more" link.
// ============================================================================

export function SetupGuide({
  platform,
  bookingType,
  companyName = "",
  websiteUrl = "",
  provider = "",
  vendorId = null,
  trackingBase = "",
  verifyState = "idle",
  verifyLink = "",
  onCheckInstall,
}: Props) {
  const isFareHarbor =
    bookingType === "FareHarbor" || platform === "FareHarbor";
  const isExternalLink = bookingType === "External Booking Link";
  const isFormPath =
    bookingType === "Form on my website" &&
    ["Wix", "Squarespace", "Odoo", "GoHighLevel", "Other", "Custom"].includes(
      platform,
    );

  const setup =
    platform && platform !== "Other" && platform !== "FareHarbor"
      ? PLATFORM_SETUP[platform]
      : OTHER_PLATFORM_SETUP;

  const utmLink = buildUtmLink(websiteUrl, companyName);
  const platformLabel = platform || "your platform";
  const providerSetup = isExternalLink ? getProviderSetup(provider) : null;

  // ----- FareHarbor: affiliate setup, no script
  if (isFareHarbor) {
    return (
      <Wrapper>
        <Section title="Add Gold Hive as an affiliate in FareHarbor">
          <p className="text-[0.95rem] leading-relaxed text-foreground/90">
            FareHarbor attributes bookings through its own affiliate system — no
            script and no form changes. Add Gold Hive once and you're done.
          </p>
          <PlainSteps steps={FAREHARBOR_SETUP.steps} />
          <p className="text-[0.95rem] text-foreground">
            <span className="font-semibold">Your partner code: </span>
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-sm text-primary">
              {FAREHARBOR_SETUP.partnerId}
            </code>
          </p>
        </Section>
        <VerifyLine>
          Make a test booking tagged to the Gold Hive affiliate, then email{" "}
          {SUPPORT_EMAIL} to confirm it arrived.
        </VerifyLine>
        <LearnMore />
        <FinishCard />
      </Wrapper>
    );
  }

  // ----- External booking link: tag the Book Now URL
  if (isExternalLink) {
    return (
      <Wrapper>
        <Section title="Use your Gold Hive booking link">
          <p className="text-[0.95rem] leading-relaxed text-foreground/90">
            Your checkout happens on{" "}
            <span className="font-medium text-foreground">
              {provider || "an external system"}
            </span>
            , so the tagged link is the only signal Gold Hive sees. Replace
            every "Book Now" / "Reserve" link on your site with this URL —
            untagged links earn no commission.
          </p>
          <CopyableCode
            label="Your Gold Hive booking link"
            code={utmLink}
            language="url"
            verifiedSafe
          />
          {providerSetup && (
            <WhereLine
              location={providerSetup.locationLabel}
              platformLabel={providerSetup.displayName}
            />
          )}
          <PlainSteps
            steps={
              providerSetup
                ? providerSetup.steps
                : defaultExternalSteps(utmLink)
            }
          />
        </Section>
        <VerifyLine>
          Open the tagged link in a new tab and confirm the address still
          contains{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs text-primary">
            ?utm_source=goldhive
          </code>
          .
        </VerifyLine>
        <LearnMore />
        <FinishCard />
      </Wrapper>
    );
  }

  // ----- Default: install the tracking script (form / website platforms)
  const trackingCode =
    vendorId && trackingBase
      ? buildTrackingSnippet(vendorId, trackingBase)
      : TRACKING_SNIPPET_EXAMPLE;
  return (
    <Wrapper>
      <Section title="Install your tracking code">
        <p className="text-[0.95rem] leading-relaxed text-foreground/90">
          Paste this into your site's{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs">
            &lt;head&gt;
          </code>{" "}
          — the{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs">
            config
          </code>{" "}
          block must come before the{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs">
            tracking.js
          </code>{" "}
          line.{" "}
          {vendorId
            ? "This is your personalized code — your vendor ID is already filled in. We'll also email you a copy."
            : "Your personalized code, with your real vendor ID filled in, is emailed to you when you finish."}
        </p>
        <CopyableCode
          label="Your tracking code"
          code={trackingCode}
          language="html"
        />
        <InstallCheck
          vendorId={vendorId}
          verifyState={verifyState}
          verifyLink={verifyLink}
          onCheckInstall={onCheckInstall}
        />
        <WhereLine
          location={setup.scriptLocation}
          platformLabel={platformLabel}
        />
        <PlainSteps steps={setup.scriptSteps} note={setup.scriptNote} />
      </Section>

      {isFormPath && (
        <p className="text-[0.95rem] leading-relaxed text-foreground/90">
          That's it — once installed, referred bookings are captured
          automatically when your form is submitted. Direct bookings, and card /
          CVV fields, are never sent.
        </p>
      )}

      <LearnMore />
      <FinishCard />
    </Wrapper>
  );
}

// ============================================================================
// Primitives
// ============================================================================

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-7 print:block"
    >
      {children}
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

// Small inline copy button for the AI-editor prompt text.
function InlineCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-1.5 flex items-start gap-2 rounded-lg border border-primary/20 bg-secondary/30 px-3 py-2">
      <p className="flex-1 font-mono text-xs leading-relaxed text-foreground/80">
        {text}
      </p>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-primary"
        aria-label="Copy prompt"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// Clean numbered list — plain text, no borders, no backgrounds, no color blocks.
function PlainSteps({ steps, note }: { steps: ClickStep[]; note?: string }) {
  return (
    <div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-primary">
              {i + 1}.
            </span>
            <div className="min-w-0 w-full">
              <p className="text-[0.95rem] leading-relaxed text-foreground">
                {s.do}
              </p>
              {s.hint && (
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {s.hint}
                </p>
              )}
              {s.copyText && <InlineCopy text={s.copyText} />}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-3">
                  {s.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="text-sm leading-relaxed text-muted-foreground before:mr-1.5 before:content-['·']"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
      {note && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}

function WhereLine({
  location,
  platformLabel,
}: {
  location: string;
  platformLabel: string;
}) {
  return (
    <p className="text-[0.95rem] leading-relaxed text-foreground">
      <span className="font-semibold">Where in {platformLabel}: </span>
      <span className="text-foreground/90">{location}</span>
    </p>
  );
}

function VerifyLine({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.95rem] leading-relaxed text-foreground/90">
      <span className="font-semibold text-foreground">Verify: </span>
      {children}
    </p>
  );
}

// One-click install check, shown right under the tracking code. Replaces the old
// DevTools instructions: the vendor publishes the snippet, opens their test link
// (one harmless ping, no booking/customer data), then clicks to confirm.
function InstallCheck({
  vendorId,
  verifyState,
  verifyLink,
  onCheckInstall,
}: {
  vendorId: string | null;
  verifyState: VerifyState;
  verifyLink: string;
  onCheckInstall?: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Check your installation
        </span>
      </div>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        After you've published the code,{" "}
        {verifyLink ? (
          <>
            open{" "}
            <a
              href={verifyLink}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              your test link
            </a>
          </>
        ) : (
          "open your published site through a Gold Hive link"
        )}{" "}
        — it sends one harmless test ping (no booking, no customer data) — then
        click the button below. No developer tools needed.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onCheckInstall}
          disabled={!vendorId || !onCheckInstall || verifyState === "checking"}
          variant="outline"
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
        >
          {verifyState === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Check installation
        </Button>
        {verifyState === "installed" && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-500">
            <Check className="h-4 w-4" /> Tracking is live — you're all set.
          </span>
        )}
        {verifyState === "notyet" && (
          <span className="text-sm text-muted-foreground">
            Not detected yet — open the test link on your published site, then
            check again.
          </span>
        )}
      </div>
      {!vendorId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Your tracking ID isn't ready yet — finish the steps and we'll enable
          one-click verification.
        </p>
      )}
    </div>
  );
}

function LearnMore() {
  return (
    <p className="text-sm text-muted-foreground">
      <Link to="/privacy" className="font-medium text-primary hover:underline">
        Privacy &amp; how it works →
      </Link>
    </p>
  );
}

function CopyableCode({
  label,
  code,
  language,
  verifiedSafe,
}: {
  label: string;
  code: string;
  language: "html" | "url";
  verifiedSafe?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
          {label}
        </div>
        {verifiedSafe && <VerifiedSafeBadge />}
      </div>
      <CodeBlock code={code} language={language} />
    </div>
  );
}

function VerifiedSafeBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
      title="Reviewed by Gold Hive — safe to paste into your site"
    >
      <BadgeCheck className="h-3 w-3" />
      Verified Safe
    </span>
  );
}

function FinishCard() {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-5 print:break-inside-avoid">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
          What happens after you finish
        </h3>
      </div>
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="font-mono text-xs text-primary">1.</span>
          <span>
            Gold Hive runs a verification booking through a partner link to
            confirm the script fires and the booking reaches our webhook.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-primary">2.</span>
          <span>
            You receive read-only access to your{" "}
            <strong className="text-foreground">Partner Dashboard</strong>:
            referred bookings, real-time commission, payout schedule.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-primary">3.</span>
          <span>
            You're listed in the Gold Hive partner directory and start receiving
            live referral traffic.
          </span>
        </li>
      </ol>
      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
        Stuck on any step? Email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-primary hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        with a screenshot and we'll walk you through it.
      </div>
    </div>
  );
}
