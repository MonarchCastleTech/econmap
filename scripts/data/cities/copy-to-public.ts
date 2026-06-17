/**
 * Copies generated city data from src/data/generated/cities/ to public/data/cities/
 * so the static export can serve workspace JSONs via client-side fetch.
 *
 * Usage: npx tsx scripts/data/cities/copy-to-public.ts
 *
 * Note: For the initial copy, this takes several minutes due to 189K+ small files.
 * Subsequent runs are faster because unchanged files are skipped.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const CITIES_DIR = path.join(process.cwd(), "src", "data", "generated", "cities");
const PUBLIC_CITIES_DIR = path.join(process.cwd(), "public", "data", "cities");
const COMMAND_CENTER_DIR = path.join(process.cwd(), "src", "data", "generated", "command-center");
const PUBLIC_COMMAND_CENTER_DIR = path.join(process.cwd(), "public", "data", "command-center");
// Command-center artifacts the static-export city dossier fetches at runtime.
const COMMAND_CENTER_FILES = ["manifest.json"];

// Legacy per-type dirs — now packed into ONE Range-addressable bundle (dossiers/), no longer shipped.
const LEGACY_SUBDIRS = ["workspaces", "entities", "sources", "coverage"];
// Root-level files to copy. registry.json (117MB) is NO LONGER shipped — the client derives cityId
// from the slug + reads the city from the dossier bundle (S1). search-index.json is rebuilt slim
// (navigable cities only, ~2.4MB) below rather than copied raw (59MB).
const ROOT_FILES = ["manifest.json"];

async function main() {
  console.log("Copying generated city data to public/data/cities/...");
  console.log("Note: Initial copy of 189K+ files may take several minutes.\n");

  const startTime = Date.now();

  // Root-level files FIRST: registry.json gates findCityBySlug, so the city dossier resolves as
  // soon as these small files land — before the slow 189K-file subdir copies.
  for (const file of ROOT_FILES) {
    const src = path.join(CITIES_DIR, file);
    const dest = path.join(PUBLIC_CITIES_DIR, file);

    try {
      await fs.access(src);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      console.log(`  Copied ${file}`);
    } catch {
      console.log(`  Skipping ${file} (does not exist)`);
    }
  }

  // Command-center artifacts (the city dossier client fetches the manifest from here).
  for (const file of COMMAND_CENTER_FILES) {
    const src = path.join(COMMAND_CENTER_DIR, file);
    const dest = path.join(PUBLIC_COMMAND_CENTER_DIR, file);
    try {
      await fs.access(src);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      console.log(`  Copied command-center/${file}`);
    } catch {
      console.log(`  Skipping command-center/${file} (does not exist)`);
    }
  }

  // Dossiers ship as ONE Range-addressable gzip bundle (build-dossier-bundle.ts) instead of 351K
  // per-type files. Remove any stale per-type dirs from public, then (re)build the bundle.
  for (const subdir of LEGACY_SUBDIRS) {
    await fs.rm(path.join(PUBLIC_CITIES_DIR, subdir), { recursive: true, force: true });
  }
  console.log("  Building dossier bundle (public/data/cities/dossiers/)...");
  execSync("npx tsx scripts/data/cities/build-dossier-bundle.ts", { stdio: "inherit" });
  console.log("  Building slim search index (public/data/cities/search-index.json)...");
  execSync("npx tsx scripts/data/cities/build-search-index-slim.ts", { stdio: "inherit" });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone. Copy completed in ${elapsed}s.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
