import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  PartyPopper,
  Mail,
  User,
  Building2,
  LayoutDashboard,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Tag,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  registerVendor,
  finalizeVendor,
} from "@/lib/vendor-onboarding.functions";
import { scanSite, type SiteScanResult } from "@/lib/scan-site.functions";
import { SetupGuide } from "./SetupGuide";

// Tracking host — stays on the Vercel domain until the Week 4 CNAME swap.
const TRACKING_BASE = "https://gold-hive-attribution.vercel.app";
// Vendor-facing dashboard. Mirrors VENDOR_PORTAL_URL in vendor-onboarding.functions.ts.
const PORTAL_URL = "https://portal.goldhive.org";
// Reserved partner id for the self-serve "Verify installation" ping. The vendor
// opens their own site with ?gh_partner=<this>; tracking.js fires one `visit`,
// the webhook flips vendors.tracking_installed and stores nothing. Keep in sync
// with VERIFY_PARTNER_ID in gold-hive-attribution/src/webhook/handle-booking.ts.
const VERIFY_PARTNER_ID = "feedface-0000-4000-8000-000000000001";
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

type Stage = 1 | 2 | 3;

export function OnboardingWizard() {
  const [stage, setStage] = useState<Stage>(1);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<
    "idle" | "checking" | "installed" | "notyet"
  >("idle");

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // `platform` is the SetupGuide content key; `platformSlug` is what we store on
  // vendors.platform (Task 3); `platformLabel` is what the vendor sees.
  const [platform, setPlatform] = useState<Platform | "">("");
  const [platformSlug, setPlatformSlug] = useState<string>("");
  const [platformLabel, setPlatformLabel] = useState<string>("");
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [provider, setProvider] = useState<string>("");

  // Inline "Unsure? Enter your website" scan, living in Step 2 below the grid.
  const runScan = useServerFn(scanSite);
  const [scanUrl, setScanUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SiteScanResult | null>(null);

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
  const step = stage;
  const progress = (step / totalSteps) * 100;

  // Self-serve verify "test link": the vendor opens their published site with
  // this appended; tracking.js fires one ping that flips tracking_installed.
  const normalizedSite = websiteUrl.trim()
    ? /^https?:\/\//i.test(websiteUrl.trim())
      ? websiteUrl.trim()
      : `https://${websiteUrl.trim()}`
    : "";
  const verifyLink = normalizedSite
    ? `${normalizedSite}${normalizedSite.includes("?") ? "&" : "?"}gh_partner=${VERIFY_PARTNER_ID}`
    : "";

  // Vendor website to stamp onto vendors.website (auto-capture; admin can later
  // override). Prefer the scan's resolved finalUrl, else what the user typed.
  const vendorWebsite =
    scanResult?.finalUrl?.trim() || websiteUrl.trim() || normalizedSite || "";

  // Detected booking provider for an external-link result (e.g. Peek, Calendly).
  const detectedProvider =
    scanResult?.signals.bookingProviders[0] ||
    scanResult?.signals.iframeProviders[0] ||
    "";
  // Scan ran but couldn't pin down platform AND booking method.
  const scanInconclusive =
    !!scanResult && (!scanResult.platform || !scanResult.bookingType);

  // For a partial match, name what the scan DID find (platform / booking method /
  // provider) so the message isn't a generic shrug. Empty fields are skipped; if
  // nothing was detected at all we fall back to the original generic wording.
  const partialMatchDetail = (() => {
    if (!scanResult) return "";
    const parts: string[] = [];
    if (scanResult.platform) parts.push(scanResult.platform);
    if (scanResult.bookingType) {
      parts.push(
        scanResult.bookingType === "External Booking Link"
          ? "an external booking link"
          : scanResult.bookingType,
      );
    }
    const prov = scanResult.signals.bookingProviders[0];
    // Avoid repeating the provider if it's already implied by the platform name.
    if (prov && prov !== scanResult.platform) parts.push(prov);
    return parts.join(" / ");
  })();

  // Run the inline scan and auto-apply what we detect to the Step-2 selections.
  const handleScan = async () => {
    const url = scanUrl.trim();
    if (!url || scanning) return;
    setScanning(true);
    setScanResult(null);
    try {
      const data = await runScan({ data: { url } });
      setScanResult(data);
      setWebsiteUrl(data.finalUrl || data.url || url);
      if (data.platform) {
        const opt = platformOptionForScan(data.platform);
        if (opt) selectPlatform(opt);
      }
      // selectPlatform may pre-set booking from the platform; let an explicit
      // detection refine it (and carry the provider for external links).
      if (data.bookingType) setBookingType(data.bookingType);
      const prov =
        data.signals.bookingProviders[0] ||
        data.signals.iframeProviders[0] ||
        "";
      if (prov) setProvider(prov);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't scan that URL.");
    } finally {
      setScanning(false);
    }
  };

  const handleStep1Next = async () => {
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) {
      toast.error("Please complete all three fields.");
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
    }

    // Register the vendor up front so Step 3 can show the real, copy-ready
    // snippet and a working "Check installation" button. No email is sent here
    // — that waits until "Mark Setup Complete" (finalize). Idempotent: skip if
    // we already have a vendor_id (e.g. navigating back then forward).
    if (!vendorId) {
      try {
        const res = await registerVendor({
          data: {
            email: contactEmail.trim(),
            company_name: companyName.trim(),
            contact_name: contactName.trim(),
            website: vendorWebsite || undefined,
          },
        });
        if (res.ok) {
          setVendorId(res.vendor_id);
          // Same email re-entering (e.g. after a refresh) resumes their existing
          // vendor instead of dead-ending — keeps the wizard restartable.
          if (res.resumed) {
            toast.success("Welcome back — picking up where you left off.");
          }
        } else {
          // Soft-fail: let them continue; Step 3 falls back to the example
          // snippet with the verify button disabled.
          toast.error(
            "We couldn't set up your tracking ID just yet — you can still view your guide.",
          );
        }
      } catch {
        toast.error(
          "We couldn't set up your tracking ID just yet — you can still view your guide.",
        );
      }
    }

    setSubmitting(false);
    setStage(2);
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
      // The vendor was registered at Step 1; recover the id if that earlier call
      // failed (so finalize can still send the credential email).
      let id = vendorId;
      if (!id) {
        const reg = await registerVendor({
          data: {
            email: contactEmail.trim(),
            company_name: companyName.trim(),
            contact_name: contactName.trim(),
            website: vendorWebsite || undefined,
          },
        });
        if (!reg.ok) {
          toast.error(reg.message);
          return; // stay on the guide so they can fix the email / contact support
        }
        id = reg.vendor_id;
        setVendorId(id);
      }

      // Finalize: set the chosen platform and send the credential email (a magic
      // login link, addressed to the contact person).
      const fin = await finalizeVendor({
        data: {
          vendor_id: id,
          email: contactEmail.trim(),
          contact_name: contactName.trim(),
          platform: platformSlug,
        },
      });
      if (!fin.ok) {
        toast.error(fin.message);
        return;
      }

      if (recordId) {
        await supabase
          .from("vendor_onboarding")
          .update({ status: "completed" })
          .eq("id", recordId);
      }
      setCompleted(true);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Couldn't finish setup. Please try again.",
      );
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
      const res = await fetch(
        `${TRACKING_BASE}/webhook/verify?vendor_id=${vendorId}`,
      );
      const data = await res.json();
      setVerifyState(data?.installed ? "installed" : "notyet");
    } catch {
      setVerifyState("notyet");
    }
  };

  if (completed) {
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
        <h2 className="mb-2 text-3xl font-semibold tracking-tight">
          Partner Setup Complete
        </h2>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          You're all set. We've emailed{" "}
          <span className="text-foreground font-medium">
            {contactEmail || "your inbox"}
          </span>{" "}
          a one-time link to log in to your Partner Dashboard — referred
          bookings, real-time commission, and your payout schedule all live
          there.
        </p>
        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-gold mx-auto mb-8 inline-flex h-11 items-center gap-2 rounded-md px-6 text-sm font-semibold"
        >
          <LayoutDashboard className="h-4 w-4" /> Go to your Partner Dashboard
        </a>
        <p className="text-xs text-muted-foreground">
          Questions?{" "}
          <a
            className="text-primary hover:underline"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_NAME} — {SUPPORT_EMAIL}
          </a>
        </p>
      </motion.div>
    );
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
            {step === 1
              ? "Identity"
              : step === 2
                ? "Tech Stack"
                : "Setup Guide"}
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
                <h2 className="text-3xl font-semibold tracking-tight">
                  Welcome to the Hive
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Let's get your technical integration started. This wizard
                  takes about 10 minutes and produces a personalized setup guide
                  for your IT team.
                </p>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="company"
                    className="flex items-center gap-2 text-sm"
                  >
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
                  <Label
                    htmlFor="contact-name"
                    className="flex items-center gap-2 text-sm"
                  >
                    <User className="h-4 w-4 text-primary" /> Your Name
                  </Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="h-11 bg-input/50"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground">
                    So we can address your dashboard email to you.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm"
                  >
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
                    We'll send Partner Dashboard credentials and verification
                    confirmations here.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
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
                <h2 className="text-3xl font-semibold tracking-tight">
                  Your Tech Stack
                </h2>
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
                  <Label className="text-sm font-medium">
                    Your website platform
                  </Label>
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
                        {p.iconSrc ? (
                          <img
                            src={p.iconSrc}
                            alt={`${p.label} logo`}
                            className="h-8 w-auto max-w-[5rem] object-contain"
                          />
                        ) : Icon ? (
                          <Icon
                            className={`h-6 w-6 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                          />
                        ) : null}
                        <span className="text-xs font-medium">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional: scan the site to auto-detect platform + booking */}
                <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">
                      Unsure? Enter your website
                    </Label>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    We'll check how your site is built and fill in the platform
                    (and booking method) above.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={scanUrl}
                        onChange={(e) => setScanUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleScan();
                          }
                        }}
                        placeholder="https://yourbusiness.com/book"
                        className="h-11 bg-input/50 pl-9"
                        disabled={scanning}
                      />
                    </div>
                    <Button
                      onClick={handleScan}
                      disabled={!scanUrl.trim() || scanning}
                      size="lg"
                      variant="outline"
                      className="h-11 gap-2"
                    >
                      {scanning && <Loader2 className="h-4 w-4 animate-spin" />}
                      {scanning ? "Scanning…" : "Scan"}
                    </Button>
                  </div>

                  {scanResult && !scanning && (
                    <div
                      className={`mt-3 rounded-lg border p-3 ${
                        scanInconclusive
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-primary/30 bg-primary/5"
                      }`}
                    >
                      <div
                        className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${
                          scanInconclusive ? "text-amber-500" : "text-primary"
                        }`}
                      >
                        {scanInconclusive ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {scanResult.error
                          ? "Scan failed"
                          : scanInconclusive
                            ? "Partial match"
                            : "Detected — filled in above"}
                      </div>
                      {scanInconclusive ? (
                        <p className="text-xs text-muted-foreground">
                          {partialMatchDetail
                            ? `We detected ${partialMatchDetail} but couldn't confirm everything — please confirm your platform`
                            : "We couldn't fully detect your setup — pick your platform above"}
                          {showBookingSection
                            ? partialMatchDetail
                              ? " and booking method above"
                              : " and booking method"
                            : partialMatchDetail
                              ? " above"
                              : ""}{" "}
                          manually.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <ScanCell
                            label="Platform"
                            value={scanResult.platform || "Unknown"}
                            confidence={scanResult.platformConfidence}
                          />
                          <ScanCell
                            label="Booking method"
                            value={
                              scanResult.bookingType === "External Booking Link"
                                ? "External"
                                : scanResult.bookingType || "Unknown"
                            }
                            confidence={scanResult.bookingConfidence}
                            chip={
                              scanResult.bookingType === "External Booking Link"
                                ? detectedProvider
                                : ""
                            }
                          />
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setScanResult(null);
                          setScanUrl("");
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" /> Scan another URL
                      </button>
                    </div>
                  )}
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
                              <span className="text-sm font-medium">
                                {b.label}
                              </span>
                              {showProviderChip && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
                                  Detected: {provider}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {b.desc}
                            </div>
                          </div>
                          {active && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setStage(1)}
                  className="gap-2"
                >
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
                    <span className="text-foreground font-medium">
                      {platformLabel || "your platform"}
                    </span>{" "}
                    +{" "}
                    <span className="text-foreground font-medium">
                      {bookingType || "your booking method"}
                    </span>
                    . Hand this to your IT team — every code block is
                    copy-ready.
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
                vendorId={vendorId}
                trackingBase={TRACKING_BASE}
                verifyState={verifyState}
                verifyLink={verifyLink}
                onCheckInstall={checkInstall}
              />

              {/* Sticky finish bar — always visible while reviewing the manual */}
              <div className="sticky bottom-3 z-20 -mx-2 mt-4 rounded-2xl border border-primary/40 bg-card/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.45),0_0_24px_oklch(0.78_0.16_85_/_0.25)] backdrop-blur supports-[backdrop-filter]:bg-card/80 print:hidden sm:-mx-4">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setStage(2)}
                    className="gap-2"
                  >
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

// Compact result cell for the inline "Unsure? Enter your website" scan.
function ScanCell({
  label,
  value,
  confidence,
  chip,
}: {
  label: string;
  value: string;
  confidence?: "high" | "medium" | "low" | "none";
  chip?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {confidence && confidence !== "none" && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
            {confidence}
          </span>
        )}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
      {chip && (
        <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-primary/50 bg-background px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
          <Tag className="h-3 w-3" /> {chip}
        </div>
      )}
    </div>
  );
}
