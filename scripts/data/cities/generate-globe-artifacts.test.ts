// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateGlobeArtifacts } from "./generate-globe-artifacts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("generateGlobeArtifacts", () => {
  it("publishes the command-center manifest and shipped layer metadata", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-globe-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const globeDir = path.join(rootDir, "public", "data", "globe");
    const baseImagerySourceDir = path.join(rootDir, "data", "raw", "globe-imagery");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");

    await fs.mkdir(generatedDir, { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });
    await fs.mkdir(path.join(baseImagerySourceDir, "true-color", "2026-03-15", "0", "0"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(baseImagerySourceDir, "true-color", "2026-03-15", "0", "0", "0.jpg"),
      "real-local-tile",
    );
    await fs.writeFile(
      path.join(baseImagerySourceDir, "true-color", "metadata.json"),
      JSON.stringify({
        downloadedAt: "2026-03-15T00:00:00.000Z",
        remoteLayerId: "MODIS_Terra_CorrectedReflectance_TrueColor",
        availableDates: ["2026-03-15"],
        minZoom: 0,
        maxZoom: 3,
        tileMatrixSet: "GoogleMapsCompatible_Level9",
        format: "image/jpeg",
        sourceLabels: ["NASA GIBS"],
      }),
    );
    await fs.mkdir(path.join(baseImagerySourceDir, "night-lights", "2016-01-01", "0", "0"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(baseImagerySourceDir, "night-lights", "2016-01-01", "0", "0", "0.png"),
      "real-night-tile",
    );
    await fs.writeFile(
      path.join(baseImagerySourceDir, "night-lights", "metadata.json"),
      JSON.stringify({
        downloadedAt: "2026-03-15T00:00:00.000Z",
        remoteLayerId: "VIIRS_Black_Marble",
        availableDates: ["2016-01-01"],
        minZoom: 0,
        maxZoom: 3,
        tileMatrixSet: "GoogleMapsCompatible_Level9",
        format: "image/png",
        sourceLabels: ["NASA Black Marble"],
      }),
    );

    await fs.writeFile(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify({
        schemaVersion: "2.0.0",
        generatedAt: "2026-03-15T00:00:00.000Z",
        totalCityCount: 1,
        processedCityCount: 1,
        countryCounts: { AND: 1 },
        entityCountsByType: { airport: 1, port: 1, utility: 1, research: 1 },
        exactSiteCountsByType: { airport: 5, port: 0, utility: 0, research: 0 },
        exactSiteCount: 5,
        cityPresenceCount: 0,
        unresolvedCoverageCount: 0,
        sourceCounts: { GeoNames: 1, OurAirports: 1 },
        buildWarnings: [],
      }),
    );

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

    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.writeFile(
      path.join(generatedDir, "map", "cities.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: [],
      }),
    );
    await fs.writeFile(
      path.join(generatedDir, "map", "entities", "airports.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: [],
      }),
    );
    await fs.writeFile(
      path.join(generatedDir, "map", "entities", "ports.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: [],
      }),
    );
    await fs.writeFile(path.join(processedIndexesDir, "power-plants.json"), JSON.stringify([{ entityId: "power-1" }]));
    await fs.writeFile(path.join(processedIndexesDir, "wpi-ports.json"), JSON.stringify([{ entityId: "port-1" }]));
    await fs.writeFile(path.join(processedIndexesDir, "unlocode-entities.json"), JSON.stringify([]));
    await fs.writeFile(path.join(processedIndexesDir, "research-orgs.json"), JSON.stringify([]));

    await generateGlobeArtifacts({
      cityManifestFile: path.join(generatedDir, "manifest.json"),
      cityRegistryFile: path.join(generatedDir, "registry.json"),
      cityMapDir: path.join(generatedDir, "map"),
      commandCenterDir,
      globeDir,
      baseImagerySourceDir,
      processedIndexesDir,
      bulkSourceManifest: {
        geonames: {
          admin1Codes: {
            absolutePath: path.join(rootDir, "data", "raw", "cities", "bulk", "geonames", "admin1CodesASCII.txt"),
            exists: true,
            purpose: "GeoNames admin1",
            relativePath: "geonames/admin1CodesASCII.txt",
            required: true,
            sizeBytes: 1,
            sourceUrl: "https://download.geonames.org/",
          },
        },
        ourAirports: {
          airports: {
            absolutePath: path.join(rootDir, "data", "raw", "cities", "bulk", "ourairports", "airports.csv"),
            exists: true,
            purpose: "OurAirports",
            relativePath: "ourairports/airports.csv",
            required: true,
            sizeBytes: 1,
            sourceUrl: "https://ourairports.com/data/",
          },
        },
        worldPortIndex: {
          wpi: {
            absolutePath: path.join(rootDir, "data", "raw", "cities", "bulk", "worldportindex", "WPI.csv"),
            exists: true,
            purpose: "World Port Index",
            relativePath: "worldportindex/WPI.csv",
            required: true,
            sizeBytes: 1,
            sourceUrl: "https://msi.nga.mil/NGAPortal/MSI.portal",
          },
        },
        wri: {
          powerPlants: {
            absolutePath: path.join(rootDir, "data", "raw", "cities", "bulk", "wri", "global_power_plant_database.csv"),
            exists: true,
            purpose: "WRI power plants",
            relativePath: "wri/global_power_plant_database.csv",
            required: false,
            sizeBytes: 1,
            sourceUrl: "https://raw.githubusercontent.com/",
          },
        },
        researchOrganizations: {
          csv: {
            absolutePath: path.join(rootDir, "data", "raw", "cities", "bulk", "ror", "ror.csv"),
            exists: true,
            purpose: "ROR csv",
            relativePath: "ror/ror.csv",
            required: false,
            sizeBytes: 1,
            sourceUrl: "https://zenodo.org/",
          },
        },
        unlocode: {
          part1: {
            absolutePath: path.join(rootDir, "data", "raw", "cities", "bulk", "unlocode", "part1.csv"),
            exists: true,
            purpose: "UN/LOCODE part 1",
            relativePath: "unlocode/part1.csv",
            required: true,
            sizeBytes: 1,
            sourceUrl: "https://service.unece.org/",
          },
        },
      },
    });

    const commandCenterManifest = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "manifest.json"), "utf-8"),
    );
    const globeManifest = JSON.parse(
      await fs.readFile(path.join(globeDir, "manifest.json"), "utf-8"),
    );
    const airportsMeta = JSON.parse(
      await fs.readFile(path.join(globeDir, "layers", "airports", "meta.json"), "utf-8"),
    );
    const airportsSummary = JSON.parse(
      await fs.readFile(path.join(globeDir, "layers", "airports", "snapshots", "summary.json"), "utf-8"),
    );
    const baseImageryCatalog = JSON.parse(
      await fs.readFile(path.join(globeDir, "base-imagery", "catalog.json"), "utf-8"),
    );
    const copiedImageryTile = await fs.readFile(
      path.join(globeDir, "base-imagery", "true-color", "2026-03-15", "0", "0", "0.jpg"),
      "utf-8",
    );
    const whoDatasetWorkspace = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "datasets", "who-air-quality.json"), "utf-8"),
    );
    const peeringDbWorkspace = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "datasets", "peeringdb.json"), "utf-8"),
    );
    const overtureTransportationWorkspace = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "datasets", "overture-transportation.json"), "utf-8"),
    );

    expect(commandCenterManifest.defaultViewId).toBe("global-ops");
    expect(commandCenterManifest.baseImageryCatalogPath).toBe("/data/globe/base-imagery/catalog.json");
    expect(commandCenterManifest.datasetInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "geonames",
          status: "published_to_website",
          workspacePath: "/datasets/geonames",
          websiteSurfaces: expect.arrayContaining(["city bundles", "globe layer"]),
        }),
        expect.objectContaining({
          id: "wri-global-power-plant-database",
          status: "processed_with_data",
          workspacePath: "/datasets/wri-global-power-plant-database",
          websiteSurfaces: expect.arrayContaining(["dataset workspace"]),
        }),
        expect.objectContaining({
          id: "world-port-index",
          status: "processed_with_data",
          workspacePath: "/datasets/world-port-index",
          websiteSurfaces: expect.arrayContaining(["dataset workspace"]),
        }),
        expect.objectContaining({
          id: "un-locode",
          status: "processed_without_data",
          workspacePath: "/datasets/un-locode",
          websiteSurfaces: expect.arrayContaining(["dataset workspace"]),
        }),
        expect.objectContaining({
          id: "research-organizations-registry",
          status: "processed_without_data",
          workspacePath: "/datasets/research-organizations-registry",
          websiteSurfaces: expect.arrayContaining(["dataset workspace"]),
        }),
        expect.objectContaining({
          id: "peeringdb",
          status: "identified_public_source",
          workspacePath: "/datasets/peeringdb",
          sourceLabels: ["PeeringDB"],
        }),
        expect.objectContaining({
          id: "geofabrik-openstreetmap",
          status: "identified_public_source",
          workspacePath: "/datasets/geofabrik-openstreetmap",
          sourceLabels: ["Geofabrik", "OpenStreetMap"],
        }),
        expect.objectContaining({
          id: "openinframap",
          status: "identified_public_source",
          workspacePath: "/datasets/openinframap",
          sourceLabels: ["OpenInfraMap", "OpenStreetMap"],
        }),
        expect.objectContaining({
          id: "healthsites",
          status: "identified_public_source",
          workspacePath: "/datasets/healthsites",
          sourceLabels: ["Healthsites", "OpenStreetMap"],
        }),
        expect.objectContaining({
          id: "world-bank-sez",
          status: "identified_public_source",
          workspacePath: "/datasets/world-bank-sez",
          sourceLabels: ["World Bank SEZ"],
        }),
        expect.objectContaining({
          id: "overture-divisions",
          status: "identified_public_source",
          workspacePath: "/datasets/overture-divisions",
          sourceLabels: ["Overture Maps", "Overture Divisions"],
        }),
        expect.objectContaining({
          id: "overture-places",
          status: "identified_public_source",
          workspacePath: "/datasets/overture-places",
          sourceLabels: ["Overture Maps", "Overture Places"],
        }),
        expect.objectContaining({
          id: "overture-buildings",
          status: "identified_public_source",
          workspacePath: "/datasets/overture-buildings",
          sourceLabels: ["Overture Maps", "Overture Buildings"],
        }),
        expect.objectContaining({
          id: "overture-transportation",
          status: "identified_public_source",
          workspacePath: "/datasets/overture-transportation",
          sourceLabels: ["Overture Maps", "Overture Transportation"],
        }),
      ]),
    );
    expect(globeManifest.layers.map((layer: { id: string }) => layer.id)).toEqual(
      expect.arrayContaining(["airports", "cities"]),
    );
    expect(airportsMeta.id).toBe("airports");
    expect(airportsSummary.featureCount).toBe(5);
    expect(baseImageryCatalog.defaultLayerId).toBe("night-lights");
    expect(
      baseImageryCatalog.layers.find((layer: { id: string }) => layer.id === "true-color"),
    ).toMatchObject({
      status: "published",
      availableDates: ["2026-03-15"],
      minZoom: 0,
      maxZoom: 3,
    });
    expect(
      baseImageryCatalog.layers.find((layer: { id: string }) => layer.id === "night-lights"),
    ).toMatchObject({
      status: "published",
      availableDates: ["2016-01-01"],
      assetPathTemplate: "/data/globe/base-imagery/night-lights/{date}/{z}/{x}/{y}.png",
    });
    expect(copiedImageryTile).toBe("real-local-tile");
    expect(whoDatasetWorkspace.dataset.id).toBe("who-air-quality");
    expect(whoDatasetWorkspace.dataset.workspacePath).toBe("/datasets/who-air-quality");
    expect(whoDatasetWorkspace.sourcePack.fileCount).toBe(0);
    expect(whoDatasetWorkspace.notes).toEqual(
      expect.arrayContaining(["No processed index is published for this dataset in the current build."]),
    );
    expect(peeringDbWorkspace.dataset.status).toBe("identified_public_source");
    expect(peeringDbWorkspace.sourcePack.files).toEqual([
      expect.objectContaining({
        relativePath: "PeeringDB REST API",
        exists: false,
        sourceUrl: "https://docs.peeringdb.com/api_specs/",
      }),
    ]);
    expect(peeringDbWorkspace.notes).toEqual(
      expect.arrayContaining(["Real public source is identified but no local source pack entry is present in this build."]),
    );
    expect(overtureTransportationWorkspace.dataset.status).toBe("identified_public_source");
    expect(overtureTransportationWorkspace.sourcePack.files).toEqual([
      expect.objectContaining({
        relativePath: "Overture Transportation docs",
        exists: false,
        sourceUrl: "https://docs.overturemaps.org/guides/transportation/",
      }),
    ]);
  });

  it("publishes ports and utilities from processed indexes when map GeoJSON is not present", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-globe-indexes-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const globeDir = path.join(rootDir, "public", "data", "globe");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");

    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify({
        schemaVersion: "2.0.0",
        generatedAt: "2026-03-15T00:00:00.000Z",
        totalCityCount: 1,
        processedCityCount: 1,
        countryCounts: { USA: 1 },
        entityCountsByType: { port: 1, utility: 1 },
        exactSiteCountsByType: { port: 1, utility: 1 },
        sourceCounts: { GeoNames: 1 },
      }),
    );

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "annapolis",
          name: "Annapolis",
          countryIso2: "US",
          countryIso3: "USA",
          countrySlug: "united-states",
          latitude: 38.9784,
          longitude: -76.4922,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
      ]),
    );

    await fs.writeFile(
      path.join(generatedDir, "map", "cities.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: [],
      }),
    );

    await fs.writeFile(
      path.join(processedIndexesDir, "wpi-ports.json"),
      JSON.stringify([
        {
          entityId: "wpi-port-8225",
          entityType: "port",
          entitySubtype: "river_port",
          name: "Annapolis",
          latitude: 38.983333,
          longitude: -76.483333,
          countryIso2: "US",
          exactSite: true,
          sourceId: "world-port-index",
        },
      ]),
    );
    await fs.writeFile(
      path.join(processedIndexesDir, "power-plants.json"),
      JSON.stringify([
        {
          entityId: "power-plant-1",
          entityType: "utility",
          entitySubtype: "power_plant",
          name: "Test Utility",
          latitude: 38.9,
          longitude: -76.5,
          countryIso2: "US",
          exactSite: true,
          sourceId: "wri-gppd",
        },
      ]),
    );
    await fs.writeFile(path.join(processedIndexesDir, "unlocode-entities.json"), JSON.stringify([]));
    await fs.writeFile(path.join(processedIndexesDir, "research-orgs.json"), JSON.stringify([]));

    await generateGlobeArtifacts({
      cityManifestFile: path.join(generatedDir, "manifest.json"),
      cityRegistryFile: path.join(generatedDir, "registry.json"),
      cityMapDir: path.join(generatedDir, "map"),
      commandCenterDir,
      globeDir,
      processedIndexesDir,
      bulkSourceManifest: {
        worldPortIndex: { wpi: { exists: true } },
        wri: { powerPlants: { exists: true } },
      },
    });

    const commandCenterManifest = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "manifest.json"), "utf-8"),
    );
    const globeManifest = JSON.parse(await fs.readFile(path.join(globeDir, "manifest.json"), "utf-8"));
    const portsMeta = JSON.parse(
      await fs.readFile(path.join(globeDir, "layers", "ports", "meta.json"), "utf-8"),
    );
    const portsGeoJson = JSON.parse(
      await fs.readFile(path.join(globeDir, "layers", "ports", "vectors", "current.geojson"), "utf-8"),
    );
    const utilitiesGeoJson = JSON.parse(
      await fs.readFile(path.join(globeDir, "layers", "utilities", "vectors", "current.geojson"), "utf-8"),
    );

    expect(globeManifest.layers.map((layer: { id: string }) => layer.id)).toEqual(
      expect.arrayContaining(["cities", "ports", "utilities"]),
    );
    expect(portsMeta.sourceLabels).toEqual(["World Port Index"]);
    expect(portsGeoJson.features).toHaveLength(1);
    expect(portsGeoJson.features[0].properties.label).toBe("Annapolis");
    expect(utilitiesGeoJson.features).toHaveLength(1);
    expect(utilitiesGeoJson.features[0].properties.label).toBe("Test Utility");
    expect(commandCenterManifest.datasetInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "world-port-index",
          status: "published_to_website",
        }),
        expect.objectContaining({
          id: "un-locode",
          status: "processed_without_data",
        }),
        expect.objectContaining({
          id: "wri-global-power-plant-database",
          status: "published_to_website",
        }),
      ]),
    );
  }, 15000);

  it("counts research city bundles from canonical source labels and publishes UN/LOCODE transport layers", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-globe-ror-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const globeDir = path.join(rootDir, "public", "data", "globe");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");

    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });

    await fs.writeFile(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify({
        schemaVersion: "2.0.0",
        generatedAt: "2026-03-15T00:00:00.000Z",
        totalCityCount: 1,
        processedCityCount: 1,
        countryCounts: { TUR: 1 },
        entityCountsByType: { port: 1, rail_hub: 1, logistics_hub: 1, research: 1 },
        exactSiteCountsByType: { port: 0, rail_hub: 0, logistics_hub: 0, research: 0 },
        sourceCounts: {
          GeoNames: 1,
          "Research Organization Registry": 1,
          "UN/LOCODE": 1,
        },
      }),
    );

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify([
        {
          cityId: "geo-745044",
          slug: "geo-745044-istanbul",
          name: "Istanbul",
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkey",
          latitude: 41.01384,
          longitude: 28.94966,
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        },
      ]),
    );

    await fs.writeFile(
      path.join(generatedDir, "map", "cities.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: [],
      }),
    );

    await fs.writeFile(
      path.join(processedIndexesDir, "unlocode-entities.json"),
      JSON.stringify([
        {
          entityId: "unlocode-port-TRIST",
          entityType: "port",
          name: "Istanbul Port",
          latitude: 41.01,
          longitude: 28.96,
          countryIso2: "TR",
          exactSite: true,
          sourceId: "unlocode",
        },
        {
          entityId: "unlocode-rail-TRIST",
          entityType: "rail_hub",
          name: "Istanbul Rail Terminal",
          latitude: 41.02,
          longitude: 28.97,
          countryIso2: "TR",
          exactSite: true,
          sourceId: "unlocode",
        },
        {
          entityId: "unlocode-logistics-TRIST",
          entityType: "logistics_hub",
          name: "Istanbul Logistics Center",
          latitude: 41.03,
          longitude: 28.98,
          countryIso2: "TR",
          exactSite: true,
          sourceId: "unlocode",
        },
      ]),
    );
    await fs.writeFile(path.join(processedIndexesDir, "wpi-ports.json"), JSON.stringify([]));
    await fs.writeFile(path.join(processedIndexesDir, "power-plants.json"), JSON.stringify([]));
    await fs.writeFile(
      path.join(processedIndexesDir, "research-orgs.json"),
      JSON.stringify([
        {
          entityId: "ror-istanbul-1",
          entityType: "research",
          entitySubtype: "university",
          name: "Bosphorus Research Center",
          latitude: 41.04,
          longitude: 29.01,
          countryIso2: "TR",
          exactSite: true,
          sourceId: "ror",
        },
      ]),
    );

    await generateGlobeArtifacts({
      cityManifestFile: path.join(generatedDir, "manifest.json"),
      cityRegistryFile: path.join(generatedDir, "registry.json"),
      cityMapDir: path.join(generatedDir, "map"),
      commandCenterDir,
      globeDir,
      processedIndexesDir,
      bulkSourceManifest: {
        unlocode: { part1: { exists: true } },
        researchOrganizations: { csv: { exists: true } },
      },
    });

    const commandCenterManifest = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "manifest.json"), "utf-8"),
    );
    const globeManifest = JSON.parse(await fs.readFile(path.join(globeDir, "manifest.json"), "utf-8"));
    const researchWorkspace = JSON.parse(
      await fs.readFile(path.join(commandCenterDir, "datasets", "research-organizations-registry.json"), "utf-8"),
    );

    expect(globeManifest.layers.map((layer: { id: string }) => layer.id)).toEqual(
      expect.arrayContaining(["ports", "rail-hubs", "logistics-hubs", "research"]),
    );
    expect(commandCenterManifest.datasetInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "un-locode",
          status: "published_to_website",
        }),
        expect.objectContaining({
          id: "research-organizations-registry",
          status: "published_to_website",
        }),
      ]),
    );
    expect(researchWorkspace.cityBundleCount).toBe(1);
  });

  it("emits a boot preview asset for oversized published globe layers", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-generate-globe-preview-"));
    tempDirs.push(rootDir);

    const generatedDir = path.join(rootDir, "src", "data", "generated", "cities");
    const commandCenterDir = path.join(rootDir, "src", "data", "generated", "command-center");
    const globeDir = path.join(rootDir, "public", "data", "globe");
    const processedIndexesDir = path.join(rootDir, "data", "processed", "cities", "indexes");

    await fs.mkdir(path.join(generatedDir, "map", "entities"), { recursive: true });
    await fs.mkdir(commandCenterDir, { recursive: true });
    await fs.mkdir(globeDir, { recursive: true });
    await fs.mkdir(processedIndexesDir, { recursive: true });

    const cityFeatures = Array.from({ length: 16_001 }, (_, index) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-120 + index * 0.001, 35 + index * 0.001],
      },
      properties: {
        cityId: `city-${index + 1}`,
        label: `City ${index + 1}`,
      },
    }));

    await fs.writeFile(
      path.join(generatedDir, "manifest.json"),
      JSON.stringify({
        schemaVersion: "2.0.0",
        generatedAt: "2026-03-15T00:00:00.000Z",
        totalCityCount: cityFeatures.length,
        processedCityCount: cityFeatures.length,
        countryCounts: { USA: cityFeatures.length },
        entityCountsByType: {},
        exactSiteCountsByType: {},
        sourceCounts: { GeoNames: cityFeatures.length },
      }),
    );

    await fs.writeFile(
      path.join(generatedDir, "registry.json"),
      JSON.stringify(
        cityFeatures.slice(0, 2).map((feature, index) => ({
          cityId: `city-${index + 1}`,
          slug: `city-${index + 1}`,
          name: `City ${index + 1}`,
          countryIso2: "US",
          countryIso3: "USA",
          countrySlug: "united-states",
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          boundaryStatus: "point_only",
          registrySource: "GeoNames",
          recordStatus: "active",
        })),
      ),
    );

    await fs.writeFile(
      path.join(generatedDir, "map", "cities.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: cityFeatures,
      }),
    );

    await generateGlobeArtifacts({
      cityManifestFile: path.join(generatedDir, "manifest.json"),
      cityRegistryFile: path.join(generatedDir, "registry.json"),
      cityMapDir: path.join(generatedDir, "map"),
      commandCenterDir,
      globeDir,
      processedIndexesDir,
      bulkSourceManifest: {
        geonames: {
          allCountries: { exists: true, sizeBytes: 1 },
        },
      },
    });

    const globeManifest = JSON.parse(await fs.readFile(path.join(globeDir, "manifest.json"), "utf-8"));
    const citiesLayer = globeManifest.layers.find((layer: { id: string }) => layer.id === "cities");
    const previewGeoJson = JSON.parse(
      await fs.readFile(path.join(globeDir, "layers", "cities", "vectors", "boot.geojson"), "utf-8"),
    );

    expect(citiesLayer.bootAssetPath).toBe("/data/globe/layers/cities/vectors/boot.geojson");
    expect(citiesLayer.bootFeatureCount).toBe(5000);
    expect(citiesLayer.bootFeatureCount).toBeLessThan(citiesLayer.featureCount);
    expect(citiesLayer.assetPath).toContain("/shards/");
    expect(previewGeoJson.features.length).toBeLessThan(16_001);
    expect(previewGeoJson.features.length).toBeGreaterThan(0);
  });
});
