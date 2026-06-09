/**
 * Builds the vendor-facing tracking snippet for the wizard completion screen.
 *
 * The deployed `tracking.js` reads its settings from
 * `window.GoldHive.config = { vendorId, webhookEndpoint }` — it does NOT read
 * `data-vendor-id` / `data-webhook` HTML attributes (those are ignored, which
 * left every wizard graduate with an inert script that fired nothing). So the
 * config object MUST be set before the script tag loads.
 *
 * Contract mirrored by:
 *  - gold-hive-attribution/src/tracking/tracking.js (reads window.GoldHive.config)
 *  - gold-hive-attribution/src/tracking/test.html    (reference head)
 *  - gold-hive-attribution/tests/wizard-snippet.spec.ts (runtime check)
 */
export function buildTrackingSnippet(
  vendorId: string,
  trackingBase: string
): string {
  return [
    `<script>`,
    `  window.GoldHive = {`,
    `    config: {`,
    `      vendorId: "${vendorId}",`,
    `      webhookEndpoint: "${trackingBase}/api/webhook/booking"`,
    `    }`,
    `  };`,
    `</script>`,
    `<script src="${trackingBase}/tracking.js"></script>`,
  ].join("\n");
}
