import fs from "node:fs";
import path from "node:path";

import { getSourceLicense } from "@/domain/source-licenses";

/**
 * Data-audit checks for `npm run audit:data`. Each check is pure + returns a uniform result so the
 * orchestrator can run them all, emit a machine report, and gate the build. Checks read the small
 * shipped/generated artifacts (manifests, a sample of dossiers/assets, and out/ for size) — never a
 * full 351K-file scan unless `--full` is passed.
 */
export type CheckStatus = "pass" | "fail" | "warn";
export type CheckResult = {
  id: string;
  title: string;
  status: CheckStatus;
  failures: string[];
  warnings: string[];
  metrics: Record<string, number | string>;
};

const ROOT = process.cwd();
const GEN = path.join(ROOT, "src", "data", "generated");
const OUT = path.join(ROOT, "out");
// Audit the DEPLOY ARTIFACT (out/) when it exists — that is what actually ships (post deploy:assemble,
// e.g. telegeography stripped + assets capped) — else fall back to the public source.
const PUBLIC_ASSETS = fs.existsSync(path.join(OUT, "data", "assets"))
  ? path.join(OUT, "data", "assets")
  : path.join(ROOT, "public", "data", "assets");

// GitHub Pages / git limits (verified): site soft cap 1 GB, per-file git hard limit 100 MB, warn 50 MiB.
const SITE_CAP = 1024 * 1024 * 1024;
const FILE_HARD = 100 * 1024 * 1024;
const FILE_WARN = 50 * 1024 * 1024;

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

function sampleDir(dir: string, limit: number): string[] {
  try {
    const all = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    if (all.length <= limit) return all;
    const step = Math.ceil(all.length / limit);
    return all.filter((_, i) => i % step === 0);
  } catch {
    return [];
  }
}

function walk(dir: string): { files: number; bytes: number; largest: Array<{ path: string; bytes: number }> } {
  let files = 0;
  let bytes = 0;
  const largest: Array<{ path: string; bytes: number }> = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        let size = 0;
        try {
          size = fs.statSync(full).size;
        } catch {
          continue;
        }
        files += 1;
        bytes += size;
        if (size > FILE_WARN) largest.push({ path: path.relative(OUT, full), bytes: size });
      }
    }
  }
  largest.sort((a, b) => b.bytes - a.bytes);
  return { files, bytes, largest: largest.slice(0, 15) };
}

const mb = (b: number) => +(b / 1048576).toFixed(1);

/** SIZE-BUDGET — the GitHub-limits gate: total < 1 GB, no file > 100 MB, warn > 50 MiB. */
export function sizeBudgetCheck(): CheckResult {
  const r: CheckResult = { id: "size-budget", title: "Size budget (GitHub Pages limits)", status: "pass", failures: [], warnings: [], metrics: {} };
  if (!fs.existsSync(OUT)) {
    r.status = "warn";
    r.warnings.push("out/ does not exist — run `npm run build` first to gate the published artifact.");
    return r;
  }
  const { files, bytes, largest } = walk(OUT);
  r.metrics = { totalMB: mb(bytes), fileCount: files, largestFileMB: largest[0] ? mb(largest[0].bytes) : 0 };
  if (bytes > SITE_CAP) r.failures.push(`out/ is ${mb(bytes)} MB > 1024 MB GitHub Pages soft cap.`);
  for (const f of largest) {
    if (f.bytes > FILE_HARD) r.failures.push(`${f.path} is ${mb(f.bytes)} MB > 100 MB git hard limit (would be rejected on push).`);
    else if (f.bytes > FILE_WARN) r.warnings.push(`${f.path} is ${mb(f.bytes)} MB > 50 MiB (GitHub warning threshold).`);
  }
  r.status = r.failures.length ? "fail" : r.warnings.length ? "warn" : "pass";
  return r;
}

/** LICENSE — every active sourceId must be a vetted, non-commercial license. */
export function licenseCheck(): CheckResult {
  const r: CheckResult = { id: "license", title: "Source licenses (no commercial/unknown)", status: "pass", failures: [], warnings: [], metrics: {} };
  const active = new Set<string>();
  for (const f of sampleDir(PUBLIC_ASSETS, 60)) {
    if (["manifest.json", "corridors-index.json"].includes(f)) continue;
    const arr = readJson<Array<{ sourceIds?: string[] }>>(path.join(PUBLIC_ASSETS, f));
    if (Array.isArray(arr)) for (const rec of arr) (rec.sourceIds ?? []).forEach((s) => active.add(s));
  }
  const sourcesDir = path.join(GEN, "cities", "sources");
  for (const f of sampleDir(sourcesDir, 3000)) {
    const o = readJson<{ sources?: Array<{ id: string }> }>(path.join(sourcesDir, f));
    for (const s of o?.sources ?? []) active.add(s.id);
  }
  let commercial = 0;
  let unknown = 0;
  for (const id of active) {
    const lic = getSourceLicense(id);
    if (!lic) {
      unknown += 1;
      r.failures.push(`Unknown source license: "${id}" (add it to src/domain/source-licenses.ts after vetting).`);
    } else if (lic.commercial) {
      commercial += 1;
      r.failures.push(`Commercial source shipped: "${id}" (${lic.label}) — must be cleared/removed before deploy.`);
    }
  }
  r.metrics = { activeSources: active.size, commercial, unknown };
  r.status = r.failures.length ? "fail" : "pass";
  return r;
}

