// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateArtifacts } from "./generate-artifacts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("generateArtifacts", () => {
  it("publishes registry, search index, manifest, workspaces, entities, and sources", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    const registry = [
      {
        cityId: "geo-1",
        slug: "andorra-la-vella",
        name: "Andorra la Vella",
        aliases: ["Andorra"],
        countryIso2: "AD",
        countryIso3: "AND",
        countrySlug: "andorra",
        admin1Name: "Andorra la Vella",
        admin1Code: "07",
        latitude: 42.5078,
        longitude: 1.5211,
        boundaryStatus: "point_only",
        population: 22615,
        populationSource: "GeoNames",
        registrySource: "GeoNames",
        recordStatus: "active",
        roleTags: [],
      },
    ];

    const resolved = {
      cityId: "geo-1",
      economicFactbook: [
        {
          indicatorId: "population",
          value: 22615,
          unit: "persons",
          status: "actual",
          source: {
            id: "geonames",
            name: "GeoNames",
            updatedAt: "2026-03-15",
            coverage: "global",
            methodology: "Geographic registry",
            url: "https://www.geonames.org/",
          },
        },
      ],
      entities: [
        {
          entityId: "airport-1",
          cityId: "geo-1",
          entityName: "Test Airport",
          entityType: "airport",
          presenceType: "airport",
          exactSite: true,
          geometryMode: "exact",
          latitude: 42.5,
          longitude: 1.5,
          status: "active",
          sources: [
            {
              id: "ourairports",
              name: "OurAirports",
              updatedAt: "2026-03-15",
              coverage: "global",
              methodology: "Airport registry",
              url: "https://ourairports.com/data/",
            },
          ],
          lastVerifiedAt: "2026-03-15T00:00:00.000Z",
          confidenceState: "verified_exact",
        },
      ],
      sources: [
        {
          id: "geonames",
          name: "GeoNames",
          updatedAt: "2026-03-15",
          coverage: "global",
          methodology: "Geographic registry",
          url: "https://www.geonames.org/",
        },
        {
          id: "ourairports",
          name: "OurAirports",
          updatedAt: "2026-03-15",
          coverage: "global",
          methodology: "Airport registry",
          url: "https://ourairports.com/data/",
        },
      ],
    };

    await fs.writeFile(path.join(generatedDir, "registry.json"), JSON.stringify(registry, null, 2));
    await fs.writeFile(path.join(resolvedDir, "geo-1.json"), JSON.stringify(resolved, null, 2));

    await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
    });

    const searchIndex = JSON.parse(
      await fs.readFile(path.join(generatedDir, "search-index.json"), "utf-8"),
    );
    const manifest = JSON.parse(
      await fs.readFile(path.join(generatedDir, "manifest.json"), "utf-8"),
    );
    const workspace = JSON.parse(
      await fs.readFile(path.join(generatedDir, "workspaces", "geo-1.json"), "utf-8"),
    );
    const coverage = JSON.parse(
      await fs.readFile(path.join(generatedDir, "coverage", "geo-1.json"), "utf-8"),
    );
    const entities = JSON.parse(
      await fs.readFile(path.join(generatedDir, "entities", "geo-1.json"), "utf-8"),
    );
    const sources = JSON.parse(
      await fs.readFile(path.join(generatedDir, "sources", "geo-1.json"), "utf-8"),
    );

    expect(searchIndex).toHaveLength(1);
    expect(manifest.totalCityCount).toBe(1);
    expect(manifest.processedCityCount).toBe(1);
    expect(manifest.coverageShellCount).toBe(1);
    expect(manifest.coverageShellBoundaryCounts).toEqual({
      has_boundary: 0,
      point_only: 1,
    });
    expect(manifest.coverageShellObservedCounts).toEqual({
      economicFactbook: 1,
      investorIntel: 1,
      urbanIntel: 0,
      sourceLineage: 1,
    });
    expect(workspace.city.cityId).toBe("geo-1");
    expect(coverage.cityId).toBe("geo-1");
    expect(coverage.boundaryStatus).toBe("point_only");
    expect(coverage.sourceCount).toBe(2);
    expect(coverage.mappedCategoryCount).toBe(1);
    expect(coverage.documentedCategoryCount).toBe(4);
    expect(coverage.missingCategoryCount).toBe(1);
    expect(coverage.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "geometry",
          state: "documented",
          detail: expect.stringContaining("Point-only"),
        }),
        expect.objectContaining({
          id: "economic-factbook",
          state: "documented",
          count: 1,
        }),
        expect.objectContaining({
          id: "infrastructure-intel",
          state: "mapped",
          count: 1,
        }),
      ]),
    );
    expect(entities.entities).toHaveLength(1);
    expect(sources.sources).toHaveLength(2);
  });

  it("skips the combined entities geojson when it exceeds the configured threshold", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-threshold-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "andorra-la-vella",
          name: "Andorra la Vella",
          countryIso2: "AD",
          countryIso3: "AND",
          countrySlug: "andorra",
          latitude: 42.5078,
          longitude: 1.5211,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
      ]),
    );

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [
          {
            entityId: "airport-1",
            cityId: "geo-1",
            entityName: "Test Airport",
            entityType: "airport",
            presenceType: "airport",
            exactSite: true,
            geometryMode: "exact",
            latitude: 42.5,
            longitude: 1.5,
            status: "active",
            sources: [
              {
                id: "ourairports",
                name: "OurAirports",
                updatedAt: "2026-03-15",
                coverage: "global",
                methodology: "Airport registry",
              },
            ],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
        ],
        sources: [],
      }),
    );

    const { manifest } = await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
      maxCombinedEntityFeatures: 0,
    });

    expect(await fs.readFile(path.join(generatedDir, "map", "entities", "airports.geojson"), "utf-8")).toContain("Test Airport");
    await expect(fs.readFile(path.join(generatedDir, "map", "entities.geojson"), "utf-8")).rejects.toThrow();
    expect(manifest.buildWarnings).toContain("Skipped combined entities GeoJSON because feature count exceeded the configured threshold.");
  });

  it("streams layer geojson when a layer exceeds the configured stringify threshold", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-layer-threshold-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "andorra-la-vella",
          name: "Andorra la Vella",
          countryIso2: "AD",
          countryIso3: "AND",
          countrySlug: "andorra",
          latitude: 42.5078,
          longitude: 1.5211,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
      ]),
    );

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [
          {
            entityId: "airport-1",
            cityId: "geo-1",
            entityName: "Test Airport",
            entityType: "airport",
            presenceType: "airport",
            exactSite: true,
            geometryMode: "exact",
            latitude: 42.5,
            longitude: 1.5,
            status: "active",
            sources: [
              {
                id: "ourairports",
                name: "OurAirports",
                updatedAt: "2026-03-15",
                coverage: "global",
                methodology: "Airport registry",
              },
            ],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
        ],
        sources: [],
      }),
    );

    const { manifest } = await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
      maxLayerStringifyFeatures: 0,
    });

    expect(await fs.readFile(path.join(generatedDir, "map", "entities", "airports.geojson"), "utf-8")).toContain("Test Airport");
    expect(manifest.exactSiteCountsByType.airport).toBe(1);
    expect(manifest.buildWarnings).toContain(
      "Streamed layer GeoJSON for airports because feature count exceeded the configured threshold.",
    );
  });

  it("deduplicates exact-site layer features across city workspaces", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-dedupe-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "city-one",
          name: "City One",
          countryIso2: "AD",
          countryIso3: "AND",
          countrySlug: "andorra",
          latitude: 42.5,
          longitude: 1.5,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
        {
          cityId: "geo-2",
          slug: "city-two",
          name: "City Two",
          countryIso2: "AD",
          countryIso3: "AND",
          countrySlug: "andorra",
          latitude: 42.6,
          longitude: 1.6,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
      ]),
    );

    const duplicateEntity = {
      entityId: "airport-1",
      entityName: "Shared Airport",
      entityType: "airport",
      presenceType: "airport",
      exactSite: true,
      geometryMode: "exact",
      latitude: 42.55,
      longitude: 1.55,
      status: "active",
      sources: [
        {
          id: "ourairports",
          name: "OurAirports",
          updatedAt: "2026-03-15",
          coverage: "global",
          methodology: "Airport registry",
        },
      ],
      lastVerifiedAt: "2026-03-15T00:00:00.000Z",
      confidenceState: "verified_exact",
    };

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [{ ...duplicateEntity, cityId: "geo-1" }],
        sources: [],
      }),
    );
    await fs.writeFile(
      path.join(resolvedDir, "geo-2.json"),
      JSON.stringify({
        cityId: "geo-2",
        economicFactbook: [],
        entities: [{ ...duplicateEntity, cityId: "geo-2" }],
        sources: [],
      }),
    );

    const { manifest } = await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
    });

    const airportsLayer = JSON.parse(
      await fs.readFile(path.join(generatedDir, "map", "entities", "airports.geojson"), "utf-8"),
    );

    expect(airportsLayer.features).toHaveLength(1);
    expect(manifest.exactSiteCountsByType.airport).toBe(1);
    expect(manifest.exactSiteCount).toBe(1);
  });

  it("can regenerate homepage artifacts without rewriting per-city bundles", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-map-only-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");
    const workspacesDir = path.join(generatedDir, "workspaces");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });
    await fs.mkdir(workspacesDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "andorra-la-vella",
          name: "Andorra la Vella",
          countryIso2: "AD",
          countryIso3: "AND",
          countrySlug: "andorra",
          latitude: 42.5078,
          longitude: 1.5211,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
      ]),
    );

    await fs.writeFile(
      path.join(workspacesDir, "geo-1.json"),
      JSON.stringify({ sentinel: "keep-me" }),
    );

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [
          {
            entityId: "airport-1",
            cityId: "geo-1",
            entityName: "Test Airport",
            entityType: "airport",
            presenceType: "airport",
            exactSite: true,
            geometryMode: "exact",
            latitude: 42.5,
            longitude: 1.5,
            status: "active",
            sources: [
              {
                id: "ourairports",
                name: "OurAirports",
                updatedAt: "2026-03-15",
                coverage: "global",
                methodology: "Airport registry",
              },
            ],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
        ],
        sources: [],
      }),
    );

    await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
      skipPerCityOutputs: true,
    });

    expect(JSON.parse(await fs.readFile(path.join(workspacesDir, "geo-1.json"), "utf-8"))).toEqual({
      sentinel: "keep-me",
    });
    expect(
      await fs.readFile(path.join(generatedDir, "map", "entities", "airports.geojson"), "utf-8"),
    ).toContain("Test Airport");
  });

  it("normalizes research source labels in the generated manifest while publishing research layers", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-ror-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "test-city",
          name: "Test City",
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkey",
          latitude: 41,
          longitude: 29,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
      ]),
    );

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [
          {
            entityId: "research-1",
            cityId: "geo-1",
            entityName: "Bosphorus Research Center",
            entityType: "research",
            entitySubtype: "research_institute",
            presenceType: "research",
            exactSite: true,
            geometryMode: "exact",
            latitude: 41.01,
            longitude: 29.01,
            status: "active",
            sources: [
              {
                id: "ror",
                name: "Research Organization Registry",
                updatedAt: "2026-03-15",
                coverage: "global",
                methodology: "Open persistent identifier for research organizations",
              },
            ],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
        ],
        sources: [
          {
            id: "ror",
            name: "Research Organization Registry",
            updatedAt: "2026-03-15",
            coverage: "global",
            methodology: "Open persistent identifier for research organizations",
          },
        ],
      }),
    );

    await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    const manifest = JSON.parse(await fs.readFile(path.join(generatedDir, "manifest.json"), "utf-8"));
    const researchLayer = JSON.parse(
      await fs.readFile(path.join(generatedDir, "map", "entities", "research.geojson"), "utf-8"),
    );

    expect(manifest.sourceCounts.ROR).toBe(1);
    expect(researchLayer.features).toHaveLength(1);
    expect(researchLayer.features[0]?.properties?.label).toBe("Bosphorus Research Center");
  });

  it("prioritizes non-airport infrastructure in per-city entity outputs", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-priority-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "test-city",
          name: "Test City",
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkey",
          latitude: 41,
          longitude: 29,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
      ]),
    );

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [
          {
            entityId: "airport-1",
            cityId: "geo-1",
            entityName: "Regional Helipad",
            entityType: "airport",
            entitySubtype: "heliport",
            presenceType: "airport",
            exactSite: true,
            geometryMode: "exact",
            latitude: 41.01,
            longitude: 29.01,
            status: "active",
            sources: [],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
          {
            entityId: "airport-2",
            cityId: "geo-1",
            entityName: "Main Airport",
            entityType: "airport",
            entitySubtype: "large_airport",
            presenceType: "airport",
            exactSite: true,
            geometryMode: "exact",
            latitude: 41.02,
            longitude: 29.02,
            status: "active",
            sources: [],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
          {
            entityId: "port-1",
            cityId: "geo-1",
            entityName: "North Port",
            entityType: "port",
            presenceType: "port",
            exactSite: true,
            geometryMode: "exact",
            latitude: 41.03,
            longitude: 29.03,
            status: "active",
            sources: [],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
          {
            entityId: "utility-1",
            cityId: "geo-1",
            entityName: "West Power Plant",
            entityType: "utility",
            entitySubtype: "power_plant",
            presenceType: "power_asset",
            exactSite: true,
            geometryMode: "exact",
            latitude: 41.04,
            longitude: 29.04,
            status: "active",
            sources: [],
            lastVerifiedAt: "2026-03-15T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
        ],
        sources: [],
      }),
    );

    await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    const entities = JSON.parse(
      await fs.readFile(path.join(generatedDir, "entities", "geo-1.json"), "utf-8"),
    );

    expect(entities.entities.slice(0, 3).map((entity: { entityType: string }) => entity.entityType)).toEqual([
      "utility",
      "port",
      "airport",
    ]);
  });

  it("publishes source-backed infrastructure metrics into the city workspace", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-artifacts-workspace-metrics-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const resolvedDir = path.join(rootDir, "data", "raw", "cities", "resolved");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(resolvedDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "test-city",
          name: "Test City",
          countryIso2: "UA",
          countryIso3: "UKR",
          countrySlug: "ukraine",
          latitude: 46.48,
          longitude: 30.73,
          boundaryStatus: "has_boundary",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
      ]),
    );

    await fs.writeFile(
      path.join(resolvedDir, "geo-1.json"),
      JSON.stringify({
        cityId: "geo-1",
        economicFactbook: [],
        entities: [
          {
            entityId: "airport-1",
            cityId: "geo-1",
            entityName: "Primary Airport",
            entityType: "airport",
            entitySubtype: "large_airport",
            presenceType: "airport",
            exactSite: true,
            geometryMode: "exact",
            latitude: 46.5,
            longitude: 30.7,
            status: "active",
            sources: [
              {
                id: "ourairports",
                name: "OurAirports",
                updatedAt: "2026-03-21",
                coverage: "global",
                methodology: "Airport registry",
              },
            ],
            lastVerifiedAt: "2026-03-21T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
          {
            entityId: "port-1",
            cityId: "geo-1",
            entityName: "Commercial Port",
            entityType: "port",
            presenceType: "port",
            exactSite: true,
            geometryMode: "exact",
            latitude: 46.49,
            longitude: 30.75,
            status: "active",
            sources: [
              {
                id: "world-port-index",
                name: "World Port Index",
                updatedAt: "2026-03-21",
                coverage: "global",
                methodology: "Port registry",
              },
            ],
            lastVerifiedAt: "2026-03-21T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
          {
            entityId: "utility-1",
            cityId: "geo-1",
            entityName: "South Power Plant",
            entityType: "utility",
            entitySubtype: "power_plant",
            presenceType: "power_asset",
            exactSite: true,
            geometryMode: "exact",
            latitude: 46.47,
            longitude: 30.74,
            status: "active",
            sources: [
              {
                id: "wri",
                name: "WRI",
                updatedAt: "2026-03-21",
                coverage: "global",
                methodology: "Power plant registry",
              },
            ],
            lastVerifiedAt: "2026-03-21T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
          {
            entityId: "research-1",
            cityId: "geo-1",
            entityName: "Marine Research Institute",
            entityType: "research",
            entitySubtype: "research_institute",
            presenceType: "research",
            exactSite: true,
            geometryMode: "exact",
            latitude: 46.46,
            longitude: 30.76,
            status: "active",
            sources: [
              {
                id: "ror",
                name: "ROR",
                updatedAt: "2026-03-21",
                coverage: "global",
                methodology: "Research organization registry",
              },
            ],
            lastVerifiedAt: "2026-03-21T00:00:00.000Z",
            confidenceState: "verified_exact",
          },
        ],
        sources: [],
      }),
    );

    await generateArtifacts({
      outDir: generatedDir,
      registryFile: path.join(generatedDir, "registry.json"),
      resolvedDir,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    const workspace = JSON.parse(
      await fs.readFile(path.join(generatedDir, "workspaces", "geo-1.json"), "utf-8"),
    );

    expect(workspace.investorIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "ports",
          value: 1,
          unit: "sites",
          source: expect.objectContaining({ name: "World Port Index" }),
        }),
        expect.objectContaining({
          indicatorId: "utilities",
          value: 1,
          unit: "sites",
          source: expect.objectContaining({ name: "WRI" }),
        }),
        expect.objectContaining({
          indicatorId: "organizations",
          value: 1,
          unit: "sites",
          source: expect.objectContaining({ name: "ROR" }),
        }),
      ]),
    );
  });
});
