// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { fetchCitySources } from "./fetch-sources";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

function buildCity(cityId: string, name: string) {
  return {
    cityId,
    name,
    countryIso2: "AD",
    countryIso3: "AND",
    latitude: 42.5,
    longitude: 1.5,
    population: 1000,
    admin1Name: "Andorra la Vella",
  };
}

describe("fetchCitySources", () => {
  it("writes local bulk facts from a provided entity index", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-fetch-sources-"));
    tempDirs.push(rootDir);

    const registryFile = path.join(rootDir, "registry.json");
    const factsDir = path.join(rootDir, "facts");

    await fs.writeFile(registryFile, JSON.stringify([buildCity("city-1", "Andorra la Vella")]));

    await fetchCitySources({
      registryFile,
      factsDir,
      entityIndex: {
        airports: [
          {
            entityId: "airport-ad-001",
            entityType: "airport",
            entitySubtype: "small_airport",
            name: "Andorra Test Airport",
            latitude: 42.5001,
            longitude: 1.5001,
            continent: "EU",
            countryIso2: "AD",
            municipality: "Andorra la Vella",
            scheduledService: false,
            exactSite: true,
            sourceId: "ourairports",
          },
        ],
        unlocodeEntities: [],
        powerPlants: [],
        researchOrgs: [],
        wpiPorts: [],
        mineralSites: [],
      },
      forceRebuild: true,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    const fact = JSON.parse(await fs.readFile(path.join(factsDir, "city-1.json"), "utf-8"));
    expect(fact.entities).toHaveLength(1);
    expect(fact.entities[0]?.type).toBe("airport");
    expect(fact.sources).toEqual(["OurAirports"]);
  });

  it("wipes stale facts on forceRebuild and writes none for entity-less cities", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-fetch-sources-force-"));
    tempDirs.push(rootDir);

    const registryFile = path.join(rootDir, "registry.json");
    const factsDir = path.join(rootDir, "facts");

    await fs.mkdir(factsDir, { recursive: true });
    await fs.writeFile(registryFile, JSON.stringify([buildCity("city-1", "Andorra la Vella")]));
    await fs.writeFile(
      path.join(factsDir, "city-1.json"),
      JSON.stringify({ cityId: "city-1", entities: [{ entityId: "stale" }], sources: [] }),
    );

    await fetchCitySources({
      registryFile,
      factsDir,
      entityIndex: {
        airports: [],
        unlocodeEntities: [],
        powerPlants: [],
        researchOrgs: [],
        wpiPorts: [],
        mineralSites: [],
      },
      forceRebuild: true,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    // forceRebuild wipes the stale facts dir; city-1 has no source-backed entities, so no new fact
    // file is written for it (entity-less cities are skipped to keep the output sane-sized).
    await expect(fs.readFile(path.join(factsDir, "city-1.json"), "utf-8")).rejects.toThrow();
  });

  it("includes WRI utility assets when the registry city provides ISO3", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-fetch-sources-wri-"));
    tempDirs.push(rootDir);

    const registryFile = path.join(rootDir, "registry.json");
    const factsDir = path.join(rootDir, "facts");

    await fs.writeFile(
      registryFile,
      JSON.stringify([
        {
          cityId: "geo-745044",
          name: "Istanbul",
          countryIso2: "TR",
          countryIso3: "TUR",
          latitude: 41.01384,
          longitude: 28.94966,
          population: 15701602,
          admin1Name: "Istanbul",
        },
      ]),
    );

    await fetchCitySources({
      registryFile,
      factsDir,
      entityIndex: {
        airports: [],
        unlocodeEntities: [],
        powerPlants: [
          {
            entityId: "power-plant-tur-1",
            entityType: "utility",
            entitySubtype: "power_plant",
            name: "Ambarli Gas Plant",
            countryIso2: "TUR",
            countryIso3: "TUR",
            countryName: "Turkey",
            latitude: 41.027,
            longitude: 28.71,
            primaryFuel: "Gas",
            capacityMw: 1200,
            capacityUnit: "MW",
            exactSite: true,
            sourceId: "wri-gppd",
          },
        ],
        researchOrgs: [],
        wpiPorts: [],
        mineralSites: [],
      },
      forceRebuild: true,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    const fact = JSON.parse(await fs.readFile(path.join(factsDir, "geo-745044.json"), "utf-8"));

    expect(fact.entities).toHaveLength(1);
    expect(fact.entities[0]?.type).toBe("utility");
    expect(fact.sources).toEqual(["WRI"]);
  });

  it("attributes a nearby USGS MRDS mineral site as a utility entity", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-fetch-sources-mrds-"));
    tempDirs.push(rootDir);

    const registryFile = path.join(rootDir, "registry.json");
    const factsDir = path.join(rootDir, "facts");

    await fs.writeFile(registryFile, JSON.stringify([buildCity("city-1", "Andorra la Vella")]));

    await fetchCitySources({
      registryFile,
      factsDir,
      entityIndex: {
        airports: [],
        unlocodeEntities: [],
        powerPlants: [],
        researchOrgs: [],
        wpiPorts: [],
        mineralSites: [
          {
            entityId: "mineral-site-12345",
            entityType: "utility",
            entitySubtype: "mineral_site",
            name: "Andorra Test Mine",
            latitude: 42.5005,
            longitude: 1.5005,
            commodity: "Iron",
            devStat: "Producer",
            countryName: "Andorra",
            exactSite: true,
            sourceId: "usgs-mrds",
          },
        ],
      },
      forceRebuild: true,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });

    const fact = JSON.parse(await fs.readFile(path.join(factsDir, "city-1.json"), "utf-8"));
    expect(fact.entities).toHaveLength(1);
    expect(fact.entities[0]?.type).toBe("utility");
    expect(fact.entities[0]?.subtype).toBe("mineral_site");
    expect(fact.sources).toEqual(["USGS MRDS"]);
  });
});
