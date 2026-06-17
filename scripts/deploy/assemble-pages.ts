import fs from "node:fs";
import path from "node:path";

import { sizeBudgetCheck } from "../audit/checks";

/**
 * Deploy pre-step: prune dead, never-fetched globe geometry from out/ and gate the GitHub-Pages size
 * budget. For every SHARDED vector layer (assetPath uses /shards/{region}.geojson) that has a boot
 * asset, the map only ever requests shards/{nw,ne,sw,se}.geojson (quadrants) + vectors/boot.geojson —
 * so vectors/current.geojson and shards/world.geojson are dead weight (verified against
 * tactical-map-2d.tsx getDesiredLayerAssetPath/shouldUseBootLayerAsset). Non-sharded layers use
 * vectors/current.geojson and are left intact. No layer's live data is touched.
 *
 * Run AFTER `npm run build`:  npx tsx scripts/deploy/assemble-pages.ts
 */
const OUT = path.join(process.cwd(), "out");
const MANIFEST = path.join(process.cwd(), "public", "data", "globe", "manifest.json");

function rmIfExists(rel: string): number {
  const full = path.join(OUT, rel);
  try {
    const size = fs.statSync(full).size;
    fs.rmSync(full);
    return size;
  } catch {
    return 0;
  }
}

function dirSizeBytes(full: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(full, entry.name);
    total += entry.isDirectory() ? dirSizeBytes(p) : fs.statSync(p).size;
  }
  return total;
}

function main() {
  if (!fs.existsSync(OUT)) {
    console.error("out/ does not exist — run `npm run build` first.");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8")) as {
    layers: { id: string; assetPath?: string; bootAssetPath?: string }[];
    pmtilesPath?: string;
  };

  // Globe operational layers are served from out/data/globe/layers.pmtiles (a sibling FILE). When that
  // archive is present, every per-layer geojson under out/data/globe/layers/** is dead weight — the 2D
  // map fetches vector tiles from the archive instead (incl. the `cities` shards, which the map never
  // fetched even before pmtiles). Drop the whole geojson tree, keep the archive.
  const pmtilesOut = path.join(OUT, "data", "globe", "layers.pmtiles");
  const layersDir = path.join(OUT, "data", "globe", "layers");
  if (manifest.pmtilesPath && fs.existsSync(pmtilesOut) && fs.existsSync(layersDir)) {
    const freed = dirSizeBytes(layersDir);
    fs.rmSync(layersDir, { recursive: true, force: true });
    console.log(`  pruned out/data/globe/layers/ (geojson superseded by layers.pmtiles) — freed ${(freed / 1048576).toFixed(0)} MB`);
    console.log(`  kept   out/data/globe/layers.pmtiles (${(fs.statSync(pmtilesOut).size / 1048576).toFixed(1)} MB)\n`);
  } else {
    // Fallback (no pmtiles archive built): prune only the verified-dead world/current files of sharded+boot layers.
    let freed = 0;
    let removed = 0;
    for (const layer of manifest.layers) {
      const sharded = (layer.assetPath ?? "").includes("{region}");
      if (!sharded || !layer.bootAssetPath) continue;
      for (const dead of [`data/globe/layers/${layer.id}/vectors/current.geojson`, `data/globe/layers/${layer.id}/shards/world.geojson`]) {
        const bytes = rmIfExists(dead);
        if (bytes > 0) {
          freed += bytes;
          removed += 1;
          console.log(`  pruned ${dead} (${(bytes / 1048576).toFixed(1)} MB)`);
        }
      }
    }
    console.log(`Pruned ${removed} dead globe files, freed ${(freed / 1048576).toFixed(0)} MB.\n`);
  }

  // Cap oversized country asset files to the top-N by priority. A 95MB/233K-record country file is a
  // mobile-killer download and unrenderable; the country page shows the FULL total from the asset
  // manifest and an explicit "top N of M" note (country-assets.tsx), so this never hides the real
  // count. critical > high > medium > low.
  const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const ASSET_CAP = 5000;
  const assetsDir = path.join(OUT, "data", "assets");
  let cappedFiles = 0;
  let cappedFreed = 0;
  try {
    for (const f of fs.readdirSync(assetsDir)) {
      if (!f.endsWith(".json") || f === "manifest.json" || f === "corridors-index.json") continue;
      const full = path.join(assetsDir, f);
      const before = fs.statSync(full).size;
      const raw = JSON.parse(fs.readFileSync(full, "utf-8")) as Array<{ priority?: string; sourceIds?: string[] }>;
      if (!Array.isArray(raw)) continue;
      // Drop commercial/unlicensed sources (telegeography) from the deploy artifact — the license
      // audit flags them; public/ keeps them in case the dataset is later licensed.
      const arr = raw.filter((a) => !(a.sourceIds ?? []).includes("telegeography"));
      const dropped = raw.length - arr.length;
      if (arr.length <= ASSET_CAP && dropped === 0) continue;
      const capped = [...arr]
        .map((a, i) => ({ a, i }))
        .sort((x, y) => (PRIORITY_RANK[x.a.priority ?? ""] ?? 4) - (PRIORITY_RANK[y.a.priority ?? ""] ?? 4) || x.i - y.i)
        .slice(0, ASSET_CAP)
        .map((e) => e.a);
      fs.writeFileSync(full, JSON.stringify(capped));
      const after = fs.statSync(full).size;
      cappedFiles += 1;
      cappedFreed += before - after;
      console.log(`  capped ${f}: ${raw.length} → ${capped.length} records${dropped ? ` (-${dropped} telegeography)` : ""} (${(before / 1048576).toFixed(1)} → ${(after / 1048576).toFixed(1)} MB)`);
    }
  } catch {
    // assets dir may be absent in a partial build
  }
  if (cappedFiles) console.log(`Capped ${cappedFiles} country asset files, freed ${(cappedFreed / 1048576).toFixed(0)} MB.\n`);

  const budget = sizeBudgetCheck();
  console.log(`[size-budget ${budget.status.toUpperCase()}] ${JSON.stringify(budget.metrics)}`);
  for (const f of budget.failures) console.log(`   x ${f}`);
  for (const w of budget.warnings) console.log(`   ! ${w}`);
  process.exit(budget.status === "fail" ? 1 : 0);
}

main();
