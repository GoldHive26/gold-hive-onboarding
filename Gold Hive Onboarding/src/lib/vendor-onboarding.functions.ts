import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
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
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex}Aa1!`; // satisfies length + complexity requirements
}

const createVendorInput = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(200),
  platform: z.string().trim().max(60).optional(),
});

export type CreateVendorResult =
  | { ok: true; vendor_id: string; user_id: string }
  | { ok: false; error: "already_registered" | "create_failed" | "vendor_insert_failed"; message: string };

/**
 * Task 3 — on wizard completion: create the Supabase auth user (service role,
 * email pre-confirmed) and insert a linked `vendors` row (commission 10%,
 * monthly, platform slug). A duplicate email returns a clear "already
 * registered" without inserting a vendor row.
 */
export const createVendorAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createVendorInput.parse(input))
  .handler(async ({ data }): Promise<CreateVendorResult> => {
    const supabase = admin();
    const email = data.email.toLowerCase();

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: generatePassword(),
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "Failed to create account";
      if (/already|exist|registered/i.test(msg)) {
        return {
          ok: false,
          error: "already_registered",
          message: "A vendor with that email is already registered.",
        };
      }
      return { ok: false, error: "create_failed", message: msg };
    }
    const userId = created.user.id;

    const { data: vendorRow, error: vendorErr } = await supabase
      .from("vendors")
      .insert({
        user_id: userId,
        name: data.name,
        email,
        commission_percent: 10,
        pay_cycle: "monthly",
        platform: data.platform ?? null,
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
  });
