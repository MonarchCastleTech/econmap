// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getBulkSourceManifest } from "./bulk-source-manifest";

describe("bulk source manifest", () => {
  const manifest = getBulkSourceManifest();
  const hasRequiredExternalCache = [
    manifest.geonames.allCountries,
    manifest.ourAirports.airports,
    manifest.unlocode.part1,
    manifest.gleif.lei2,
  ].every((entry) => entry.exists);
  const externalCacheTest = hasRequiredExternalCache ? it : it.skip;

  externalCacheTest("resolves all required local bulk files", () => {
    expect(manifest.geonames.allCountries.exists).toBe(true);
    expect(manifest.ourAirports.airports.exists).toBe(true);
    expect(manifest.unlocode.part1.exists).toBe(true);
    expect(manifest.gleif.lei2.exists).toBe(true);
  });
});
