import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import { describe, expect, it } from "vitest";

function city(cityId: string, slug: string, name: string) {
  return {
    cityId,
    slug,
    name,
    aliases: [],
    placeClass: "city",
    featureClass: "P",
    featureCode: "PPL",
    sourceIds: { geonames: cityId.replace("geo-", "") },
    countryIso2: "TR",
    countryIso3: "TUR",
    countrySlug: "turkey",
    latitude: 40,
    longitude: 29,
    boundaryStatus: "point_only",
    population: 100_000,
    populationSource: "GeoNames",
    registrySource: "GeoNames",
    recordStatus: "active",
    isMajorCity: false,
  };
}

describe("build-dossier-bundle", () => {
  it("packs a registry-backed baseline dossier when sparse workspace files are absent", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "econmap-dossier-"));
    const generatedDir = path.join(fixtureRoot, "src", "data", "generated", "cities");
    const workspacesDir = path.join(generatedDir, "workspaces");
    fs.mkdirSync(workspacesDir, { recursive: true });

    const observedCity = city("geo-1", "geo-1-observed", "Observed");
    const baselineCity = city("geo-2", "geo-2-baseline", "Baseline");
    fs.writeFileSync(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([observedCity, baselineCity]),
    );
    fs.writeFileSync(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify({ generatedAt: "2026-07-27T22:34:13.438Z" }),
    );
    fs.writeFileSync(
      path.join(workspacesDir, "geo-1.json"),
      JSON.stringify({ city: observedCity }),
    );

    const repoRoot = process.cwd();
    const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
    const script = path.join(repoRoot, "scripts", "data", "cities", "build-dossier-bundle.ts");
    execFileSync(process.execPath, [tsxCli, script], {
      cwd: fixtureRoot,
      stdio: "pipe",
    });

    const outputDir = path.join(fixtureRoot, "public", "data", "cities", "dossiers");
    const index = JSON.parse(fs.readFileSync(path.join(outputDir, "index.json"), "utf8")) as {
      shards: Array<{ file: string }>;
      entries: Record<string, [number, number, number]>;
    };
    const entry = index.entries["geo-2"];

    expect(entry).toBeDefined();
    const [shardNumber, offset, length] = entry;
    const shard = fs.readFileSync(path.join(outputDir, index.shards[shardNumber].file));
    const dossier = JSON.parse(zlib.gunzipSync(shard.subarray(offset, offset + length)).toString());

    expect(dossier.w.city).toEqual(baselineCity);
    expect(dossier.w.summary).toContain("registry-backed OSINT workspace");
    expect(dossier.w.coverage).toEqual({
      economicFactbook: "verified_exact",
      investorIntel: "not_covered_yet",
      urbanIntel: "not_covered_yet",
    });
    expect(dossier.e).toBeNull();
    expect(dossier.s).toBeNull();
    expect(dossier.c).toBeNull();
  });
});
