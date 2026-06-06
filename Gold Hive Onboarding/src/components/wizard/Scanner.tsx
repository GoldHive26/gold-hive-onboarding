import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, Search, Loader2, CheckCircle2, ArrowRight, SkipForward,
  RefreshCw, AlertTriangle, Globe, FileText, Link as LinkIcon, Code2, Tag,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scanSite, type SiteScanResult } from "@/lib/scan-site.functions";
import type { Platform, BookingType } from "./setup-data";

export interface ScanResult {
  url: string;
  platform: Platform | "";
  bookingType: BookingType | "";
  pathLabel: string;
  provider?: string;
}

interface Props {
  onComplete: (result: ScanResult) => void;
  onSkip: () => void;
}

const SCAN_PHASES = [
  "Fetching site...",
  "Reading HTML headers...",
  "Detecting CMS fingerprints...",
  "Scanning for booking providers...",
  "Mapping integration path...",
];

export function Scanner({ onComplete, onSkip }: Props) {
  const runScan = useServerFn(scanSite);
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [result, setResult] = useState<SiteScanResult | null>(null);

  const startScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setPhaseIdx(0);
    const interval = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, SCAN_PHASES.length - 1));
    }, 700);
    try {
      const data = await runScan({ data: { url: url.trim() } });
      setResult(data);
    } catch (e) {
      setResult({
        ok: false,
        url: url.trim(),
        platform: "",
        platformConfidence: "none",
        bookingType: "",
        bookingConfidence: "none",
        pathLabel: "Manual Selection Required",
        error: e instanceof Error ? e.message : "Scan failed",
        pagesScanned: [],
        signals: {
          hasForm: false, formCount: 0, hasMailto: false,
          bookingProviders: [], bookingButtonHints: [],
          externalBookingLinks: [], iframeProviders: [], schemaTypes: [],
          scripts: [], cms: [], candidatePagesFound: [],
        },
        recommendations: ["We couldn't reach that URL. Try another page or skip to manual."],
      });
    } finally {
      clearInterval(interval);
      setScanning(false);
    }
  };

  const reset = () => {
    setResult(null);
    setUrl("");
  };

  const detectedProvider =
    result?.signals.bookingProviders[0] || result?.signals.iframeProviders[0] || "";

  const accept = () => {
    if (!result) return;
    onComplete({
      url: result.finalUrl || result.url,
      platform: (result.platform || "") as Platform | "",
      bookingType: (result.bookingType || "") as BookingType | "",
      pathLabel: result.pathLabel,
      provider: detectedProvider,
    });
  };

  const inconclusive = !!result && (!result.platform || !result.bookingType);
  const isExternal = result?.bookingType === "External Booking Link";

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl sm:p-10">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gradient-gold)] shadow-[var(--shadow-gold)]">
          <Radar className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Enter your website</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Paste your website address and we'll check how it's built, then tailor your setup
          instructions. No website to scan? Skip and pick your platform yourself.
        </p>
      </div>

      <div className="mt-7">
        <label htmlFor="site-url" className="mb-2 block text-left text-sm font-medium">
          Website URL
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="site-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !scanning && !result && startScan()}
              placeholder="https://yourbusiness.com/book"
              className="h-12 bg-input/50 pl-9 text-base"
              disabled={scanning || !!result}
            />
          </div>
          <Button
            onClick={startScan}
            disabled={!url.trim() || scanning || !!result}
            size="lg"
            className="btn-gold h-12 gap-2 px-6"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            Scan
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {scanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex flex-col items-center"
            >
              <RadarPulse />
              <motion.div
                key={phaseIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 font-mono text-sm text-primary"
              >
                {SCAN_PHASES[phaseIdx]}
              </motion.div>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-7 space-y-4"
            >
              {/* Headline */}
              <div className={`rounded-xl border p-5 ${inconclusive ? "border-amber-500/40 bg-amber-500/5" : "border-primary/30 bg-primary/5"}`}>
                <div className={`mb-3 flex items-center gap-2 ${inconclusive ? "text-amber-500" : "text-primary"}`}>
                  {inconclusive ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  <span className="text-sm font-medium uppercase tracking-wider">
                    {result.error ? "Scan Failed" : inconclusive ? "Partial Match" : "Scan Complete"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ResultCell
                    label="Detected Platform"
                    value={result.platform || "Unknown"}
                    badge={result.platformConfidence !== "none" ? result.platformConfidence : undefined}
                  />
                  <ResultCell
                    label="Booking Method"
                    value={
                      isExternal
                        ? "External"
                        : result.bookingType || "Unknown"
                    }
                    badge={result.bookingConfidence !== "none" ? result.bookingConfidence : undefined}
                    chip={isExternal && detectedProvider ? detectedProvider : undefined}
                  />
                  <ResultCell label="Routed To" value={result.pathLabel} highlight />
                </div>
                {result.error && (
                  <p className="mt-3 text-xs text-amber-500/90">{result.error}</p>
                )}
              </div>

              {/* Detail signals */}
              {result.ok && (
                <div className="rounded-xl border border-border bg-secondary/30 p-5 text-sm">
                  <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What we found
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {result.signals.title && (
                      <SignalRow icon={Globe} label="Page title" value={result.signals.title} />
                    )}
                    {result.signals.generator && (
                      <SignalRow icon={Tag} label="Generator meta" value={result.signals.generator} />
                    )}
                    <SignalRow icon={FileText} label="Forms on page" value={String(result.signals.formCount)} />
                    {result.signals.bookingProviders.length > 0 && (
                      <SignalRow icon={CheckCircle2} label="Booking providers" value={result.signals.bookingProviders.join(", ")} />
                    )}
                    {result.signals.iframeProviders.length > 0 && (
                      <SignalRow icon={Code2} label="Booking iframes" value={result.signals.iframeProviders.join(", ")} />
                    )}
                    {result.signals.bookingButtonHints.length > 0 && (
                      <SignalRow icon={LinkIcon} label="Booking buttons" value={result.signals.bookingButtonHints.slice(0, 3).join(" · ")} />
                    )}
                    {result.signals.cms.length > 0 && (
                      <SignalRow icon={Code2} label="CMS fingerprints" value={result.signals.cms.join(", ")} />
                    )}
                    {result.signals.schemaTypes.length > 0 && (
                      <SignalRow icon={Tag} label="Schema.org types" value={result.signals.schemaTypes.slice(0, 4).join(", ")} />
                    )}
                    {result.pagesScanned.length > 1 && (
                      <SignalRow icon={Globe} label="Pages scanned" value={`${result.pagesScanned.length} (homepage + booking pages)`} />
                    )}
                  </dl>
                  {result.signals.externalBookingLinks.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">External booking links</div>
                      <ul className="space-y-1 text-xs">
                        {result.signals.externalBookingLinks.slice(0, 3).map((l) => (
                          <li key={l} className="truncate text-primary/90">{l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.recommendations.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Next step</div>
                      <ul className="space-y-1 text-xs text-foreground/80">
                        {result.recommendations.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Try another URL
                  </Button>
                  <Button variant="ghost" onClick={onSkip} className="gap-2">
                    <SkipForward className="h-4 w-4" /> Skip & select manually
                  </Button>
                </div>
                <Button onClick={accept} size="lg" className="btn-gold gap-2">
                  {inconclusive ? "Continue manually" : "Continue"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {!scanning && !result && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex justify-center"
            >
              <button
                onClick={onSkip}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Skip and choose my platform manually →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCell({
  label, value, highlight, badge, chip,
}: { label: string; value: string; highlight?: boolean; badge?: string; chip?: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        {badge && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}
      </div>
      <div className={`mt-1 text-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      {chip && (
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-primary/50 bg-background px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
          <Tag className="h-3 w-3" /> {chip}
        </div>
      )}
    </div>
  );
}

function SignalRow({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-sm">{value}</div>
      </div>
    </div>
  );
}

function RadarPulse() {
  return (
    <div className="relative h-32 w-32">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-primary/60"
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gradient-gold)] shadow-[var(--shadow-gold)]">
          <Radar className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
      <motion.div
        className="absolute left-1/2 top-1/2 h-16 w-[2px] origin-top -translate-x-1/2 bg-gradient-to-b from-primary to-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
