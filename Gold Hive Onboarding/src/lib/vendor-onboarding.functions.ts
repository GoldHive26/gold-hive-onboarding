import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";

/**
 * Server-side onboarding actions (service role). Uses its own *untyped*
 * Supabase client because the generated Database type in this repo only knows
 * `vendor_onboarding` — the shared dev DB's `vendors`/auth tables are owned by
 * the attribution project. Secrets come from process.env (Bun loads .env in
 * dev; set as wrangler secrets for prod).
 */
function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Portable random password (Web Crypto — works in Node and Cloudflare Workers).
function generatePassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex}Aa1!`; // satisfies length + complexity requirements
}

// Step 1 registration: create the auth user + vendors row up front so the
// wizard has a real vendor_id for the personalized snippet and the verify
// button. No email is sent during onboarding — the welcome/login email goes
// out when a Gold Hive admin approves the account in the partner portal.
const registerVendorInput = z.object({
  email: z.string().trim().email().max(320),
  // The business / vendor name shown in the dashboard + partner directory.
  company_name: z.string().trim().min(1).max(200),
  // The contact person's name — used only to address the credential email.
  contact_name: z.string().trim().max(200).optional(),
  // The vendor's site URL (scan finalUrl, else what they typed in the wizard).
  // Auto-captured into vendors.website; admins can override later. Nullable.
  website: z.string().trim().max(500).optional(),
});

// Wizard finish: flip the vendor's platform and forward any pasted booking
// form to the mapping job. The login email is sent at admin approval, not here.
const finalizeVendorInput = z.object({
  vendor_id: z.string().uuid(),
  email: z.string().trim().email().max(320),
  contact_name: z.string().trim().max(200).optional(),
  platform: z.string().trim().max(60).optional(),
  // Task 8: the booking-form HTML / field list pasted in the wizard, forwarded
  // to the normalize-vendor-form job once the vendor_id exists.
  raw_form: z.string().trim().max(50000).optional(),
});

export type RegisterVendorResult =
  | { ok: true; vendor_id: string; user_id: string; resumed?: boolean }
  | {
      ok: false;
      error: "create_failed" | "vendor_insert_failed";
      message: string;
    };

export type FinalizeVendorResult =
  | { ok: true; mappingTriggered: boolean }
  | { ok: false; error: "finalize_failed"; message: string };

export type RegisterVendorData = z.infer<typeof registerVendorInput>;
export type FinalizeVendorData = z.infer<typeof finalizeVendorInput>;

/**
 * Step 1 registration (service role): create the Supabase auth user (email
 * pre-confirmed) and insert a linked `vendors` row (commission 10%, monthly).
 * Platform is left null until the wizard knows it (set at finalize). NO email
 * is sent here — the wizard stays silent until the vendor finishes. A duplicate
 * email returns a clear "already registered" without inserting a vendor row.
 *
 * Framework-free so tests can drive it directly (the createServerFn wrapper
 * below is a thin RPC shell over this).
 */
/** Find an existing auth user's id by email (paginated; service role). */
async function findUserIdByEmail(
  supabase: ReturnType<typeof admin>,
  email: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) return null;
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit.id;
    if (users.length < perPage) return null;
    page++;
  }
}

/**
 * Resume an already-registered email: return its existing vendor so the wizard
 * picks up where it left off (no dead-end on duplicate). If the auth user exists
 * but its vendor row is missing (a partial earlier failure), repair it.
 */
async function resumeExistingVendor(
  supabase: ReturnType<typeof admin>,
  email: string,
  companyName: string,
  website?: string,
): Promise<RegisterVendorResult> {
  const { data: rows } = await supabase
    .from("vendors")
    .select("id, user_id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);
  const existing = rows?.[0];
  if (existing?.id) {
    return {
      ok: true,
      vendor_id: existing.id as string,
      user_id: (existing.user_id as string) ?? "",
      resumed: true,
    };
  }

  // Auth user exists but no vendor row — recover by creating one.
  const userId = await findUserIdByEmail(supabase, email);
  if (!userId) {
    return {
      ok: false,
      error: "create_failed",
      message: "That email is registered but we couldn't load its account.",
    };
  }
  const { data: vendorRow, error: vendorErr } = await supabase
    .from("vendors")
    .insert({
      user_id: userId,
      name: companyName,
      email,
      commission_percent: 10,
      pay_cycle: "monthly",
      platform: null,
      website: website?.trim() || null,
    })
    .select("id")
    .single();
  if (vendorErr || !vendorRow?.id) {
    return {
      ok: false,
      error: "vendor_insert_failed",
      message: vendorErr?.message ?? "Failed to create vendor record",
    };
  }
  return {
    ok: true,
    vendor_id: vendorRow.id as string,
    user_id: userId,
    resumed: true,
  };
}

export async function registerVendorCore(
  data: RegisterVendorData,
): Promise<RegisterVendorResult> {
  const supabase = admin();
  const email = data.email.toLowerCase();

  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: generatePassword(),
      // First-login force-set: the portal redirects to /set-password until the
      // vendor replaces the generated password with their own.
      user_metadata: { must_set_password: true },
    });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Failed to create account";
    // Duplicate email → resume the existing vendor instead of dead-ending.
    if (/already|exist|registered/i.test(msg)) {
      return resumeExistingVendor(
        supabase,
        email,
        data.company_name,
        data.website,
      );
    }
    return { ok: false, error: "create_failed", message: msg };
  }
  const userId = created.user.id;

  const { data: vendorRow, error: vendorErr } = await supabase
    .from("vendors")
    .insert({
      user_id: userId,
      name: data.company_name,
      email,
      commission_percent: 10,
      pay_cycle: "monthly",
      platform: null,
      website: data.website?.trim() || null,
    })
    .select("id")
    .single();

  if (vendorErr || !vendorRow?.id) {
    return {
      ok: false,
      error: "vendor_insert_failed",
      message: vendorErr?.message ?? "Failed to create vendor record",
    };
  }

  return { ok: true, vendor_id: vendorRow.id as string, user_id: userId };
}

/**
 * Wizard finish (service role): set the chosen platform on the vendor and
 * forward any pasted booking form to the normalize-vendor-form job. The
 * mapping step is non-fatal — the vendor already exists.
 *
 * NOTE: finalize no longer sends the credential email. Approval now gates the
 * login email — a Gold Hive admin approving the signup in the partner portal
 * (Approvals page) sends the "Your Gold Hive Partner Dashboard is ready"
 * magic-link email from there.
 */
export async function finalizeVendorCore(
  data: FinalizeVendorData,
): Promise<FinalizeVendorResult> {
  const supabase = admin();

  if (data.platform) {
    const { error: updateErr } = await supabase
      .from("vendors")
      .update({ platform: data.platform })
      .eq("id", data.vendor_id);
    if (updateErr) {
      return {
        ok: false,
        error: "finalize_failed",
        message: updateErr.message,
      };
    }
  }

  // Task 8: forward the pasted booking form to the normalize-vendor-form job
  // in the attribution Trigger.dev project (TRIGGER_SECRET_KEY scopes it).
  // Non-fatal — the vendor exists; mapping can be re-run. Requires the task to
  // be deployed in that project (deploy-time dependency).
  let mappingTriggered = false;
  if (data.raw_form) {
    try {
      await tasks.trigger("normalize-vendor-form", {
        vendor_id: data.vendor_id,
        raw_form_html_or_fields: data.raw_form,
      });
      mappingTriggered = true;
    } catch (err) {
      console.error("normalize-vendor-form trigger failed", err);
    }
  }

  return { ok: true, mappingTriggered };
}

export const registerVendor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerVendorInput.parse(input))
  .handler(
    async ({ data }): Promise<RegisterVendorResult> => registerVendorCore(data),
  );

export const finalizeVendor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => finalizeVendorInput.parse(input))
  .handler(
    async ({ data }): Promise<FinalizeVendorResult> => finalizeVendorCore(data),
  );
