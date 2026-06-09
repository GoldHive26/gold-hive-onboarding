import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, CreditCard, Filter } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_NAME } from "@/components/wizard/setup-data";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy & How Tracking Works — Gold Hive" },
      {
        name: "description",
        content:
          "How Gold Hive attribution tracking works and what it does (and doesn't) collect — only Gold Hive-referred traffic, never payment details.",
      },
    ],
  }),
});

function Privacy() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to setup
        </Link>

        <header className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Privacy
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            How tracking works &amp; your privacy
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Gold Hive's tracking is website/webhook only — there's no email BCC,
            and we never get access to your booking system. Here's exactly what
            it does, in plain terms.
          </p>
        </header>

        <div className="space-y-6">
          <Card
            icon={<Filter className="h-5 w-5 text-primary" />}
            title="We only track Gold Hive-referred traffic — not every visitor"
          >
            <p>
              The tracking script stays{" "}
              <span className="font-medium text-foreground">dormant</span> on
              your site. It does nothing until a visitor arrives through a Gold
              Hive partner link — a URL carrying{" "}
              <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-xs text-primary">
                ?gh_partner=…
              </code>
              . Only then does it set a first-party cookie and watch for a
              booking.
            </p>
          </Card>

          <Card
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title="Organic and direct visitors send nothing"
          >
            <p>
              If someone reaches your site directly, from search, or from
              anywhere other than a Gold Hive link, the script transmits
              nothing. Those bookings stay entirely in your system — nothing
              leaves the page. Gold Hive only ever sees the bookings it actually
              referred.
            </p>
          </Card>

          <Card
            icon={<CreditCard className="h-5 w-5 text-primary" />}
            title="We store no payment or card information"
          >
            <p>
              Card numbers, CVV, and similar payment inputs are{" "}
              <span className="font-medium text-foreground">never sent</span>{" "}
              and never stored. When a booking total is available we keep only
              that amount, so we can calculate the referral commission — nothing
              more.
            </p>
          </Card>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-secondary/20 p-5 text-sm text-muted-foreground">
          <p>
            In short: Gold Hive only ever sees the bookings it actually
            referred, and only the fields needed to attribute and commission
            them.
          </p>
          <p className="mt-3 border-t border-border pt-3">
            Questions about any of this? Email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-primary hover:underline"
            >
              {SUPPORT_NAME} — {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          {icon}
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="text-[0.95rem] leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}
