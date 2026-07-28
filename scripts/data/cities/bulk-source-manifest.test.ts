// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getBulkSourceManifest } from "./bulk-source-manifest";

describe("bulk source manifest", () => {
  const manifest = getBulkSourceManifest();
  const hasRequiredExternalCache = [
    manifest.geonames.allCountries,
    manifest.ourAirports.airports,
    manifest.unlocode.part1,
  ].every((entry) => entry.exists);
  const externalCacheTest = hasRequiredExternalCache ? it : it.skip;

  externalCacheTest("resolves all required local bulk files", () => {
    expect(manifest.geonames.allCountries.exists).toBe(true);
    expect(manifest.ourAirports.airports.exists).toBe(true);
    expect(manifest.unlocode.part1.exists).toBe(true);
  });

  it("does not gate the global baseline on optional enrichment feeds", () => {
    expect(manifest.gleif.lei2.required).toBe(false);
    expect(manifest.ghsl.statistics.required).toBe(false);
    expect(manifest.oecd.fuaEconomy.required).toBe(false);
    expect(manifest.worldPortIndex.wpi.required).toBe(false);
  });

  it("tracks the official UNECE 2025-1 release artifact layout", () => {
    expect(manifest.unlocode.part1.relativePath).toBe(
      "unlocode/2025-1/release/csv/UNLOCODE CodeListPart1.csv",
    );
    expect(manifest.unlocode.part2.relativePath).toBe(
      "unlocode/2025-1/release/csv/UNLOCODE CodeListPart2.csv",
    );
    expect(manifest.unlocode.part3.relativePath).toBe(
      "unlocode/2025-1/release/csv/UNLOCODE CodeListPart3.csv",
    );
    expect(manifest.unlocode.subdivisionCodes.relativePath).toBe(
      "unlocode/2025-1/release/csv/SubdivisionCodes.csv",
    );
    expect(manifest.unlocode.part1.sourceUrl).toContain(
      "opensource.unicc.org/un/unece/uncefact/vocab-locode",
    );
    expect(manifest.unlocode.part1.sourceUrl).toContain("2025-1");
  });
});
