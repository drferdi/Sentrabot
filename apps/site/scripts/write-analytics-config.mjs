import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function envValue(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const config = {
  posthogKey: envValue("SITE_POSTHOG_KEY"),
  posthogHost: envValue("SITE_POSTHOG_HOST"),
  plausibleDomain: envValue("SITE_PLAUSIBLE_DOMAIN"),
  ga4MeasurementId: envValue("SITE_GA4_MEASUREMENT_ID"),
};

if (!Object.values(config).some((value) => value.length > 0)) {
  process.exit(0);
}

writeFileSync(join(root, "public/analytics.json"), `${JSON.stringify(config, null, 2)}\n`);
