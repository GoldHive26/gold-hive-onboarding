import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Code2,
  FileInput,
  Mail,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Lightbulb,
  ChevronDown,
  Bot,
  Copy,
  Check as CheckIcon,
  ExternalLink,
  BadgeCheck,
  Receipt,
  Send,
  Zap,
  Users,
  Cookie,
  Clock,
  Filter,
  MousePointerClick,
} from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PLATFORM_SETUP,
  OTHER_PLATFORM_SETUP,
  PLATFORM_COACH,
  OTHER_PLATFORM_COACH,
  FAREHARBOR_SETUP,
  FAREHARBOR_COACH,
  TRACKING_SCRIPT,
  HIDDEN_FIELD_HTML,
  BCC_EMAIL,
  SUPPORT_EMAIL,
  GLOSSARY,
  getProviderSetup,
  type Platform,
  type BookingType,
  type ClickStep,
  type VisualHint,
  type Mistake,
} from "./setup-data";

interface Props {
  platform: Platform | "";
  bookingType: BookingType | "";
  companyName?: string;
  websiteUrl?: string;
  provider?: string;
}

function buildUtmLink(websiteUrl: string, businessName: string) {
  const safeUrl = websiteUrl?.trim()
    ? websiteUrl.replace(/\/$/, "")
    : "https://[YourSiteURL]";
  const safeName = (businessName?.trim() || "[BusinessName]").replace(/\s+/g, "");
  return `${safeUrl}?utm_source=goldhive&utm_medium=referral&utm_campaign=${safeName}%26goldhive&utm_id=${safeName}_Social`;
}

