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
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createVendorAccount } from "@/lib/vendor-onboarding.functions";
import { SetupGuide } from "./SetupGuide";
import { Scanner, type ScanResult } from "./Scanner";
import {
  PLATFORM_OPTIONS,
  platformOptionForScan,
  BOOKING_TYPES,
  SUPPORT_NAME,
  SUPPORT_EMAIL,
  type Platform,
  type BookingType,
} from "./setup-data";

type Stage = "scan" | 1 | 2 | "form" | 3;

export function OnboardingWizard() {
  const [stage, setStage] = useState<Stage>("scan");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

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
  // Task 8: raw booking-form HTML (or field names, one per line) the vendor
  // pastes; forwarded to the normalize-vendor-form job at completion.
  const [bookingFormRaw, setBookingFormRaw] = useState<string>("");

  const selectPlatform = (opt: { setup: Platform; slug: string; label: string }) => {
    setPlatform(opt.setup);
    setPlatformSlug(opt.slug);
    setPlatformLabel(opt.label);
  };

  const totalSteps = 4;
  const STEP_OF: Record<Exclude<Stage, "scan">, number> = { 1: 1, 2: 2, form: 3, 3: 4 };
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
    if (!platformSlug || !bookingType) {
      toast.error("Pick a platform and booking method.");
      return;
    }
    setSubmitting(true);
    try {
      if (recordId) {
        await supabase
          .from("vendor_onboarding")
          .update({
            website_platform: platformLabel,
            booking_type: bookingType,
            status: "in_progress",
          })
          .eq("id", recordId);
      }
    } catch {
      // Silent
    } finally {
      setSubmitting(false);
      setStage("form");
    }
  };

  const handleFormNext = () => {
    if (!bookingFormRaw.trim()) {
      toast.error("Paste your booking form HTML, or list your field names one per line.");
      return;
    }
    setStage(3);
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
        <h2 className="mb-2 text-3xl font-semibold tracking-tight">Welcome to the Hive</h2>
        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
          Your integration is registered. Our team will run a verification booking within 1
          business day. Once confirmed, you'll receive credentials for your Partner Dashboard.
        </p>
        <div className="mx-auto mb-6 flex max-w-sm flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 text-left text-sm">
          <div className="flex items-center gap-2 text-primary">
            <LayoutDashboard className="h-4 w-4" />
            <span className="font-medium">What's next</span>
          </div>
          <ul className="space-y-1 pl-6 text-muted-foreground">
            <li className="list-disc">Verification test booking (within 24 hours)</li>
            <li className="list-disc">Partner Dashboard credentials emailed to you</li>
            <li className="list-disc">Listed in the Gold Hive partner directory</li>
          </ul>
        </div>
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
            {step === 1
              ? "Identity"
              : step === 2
                ? "Tech Stack"
                : step === 3
                  ? "Booking Form"
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
                    ? "We pre-filled this from your scan — confirm or adjust."
                    : "Tell us how your site is built so we can tailor the setup instructions."}
                </p>
              </div>

              <div>
                <Label className="mb-3 block text-sm font-medium">
                  What is your Website Platform?
                </Label>
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

              <div>
                <Label className="mb-3 block text-sm font-medium">How do guests book?</Label>
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
                            <span className="text-sm font-medium">{b.value}</span>
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

          {stage === "form" && (
            <motion.div
              key="stepForm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Paste Your Booking Form</h2>
                <p className="mt-2 text-muted-foreground">
                  Paste the HTML of your existing booking or inquiry form. No form yet? List your
                  field names instead — one per line (e.g. <code>full name</code>, <code>email</code>,
                  <code>tour date</code>). We use this to map your fields to Gold Hive automatically.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-form" className="flex items-center gap-2 text-sm">
                  <FileCode className="h-4 w-4 text-primary" /> Booking form HTML or field list
                </Label>
                <Textarea
                  id="booking-form"
                  value={bookingFormRaw}
                  onChange={(e) => setBookingFormRaw(e.target.value)}
                  placeholder={`<form>\n  <input name="full_name" ... />\n  <input name="email" ... />\n  <input name="tour_date" ... />\n</form>`}
                  className="min-h-[220px] bg-input/50 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Pasted as-is and sent to our field-mapping assistant — nothing is published.
                </p>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStage(2)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handleFormNext} size="lg" className="btn-gold gap-2">
                  Next <ArrowRight className="h-4 w-4" />
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
                  <Button variant="ghost" onClick={() => setStage("form")} className="gap-2">
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
