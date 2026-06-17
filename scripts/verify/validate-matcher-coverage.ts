/**
 * Scoped validation for the spatial-grid matcher (P1.3). Runs the entity->city join over a bounded
 * set of cities into a TEMP facts dir (never touches the real data/raw/cities/facts), then reports
 * per-source city coverage + timing so we can project the full 189K-city run before committing to it.
 *
 * Usage: npx tsx scripts/verify/validate-matcher-coverage.ts [maxCities]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getEntityIndex } from "../data/cities/load-bulk-entities";
import { fetchCitySources } from "../data/cities/fetch-sources";

async function main() {
  const maxCities = Number(process.argv[2] ?? "3000");
  const tmp = path.join(os.tmpdir(), "econmap-matcher-validate");
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log("Loading entity index (cached parse)...");
  const tIdx = Date.now();
  const entityIndex = await getEntityIndex({ forceReload: false });
  console.log(`Entity index ready in ${((Date.now() - tIdx) / 1000).toFixed(1)}s`);

  const t0 = Date.now();
  await fetchCitySources({
    factsDir: tmp,
    forceRebuild: true,
    entityIndex,
    cityFilter: (c) => c.isMajorCity === true,
    maxCities,
    logger: { log: () => {}, warn: () => {} },
  });
  const dt = Date.now() - t0;

  // Tally coverage from the temp facts.
  const files = fs.readdirSync(tmp).filter((f) => f.endsWith(".json"));
  const citiesWithSource: Record<string, number> = {};
  const entityTotals: Record<string, number> = {};
  let citiesWithAnyEntity = 0;
  for (const f of files) {
    const facts = JSON.parse(fs.readFileSync(path.join(tmp, f), "utf-8"));
    if ((facts.entities?.length ?? 0) > 0) citiesWithAnyEntity++;
    for (const s of facts.sources ?? []) citiesWithSource[s] = (citiesWithSource[s] ?? 0) + 1;
    for (const e of facts.entities ?? []) entityTotals[e.type] = (entityTotals[e.type] ?? 0) + 1;
  }

  const n = files.length;
  console.log("\n=== SCOPED MATCHER VALIDATION ===");
  console.log(`cities processed:        ${n}`);
  console.log(`join time:               ${(dt / 1000).toFixed(1)}s  (${(dt / n).toFixed(1)} ms/city)`);
  console.log(`projected full 189,025:  ${((dt / n) * 189025 / 1000 / 60).toFixed(1)} min (join only)`);
  console.log(`cities with >=1 entity:  ${citiesWithAnyEntity} (${((citiesWithAnyEntity / n) * 100).toFixed(1)}%)`);
  console.log("\ncities citing each source (was 9/9/9/4 for UN-LOCODE/WRI/ROR/WPI in the stale manifest):");
  for (const [s, c] of Object.entries(citiesWithSource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s.padEnd(30)} ${c}`);
  }
  console.log("\nentity totals by type:");
  for (const [t, c] of Object.entries(entityTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(18)} ${c}`);
  }

  fs.rmSync(tmp, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
