/**
 * Space-lean SCOPED re-run: propagates the P1.1/P1.3 parser+matcher fixes to the cities that get
 * pre-rendered dossier pages (population >= threshold), without the ~14GB peak of the full 189K run
 * — which does not fit in the limited SSD free space. The full registry is still ingested (so search
 * covers all cities) and generateArtifacts still writes a point for every city; only the per-city
 * entity JOIN is scoped, which is what costs space/time.
 *
 * facts/ is deleted right after resolve (generateArtifacts reads resolved/, not facts/) to keep the
 * peak footprint ~ resolved + artifacts. Enrichment (connectivity/environment/economic) is skipped —
 * it is unaffected by the matcher fix and its prior values remain in command-center/.
 *
 * Usage: npx tsx scripts/data/cities/rerun-scoped.ts [minPopulation=50000]
 */
import fs from "node:fs";
import path from "node:path";

import { ingestRegistry } from "./ingest-registry";
import { fetchCitySources } from "./fetch-sources";
import { resolveEntities } from "./resolve-entities";
import { generateArtifacts } from "./generate-artifacts";
import { generateGlobeArtifacts } from "./generate-globe-artifacts";

async function main() {
  const minPop = Number(process.argv[2] ?? "50000");
  const t0 = Date.now();
  console.log(`=== SCOPED re-run (population >= ${minPop}) ===`);

  console.log("[1/5] ingest registry (full)...");
  await ingestRegistry();

  // Slim slug -> {name, iso3, population} lookup. The city route's static-export
  // build functions read this (~11MB) instead of the full 113MB registry, which
  // otherwise parses to ~500MB resident per worker and OOMs the export.
  {
    const genDir = path.join(process.cwd(), "src", "data", "generated", "cities");
    const registry: Array<{ slug: string; name: string; countryIso3: string; population?: number | null }> =
      JSON.parse(fs.readFileSync(path.join(genDir, "registry.json"), "utf-8"));
    const meta: Record<string, { n: string; i: string; p: number }> = {};
    for (const c of registry) meta[c.slug] = { n: c.name, i: c.countryIso3, p: c.population ?? 0 };
    fs.writeFileSync(path.join(genDir, "slug-meta.json"), JSON.stringify(meta));
    console.log(`  wrote slug-meta.json (${registry.length} entries)`);
  }

  console.log(`[2/5] fetch sources (scoped join, pop >= ${minPop})...`);
  await fetchCitySources({
    forceRebuild: true,
    cityFilter: (c) => (c.population ?? 0) >= minPop,
  });

  console.log("[3/5] resolve entities...");
  await resolveEntities({ forceRebuild: true });

  // Free the facts footprint before generateArtifacts (which only needs resolved/).
  const factsDir = path.join(process.cwd(), "data", "raw", "cities", "facts");
  try {
    fs.rmSync(factsDir, { recursive: true, force: true });
    console.log("  freed facts/ to reduce peak disk usage");
  } catch {}

  console.log("[4/5] generate per-city artifacts...");
  await generateArtifacts();

  console.log("[5/5] generate globe artifacts...");
  await generateGlobeArtifacts();

  console.log(`=== scoped re-run complete in ${((Date.now() - t0) / 60000).toFixed(1)} min ===`);
}

main().catch((e) => {
  console.error("SCOPED RE-RUN FAILED:", e);
  process.exit(1);
});
