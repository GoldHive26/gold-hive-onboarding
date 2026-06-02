import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const PORTAL_URL = process.env.VENDOR_PORTAL_URL || "https://portal.goldhive.org";

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
  | { ok: true; vendor_id: string; user_id: string; emailed: boolean }
  | { ok: false; error: "already_registered" | "create_failed" | "vendor_insert_failed"; message: string };

function credentialEmailHtml(name: string, loginLink: string, email: string): string {
  const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; color:#1a1a1a;">
    <p>Hi ${safeName},</p>
    <p>Your Gold Hive Partner Dashboard is ready. Your account email is <strong>${email}</strong>.</p>
    <p style="margin:24px 0;">
      <a href="${loginLink}" style="display:inline-block; padding:14px 28px; background:#C9973A; color:#000; font-weight:bold; text-decoration:none; border-radius:8px;">Log in to your dashboard</a>
    </p>
    <p style="font-size:13px; color:#666;">This one-time sign-in link logs you straight in (no password needed) and expires shortly. You can always reach your portal at <a href="${PORTAL_URL}">${PORTAL_URL}</a>.</p>
  </body>
</html>`;
}

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

    // Task 4: credential email — a one-time magic link into the portal. Non-fatal
    // on failure: the vendor exists and the link can be re-sent.
    let emailed = false;
    try {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${PORTAL_URL}/dashboard/vendor` },
      });
      if (linkErr) throw linkErr;
      const actionLink = linkData?.properties?.action_link;
      if (actionLink) {
        await sendEmail({
          to: email,
          subject: "Your Gold Hive Partner Dashboard is ready",
          html: credentialEmailHtml(data.name, actionLink, email),
        });
        emailed = true;
      }
    } catch (err) {
      console.error("Credential email failed", err);
    }

    return { ok: true, vendor_id: vendorRow.id as string, user_id: userId, emailed };
  });
