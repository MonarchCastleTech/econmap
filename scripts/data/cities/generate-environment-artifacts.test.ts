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

async function writeExcelFixture(filePath: string, sheetName: string, rows: Array<Record<string, unknown>>) {
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
        "writer = pd.ExcelWriter(sys.argv[2], engine='openpyxl')",
        "pd.DataFrame([{'placeholder': 'meta'}]).to_excel(writer, sheet_name='Readme', index=False)",
        "pd.DataFrame(rows).to_excel(writer, sheet_name=sys.argv[3], index=False)",
        "writer.close()",
      ].join("; "),
      rowsFile,
      filePath,
      sheetName,
    ],
    { windowsHide: true },
  );
}

async function writeAqueductZipFixture(filePath: string, rows: Array<Record<string, unknown>>) {
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
        "from zipfile import ZipFile",
        "rows = json.load(open(sys.argv[1], encoding='utf-8'))",
        "csv_payload = pd.DataFrame(rows).to_csv(index=False)",
        "archive = ZipFile(sys.argv[2], 'w')",
        "archive.writestr('Aqueduct40_waterrisk_download_Y2023M07D05/CVS/Aqueduct40_baseline_annual_y2023m07d05.csv', csv_payload)",
        "archive.close()",
      ].join("; "),
      rowsFile,
      filePath,
    ],
    { windowsHide: true },
  );
}

describe("generate-environment-artifacts", () => {
  it("builds city-first environment artifacts and publishes air-quality and water-stress layers", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-environment-"));
    tempDirs.push(rootDir);

    const selectionAssetFile = path.join(
      rootDir,
      "public",
      "data",
      "globe",
      "reference",
      "city-footprints",
      "selectable.geojson",
    );
    const registryFile = path.join(rootDir, "src", "data", "generated", "cities", "registry.json");
    const whoFile = path.join(
      rootDir,
      "data",
      "raw",
      "cities",
      "bulk",
      "who",
      "who_ambient_air_quality_database_v2024.xlsx",
    );
    const aqueductFile = path.join(
      rootDir,
      "data",
      "raw",
      "cities",
      "bulk",
      "aqueduct",
      "aqueduct-4-0-water-risk-data.zip",
    );
    const carbonFile = path.join(
      rootDir,
      "data",
      "raw",
      "cities",
      "bulk",
      "carbon-monitor",
      "carbon-monitor-cities-figshare",
      "carbon-monitor-cities-all-cities-FUA-v0325.csv",
    );
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");
    const globeDir = path.join(rootDir, "public", "data", "globe");

    await fs.mkdir(path.dirname(selectionAssetFile), { recursive: true });
    await fs.mkdir(path.dirname(registryFile), { recursive: true });
    await fs.mkdir(path.dirname(whoFile), { recursive: true });
    await fs.mkdir(path.dirname(aqueductFile), { recursive: true });
    await fs.mkdir(path.dirname(carbonFile), { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });

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
      registryFile,
      JSON.stringify(
        [
          {
            cityId: "geo-745044",
            slug: "geo-745044-istanbul",
            name: "Istanbul",
            aliases: ["Constantinople"],
            countryIso2: "TR",
            countryIso3: "TUR",
            countrySlug: "turkey",
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
            countrySlug: "turkey",
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

    await writeExcelFixture(whoFile, "Update 2024 (V6.1)", [
      {
        who_region: "4_Eur",
        iso3: "TUR",
        country_name: "Turkey",
        city: "Istanbul/TUR",
        year: 2023,
        version: "V6.1",
        pm10_concentration: 28.4,
        pm25_concentration: 18.6,
        no2_concentration: 24.1,
        pm10_tempcov: 95,
        pm25_tempcov: 95,
        no2_tempcov: 90,
        type_of_stations: "Urban",
        population: 15_701_602,
        latitude: 41.01384,
        longitude: 28.94966,
        who_ms: 1,
      },
      {
        who_region: "4_Eur",
        iso3: "TUR",
        country_name: "Turkey",
        city: "Ankara/TUR",
        year: 2023,
        version: "V6.1",
        pm10_concentration: 24.1,
        pm25_concentration: 14.2,
        no2_concentration: 19.7,
        pm10_tempcov: 96,
        pm25_tempcov: 96,
        no2_tempcov: 92,
        type_of_stations: "Urban",
        population: 5_607_000,
        latitude: 39.9334,
        longitude: 32.8597,
        who_ms: 1,
      },
    ]);

    await writeAqueductZipFixture(aqueductFile, [
      {
        string_id: "tur-istanbul-1",
        gid_0: "TUR",
        name_0: "Turkey",
        name_1: "Istanbul",
        area_km2: 1539.2,
        bws_score: 3.6,
        bws_label: "High (3-4)",
      },
      {
        string_id: "tur-ankara-1",
        gid_0: "TUR",
        name_0: "Turkey",
        name_1: "Ankara",
        area_km2: 2516.0,
        bws_score: 2.8,
        bws_label: "Medium - High (2-3)",
      },
    ]);

    await fs.writeFile(
      carbonFile,
      [
        "city,country,date,sector,value (KtCO2 per day),timestamp",
        "Istanbul,Turkey,2024-03-20,Aviation,12.5,1710892800",
        "Istanbul,Turkey,2024-03-20,Ground Transport,30.1,1710892800",
        "Ankara,Turkey,2024-03-20,Aviation,3.2,1710892800",
      ].join("\n"),
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
            countrySlug: "turkey",
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
            countrySlug: "turkey",
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
    await fs.writeFile(path.join(processedIndexesDir, "connectivity-fixed.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "connectivity-mobile.json"), "[]");

    await execFileAsync(
      "python",
      [path.join(process.cwd(), "scripts", "data", "cities", "generate-environment-artifacts.py"), "--root-dir", rootDir],
      {
        cwd: process.cwd(),
        windowsHide: true,
      },
    );

    const airQualityIndex = JSON.parse(
      await fs.readFile(path.join(processedIndexesDir, "air-quality.json"), "utf-8"),
    );
    const waterStressIndex = JSON.parse(
      await fs.readFile(path.join(processedIndexesDir, "water-stress.json"), "utf-8"),
    );
    const environmentEnrichment = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "city-environment-enrichment.json"), "utf-8"),
    );

    expect(airQualityIndex).toHaveLength(2);
    expect(waterStressIndex).toHaveLength(2);
    expect(environmentEnrichment.cities["geo-745044"].urbanIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "pm25",
          value: 18.6,
        }),
        expect.objectContaining({
          indicatorId: "water-stress",
          value: 3.6,
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
        who: {
          workbook: { exists: true },
        },
        aqueduct: {
          baseline: { exists: true },
        },
      },
    });

    expect(globeManifest.layers.some((layer) => layer.id === "air-quality")).toBe(true);
    expect(globeManifest.layers.some((layer) => layer.id === "water-stress")).toBe(true);
    expect(commandCenterManifest.datasetInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "who-air-quality",
          status: "published_to_website",
        }),
        expect.objectContaining({
          id: "aqueduct",
          status: "published_to_website",
        }),
      ]),
    );
  }, 120000);
});
