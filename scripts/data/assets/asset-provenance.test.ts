import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  isSyntheticAssetRecord,
  isSourceBackedAssetRecord,
  REAL_ASSET_SOURCE_IDS,
  SYNTHETIC_ASSET_SOURCE_IDS,
} from "./asset-provenance";

describe("asset provenance rule", () => {
  it("flags a Math.random() base station stamped 'ookla' as synthetic", () => {
    expect(
      isSyntheticAssetRecord({ assetId: "bs-are-0", subtype: "base_station", sourceIds: ["ookla"] }),
    ).toBe(true);
  });

  it("flags an IXP stamped 'mock-telecom-registry' as synthetic", () => {
    expect(
      isSyntheticAssetRecord({ assetId: "ixp-are-main", subtype: "ixp", sourceIds: ["mock-telecom-registry"] }),
    ).toBe(true);
  });

  it("flags a record with no sourceIds as synthetic (not traceable)", () => {
    expect(isSyntheticAssetRecord({ assetId: "x", sourceIds: [] })).toBe(true);
    expect(isSyntheticAssetRecord({ assetId: "x" })).toBe(true);
  });

  it("accepts real source-backed records", () => {
    expect(isSourceBackedAssetRecord({ subtype: "large_airport", sourceIds: ["ourairports"] })).toBe(true);
    expect(isSourceBackedAssetRecord({ subtype: "mine", sourceIds: ["usgs-mrds"] })).toBe(true);
    expect(isSourceBackedAssetRecord({ subtype: "subsea_cable_landing", sourceIds: ["telegeography"] })).toBe(true);
  });

  it("keeps the real and synthetic source sets disjoint", () => {
    for (const id of SYNTHETIC_ASSET_SOURCE_IDS) {
      expect(REAL_ASSET_SOURCE_IDS.has(id)).toBe(false);
    }
  });
});

describe("published asset files contain no fabricated records (regression lock)", () => {
  const publicAssetsDir = path.join(process.cwd(), "public", "data", "assets");
  const externalCacheTest = fs.existsSync(publicAssetsDir) ? it : it.skip;

  // Scans all ~248 published country asset files (some large) — give the I/O scan room beyond the 5s default.
  externalCacheTest("every record in public/data/assets is source-backed", { timeout: 30000 }, () => {
    const files = fs
      .readdirSync(publicAssetsDir)
      // corridors-index.json holds per-corridor summaries (no records); per-corridor
      // detail lives in the corridors/ subdir (not scanned here) and its records are a
      // capped subset of the country files already scanned below.
      .filter(
        (f) =>
          f.endsWith(".json") &&
          f !== "manifest.json" &&
          f !== "corridors.json" &&
          f !== "corridors-index.json",
      );

    const offenders: string[] = [];
    let scanned = 0;
    for (const file of files) {
      let arr: unknown;
      try {
        arr = JSON.parse(fs.readFileSync(path.join(publicAssetsDir, file), "utf-8"));
      } catch {
        continue;
      }
      if (!Array.isArray(arr)) continue;
      for (const rec of arr) {
        scanned++;
        if (isSyntheticAssetRecord(rec as { sourceIds?: string[] })) {
          offenders.push(`${file}:${(rec as { assetId?: string }).assetId ?? "?"}:${((rec as { sourceIds?: string[] }).sourceIds ?? []).join("|")}`);
        }
      }
    }

    expect(scanned).toBeGreaterThan(0);
    expect(offenders.slice(0, 20), `synthetic records still published (${offenders.length} total)`).toEqual([]);
  });
});
