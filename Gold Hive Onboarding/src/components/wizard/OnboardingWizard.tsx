import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  PartyPopper,
  Mail,
  Building2,
  LayoutDashboard,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createVendorAccount } from "@/lib/vendor-onboarding.functions";
import { SetupGuide } from "./SetupGuide";
import { CodeBlock } from "./CodeBlock";
import { buildTrackingSnippet } from "@/lib/tracking-snippet";
import { Scanner, type ScanResult } from "./Scanner";

// Tracking host — stays on the Vercel domain until the Week 4 CNAME swap.
const TRACKING_BASE = "https://gold-hive-attribution.vercel.app";
// Reserved partner id for the self-serve "Verify installation" ping. The vendor
// opens their own site with ?gh_partner=<this>; tracking.js fires one `visit`,
// the webhook flips vendors.tracking_installed and stores nothing. Keep in sync
// with VERIFY_PARTNER_ID in gold-hive-attribution/src/webhook/handle-booking.ts.
const VERIFY_PARTNER_ID = "feedface-0000-4000-8000-000000000001";
const WEBHOOK_SETUP_DOC =
  "https://github.com/GoldHive26/gold-hive-attribution/blob/main/docs/vendor-webhook-setup.md";
import {
  PLATFORM_OPTIONS,
  platformOptionForScan,
  bookingBehaviorForSlug,
  BOOKING_TYPES,
  SUPPORT_NAME,
  SUPPORT_EMAIL,
  type Platform,
  type BookingType,
  type PlatformOption,
} from "./setup-data";

type Stage = "scan" | 1 | 2 | 3;