/** COUNT-CONSISTENCY — command-center strings + registry-summary trace to the city manifest (P1.4). */
export function countConsistencyCheck(): CheckResult {
  const r: CheckResult = { id: "count-consistency", title: "Counts trace to the city manifest", status: "pass", failures: [], warnings: [], metrics: {} };
  const city = readJson<{ totalCityCount: number; processedCityCount: number; sourceCounts: Record<string, number>; countryCounts: Record<string, number> }>(path.join(GEN, "cities", "manifest.json"));
  const cc = readJson<{ globalIntelligence: Array<{ id: string; body: string }>; sourceSummary: Array<{ label: string; value: string }> }>(path.join(GEN, "command-center", "manifest.json"));
  const rs = readJson<{ totalCities: number; countriesCovered: number }>(path.join(GEN, "command-center", "registry-summary.json"));
  if (!city || !cc || !rs) {
    r.status = "fail";
    r.failures.push("Missing one of: city manifest / command-center manifest / registry-summary.");
    return r;
  }
  const backbone = cc.globalIntelligence.find((i) => i.id === "published-city-backbone");
  const expected = `${city.processedCityCount} of ${city.totalCityCount} cities have published intelligence bundles.`;
  if (backbone?.body !== expected) r.failures.push(`backbone body "${backbone?.body}" != "${expected}"`);
  for (const e of cc.sourceSummary) {
    if (e.value !== `${city.sourceCounts[e.label]} city bundles`) r.failures.push(`sourceSummary[${e.label}] "${e.value}" != manifest count`);
  }
  if (rs.totalCities !== city.totalCityCount) r.failures.push(`registry-summary.totalCities ${rs.totalCities} != manifest ${city.totalCityCount}`);
  if (rs.countriesCovered !== Object.keys(city.countryCounts).length) r.failures.push(`registry-summary.countriesCovered ${rs.countriesCovered} != ${Object.keys(city.countryCounts).length}`);
  r.metrics = { totalCities: city.totalCityCount, processed: city.processedCityCount, sources: Object.keys(city.sourceCounts).length };
  r.status = r.failures.length ? "fail" : "pass";
  return r;
}

/** PROVENANCE — sampled dossier sources + asset records carry real, known sourceIds (no fabrication). */
export function provenanceCheck(): CheckResult {
  const r: CheckResult = { id: "provenance", title: "Provenance (every entity is source-backed)", status: "pass", failures: [], warnings: [], metrics: {} };
  let scanned = 0;
  let bad = 0;
  const sourcesDir = path.join(GEN, "cities", "sources");
  for (const f of sampleDir(sourcesDir, 2000)) {
    const o = readJson<{ sources?: Array<{ id: string }> }>(path.join(sourcesDir, f));
    for (const s of o?.sources ?? []) {
      scanned += 1;
      if (!s.id || !getSourceLicense(s.id)) {
        bad += 1;
        if (r.failures.length < 10) r.failures.push(`${f}: source "${s.id}" has no known license/provenance`);
      }
    }
  }
  for (const f of sampleDir(PUBLIC_ASSETS, 40)) {
    if (["manifest.json", "corridors-index.json"].includes(f)) continue;
    const arr = readJson<Array<{ sourceIds?: string[]; assetId?: string }>>(path.join(PUBLIC_ASSETS, f));
    if (!Array.isArray(arr)) continue;
    for (const rec of arr) {
      scanned += 1;
      if (!rec.sourceIds || rec.sourceIds.length === 0) {
        bad += 1;
        if (r.failures.length < 10) r.failures.push(`${f}:${rec.assetId ?? "?"} has no sourceIds (would be fabricated)`);
      }
    }
  }
  r.metrics = { scanned, unsourced: bad };
  r.status = bad > 0 ? "fail" : "pass";
  return r;
}

/** GEOSPATIAL — sampled coordinates are within world bounds; flags null-island. */
export function geospatialCheck(): CheckResult {
  const r: CheckResult = { id: "geospatial", title: "Geospatial sanity (coords in bounds)", status: "pass", failures: [], warnings: [], metrics: {} };
  let scanned = 0;
  let outOfBounds = 0;
  let nullIsland = 0;
  for (const f of sampleDir(PUBLIC_ASSETS, 40)) {
    if (["manifest.json", "corridors-index.json"].includes(f)) continue;
    const arr = readJson<Array<{ latitude?: number; longitude?: number; assetId?: string }>>(path.join(PUBLIC_ASSETS, f));
    if (!Array.isArray(arr)) continue;
    for (const rec of arr) {
      if (typeof rec.latitude !== "number" || typeof rec.longitude !== "number") continue;
      scanned += 1;
      if (rec.latitude < -90 || rec.latitude > 90 || rec.longitude < -180 || rec.longitude > 180) {
        outOfBounds += 1;
        if (r.failures.length < 10) r.failures.push(`${f}:${rec.assetId ?? "?"} out of bounds (${rec.latitude},${rec.longitude})`);
      } else if (rec.latitude === 0 && rec.longitude === 0) {
        nullIsland += 1;
      }
    }
  }
  if (nullIsland > 0) r.warnings.push(`${nullIsland} record(s) at null-island (0,0).`);
  r.metrics = { scanned, outOfBounds, nullIsland };
  r.status = outOfBounds > 0 ? "fail" : nullIsland > 0 ? "warn" : "pass";
  return r;
}

export const ALL_CHECKS = [
  sizeBudgetCheck,
  licenseCheck,
  countConsistencyCheck,
  provenanceCheck,
  geospatialCheck,
];
