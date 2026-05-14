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
import { SetupGuide } from "./SetupGuide";
import { Scanner, type ScanResult } from "./Scanner";
import {
  PLATFORMS,
  BOOKING_TYPES,
  SUPPORT_NAME,
  SUPPORT_EMAIL,
  type Platform,
  type BookingType,
} from "./setup-data";

type Stage = "scan" | 1 | 2 | 3;

export function OnboardingWizard() {
  const [stage, setStage] = useState<Stage>("scan");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [provider, setProvider] = useState<string>("");

  const totalSteps = 3;
  const step = stage === "scan" ? 0 : stage;
  const progress = stage === "scan" ? 0 : (step / totalSteps) * 100;

  const handleScanComplete = (r: ScanResult) => {
    setWebsiteUrl(r.url);
    if (r.platform) setPlatform(r.platform);
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
    if (!platform || !bookingType) {
      toast.error("Pick a platform and booking method.");
      return;
    }
    setSubmitting(true);
    try {
      if (recordId) {
        await supabase
          .from("vendor_onboarding")
          .update({
            website_platform: platform,
            booking_type: bookingType,
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
      if (recordId) {
        await supabase
          .from("vendor_onboarding")
          .update({ status: "completed" })
          .eq("id", recordId);
      }
    } catch {
      // Silent
    } finally {
      setSubmitting(false);
      setCompleted(true);
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
                    ? "We pre-filled this from your scan — confirm or adjust."
                    : "Tell us how your site is built so we can tailor the setup instructions."}
                </p>
              </div>

              <div>
                <Label className="mb-3 block text-sm font-medium">
                  What is your Website Platform?
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = platform === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setPlatform(p.value)}
                        className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                          active
                            ? "border-primary bg-primary/10 shadow-[var(--shadow-gold)]"
                            : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                        />
                        <span className="text-xs font-medium">{p.value}</span>
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
                    <span className="text-foreground font-medium">{platform || "your platform"}</span>{" "}
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
