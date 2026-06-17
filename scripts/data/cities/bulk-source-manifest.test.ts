// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getBulkSourceManifest } from "./bulk-source-manifest";

describe("bulk source manifest", () => {
  it("resolves all required local bulk files", () => {
    const manifest = getBulkSourceManifest();

    expect(manifest.geonames.allCountries.exists).toBe(true);
    expect(manifest.ourAirports.airports.exists).toBe(true);
    expect(manifest.unlocode.part1.exists).toBe(true);
    expect(manifest.gleif.lei2.exists).toBe(true);
  });
});