export function SetupGuide({
  platform,
  bookingType,
  companyName = "",
  websiteUrl = "",
  provider = "",
}: Props) {
  const isFareHarbor = bookingType === "FareHarbor" || platform === "FareHarbor";
  const isExternalLink = bookingType === "External Booking Link";
  const isFormPath =
    bookingType === "Form on my website" &&
    ["Wix", "Squarespace", "Odoo", "GoHighLevel", "Other"].includes(platform);

  const setup =
    platform && platform !== "Other" && platform !== "FareHarbor"
      ? PLATFORM_SETUP[platform]
      : OTHER_PLATFORM_SETUP;

  const coach =
    platform && platform !== "Other" && platform !== "FareHarbor"
      ? PLATFORM_COACH[platform]
      : OTHER_PLATFORM_COACH;

  const utmLink = buildUtmLink(websiteUrl, companyName);
  const platformLabel = platform || "your platform";
  const providerSetup = isExternalLink ? getProviderSetup(provider) : null;

  // ----- FareHarbor (Path C)
  if (isFareHarbor) {
    return (
      <TooltipProvider delayDuration={150}>
        <Wrapper>
          <PrivateStatusBadge />
          <AttributionSimulator />
          <HowAttributionWorks path="C" provider="FareHarbor" />
          <PhaseCard
            number={1}
            icon={Sparkles}
            title="Add Gold Hive as an Affiliate in FareHarbor"
            subtitle={
              <>
                FareHarbor handles attribution natively through its{" "}
                <Term k="affiliate">affiliate</Term> system — no script, no form fields, no
                BCC. Just one entry. The Affiliate ID is the filter: FareHarbor only
                reports bookings tagged to Gold Hive.
              </>
            }
          >
            <CheckableSteps
              storageKey={`fh-${platform}`}
              steps={FAREHARBOR_SETUP.steps}
              where={FAREHARBOR_COACH.where}
              platformLabel="FareHarbor"
              phaseTitle="Add Gold Hive as a FareHarbor affiliate"
              aiGoal="Add a new affiliate named 'Gold Hive' (code GOLDHIVE) inside the FareHarbor dashboard so bookings can be attributed and commissioned correctly."
            />
            <KeyValueCallout
              label="Your Partner Code"
              value={FAREHARBOR_SETUP.partnerId}
            />
            <CommonMistakes mistakes={FAREHARBOR_COACH.mistakes} />
          </PhaseCard>
          <FinishCard />
        </Wrapper>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Wrapper>
        <PrivateStatusBadge />
        <AttributionSimulator />
        <HowAttributionWorks
          path={isExternalLink ? "B" : "A"}
          provider={provider}
        />
        <TechnicalSpecsTable />
        {/* PHASE 1 — TRACKING SCRIPT */}
        <PhaseCard
          number={1}
          icon={Code2}
          title="Install the Persistence Script"
          subtitle={
            isExternalLink ? (
              <>
                A small, dormant <Term k="cookie">cookie</Term>-based{" "}
                <Term k="persistence script">persistence script</Term> on YOUR site.
                It only wakes up when a visitor arrives with the goldhive UTM tag —
                otherwise it does nothing. It cannot read your checkout because the
                checkout lives on {provider || "your booking provider"}.
              </>
            ) : (
              <>
                A 30-day <Term k="cookie">cookie</Term>-based{" "}
                <Term k="persistence script">persistence script</Term>. It stays{" "}
                <strong className="text-foreground">dormant</strong> until it sees a
                visitor arrive with the goldhive referral link — then it tags their
                session so your form can attribute the booking.
              </>
            )
          }
        >
          <CopyableCode label="Copy this script" code={TRACKING_SCRIPT} language="html" />
          <LocationBar location={setup.scriptLocation} platformLabel={platformLabel} />
          <CheckableSteps
            storageKey={`script-${platform}`}
            steps={setup.scriptSteps}
            note={setup.scriptNote}
            where={coach.scriptWhere}
            platformLabel={platformLabel}
            phaseTitle="Phase 1 — Install the Gold Hive persistence (tracking) script"
            aiGoal={`Paste the Gold Hive <script> tag into the global footer/body-end of a ${platformLabel} site so it loads on every page. The exact location is: ${setup.scriptLocation}.`}
          />
          <SuccessCheck>
            Open your live site, then in <Term k="devtools">DevTools</Term> → Application
            → Cookies look for{" "}
            <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs">
              gh_referral
            </code>
            . If it's there, the script is firing.
          </SuccessCheck>
          <CommonMistakes mistakes={coach.scriptMistakes} />
        </PhaseCard>

        {/* PHASE 2 — ATTRIBUTION CAPTURE */}
        <PhaseCard
          number={2}
          icon={FileInput}
          title={
            isExternalLink
              ? "Replace your Book Now link with the tagged URL"
              : "Add the hidden referral_source field to your form"
          }
          subtitle={
            isExternalLink ? (
              <>
                Because checkout happens on{" "}
                <strong className="text-foreground">{provider || "an external system"}</strong>,
                the UTM-tagged link is the <strong className="text-foreground">only</strong>{" "}
                signal Gold Hive ever sees. If a guest clicks a regular (untagged) link,
                Gold Hive is never notified — no commission, no record. Every Book Now
                button must use the tagged URL below.
              </>
            ) : (
              <>
                This <Term k="hidden field">hidden field</Term> is what our script
                populates with 'goldhive' when a referred guest submits your form. The
                BCC in Phase 3 only fires when this field equals 'goldhive' — direct
                bookings stay invisible to Gold Hive.
              </>
            )
          }
        >
          {isFormPath && (
            <>
              <CopyableCode
                label="Hidden field HTML (for reference)"
                code={HIDDEN_FIELD_HTML}
                language="html"
              />
              <SpecTable
                rows={[
                  ["Field Name / ID", "referral_source", true],
                  ["Field Type", "Hidden", false],
                  ["Default Value", "(leave blank)", false],
                  [
                    "Auto-populated by",
                    "tracking.js → sets to 'goldhive' on referred visits",
                    false,
                  ],
                  ["Required", "Yes — without this, attribution silently fails", false],
                ]}
              />
              <LocationBar location={setup.fieldLocation} platformLabel={platformLabel} />
              <CheckableSteps
                storageKey={`field-${platform}`}
                steps={setup.fieldSteps}
                note={setup.fieldNote}
                where={coach.fieldWhere}
                platformLabel={platformLabel}
                phaseTitle="Phase 2 — Add the hidden referral_source field to the booking form"
                aiGoal={`Add a hidden form field named exactly 'referral_source' (lowercase, underscore) to the booking form on a ${platformLabel} site. The exact location is: ${setup.fieldLocation}.`}
              />
              <CommonMistakes mistakes={coach.fieldMistakes} />
            </>
          )}

          {isExternalLink && (
            <>
              <CopyableCode
                label="Your custom UTM-tagged Book Now URL"
                code={utmLink}
                language="url"
                verifiedSafe
              />

              <TestLinkButton url={utmLink} />

              <AutoTaggerCard />

              {providerSetup ? (
                <>
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
                        Custom guide · {providerSetup.displayName}
                      </span>
                    </div>
                    <p className="text-[0.92rem] leading-relaxed text-foreground/85">
                      We detected{" "}
                      <strong className="text-foreground">{providerSetup.displayName}</strong>{" "}
                      as your checkout — these instructions are tailored to that
                      provider's quirks (where the URL lives, which UTM toggle to flip,
                      common gotchas).
                    </p>
                    {providerSetup.utmNote && (
                      <p className="mt-2 text-[0.85rem] italic text-primary/90">
                        ⓘ {providerSetup.utmNote}
                      </p>
                    )}
                  </div>
                  <LocationBar
                    location={providerSetup.locationLabel}
                    platformLabel={providerSetup.displayName}
                  />
                  <CheckableSteps
                    storageKey={`extlink-${platform}-${providerSetup.displayName}`}
                    steps={providerSetup.steps}
                    where={providerSetup.where}
                    platformLabel={providerSetup.displayName}
                    phaseTitle={`Phase 2 — Send Gold Hive traffic to ${providerSetup.displayName} with UTM tagging`}
                    aiGoal={`I use ${providerSetup.displayName} for my checkout. Help me grab my correct booking URL from ${providerSetup.locationLabel}, append the Gold Hive UTM tail (${utmLink.split("?")[1] || "utm_source=goldhive..."}), and confirm UTMs survive end-to-end.`}
                  />
                  <SpecTable
                    rows={[
                      ["utm_source", "goldhive — primary identifier", true],
                      [
                        "utm_campaign",
                        `${(companyName || "[Brand]").replace(/\s+/g, "")}%26goldhive — for invoice reconciliation`,
                        true,
                      ],
                      [
                        "utm_id",
                        `${(companyName || "[Brand]").replace(/\s+/g, "")}_Social — channel attribution`,
                        true,
                      ],
                    ]}
                  />
                  <CommonMistakes mistakes={providerSetup.mistakes} />
                </>
              ) : (
                <>
                  <CheckableSteps
                    storageKey={`extlink-${platform}`}
                    steps={[
                      {
                        do: "Open every page of your site that has a 'Book Now' / 'Reserve' button (header, hero, pricing, footer).",
                      },
                      {
                        do: "Edit each button's link and replace the existing URL with the tagged URL above.",
                      },
                      { do: "Save and publish each page." },
                      {
                        do: "Test: open an incognito window, click one of your Book Now buttons, and confirm the destination URL still contains ?utm_source=goldhive.",
                        hint: "If the parameters are stripped, your booking provider may need a redirect rule — email us and we'll help.",
                      },
                    ]}
                    where={coach.fieldWhere}
                    platformLabel={platformLabel}
                    phaseTitle="Phase 2 — Replace every Book Now link with the UTM-tagged URL"
                    aiGoal={`Find every 'Book Now' / 'Reserve' button on a ${platformLabel} site and replace its destination URL with this exact tagged URL: ${utmLink}. The tag is the only signal Gold Hive will ever see, so any untagged button means a missed commission.`}
                  />
                  <SpecTable
                    rows={[
                      ["utm_source", "goldhive — primary identifier", true],
                      [
                        "utm_campaign",
                        `${(companyName || "[Brand]").replace(/\s+/g, "")}%26goldhive — for invoice reconciliation`,
                        true,
                      ],
                      [
                        "utm_id",
                        `${(companyName || "[Brand]").replace(/\s+/g, "")}_Social — channel attribution`,
                        true,
                      ],
                    ]}
                  />
                  <CommonMistakes mistakes={coach.fieldMistakes} />
                </>
              )}
            </>
          )}

          {!isFormPath && !isExternalLink && (
            <InfoBox tone="info">
              Pick a booking method on the previous step so we can show the exact
              attribution wiring.
            </InfoBox>
          )}
        </PhaseCard>

        {/* PHASE 3 — BCC AUDIT RULE */}
        <PhaseCard
          number={3}
          icon={Mail}
          title="Set up the conditional BCC rule"
          subtitle={
            <>
              The 'safety net' — a <Term k="conditional bcc">conditional BCC</Term> that
              guarantees Gold Hive only ever sees data for guests we actually referred.
              Required for automated commission payouts.
            </>
          }
        >
          <SpecTable
            rows={[
              ["BCC Address", BCC_EMAIL, true],
              ["Trigger", "Customer booking confirmation email", false],
              ["Condition", "referral_source equals 'goldhive'", true],
              ["Behavior", "BCC fires ONLY on Gold Hive referrals", false],
            ]}
          />
          <LocationBar location={setup.bccLocation} platformLabel={platformLabel} />
          <CheckableSteps
            storageKey={`bcc-${platform}`}
            steps={setup.bccSteps}
            note={setup.bccNote}
            where={coach.bccWhere}
            platformLabel={platformLabel}
            phaseTitle="Phase 3 — Set up the conditional BCC rule"
            aiGoal={`Create an email automation rule on ${platformLabel} that BCCs ${BCC_EMAIL} on the booking confirmation email — but ONLY when the form's referral_source field equals 'goldhive'. The exact location is: ${setup.bccLocation}.`}
          />
          <PrivacyCallout />
          <CommonMistakes mistakes={coach.bccMistakes} />
        </PhaseCard>

        <TechConcierge websiteUrl={websiteUrl} companyName={companyName} />
        <FinishCard />
      </Wrapper>
    </TooltipProvider>
  );
}