export function OnboardingWizard() {
  const [stage, setStage] = useState<Stage>("scan");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<
    "idle" | "checking" | "installed" | "notyet"
  >("idle");

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // `platform` is the SetupGuide content key; `platformSlug` is what we store on
  // vendors.platform (Task 3); `platformLabel` is what the vendor sees.
  const [platform, setPlatform] = useState<Platform | "">("");
  const [platformSlug, setPlatformSlug] = useState<string>("");
  const [platformLabel, setPlatformLabel] = useState<string>("");
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [provider, setProvider] = useState<string>("");

  const selectPlatform = (opt: PlatformOption) => {
    setPlatform(opt.setup);
    setPlatformSlug(opt.slug);
    setPlatformLabel(opt.label);
    // Section 2 is platform-aware: for platforms that own the booking/checkout we
    // pre-set the implied method and hide the question (see PlatformOption.booking).
    switch (opt.booking) {
      case "external":
        // Platform hosts the booking page (Peek, Rezdy) → tagged external link.
        setBookingType("External Booking Link");
        setProvider(opt.provider ?? "");
        break;
      case "native": // checkout on the vendor's own site → tracking-script guide
      case "fareharbor": // affiliate path keyed off `platform === "FareHarbor"`
      case "choose": // vendor picks; clear any auto value from a prior selection
        setBookingType("");
        setProvider("");
        break;
    }
  };

  // Section 2 ("how do guests book or make a purchase") only applies to platforms
  // where the vendor chooses their method; platforms that own booking/checkout
  // hide it. Shown by default until a platform is picked.
  const bookingBehavior = bookingBehaviorForSlug(platformSlug);
  const showBookingSection =
    bookingBehavior === undefined || bookingBehavior === "choose";

  const totalSteps = 3;
  const STEP_OF: Record<Exclude<Stage, "scan">, number> = { 1: 1, 2: 2, 3: 3 };
  const step = stage === "scan" ? 0 : STEP_OF[stage];
  const progress = stage === "scan" ? 0 : (step / totalSteps) * 100;

  const handleScanComplete = (r: ScanResult) => {
    setWebsiteUrl(r.url);
    if (r.platform) {
      const opt = platformOptionForScan(r.platform);
      if (opt) selectPlatform(opt);
    }
    if (r.bookingType) setBookingType(r.bookingType);
    if (r.provider) setProvider(r.provider);
    setStage(1);
  };

  const handleStep1Next = async () => {
    if (!companyName.trim() || !contactEmail.trim()) {
      toast.error("Please complete both fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await supabase
        .from("vendor_onboarding")
        .insert({
          company_name: companyName.trim(),
          contact_email: contactEmail.trim(),
          status: "started",
        })
        .select("id")
        .single();
      if (data?.id) setRecordId(data.id);
    } catch {
      // Silent — user can still continue and view their guide.
    } finally {
      setSubmitting(false);
      setStage(2);
    }
  };

  const handleStep2Next = async () => {
    if (!platformSlug) {
      toast.error("Pick a platform.");
      return;
    }
    // Only platforms that show Section 2 require an explicit booking method;
    // for the rest the platform itself determines it.
    if (showBookingSection && !bookingType) {
      toast.error("Pick how guests book or make a purchase.");
      return;
    }
    setSubmitting(true);
    try {
      if (recordId) {
        await supabase
          .from("vendor_onboarding")
          .update({
            website_platform: platformLabel,
            booking_type: bookingType || null,
            status: "in_progress",
          })
          .eq("id", recordId);
      }
    } catch {
      // Silent
    } finally {
      setSubmitting(false);
      setStage(3);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      // Task 3: create the vendor's auth account + vendors row (service role).
      const res = await createVendorAccount({
        data: {
          email: contactEmail.trim(),
          name: companyName.trim(),
          platform: platformSlug,
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        return; // stay on the guide so they can fix the email / contact support
      }
      setVendorId(res.vendor_id);

      if (recordId) {
        await supabase
          .from("vendor_onboarding")
          .update({ status: "completed" })
          .eq("id", recordId);
      }
      setCompleted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't finish setup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Self-serve install check: look up whether the vendor's script has pinged us
  // yet (set when they open their site via the verify test link, or on any real
  // Gold Hive booking). Manual — the vendor clicks "Check installation".
  const checkInstall = async () => {
    if (!vendorId) return;
    setVerifyState("checking");
    try {
      const res = await fetch(`${TRACKING_BASE}/webhook/verify?vendor_id=${vendorId}`);
      const data = await res.json();
      setVerifyState(data?.installed ? "installed" : "notyet");
    } catch {
      setVerifyState("notyet");
    }
  };

  if (completed) {
    const scriptTag = vendorId ? buildTrackingSnippet(vendorId, TRACKING_BASE) : "";
    const normalizedSite = websiteUrl.trim()
      ? /^https?:\/\//i.test(websiteUrl.trim())
        ? websiteUrl.trim()
        : `https://${websiteUrl.trim()}`
      : "";
    const verifyLink = normalizedSite
      ? `${normalizedSite}${normalizedSite.includes("?") ? "&" : "?"}gh_partner=${VERIFY_PARTNER_ID}`
      : "";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-primary/30 bg-card p-10 text-center shadow-[var(--shadow-gold)]"
      >
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gradient-gold)] shadow-[var(--shadow-gold)]"
        >
          <PartyPopper className="h-10 w-10 text-primary-foreground" />
        </motion.div>
        <h2 className="mb-2 text-3xl font-semibold tracking-tight">Welcome to the Hive</h2>
        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
          Your integration is registered. Install the snippet below and verify it yourself in
          seconds — your Partner Dashboard credentials are on their way to your inbox.
        </p>
        <div className="mx-auto mb-6 flex max-w-sm flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 text-left text-sm">
          <div className="flex items-center gap-2 text-primary">
            <LayoutDashboard className="h-4 w-4" />
            <span className="font-medium">What's next</span>
          </div>
          <ul className="space-y-1 pl-6 text-muted-foreground">
            <li className="list-disc">Verify your install with the button below</li>
            <li className="list-disc">Partner Dashboard credentials emailed to you</li>
            <li className="list-disc">Listed in the Gold Hive partner directory</li>
          </ul>
        </div>

        {scriptTag && (
          <div className="mx-auto mb-6 max-w-xl text-left">
            <h3 className="mb-1 text-sm font-semibold tracking-tight">Install your tracking script</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Paste this into your site's <code>&lt;head&gt;</code>. It's unique to your account
              (your vendor ID is baked in).{" "}
              <a
                href={WEBHOOK_SETUP_DOC}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                vendor-webhook-setup.md
              </a>
            </p>
            <CodeBlock code={scriptTag} language="html" />
          </div>
        )}

        {vendorId && (
          <div className="mx-auto mb-6 max-w-xl text-left">
            <h3 className="mb-1 text-sm font-semibold tracking-tight">
              Verify it's working
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Once the snippet is published on your site,{" "}
              {verifyLink ? (
                <>
                  open{" "}
                  <a
                    href={verifyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    your test link
                  </a>
                </>
              ) : (
                <>
                  open your site with{" "}
                  <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono">
                    ?gh_partner={VERIFY_PARTNER_ID}
                  </code>{" "}
                  added to the address
                </>
              )}{" "}
              — it sends one harmless test ping (no booking, no customer data) —
              then check below.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={checkInstall}
                disabled={verifyState === "checking"}
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
                  Not detected yet — open the test link on your published site,
                  then check again.
                </span>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Questions?{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_NAME} — {SUPPORT_EMAIL}
          </a>
        </p>
      </motion.div>
    );
  }

  if (stage === "scan") {
    return <Scanner onComplete={handleScanComplete} onSkip={() => setStage(1)} />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xl print:border-0 print:shadow-none">
      {/* Progress */}
      <div className="border-b border-border px-6 pt-6 pb-5 print:hidden sm:px-8">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Step {step} of {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">
            {step === 1 ? "Identity" : step === 2 ? "Tech Stack" : "Setup Guide"}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full bg-[var(--gradient-gold)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8">
        <AnimatePresence mode="wait">
          {stage === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Welcome to the Hive</h2>
                <p className="mt-2 text-muted-foreground">
                  Let's get your technical integration started. This wizard takes about 10
                  minutes and produces a personalized setup guide for your IT team.
                </p>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-primary" /> Company Name
                  </Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Backspin Social"
                    className="h-11 bg-input/50"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" /> Contact Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="ops@yourcompany.com"
                    className="h-11 bg-input/50"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send Partner Dashboard credentials and verification confirmations
                    here.
                  </p>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStage("scan")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Scan
                </Button>
                <Button
                  onClick={handleStep1Next}
                  disabled={submitting}
                  size="lg"
                  className="btn-gold gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Next <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Your Tech Stack</h2>
                <p className="mt-2 text-muted-foreground">
                  {platform || bookingType
                    ? "We pre-filled this from your scan — confirm or adjust below."
                    : "Tell us how your site is built so we can tailor the setup instructions."}
                </p>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    1
                  </span>
                  <Label className="text-sm font-medium">Your website platform</Label>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {PLATFORM_OPTIONS.map((p) => {
                    const Icon = p.icon;
                    const active = platformSlug === p.slug;
                    return (
                      <button
                        key={p.slug}
                        onClick={() => selectPlatform(p)}
                        className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                          active
                            ? "border-primary bg-primary/10 shadow-[var(--shadow-gold)]"
                            : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                        />
                        <span className="text-xs font-medium">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showBookingSection && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    2
                  </span>
                  <Label className="text-sm font-medium">
                    How do guests book or make a purchase?
                  </Label>
                </div>
                <div className="space-y-2.5">
                  {BOOKING_TYPES.map((b) => {
                    const Icon = b.icon;
                    const active = bookingType === b.value;
                    const showProviderChip =
                      b.value === "External Booking Link" && !!provider;
                    return (
                      <button
                        key={b.value}
                        onClick={() => setBookingType(b.value)}
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10 shadow-[var(--shadow-gold)]"
                            : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{b.label}</span>
                            {showProviderChip && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
                                Detected: {provider}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{b.desc}</div>
                        </div>
                        {active && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStage(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleStep2Next}
                  disabled={submitting}
                  size="lg"
                  className="btn-gold gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Next <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {stage === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:block">
                <div>
                  <h2 className="text-4xl font-semibold tracking-tight sm:text-[2.6rem]">
                    Your Integration Manual
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Personalized for{" "}
                    <span className="text-foreground font-medium">{platformLabel || "your platform"}</span>{" "}
                    +{" "}
                    <span className="text-foreground font-medium">{bookingType || "your booking method"}</span>.
                    Hand this to your IT team — every code block is copy-ready.
                  </p>
                </div>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="shrink-0 gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary print:hidden"
                >
                  <Download className="h-4 w-4" /> Download PDF Guide
                </Button>
              </div>

              <SetupGuide
                platform={platform}
                bookingType={bookingType}
                companyName={companyName}
                websiteUrl={websiteUrl}
                provider={provider}
              />

              {/* Sticky finish bar — always visible while reviewing the manual */}
              <div className="sticky bottom-3 z-20 -mx-2 mt-4 rounded-2xl border border-primary/40 bg-card/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.45),0_0_24px_oklch(0.78_0.16_85_/_0.25)] backdrop-blur supports-[backdrop-filter]:bg-card/80 print:hidden sm:-mx-4">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" onClick={() => setStage(2)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={submitting}
                      size="lg"
                      className="btn-gold gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Mark Setup Complete <Check className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
