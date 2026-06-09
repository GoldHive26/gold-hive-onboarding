import { Resend } from "resend";

/**
 * Server-side transactional email helper (Resend). Recreated locally (the
 * attribution + partner-hub repos can't share code). Reads RESEND_API_KEY +
 * FOLLOW_UP_FROM_EMAIL from process.env (Bun loads .env in dev; wrangler
 * secrets in prod) and throws a clear error rather than failing silently.
 * Call only from server functions.
 */
function getResend(): { client: Resend; from: string } {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY — set it in .env (local) and wrangler secrets (prod)");
  }
  const from = process.env.FOLLOW_UP_FROM_EMAIL;
  if (!from) {
    throw new Error("Missing FOLLOW_UP_FROM_EMAIL — set the transactional sender address");
  }
  return { client: new Resend(key), from };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const { client, from } = getResend();
  const { data, error } = await client.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`);
  if (!data?.id) throw new Error("Resend send returned no message id");
  return { id: data.id };
}
