import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingWizard } from "@/components/wizard/OnboardingWizard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Gold Hive Partner Setup" },
      {
        name: "description",
        content:
          "Set up Gold Hive attribution tracking for your website — get your tracking code and step-by-step install instructions.",
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
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Partner Setup
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Attribution tracking for local partners. Fill in the fields below and we'll give you a
            tracking code, a login link to your dashboard, and step-by-step setup instructions for
            your website.
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
