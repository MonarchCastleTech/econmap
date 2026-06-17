/**
 * P1.5 resilient full re-run. Same stage order as run-pipeline.ts, but the Python/TS enrichment
 * generators are best-effort (a single enrichment failure logs and continues) so the critical path
 * — ingest -> spatial join -> resolve -> per-city artifacts -> globe layers, which propagates the
 * P1.1 parser fixes and the P1.3 spatial matcher to the served artifacts — always completes.
 *
 * Usage: npx tsx scripts/data/cities/rerun-full.ts
 */
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { assertRequiredBulkSourcesExist } from "./bulk-source-manifest";
import { ingestRegistry } from "./ingest-registry";
import { fetchCitySources } from "./fetch-sources";
import { resolveEntities } from "./resolve-entities";
import { generateArtifacts } from "./generate-artifacts";
import { generateGlobeArtifacts } from "./generate-globe-artifacts";

const execFileAsync = promisify(execFile);
const root = process.cwd();

async function bestEffort(label: string, cmd: string, args: string[]) {
  const t = Date.now();
  try {
    console.log(`[enrichment] ${label} starting...`);
    await execFileAsync(cmd, args, { cwd: root, windowsHide: true, maxBuffer: 1024 * 1024 * 64 });
    console.log(`[enrichment] ${label} done in ${((Date.now() - t) / 1000).toFixed(0)}s`);
  } catch (e) {
    console.warn(`[enrichment] ${label} FAILED (continuing): ${String((e as Error).message).slice(0, 240)}`);
  }
}

async function main() {
  const t0 = Date.now();
  console.log("=== P1.5 full re-run (resilient) ===");
  assertRequiredBulkSourcesExist();

  console.log("[1/6] ingest registry (GeoNames)...");
  await ingestRegistry();

  console.log("[2/6] fetch sources (spatial grid join)...");
  await fetchCitySources({ forceRebuild: true });

  console.log("[3/6] resolve entities...");
  await resolveEntities({ forceRebuild: true });

  console.log("[4/6] generate per-city artifacts...");
  await generateArtifacts();

  console.log("[5/6] enrichment generators (best-effort)...");
  const dir = path.join(root, "scripts", "data", "cities");
  await bestEffort("connectivity", "python", [path.join(dir, "generate-connectivity-artifacts.py")]);
  await bestEffort("environment", "python", [path.join(dir, "generate-environment-artifacts.py")]);
  await bestEffort("economic-coverage", "python", [path.join(dir, "generate-economic-coverage-artifacts.py")]);
  await bestEffort("mobility", "npx", ["tsx", path.join(dir, "generate-mobility-artifacts.ts")]);

  console.log("[6/6] generate globe artifacts...");
  await generateGlobeArtifacts();

  console.log(`=== core + globe complete in ${((Date.now() - t0) / 60000).toFixed(1)} min ===`);
}

main().catch((e) => {
  console.error("RE-RUN FAILED:", e);
  process.exit(1);
});
