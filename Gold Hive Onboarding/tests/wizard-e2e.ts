/**
 * Task 6 — full onboarding wizard end-to-end (server side).
 *
 * No Playwright/vitest harness exists in this repo, so this is a standalone
 * bun-runnable e2e that drives the REAL two-step path the wizard uses:
 * `registerVendor` (Step 1, silent — no email) then `finalizeVendor`
 * ("Mark Setup Complete" — sets platform + sends the credential email), against
 * the dev Supabase + Trigger.dev, then asserts every artifact and cleans up.
 *
 * Run:  bun run tests/wizard-e2e.ts      (from the app dir; Bun loads .env)
 *
 * Covers: auth user + vendors row created at register (10% / monthly, platform
 * null, NO email), platform set + credential-email path at finalize, and the
 * vendor-specific tracking <script> snippet. Field mapping is NO LONGER
 * collected at onboarding (vendors never paste their form) — the webhook
 * auto-learns it from the first real booking — so no mapping is triggered here.
 *
 * NOT covered here (manual, cross-repo): clicking the magic link logs the
 * vendor into the partner-hub portal and shows an empty dashboard — verify by
 * hand once, since the portal is a separate app. Email *delivery* within 60s
 * was verified in Task 4 (Resend test-mode only delivers to the account owner,
 * so a throwaway recipient here reports emailed=false without a code fault).
 */
import { createClient } from "@supabase/supabase-js";
import {
  registerVendorCore,
  finalizeVendorCore,
} from "../src/lib/vendor-onboarding.functions";
import { buildTrackingSnippet } from "../src/lib/tracking-snippet";

const TRACKING_BASE = "https://gold-hive-attribution.vercel.app";
const svc = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

function assert(cond: unknown, label: string) {
  console.log(`${cond ? "✅" : "❌"} ${label}`);
  if (!cond) process.exitCode = 1;
}

const email = `wizard-e2e-${Date.now()}@example.com`;

console.log(`\n— Onboarding wizard e2e (fresh email: ${email}) —\n`);

// 1. Step 1 — register the vendor (silent: no email, platform null).
const res = await registerVendorCore({
  email,
  company_name: "E2E Tour Co",
  contact_name: "Alex Rivera",
});
assert(res.ok, "Step 1 register succeeds (registerVendor ok)");
if (!res.ok) {
  console.log("  error:", res.message);
  process.exit(1);
}
console.log(`  vendor_id=${res.vendor_id} user_id=${res.user_id}`);

// 2. Auth user created.
const { data: gotUser } = await svc.auth.admin.getUserById(res.user_id);
assert(gotUser?.user?.email === email, "auth user created with matching email");

// 3. Vendors row created + linked + defaults; platform null until finalize.
const { data: registered } = await svc
  .from("vendors")
  .select("id, user_id, name, email, commission_percent, pay_cycle, platform")
  .eq("id", res.vendor_id)
  .single();
assert(registered?.user_id === res.user_id, "vendors row linked by user_id");
assert(registered?.name === "E2E Tour Co", "vendors.name is the company name");
assert(
  Number(registered?.commission_percent) === 10,
  "commission_percent default 10",
);
assert(registered?.pay_cycle === "monthly", "pay_cycle default monthly");
assert(
  registered?.platform == null,
  "platform null after register (set at finalize)",
);

// 4. Finalize ("Mark Setup Complete") — sets platform + sends credential email.
const fin = await finalizeVendorCore({
  vendor_id: res.vendor_id,
  email,
  contact_name: "Alex Rivera",
  platform: "shopify",
});
assert(fin.ok, "finalize succeeds (finalizeVendor ok)");
if (!fin.ok) {
  console.log("  error:", fin.message);
}
console.log(
  `  emailed=${fin.ok && fin.emailed} mappingTriggered=${fin.ok && fin.mappingTriggered}`,
);

// 5. Platform slug stored after finalize.
const { data: finalized } = await svc
  .from("vendors")
  .select("platform")
  .eq("id", res.vendor_id)
  .single();
assert(
  finalized?.platform === "shopify",
  "platform slug stored at finalize (shopify)",
);

// 6. No field mapping at onboarding — the webhook auto-learns it from the
//    vendor's first real booking (vendors never paste their form).
assert(
  fin.ok && !fin.mappingTriggered,
  "field mapping NOT triggered at onboarding (auto-learned on first booking)",
);

// 7. Credential-email path ran at finalize (boolean present; delivery proven in Task 4).
assert(
  fin.ok && typeof fin.emailed === "boolean",
  "credential-email path executed at finalize",
);

// 8. Vendor-specific tracking snippet carries the real UUID + config-first shape.
const scriptTag = buildTrackingSnippet(res.vendor_id, TRACKING_BASE);
assert(
  scriptTag.includes(res.vendor_id),
  "snippet contains the new vendor UUID",
);
assert(
  scriptTag.includes("window.GoldHive") &&
    scriptTag.includes(`${TRACKING_BASE}/tracking.js`) &&
    scriptTag.includes("/api/webhook/booking"),
  "snippet has config + correct src + webhook",
);

// 9. Duplicate register with the same email is rejected (no double-insert).
const dup = await registerVendorCore({
  email,
  company_name: "E2E Tour Co",
  contact_name: "Alex Rivera",
});
assert(
  !dup.ok && dup.error === "already_registered",
  "duplicate email rejected (already_registered)",
);
const { data: rows } = await svc
  .from("vendors")
  .select("id")
  .eq("email", email);
assert(
  (rows ?? []).length === 1,
  "exactly one vendor row for the email (no double-insert)",
);

// Cleanup.
await svc.from("vendors").delete().eq("user_id", res.user_id);
await svc.auth.admin.deleteUser(res.user_id);
console.log("\ncleanup: removed test vendor + auth user");
console.log(process.exitCode ? "\nFAIL ❌" : "\nPASS ✅");
