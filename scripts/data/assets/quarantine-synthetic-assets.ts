/**
 * P0.2 remediation: strip synthetic / non-traceable asset records from the published and processed
 * asset files, using the single provenance rule in asset-provenance.ts.
 *
 * - Backs up every modified file's removed records to data/quarantine/assets/<ts>/ (no git net).
 * - Rewrites each asset JSON keeping only source-backed records.
 * - Idempotent: re-running finds nothing to remove.
 *
 * Usage: npx tsx scripts/data/assets/quarantine-synthetic-assets.ts [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { isSyntheticAssetRecord } from "./asset-provenance";

const TARGET_DIRS = [
  path.join(process.cwd(), "public", "data", "assets"),
  path.join(process.cwd(), "data", "processed", "assets"),
];

function quarantine(dry: boolean): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(process.cwd(), "data", "quarantine", "assets", stamp);
  let removedTotal = 0;
  let filesChanged = 0;
  const removedBySource: Record<string, number> = {};

  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json") && f !== "manifest.json" && f !== "corridors.json");

    for (const file of files) {
      const full = path.join(dir, file);
      let arr: unknown;
      try {
        arr = JSON.parse(fs.readFileSync(full, "utf-8"));
      } catch {
        continue;
      }
      if (!Array.isArray(arr)) continue;

      const kept: unknown[] = [];
      const removed: unknown[] = [];
      for (const rec of arr) {
        if (isSyntheticAssetRecord(rec as { sourceIds?: string[] })) {
          removed.push(rec);
          for (const s of (rec as { sourceIds?: string[] }).sourceIds ?? ["<none>"]) {
            removedBySource[s] = (removedBySource[s] ?? 0) + 1;
          }
        } else {
          kept.push(rec);
        }
      }

      if (removed.length === 0) continue;
      removedTotal += removed.length;
      filesChanged++;

      if (!dry) {
        const relBackup = path.join(backupRoot, path.basename(dir));
        fs.mkdirSync(relBackup, { recursive: true });
        fs.writeFileSync(path.join(relBackup, file), JSON.stringify(removed, null, 2));
        fs.writeFileSync(full, JSON.stringify(kept, null, 2));
      }
    }
  }

  console.log(
    `[quarantine-synthetic-assets]${dry ? " DRY" : ""} removed ${removedTotal} records across ${filesChanged} files`,
  );
  console.log("  by source:", JSON.stringify(removedBySource));
  if (!dry && removedTotal > 0) console.log(`  backup: ${backupRoot}`);
}

quarantine(process.argv.includes("--dry"));
