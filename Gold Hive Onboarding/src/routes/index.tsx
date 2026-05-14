import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingWizard } from "@/components/wizard/OnboardingWizard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Partner Onboarding — Gold Hive" },
      {
        name: "description",
        content:
          "Connect your booking system to Gold Hive in three guided steps — tracking script, hidden fields, and BCC audit rule.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium tracking-wider text-primary uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Partner Integration Protocol · v1.2
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="bg-[var(--gradient-gold)] bg-clip-text text-transparent">
              Gold Hive
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            High-persistence attribution tracking for local partners. Complete this 3-step
            wizard to receive your personalized setup guide.
          </p>
        </header>

        <OnboardingWizard />

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Technical Support: Christopher Turpin —{" "}
          <a className="text-primary hover:underline" href="mailto:cturpin@goldhive.org">
            cturpin@goldhive.org
          </a>
        </footer>
      </div>

      <Toaster theme="dark" />
    </div>
  );
}
