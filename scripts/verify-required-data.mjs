import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "src/data/generated/world-bank-core.json",
  "src/data/generated/cities/manifest.json",
  "src/data/generated/command-center/manifest.json",
  "public/data/command-center/manifest.json",
  "public/data/globe/manifest.json",
];
const missing = required.filter((relativePath) => !existsSync(resolve(root, relativePath)));

if (missing.length > 0) {
  console.error("EconMap build prerequisites are missing; no fixture data will be fabricated.");
  console.error("Missing generated artifacts:");
  for (const relativePath of missing) {
    console.error(`  - ${relativePath}`);
  }
  console.error("");
  console.error("Reproduce them from reviewed upstream sources:");
  console.error("  1. npm run data:generate-core");
  console.error("  2. npm run data:cities:download-bulk -- --optional");
  console.error("  3. npm run data:cities");
  console.error("");
  console.error("See docs/data/local-verification-prerequisites.md for source and storage boundaries.");
  process.exit(1);
}

console.log("EconMap generated-data prerequisites are present.");
