// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

import { cityManifestSchema } from "@/domain/city-schemas";

/**
 * P1.2 artifact-integrity guard (drive-safe: reads only the small manifest, no 189K-file scans).
 * Asserts the served city manifest is internally consistent so count drift can't ship silently.
 */
const MANIFEST_PATH = path.join(process.cwd(), "src", "data", "generated", "cities", "manifest.json");

describe("served city manifest integrity", () => {
  const manifest = cityManifestSchema.parse(
    JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")),
  );

  it("reconciles exactSiteCount with the per-type exact-site breakdown", () => {
    const sum = Object.values(manifest.exactSiteCountsByType).reduce((a, b) => a + b, 0);
    expect(sum).toBe(manifest.exactSiteCount);
  });

  it("never reports more processed cities than exist", () => {
    expect(manifest.processedCityCount).toBeLessThanOrEqual(manifest.totalCityCount);
    expect(manifest.totalCityCount).toBeGreaterThan(0);
  });

  it("publishes a non-empty source breakdown including the GeoNames registry baseline", () => {
    expect(Object.keys(manifest.sourceCounts).length).toBeGreaterThan(0);
    expect(manifest.sourceCounts["GeoNames"]).toBe(manifest.totalCityCount);
  });
});