// ============================================================================
// Layout primitives
// ============================================================================

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 print:block"
    >
      {children}
    </motion.div>
  );
}

function PhaseCard({
  number,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-border bg-card/40 shadow-sm print:break-inside-avoid">
      {/* Bold phase banner — unmistakable section divider */}
      <div className="flex items-center gap-3 border-b-2 border-primary/40 bg-background px-5 py-3 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gradient-gold)] text-base font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] shadow-[0_0_18px_oklch(0.78_0.16_85_/_0.55)] ring-1 ring-primary/40">
          {number}
        </span>
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-primary sm:text-xs">
          Phase {number} of 3
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <header className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-background shadow-[var(--shadow-gold)]">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {title}
            </h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-foreground/80">
              {subtitle}
            </p>
          </div>
        </header>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
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

function LocationBar({
  location,
  platformLabel,
}: {
  location: string;
  platformLabel: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Where you'll be working in {platformLabel}
        </div>
        <div className="mt-0.5 break-words text-[0.95rem] font-medium text-foreground">
          {location}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Interactive checkable steps with confetti / glow on check
// ----------------------------------------------------------------------------

function CheckableSteps({
  storageKey,
  steps,
  note,
  where,
  platformLabel,
  aiGoal,
  phaseTitle,
}: {
  storageKey: string;
  steps: ClickStep[];
  note?: string;
  where?: VisualHint;
  platformLabel?: string;
  aiGoal?: string;
  phaseTitle?: string;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [showWhere, setShowWhere] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const completedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked],
  );
  const allDone = completedCount === steps.length && steps.length > 0;

  const toggle = (i: number) => {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div>
      {/* Header row: progress + visual guide + AI walkthrough */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span
            className={
              allDone
                ? "text-emerald-400"
                : completedCount > 0
                  ? "text-primary"
                  : "text-muted-foreground"
            }
          >
            {completedCount} / {steps.length} complete
          </span>
          {allDone && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400"
            >
              <CheckCircle2 className="h-3 w-3" /> Phase ready
            </motion.span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {where && (
            <button
              type="button"
              onClick={() => setShowWhere((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 hover:shadow-[var(--shadow-gold)] print:hidden"
            >
              {showWhere ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span aria-hidden>📸</span>
              {showWhere ? "Hide visual guide" : "Show me where this is"}
            </button>
          )}
          {aiGoal && phaseTitle && (
            <button
              type="button"
              onClick={() => setShowAi((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 hover:shadow-[var(--shadow-gold)] print:hidden"
            >
              <Bot className="h-3.5 w-3.5" />
              {showAi ? "Hide AI prompt" : "Ask AI to walk me through"}
            </button>
          )}
        </div>
      </div>

      {/* Visual guide panel */}
      <AnimatePresence>
        {showWhere && where && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <VisualGuidePanel hint={where} platformLabel={platformLabel} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI walkthrough prompt panel */}
      <AnimatePresence>
        {showAi && aiGoal && phaseTitle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <AiPromptPanel
              platformLabel={platformLabel || "your platform"}
              phaseTitle={phaseTitle}
              goal={aiGoal}
              steps={steps}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <CheckableStep
            key={`${storageKey}-${i}`}
            index={i}
            step={s}
            checked={!!checked[i]}
            onToggle={() => toggle(i)}
          />
        ))}
      </ol>

      {note && (
        <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[0.85rem] text-foreground/85">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// AI Walkthrough Prompt — generates a copy-paste prompt for Gemini/ChatGPT
// designed for use with screen sharing.
// ----------------------------------------------------------------------------

function AiPromptPanel({
  platformLabel,
  phaseTitle,
  goal,
  steps,
}: {
  platformLabel: string;
  phaseTitle: string;
  goal: string;
  steps: ClickStep[];
}) {
  const prompt = useMemo(() => {
    const stepLines = steps.map((s, i) => `${i + 1}. ${s.do}`).join("\n");
    return `I'm setting up a Gold Hive partner integration on ${platformLabel} and I'm sharing my screen with you.

GOAL: ${goal}

PHASE: ${phaseTitle}

I'll be following these exact steps:
${stepLines}

Please act as a patient, click-by-click coach:
1. Look at my screen and tell me exactly what to click next, by NAME (e.g. "click the gear icon labeled Settings in the bottom-left").
2. If what's on my screen doesn't match the expected step, tell me what menu I'm probably in and how to navigate back.
3. Wait for me to confirm each click before moving on.
4. If I get an error or a button is missing, diagnose it (plan limit, missing custom domain, wrong sub-account, etc.) and tell me how to fix it.
5. Don't skip ahead. One click at a time.

Start by telling me what you see on my screen and what I should click first.`;
  }, [platformLabel, phaseTitle, goal, steps]);

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--gradient-gold)] text-primary-foreground">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Live AI walkthrough prompt
            </div>
            <div className="text-[0.9rem] font-semibold text-foreground">
              Paste into Gemini (or ChatGPT) and share your screen
            </div>
          </div>
        </div>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-foreground/80">
        Open{" "}
        <a
          href="https://gemini.google.com/app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid"
        >
          Gemini <ExternalLink className="h-3 w-3" />
        </a>{" "}
        (or{" "}
        <a
          href="https://chat.openai.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid"
        >
          ChatGPT <ExternalLink className="h-3 w-3" />
        </a>
        ), start a new chat, turn on screen sharing, then paste this prompt. The AI
        will coach you through each click in real time while watching your screen.
      </p>
      <div className="relative rounded-lg border border-border bg-[oklch(0.14_0.005_60)]">
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap p-3 pr-12 text-[0.8rem] leading-relaxed text-foreground/95">
          {prompt}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className={
            "absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all " +
            (copied
              ? "bg-emerald-500 text-white shadow-[0_0_16px_oklch(0.7_0.18_150_/_0.5)]"
              : "btn-gold")
          }
          aria-label={copied ? "Prompt copied" : "Copy AI prompt"}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy prompt
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CheckableStep({
  index,
  step,
  checked,
  onToggle,
}: {
  index: number;
  step: ClickStep;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.li
      animate={
        checked
          ? {
              boxShadow:
                "0 0 0 1px oklch(0.7 0.18 150 / 0.5), 0 0 24px oklch(0.7 0.18 150 / 0.25)",
            }
          : { boxShadow: "0 0 0 0 transparent" }
      }
      transition={{ duration: 0.4 }}
      className={
        "relative flex gap-3 overflow-hidden rounded-lg border p-3 transition-colors " +
        (checked
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border/60 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40")
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={`Mark step ${index + 1} as ${checked ? "incomplete" : "complete"}`}
        className={
          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-all " +
          (checked
            ? "bg-emerald-500 text-white shadow-[0_0_16px_oklch(0.7_0.18_150_/_0.6)]"
            : "bg-[var(--gradient-gold)] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] hover:scale-110")
        }
      >
        {checked ? (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.span>
        ) : (
          index + 1
        )}
      </button>
      <div className="min-w-0 pt-0.5">
        <div
          className={
            "text-[0.95rem] leading-snug transition-all " +
            (checked
              ? "text-muted-foreground line-through decoration-emerald-500/60"
              : "text-foreground")
          }
        >
          {step.do}
        </div>
        {step.hint && (
          <div className="mt-1 text-xs leading-snug text-muted-foreground">
            {step.hint}
          </div>
        )}
      </div>

      {/* Confetti burst */}
      <AnimatePresence>
        {checked && <Confetti />}
      </AnimatePresence>
    </motion.li>
  );
}

function Confetti() {
  // 10 small gold/green particles bursting from the checkbox
  const particles = Array.from({ length: 10 }, (_, i) => i);
  const colors = [
    "oklch(0.82 0.16 85)",
    "oklch(0.75 0.18 60)",
    "oklch(0.7 0.18 150)",
    "oklch(0.88 0.12 95)",
  ];
  return (
    <div className="pointer-events-none absolute left-3.5 top-3.5 h-7 w-7">
      {particles.map((p) => {
        const angle = (p / particles.length) * Math.PI * 2;
        const distance = 28 + Math.random() * 18;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        return (
          <motion.span
            key={p}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: colors[p % colors.length] }}
          />
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Visual "Where is this?" panel
// ----------------------------------------------------------------------------

function VisualGuidePanel({
  hint,
  platformLabel,
}: {
  hint: VisualHint;
  platformLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--gradient-gold)] text-primary-foreground">
          <Lightbulb className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Visual guide{platformLabel ? ` · ${platformLabel}` : ""}
          </div>
          <div className="text-[0.95rem] font-semibold text-foreground">
            {hint.headline}
          </div>
        </div>
      </div>
      <ul className="mt-3 space-y-2 pl-1">
        {hint.landmarks.map((l, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Common Mistakes accordion
// ----------------------------------------------------------------------------

function CommonMistakes({ mistakes }: { mistakes: Mistake[] }) {
  if (!mistakes || mistakes.length === 0) return null;
  return (
    <Accordion type="single" collapsible className="rounded-lg border border-border bg-secondary/20 print:hidden">
      <AccordionItem value="mistakes" className="border-b-0">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]>div>svg.chev]:rotate-180">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Common mistakes &amp; fixes ({mistakes.length})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <ul className="space-y-3">
            {mistakes.map((m, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <div className="flex items-start gap-2 text-[0.95rem] font-semibold text-amber-300">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{m.q}</span>
                </div>
                <div className="mt-1.5 pl-6 text-sm leading-relaxed text-foreground/85">
                  {m.a}
                </div>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// ----------------------------------------------------------------------------
// Term tooltip — plain-English glossary
// ----------------------------------------------------------------------------

function Term({ k, children }: { k: string; children: ReactNode }) {
  const def = GLOSSARY[k.toLowerCase()];
  if (!def) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="cursor-help font-semibold text-primary underline decoration-primary/40 decoration-dotted underline-offset-2 transition-colors hover:decoration-primary"
        >
          {children}
          <HelpCircle className="ml-0.5 inline-block h-3 w-3 align-text-top text-primary/70" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs whitespace-normal bg-card text-foreground border border-primary/30 px-3 py-2 text-[0.85rem] leading-relaxed shadow-[var(--shadow-gold)]"
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {def.short}
        </div>
        <div className="mt-1">{def.long}</div>
      </TooltipContent>
    </Tooltip>
  );
}

// ----------------------------------------------------------------------------
// Existing primitives
// ----------------------------------------------------------------------------

function SpecTable({ rows }: { rows: [string, string, boolean][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value, mono], i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="w-[38%] bg-secondary/30 px-3 py-2 align-top text-xs uppercase tracking-wider text-muted-foreground">
                {label}
              </td>
              <td
                className={`break-words px-3 py-2 text-sm ${
                  mono ? "font-mono text-primary" : "text-foreground"
                }`}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuccessCheck({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-[0.95rem] text-foreground/90">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      <div>
        <span className="font-semibold text-emerald-400">How to verify: </span>
        {children}
      </div>
    </div>
  );
}

function InfoBox({
  tone,
  children,
}: {
  tone: "info" | "warning";
  children: ReactNode;
}) {
  const styles =
    tone === "warning"
      ? "border-amber-500/40 bg-amber-500/10"
      : "border-primary/30 bg-primary/5";
  const Icon = tone === "warning" ? AlertTriangle : ShieldCheck;
  const iconColor = tone === "warning" ? "text-amber-400" : "text-primary";
  return (
    <div className={`flex gap-2 rounded-lg border p-3 text-sm text-foreground/90 ${styles}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
      <div>{children}</div>
    </div>
  );
}

function KeyValueCallout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold tracking-wide text-primary">
        {value}
      </div>
    </div>
  );
}

function PrivacyCallout() {
  return (
    <div className="flex gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <span className="font-semibold text-primary">Privacy guarantee: </span>
        <span className="text-foreground/90">
          Our audit bot only processes emails that match this exact rule. All other
          customer data stays in your system and is never sent to Gold Hive.
        </span>
      </div>
    </div>
  );
}

function TestLinkButton({ url }: { url: string }) {
  const isPlaceholder = url.includes("[YourSiteURL]");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
      <div className="flex items-start gap-2.5">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Safety check
          </div>
          <div className="text-sm text-foreground/90">
            Open your tagged URL in a new tab to confirm the script fires and the
            <code className="mx-1 rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs text-primary">
              gh_referral
            </code>
            cookie sets.
          </div>
        </div>
      </div>
      <a
        href={isPlaceholder ? undefined : url}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={isPlaceholder}
        onClick={(e) => {
          if (isPlaceholder) e.preventDefault();
        }}
        className={
          "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all " +
          (isPlaceholder
            ? "cursor-not-allowed border-border bg-secondary/30 text-muted-foreground"
            : "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:shadow-[0_0_18px_oklch(0.7_0.18_150_/_0.35)]")
        }
      >
        Test Link <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function TechnicalSpecsTable() {
  const rows: { icon: typeof Cookie; label: string; value: string }[] = [
    { icon: Cookie, label: "Tracking", value: "First-party Cookie (gh_referral)" },
    { icon: Clock, label: "Duration", value: "30 Days" },
    { icon: MousePointerClick, label: "Method", value: "DOM Mutation / URL Parameter Listener" },
    { icon: Filter, label: "Privacy", value: "Selective Attribution (Filtered by utm_source)" },
  ];
  return (
    <div className="rounded-2xl border border-primary/30 bg-background/60 p-5 print:break-inside-avoid">
      <div className="mb-3 flex items-center gap-2">
        <Code2 className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Technical Specifications
        </h3>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-primary/40 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          For Developers
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => {
              const Icon = r.icon;
              return (
                <tr
                  key={r.label}
                  className={i % 2 === 0 ? "bg-secondary/20" : "bg-background/40"}
                >
                  <td className="w-44 border-r border-border px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {r.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                    {r.value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TECH_PARTNERS = [
  { name: "Backspin Social", specialty: "GoHighLevel + LeadConnector" },
  { name: "Mountain Trail Adventures", specialty: "FareHarbor + Wix" },
  { name: "Coastal Bookings Co.", specialty: "Squarespace + Vagaro" },
];

function TechConcierge({
  websiteUrl,
  companyName,
}: {
  websiteUrl?: string;
  companyName?: string;
}) {
  const [showPros, setShowPros] = useState(false);

  const partnerName = companyName?.trim() || "Your Business";
  const siteUrl = websiteUrl?.trim() || "[your website URL]";

  // Exact mailto strings per spec
  const devMailto =
    "mailto:?subject=" +
    encodeURIComponent("Action Required: Gold Hive Partner Integration") +
    "&body=" +
    encodeURIComponent(
      "Hi, we are partnering with Gold Hive. Please implement the tracking protocol found here: https://docs.google.com/document/d/1azjaIW4qP6XyUiAVF9w0poVpy8SgsJJflPRNoDRYRRQ/edit.",
    );

  const proMailto =
    "mailto:cturpin@goldhive.org?subject=" +
    encodeURIComponent("Tech Concierge Request") +
    "&body=" +
    encodeURIComponent(
      `Hi Chris, please connect me with a Gold Hive partner to help with my setup.\n\nBusiness: ${partnerName}\nSite: ${siteUrl}`,
    );

  const introMailto = (partner: string) =>
    `mailto:cturpin@goldhive.org?subject=${encodeURIComponent(
      `Intro Request: ${partnerName} ↔ ${partner}`,
    )}&body=${encodeURIComponent(
      `Hi Chris,\n\nPlease introduce me to ${partner} so they can help me complete my Gold Hive setup.\n\nMy site: ${siteUrl}\n\nThanks!`,
    )}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-[var(--shadow-gold)] print:hidden">
      {/* Verified ribbon */}
      <div className="absolute right-4 top-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
          <BadgeCheck className="h-3 w-3" /> Verified Concierge
        </span>
      </div>

      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-background text-primary shadow-[0_0_18px_oklch(0.78_0.16_85_/_0.45)]">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Need a Hand with Setup?
          </h3>
          <p className="mt-1 text-sm text-[#e5e5e5]">
            Not a tech person? No problem. Hand it to your developer, or let Gold Hive
            connect you with a verified partner who's already done it.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Send to Dev */}
        <a
          href={devMailto}
          className="group flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 transition-all hover:border-primary/50 hover:bg-secondary/60"
        >
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Email Instructions to my Dev
            </span>
          </div>
          <p className="text-xs text-[#e5e5e5]">
            Opens your mail app with the Gold Hive Technical Backbone link and a brief
            for your developer.
          </p>
        </a>

        {/* Pro Concierge — gold high-contrast */}
        <a
          href={proMailto}
          className="group flex flex-col gap-2 rounded-xl bg-[var(--gradient-gold)] p-4 text-[#1a1a1a] shadow-[var(--shadow-gold)] transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-bold">Request Gold Hive Tech Concierge</span>
          </div>
          <p className="text-xs font-medium text-[#1a1a1a]/90">
            Don't have a developer? We'll personally introduce you to a verified Gold
            Hive partner.
          </p>
        </a>
      </div>

      <p className="mt-3 text-xs italic text-[#e5e5e5]/80">
        Note: Chris Turpin will personally introduce you to a verified partner who has
        successfully completed this integration.
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <button
          onClick={() => setShowPros((s) => !s)}
          className="flex w-full items-center justify-between rounded-lg px-1 text-left text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80"
        >
          <span className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Verified Gold Hive Tech Partners
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showPros ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {showPros && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              {TECH_PARTNERS.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Specialty: {p.specialty}
                    </p>
                  </div>
                  <a
                    href={introMailto(p.name)}
                    className="shrink-0 rounded-md border border-primary/40 bg-background px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    Request Help
                  </a>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
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
            Gold Hive runs a verification booking to confirm the script fires and the
            BCC arrives at <span className="font-mono text-foreground">{BCC_EMAIL}</span>.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-primary">2.</span>
          <span>
            You receive read-only access to your{" "}
            <strong className="text-foreground">Partner Dashboard</strong>: referred
            bookings, real-time commission, payout schedule.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-primary">3.</span>
          <span>
            You're listed in the Gold Hive partner directory and start receiving live
            referral traffic.
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

// ----------------------------------------------------------------------------
// Privacy badge — pinned to the top of every guide
// ----------------------------------------------------------------------------

function PrivateStatusBadge() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 print:border print:bg-transparent">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
        <ShieldCheck className="h-5 w-5 text-emerald-400" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <ShieldCheck className="h-3 w-3" /> Status: Private
          </span>
          <span className="text-sm font-semibold text-foreground">
            Your data is protected.
          </span>
        </div>
        <p className="mt-1 text-[0.92rem] leading-relaxed text-foreground/85">
          This integration is filtered and will only report bookings tagged with the{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs text-primary">
            goldhive
          </code>{" "}
          source. <strong className="text-foreground">100% of your direct &amp; organic
          traffic remains invisible</strong> to Gold Hive.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// "How attribution works" — path-specific intro callout
// ----------------------------------------------------------------------------

function HowAttributionWorks({
  path,
  provider,
}: {
  path: "A" | "B" | "C";
  provider?: string;
}) {
  const content =
    path === "A"
      ? {
          title: "How your attribution works (Path A — Native Form)",
          body: (
            <>
              The script we install <strong className="text-foreground">stays dormant</strong>{" "}
              until it sees a visitor arrive via a Gold Hive link. Only then does it tag
              their session. The <Term k="conditional bcc">conditional BCC</Term> in Phase
              3 <strong className="text-foreground">only fires</strong> when the form
              actually carries the goldhive tag — every other booking stays in your inbox
              alone.
            </>
          ),
        }
      : path === "B"
        ? {
            title: `How your attribution works (Path B — External Booking${provider ? ` · ${provider}` : ""})`,
            body: (
              <>
                We detected you use{" "}
                <strong className="text-foreground">{provider || "an external booking system"}</strong>{" "}
                for checkout. Because we have{" "}
                <strong className="text-foreground">no script on the checkout page</strong>,
                the UTM-tagged Book Now link is the <strong className="text-foreground">only
                thing doing the work</strong>. We are not asking you to inject any code into{" "}
                {provider || "your provider"} — just to <em>label the traffic</em> you send
                them. If a guest uses a regular link, Gold Hive is never notified.
              </>
            ),
          }
        : {
            title: "How your attribution works (Path C — FareHarbor Affiliate)",
            body: (
              <>
                The <Term k="affiliate">Affiliate ID</Term> is the filter. FareHarbor only
                sends booking data to affiliates for the specific bookings tagged to them
                — your other reservations are never shared.
              </>
            ),
          };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--gradient-gold)]">
          <Lightbulb className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
          {content.title}
        </h3>
      </div>
      <p className="text-[0.95rem] leading-relaxed text-foreground/90">{content.body}</p>
    </div>
  );
}

// Suppress unused-import warning for ChevronDown (kept for future use)
void ChevronDown;

// ----------------------------------------------------------------------------
// Attribution Simulator — "See how it works" with two test guests
// ----------------------------------------------------------------------------

const AUTO_TAGGER_SCRIPT = `<script>
  (function() {
    const source = new URLSearchParams(window.location.search).get('utm_source') || localStorage.getItem('gh_referral');
    if (source === 'goldhive') {
      document.querySelectorAll('a').forEach(link => {
        if (link.href.includes('leadconnectorhq.com') || link.href.includes('bookingplatform.app') || link.href.includes('vagaro.com')) {
          link.href += (link.href.includes('?') ? '&' : '?') + 'src=goldhive';
        }
      });
    }
  })();
</script>`;

function AttributionSimulator() {
  const [mode, setMode] = useState<"idle" | "normal" | "goldhive">("idle");

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 print:hidden">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-background shadow-[var(--shadow-gold)]">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              See how it works · Live simulation
            </div>
            <div className="text-base font-semibold text-foreground">
              Watch what Gold Hive sees (and doesn't see)
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("normal")}
            className={
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all " +
              (mode === "normal"
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_oklch(0.7_0.18_150_/_0.35)]"
                : "border-border bg-secondary/40 text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/10")
            }
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Test Normal Guest
          </button>
          <button
            type="button"
            onClick={() => setMode("goldhive")}
            className={
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all " +
              (mode === "goldhive"
                ? "border-primary bg-primary/15 text-primary shadow-[var(--shadow-gold)]"
                : "border-border bg-secondary/40 text-foreground hover:border-primary/50 hover:bg-primary/10")
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            Test Gold Hive Guest
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground"
          >
            Click a button above to simulate a booking and see exactly what data
            (if any) reaches Gold Hive.
          </motion.div>
        )}

        {mode === "normal" && (
          <motion.div
            key="normal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-3 md:grid-cols-2"
          >
            <ReceiptMock source="Direct" />
            <div className="flex flex-col justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16 }}
                className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_24px_oklch(0.7_0.18_150_/_0.6)]"
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
              <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                  Privacy Protected
                </div>
                <div className="mt-1 text-[0.92rem] text-foreground/85">
                  No data sent to Gold Hive. This booking stays entirely in your
                  system — invisible to us.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mode === "goldhive" && (
          <motion.div
            key="goldhive"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-3 md:grid-cols-2"
          >
            <ReceiptMock source="goldhive" />
            <div className="flex flex-col justify-center rounded-xl border border-primary/50 bg-primary/10 p-4">
              <div className="mb-3 flex items-center justify-center gap-3">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background"
                >
                  <Receipt className="h-5 w-5 text-foreground/70" />
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex-1"
                >
                  <Send className="mx-auto h-5 w-5 text-primary" />
                  <div className="mt-1 h-0.5 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-gold)]"
                >
                  <Mail className="h-5 w-5" />
                </motion.div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[0.78rem] text-foreground/70">
                  bookings@goldhive.org
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--gradient-gold)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-gold)]"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Commission Tracked
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReceiptMock({ source }: { source: string }) {
  const isGold = source === "goldhive";
  return (
    <motion.div
      initial={{ rotate: -1, y: 10, opacity: 0 }}
      animate={{ rotate: 0, y: 0, opacity: 1 }}
      className="rounded-xl border border-border bg-background p-4 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between border-b border-dashed border-border pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Receipt className="h-3.5 w-3.5" />
          Booking Receipt
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">#A4F-029</span>
      </div>
      <div className="space-y-1 font-mono text-[0.78rem]">
        <Row k="Guest" v="Jamie R." />
        <Row k="Tour" v="Sunset Kayak · 2 pax" />
        <Row k="Total" v="$148.00" />
        <Row
          k="Source"
          v={source}
          highlight={isGold ? "gold" : "muted"}
        />
      </div>
    </motion.div>
  );
}

function Row({
  k,
  v,
  highlight,
}: {
  k: string;
  v: string;
  highlight?: "gold" | "muted";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span
        className={
          highlight === "gold"
            ? "font-bold text-primary"
            : highlight === "muted"
              ? "text-foreground/70"
              : "text-foreground"
        }
      >
        {v}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Auto-Pilot Button Tagger — global link tagger script for external bookings
// ----------------------------------------------------------------------------

function AutoTaggerCard() {
  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-gold)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Auto-Pilot Button Tagger
            </div>
            <div className="text-base font-semibold text-foreground">
              One script tags every Book Now button — no manual editing
            </div>
          </div>
        </div>
        <VerifiedSafeBadge />
      </div>

      <p className="mb-3 text-[0.92rem] leading-relaxed text-foreground/85">
        <strong className="text-foreground">Dummy-proof setup:</strong> paste this
        script directly below the Phase 1 persistence script in your footer. It
        automatically finds every <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-xs">&lt;a&gt;</code>{" "}
        link pointing at LeadConnector, your booking platform, or Vagaro and tags
        it for you on Gold Hive visits — <em>no manual link editing required.</em>
      </p>

      <CodeBlock code={AUTO_TAGGER_SCRIPT} language="html" />

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniFact label="Runs only when" value="utm_source=goldhive" />
        <MiniFact label="Touches" value="Booking links only" />
        <MiniFact label="Direct traffic" value="Untouched" />
      </div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[0.78rem] text-primary">{value}</div>
    </div>
  );
}
