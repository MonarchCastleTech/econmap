// @vitest-environment node

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import { generateGlobeArtifacts } from "./generate-globe-artifacts";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

async function writeParquetFixture(filePath: string, rows: Array<Record<string, unknown>>) {
  const rowsFile = `${filePath}.rows.json`;

  await fs.writeFile(rowsFile, JSON.stringify(rows, null, 2));
  await execFileAsync(
    "python",
    [
      "-c",
      [
        "import json",
        "import pandas as pd",
        "import sys",
        "rows = json.load(open(sys.argv[1], encoding='utf-8'))",
        "pd.DataFrame(rows).to_parquet(sys.argv[2], index=False)",
      ].join("; "),
      rowsFile,
      filePath,
    ],
    { windowsHide: true },
  );
}

describe("generate-connectivity-artifacts", () => {
  it("builds city-first Ookla artifacts and publishes fixed/mobile connectivity layers", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-connectivity-"));
    tempDirs.push(rootDir);

    const fixedParquet = path.join(
      rootDir,
      "data",
      "raw",
      "cities",
      "bulk",
      "ookla",
      "2025-10-01_performance_fixed_tiles.parquet",
    );
    const mobileParquet = path.join(
      rootDir,
      "data",
      "raw",
      "cities",
      "bulk",
      "ookla",
      "2025-10-01_performance_mobile_tiles.parquet",
    );
    const selectionAssetFile = path.join(
      rootDir,
      "public",
      "data",
      "globe",
      "reference",
      "city-footprints",
      "selectable.geojson",
    );
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");
    const globeDir = path.join(rootDir, "public", "data", "globe");

    await fs.mkdir(path.dirname(fixedParquet), { recursive: true });
    await fs.mkdir(path.dirname(selectionAssetFile), { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });

    await writeParquetFixture(fixedParquet, [
      {
        quadkey: "1200",
        tile: "POLYGON((28.9 41, 29 41, 29 41.1, 28.9 41.1, 28.9 41))",
        tile_x: 28.95,
        tile_y: 41.02,
        avg_d_kbps: 100_000,
        avg_u_kbps: 20_000,
        avg_lat_ms: 18,
        tests: 10,
        devices: 8,
      },
      {
        quadkey: "1201",
        tile: "POLYGON((28.95 41, 29.05 41, 29.05 41.1, 28.95 41.1, 28.95 41))",
        tile_x: 29.0,
        tile_y: 41.03,
        avg_d_kbps: 200_000,
        avg_u_kbps: 30_000,
        avg_lat_ms: 12,
        tests: 20,
        devices: 16,
      },
      {
        quadkey: "2200",
        tile: "POLYGON((32.8 39.85, 32.9 39.85, 32.9 39.95, 32.8 39.95, 32.8 39.85))",
        tile_x: 32.85,
        tile_y: 39.9,
        avg_d_kbps: 80_000,
        avg_u_kbps: 15_000,
        avg_lat_ms: 24,
        tests: 5,
        devices: 4,
      },
    ]);
    await writeParquetFixture(mobileParquet, [
      {
        quadkey: "1300",
        tile: "POLYGON((28.9 41, 29 41, 29 41.1, 28.9 41.1, 28.9 41))",
        tile_x: 28.97,
        tile_y: 41.01,
        avg_d_kbps: 60_000,
        avg_u_kbps: 12_000,
        avg_lat_ms: 28,
        tests: 14,
        devices: 12,
      },
      {
        quadkey: "2300",
        tile: "POLYGON((32.8 39.85, 32.9 39.85, 32.9 39.95, 32.8 39.95, 32.8 39.85))",
        tile_x: 32.86,
        tile_y: 39.91,
        avg_d_kbps: 40_000,
        avg_u_kbps: 10_000,
        avg_lat_ms: 34,
        tests: 6,
        devices: 5,
      },
    ]);

    await fs.writeFile(
      selectionAssetFile,
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                cityId: "geo-745044",
                slug: "geo-745044-istanbul",
                name: "Istanbul",
                countryIso3: "TUR",
                latitude: 41.01384,
                longitude: 28.94966,
                population: 15_701_602,
                sourceLabel: "Natural Earth Admin1",
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [28.8, 40.95],
                    [29.1, 40.95],
                    [29.1, 41.1],
                    [28.8, 41.1],
                    [28.8, 40.95],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: {
                cityId: "geo-323786",
                slug: "geo-323786-ankara",
                name: "Ankara",
                countryIso3: "TUR",
                latitude: 39.9334,
                longitude: 32.8597,
                population: 5_607_000,
                sourceLabel: "Natural Earth Admin1",
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [32.7, 39.82],
                    [33.02, 39.82],
                    [33.02, 40.02],
                    [32.7, 40.02],
                    [32.7, 39.82],
                  ],
                ],
              },
            },
          ],
        },
        null,
        2,
      ),
    );

    await fs.writeFile(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify(
        {
          schemaVersion: "2.0.0",
          generatedAt: "2026-03-21T00:00:00.000Z",
          totalCityCount: 2,
          processedCityCount: 2,
          countryCounts: { TUR: 2 },
          entityCountsByType: {},
          exactSiteCountsByType: {},
          exactSiteCount: 0,
          cityPresenceCount: 0,
          unresolvedCoverageCount: 0,
          sourceCounts: { GeoNames: 2 },
          buildWarnings: [],
        },
        null,
        2,
      ),
    );
    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify(
        [
          {
            cityId: "geo-745044",
            slug: "geo-745044-istanbul",
            name: "Istanbul",
            aliases: [],
            countryIso2: "TR",
            countryIso3: "TUR",
            countrySlug: "turkiye",
            admin1Name: "Istanbul",
            latitude: 41.01384,
            longitude: 28.94966,
            boundaryStatus: "has_boundary",
            registrySource: "GeoNames",
            recordStatus: "active",
          },
          {
            cityId: "geo-323786",
            slug: "geo-323786-ankara",
            name: "Ankara",
            aliases: [],
            countryIso2: "TR",
            countryIso3: "TUR",
            countrySlug: "turkiye",
            admin1Name: "Ankara",
            latitude: 39.9334,
            longitude: 32.8597,
            boundaryStatus: "has_boundary",
            registrySource: "GeoNames",
            recordStatus: "active",
          },
        ],
        null,
        2,
      ),
    );
    await fs.writeFile(
      path.join(generatedDir, "map", "cities.geojson"),
      JSON.stringify({ type: "FeatureCollection", features: [] }, null, 2),
    );
    await fs.writeFile(path.join(processedIndexesDir, "wpi-ports.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "power-plants.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "unlocode-entities.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "research-orgs.json"), "[]");

    await execFileAsync(
      "python",
      [path.join(process.cwd(), "scripts", "data", "cities", "generate-connectivity-artifacts.py"), "--root-dir", rootDir],
      {
        cwd: process.cwd(),
        windowsHide: true,
      },
    );

    const fixedIndex = JSON.parse(
      await fs.readFile(path.join(processedIndexesDir, "connectivity-fixed.json"), "utf-8"),
    );
    const mobileIndex = JSON.parse(
      await fs.readFile(path.join(processedIndexesDir, "connectivity-mobile.json"), "utf-8"),
    );
    const connectivityEnrichment = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "city-connectivity-enrichment.json"), "utf-8"),
    );

    expect(fixedIndex).toHaveLength(2);
    expect(mobileIndex).toHaveLength(2);
    expect(connectivityEnrichment.cities["geo-745044"].urbanIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "fixed-download-mbps",
          value: 166.7,
        }),
        expect.objectContaining({
          indicatorId: "mobile-download-mbps",
          value: 60,
        }),
      ]),
    );

    const { globeManifest, commandCenterManifest } = await generateGlobeArtifacts({
      cityManifestFile: path.join(generatedDir, "manifest.json"),
      cityRegistryFile: path.join(generatedDir, "registry.json"),
      cityMapDir: path.join(generatedDir, "map"),
      commandCenterDir,
      globeDir,
      processedIndexesDir,
      bulkSourceManifest: {
        ookla: {
          fixed: { exists: true },
          mobile: { exists: true },
        },
      },
    });

    expect(globeManifest.layers.some((layer) => layer.id === "connectivity-fixed")).toBe(true);
    expect(globeManifest.layers.some((layer) => layer.id === "connectivity-mobile")).toBe(true);
    expect(commandCenterManifest.datasetInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ookla",
          status: "published_to_website",
          websiteSurfaces: expect.arrayContaining(["dataset workspace", "globe layer"]),
        }),
      ]),
    );
  }, 45000);
});
