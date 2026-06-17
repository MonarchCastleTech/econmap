// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateGlobeArtifacts } from "./generate-globe-artifacts";
import { generateMobilityArtifacts } from "./generate-mobility-artifacts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("generate-mobility-artifacts", () => {
  it("publishes city transit feed coverage from the Mobility Database into enrichment, processed indexes, and globe layers", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-mobility-"));
    tempDirs.push(rootDir);

    const registryFile = path.join(rootDir, "src", "data", "generated", "cities", "registry.json");
    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const mobilityCsv = path.join(rootDir, "data", "raw", "cities", "bulk", "mobilitydatabase", "feeds_v2.csv");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const globeDir = path.join(rootDir, "public", "data", "globe");

    await fs.mkdir(path.dirname(registryFile), { recursive: true });
    await fs.mkdir(path.dirname(mobilityCsv), { recursive: true });
    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });

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
            countrySlug: "turkiye",
            admin1Name: "Istanbul",
            latitude: 41.01384,
            longitude: 28.94966,
            boundaryStatus: "has_boundary",
            population: 15_701_602,
            registrySource: "GeoNames",
            recordStatus: "active",
            isMajorCity: true,
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
            population: 5_607_000,
            registrySource: "GeoNames",
            recordStatus: "active",
            isMajorCity: true,
          },
        ],
        null,
        2,
      ),
    );

    await fs.writeFile(
      mobilityCsv,
      [
        "id,data_type,entity_type,location.country_code,location.subdivision_name,location.municipality,provider,is_official,name,note,feed_contact_email,static_reference,urls.direct_download,urls.authentication_type,urls.authentication_info,urls.api_key_parameter_name,urls.latest,urls.license,location.bounding_box.minimum_latitude,location.bounding_box.maximum_latitude,location.bounding_box.minimum_longitude,location.bounding_box.maximum_longitude,location.bounding_box.extracted_on,status,features,redirect.id,redirect.comment",
        "feed-1,gtfs,,TR,Istanbul,Istanbul,Metro Istanbul,True,Metro Istanbul Feed,,,,https://example.com/feed-1.zip,0,,,https://files.mobilitydatabase.org/feed-1/latest.zip,CC0,40.9,41.2,28.7,29.2,2025-10-29 18:29:34.166039+00:00,active,Feed Information,,",
        "feed-2,gtfs,,TR,Istanbul,Constantinople,City Ferries,False,City Ferries Feed,,,,https://example.com/feed-2.zip,0,,,https://files.mobilitydatabase.org/feed-2/latest.zip,CC0,40.9,41.2,28.7,29.2,2025-10-29 18:29:34.166039+00:00,active,Feed Information,,",
        "feed-3,gtfs,,TR,Ankara,Ankara,EGO,True,Ankara Feed,,,,https://example.com/feed-3.zip,0,,,https://files.mobilitydatabase.org/feed-3/latest.zip,CC0,39.7,40.1,32.6,33.0,2025-10-29 18:29:34.166039+00:00,active,Feed Information,,",
        "feed-4,gtfs,,TR,Istanbul,Istanbul,Inactive Feed,True,Inactive Feed,,,,https://example.com/feed-4.zip,0,,,https://files.mobilitydatabase.org/feed-4/latest.zip,CC0,40.9,41.2,28.7,29.2,2025-10-29 18:29:34.166039+00:00,inactive,Feed Information,,",
      ].join("\n"),
    );

    await fs.writeFile(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify(
        {
          schemaVersion: "2.0.0",
          generatedAt: "2026-03-25T00:00:00.000Z",
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
      path.join(generatedDir, "map", "cities.geojson"),
      JSON.stringify({ type: "FeatureCollection", features: [] }, null, 2),
    );
    await fs.writeFile(path.join(processedIndexesDir, "wpi-ports.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "power-plants.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "unlocode-entities.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "research-orgs.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "connectivity-fixed.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "connectivity-mobile.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "air-quality.json"), "[]");
    await fs.writeFile(path.join(processedIndexesDir, "water-stress.json"), "[]");

    await generateMobilityArtifacts({
      outputFile: path.join(commandCenterDir, "city-mobility-enrichment.json"),
      processedIndexesDir,
      registryFile,
      mobilityCsv,
    });

    const transitFeedIndex = JSON.parse(
      await fs.readFile(path.join(processedIndexesDir, "transit-feeds.json"), "utf-8"),
    );
    const mobilityEnrichment = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "city-mobility-enrichment.json"), "utf-8"),
    );

    expect(transitFeedIndex).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cityId: "geo-745044",
          feedCount: 2,
          officialFeedCount: 1,
          providerCount: 2,
        }),
        expect.objectContaining({
          cityId: "geo-323786",
          feedCount: 1,
          officialFeedCount: 1,
        }),
      ]),
    );
    expect(mobilityEnrichment.cities["geo-745044"].investorIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "transit-feeds",
          value: 2,
        }),
        expect.objectContaining({
          indicatorId: "official-transit-feeds",
          value: 1,
        }),
      ]),
    );

    const { globeManifest, commandCenterManifest } = await generateGlobeArtifacts({
      cityManifestFile: path.join(generatedDir, "manifest.json"),
      cityRegistryFile: registryFile,
      cityMapDir: path.join(generatedDir, "map"),
      commandCenterDir,
      globeDir,
      processedIndexesDir,
      bulkSourceManifest: {
        mobilityDatabase: {
          feeds: {
            exists: true,
            purpose: "Mobility Database GTFS catalog",
            relativePath: "mobilitydatabase/feeds_v2.csv",
            required: false,
            sizeBytes: 1024,
            sourceUrl: "https://files.mobilitydatabase.org/feeds_v2.csv",
          },
        },
      },
    });

    expect(globeManifest.layers.some((layer) => layer.id === "transit-feeds")).toBe(true);
    expect(commandCenterManifest.datasetInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mobility-database",
          status: "published_to_website",
          websiteSurfaces: expect.arrayContaining(["dataset workspace", "globe layer"]),
        }),
      ]),
    );
  });
});
