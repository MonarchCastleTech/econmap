import fs from "node:fs/promises";
import path from "node:path";

import { getEntityIndex } from "./load-bulk-entities";
import { findAirportsForCity } from "./parsers/ourairports-parser";
import { findUnlocodeEntitiesForCity } from "./parsers/unlocode-parser";
import { findPowerPlantsForCity } from "./parsers/wri-powerplants-parser";
import { findResearchForCity } from "./parsers/ror-parser";
import { findPortsForCity } from "./parsers/wpi-parser";
import { findMineralSitesForCity } from "./parsers/usgs-mrds-parser";
import { buildSpatialGrid, queryRadius, haversineKm } from "./parsers/spatial-index";

// Per-source candidate search radii (km). The matchers apply the exact distance/name filter; the
// grid only prunes entities that cannot possibly be in range, making the join O(local density).
const AIRPORT_RADIUS_KM = 50;
const UNLOCODE_RADIUS_KM = 30;
const WPI_RADIUS_KM = 50;
const WRI_RADIUS_KM = 100;
const ROR_RADIUS_KM = 50;
// Small radius: attribute only mineral sites in the immediate urban footprint, not distant mines.
const MRDS_RADIUS_KM = 30;

// Accepts optional coords (e.g. ROR research orgs may lack a location); NaN is dropped by the grid.
const entityLatLon = (e: { latitude?: number | null; longitude?: number | null }) => ({
  lat: e.latitude ?? NaN,
  lon: e.longitude ?? NaN,
});

const REGISTRY_FILE = path.join(process.cwd(), "src", "data", "generated", "cities", "registry.json");
const FACTS_DIR = path.join(process.cwd(), "data", "raw", "cities", "facts");

type CityRegistryEntry = {
  cityId: string;
  countryIso2: string;
  countryIso3?: string;
  latitude: number;
  longitude: number;
  name: string;
  population?: number | null;
  admin1Name?: string;
  isMajorCity?: boolean;
};

type CityFactEntity = {
  entityId: string;
  name: string;
  type: string;
  subtype?: string;
  lat?: number;
  lon?: number;
  exactSite: boolean;
  source: string;
  sourceId: string;
};

type CityFacts = {
  cityId: string;
  fetchedAt: string;
  economic: {
    gdp: number | null;
    population: number | null;
  };
  entities: CityFactEntity[];
  sources: string[];
};

type FetchCitySourcesOptions = {
  registryFile?: string;
  factsDir?: string;
  forceRebuild?: boolean;
  entityIndex?: Awaited<ReturnType<typeof getEntityIndex>>;
  logger?: Pick<Console, "log" | "warn">;
  /** Process only cities matching this predicate (for scoped validation runs). */
  cityFilter?: (city: CityRegistryEntry) => boolean;
  /** Cap the number of cities processed (after cityFilter) — for scoped validation runs. */
  maxCities?: number;
};

export async function fetchCitySources(options: FetchCitySourcesOptions = {}) {
  const registryFile = options.registryFile ?? REGISTRY_FILE;
  const factsDir = options.factsDir ?? FACTS_DIR;
  const forceRebuild = options.forceRebuild ?? false;
  const logger = options.logger ?? console;

  logger.log("Starting local bulk entity joins for cities...");

  if (forceRebuild) {
    await fs.rm(factsDir, { recursive: true, force: true });
  }

  await fs.mkdir(factsDir, { recursive: true });

  const registry = JSON.parse(await fs.readFile(registryFile, "utf-8")) as CityRegistryEntry[];
  logger.log(`Processing ${registry.length} cities...`);

  // Load all bulk entity indexes
  const entityIndex = options.entityIndex ?? (await getEntityIndex({ forceReload: forceRebuild }));

  logger.log(`  Airports: ${entityIndex.airports.length}`);
  logger.log(`  UN/LOCODE entities: ${entityIndex.unlocodeEntities.length}`);
  logger.log(`  Power plants: ${entityIndex.powerPlants.length}`);
  logger.log(`  Research orgs: ${entityIndex.researchOrgs.length}`);
  logger.log(`  WPI ports: ${entityIndex.wpiPorts.length}`);
  logger.log(`  USGS mineral sites: ${entityIndex.mineralSites.length}`);

  // Build spatial grids once so each city queries only nearby candidates (O(local density)).
  const airportsGrid = buildSpatialGrid(entityIndex.airports, entityLatLon);
  const unlocodeGrid = buildSpatialGrid(entityIndex.unlocodeEntities, entityLatLon);
  const wpiGrid = buildSpatialGrid(entityIndex.wpiPorts, entityLatLon);
  const wriGrid = buildSpatialGrid(entityIndex.powerPlants, entityLatLon);
  const rorGrid = buildSpatialGrid(entityIndex.researchOrgs, entityLatLon);
  const mrdsGrid = buildSpatialGrid(entityIndex.mineralSites, entityLatLon);

  // Over-match fix: attribute each entity to its SINGLE nearest registry city (not every city within
  // radius). Precompute entityId -> nearest cityId once over the full registry; the per-city loop
  // keeps an entity only if this city is its nearest. This stops the airport-3.78M-row explosion and
  // keeps per-city facts (and the published artifacts) a sane size.
  // Fine 0.2-degree cells so each nearest-city lookup scans far fewer candidate cities.
  const cityGrid = buildSpatialGrid(registry, (c) => ({ lat: c.latitude, lon: c.longitude }), 0.2);
  const nearestCityId = (lat: number, lon: number, radiusKm: number): string | null => {
    let bestId: string | null = null;
    let bestD = Infinity;
    for (const c of queryRadius(cityGrid, lat, lon, radiusKm)) {
      const d = haversineKm(lat, lon, c.latitude, c.longitude);
      if (d <= radiusKm && d < bestD) {
        bestD = d;
        bestId = c.cityId;
      }
    }
    return bestId;
  };
  const buildNearestMap = (
    items: Array<{ entityId: string; latitude?: number | null; longitude?: number | null }>,
    radiusKm: number,
  ): Map<string, string> => {
    const m = new Map<string, string>();
    for (const it of items) {
      const lat = it.latitude;
      const lon = it.longitude;
      if (lat == null || lon == null || (lat === 0 && lon === 0)) continue;
      const id = nearestCityId(lat, lon, radiusKm);
      if (id) m.set(it.entityId, id);
    }
    return m;
  };
  const airportNearest = buildNearestMap(entityIndex.airports, AIRPORT_RADIUS_KM);
  const unlocodeNearest = buildNearestMap(entityIndex.unlocodeEntities, UNLOCODE_RADIUS_KM);
  const wpiNearest = buildNearestMap(entityIndex.wpiPorts, WPI_RADIUS_KM);
  const wriNearest = buildNearestMap(entityIndex.powerPlants, WRI_RADIUS_KM);
  const rorNearest = buildNearestMap(entityIndex.researchOrgs, ROR_RADIUS_KM);
  const mrdsNearest = buildNearestMap(entityIndex.mineralSites, MRDS_RADIUS_KM);

  let workingRegistry = registry;
  if (options.cityFilter) workingRegistry = workingRegistry.filter(options.cityFilter);
  if (options.maxCities != null) workingRegistry = workingRegistry.slice(0, options.maxCities);
  if (workingRegistry.length !== registry.length) {
    logger.log(`Scoped run: processing ${workingRegistry.length} of ${registry.length} cities.`);
  }

  let processedCount = 0;
  let skippedCount = 0;

  for (const city of workingRegistry) {
    const factFile = path.join(factsDir, `${city.cityId}.json`);

    // Check if already processed (resumable)
    const exists = !forceRebuild && (await fs.access(factFile).then(() => true).catch(() => false));
    if (exists && !forceRebuild) {
      skippedCount++;
      continue;
    }

    const entities: CityFactEntity[] = [];
    const sources = new Set<string>();

    // Find airports from OurAirports
    const cityAirports = findAirportsForCity(
      queryRadius(airportsGrid, city.latitude, city.longitude, AIRPORT_RADIUS_KM),
      {
        name: city.name,
        countryIso2: city.countryIso2,
        admin1Code: city.admin1Name,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      AIRPORT_RADIUS_KM,
    );

    for (const airport of cityAirports) {
      if (airportNearest.get(airport.entityId) !== city.cityId) continue;
      entities.push({
        entityId: airport.entityId,
        name: airport.name,
        type: "airport",
        subtype: airport.entitySubtype,
        lat: airport.latitude,
        lon: airport.longitude,
        exactSite: airport.exactSite,
        source: "OurAirports",
        sourceId: airport.sourceId,
      });
      sources.add("OurAirports");
    }

    // Find ports and transport from UN/LOCODE
    const unlocodeEntities = findUnlocodeEntitiesForCity(
      queryRadius(unlocodeGrid, city.latitude, city.longitude, UNLOCODE_RADIUS_KM),
      {
        name: city.name,
        countryIso2: city.countryIso2,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      UNLOCODE_RADIUS_KM,
    );

    for (const entity of unlocodeEntities) {
      if (unlocodeNearest.get(entity.entityId) !== city.cityId) continue;
      entities.push({
        entityId: entity.entityId,
        name: entity.name,
        type: entity.entityType,
        lat: entity.latitude,
        lon: entity.longitude,
        exactSite: entity.exactSite,
        source: "UN/LOCODE",
        sourceId: entity.sourceId,
      });
      sources.add("UN/LOCODE");
    }

    // Find ports from World Port Index
    const wpiPorts = findPortsForCity(
      queryRadius(wpiGrid, city.latitude, city.longitude, WPI_RADIUS_KM),
      {
        name: city.name,
        countryIso2: city.countryIso2,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      WPI_RADIUS_KM,
    );

    for (const port of wpiPorts) {
      if (wpiNearest.get(port.entityId) !== city.cityId) continue;
      // Avoid duplicates if already in UN/LOCODE
      const alreadyExists = entities.some((e) => e.type === "port" && e.name.toLowerCase() === port.name.toLowerCase());
      if (!alreadyExists) {
        entities.push({
          entityId: port.entityId,
          name: port.name,
          type: "port",
          subtype: port.entitySubtype,
          lat: port.latitude,
          lon: port.longitude,
          exactSite: port.exactSite,
          source: "World Port Index",
          sourceId: port.sourceId,
        });
        sources.add("World Port Index");
      }
    }

    // Find power plants from WRI
    const powerPlants = findPowerPlantsForCity(
      queryRadius(wriGrid, city.latitude, city.longitude, WRI_RADIUS_KM),
      {
        name: city.name,
        countryIso2: city.countryIso2,
        countryIso3: city.countryIso3,
        admin1Name: city.admin1Name,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      WRI_RADIUS_KM,
    );

    for (const plant of powerPlants) {
      if (wriNearest.get(plant.entityId) !== city.cityId) continue;
      entities.push({
        entityId: plant.entityId,
        name: plant.name,
        type: "utility",
        subtype: plant.entitySubtype,
        lat: plant.latitude,
        lon: plant.longitude,
        exactSite: plant.exactSite,
        source: "WRI",
        sourceId: plant.sourceId,
      });
      sources.add("WRI");
    }

    // Find research organizations from ROR
    const researchOrgs = findResearchForCity(
      queryRadius(rorGrid, city.latitude, city.longitude, ROR_RADIUS_KM),
      {
        name: city.name,
        countryIso2: city.countryIso2,
        admin1Name: city.admin1Name,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      ROR_RADIUS_KM,
    );

    for (const org of researchOrgs) {
      if (rorNearest.get(org.entityId) !== city.cityId) continue;
      entities.push({
        entityId: org.entityId,
        name: org.name,
        type: "research",
        subtype: org.entitySubtype,
        lat: org.latitude,
        lon: org.longitude,
        exactSite: org.exactSite,
        source: "ROR",
        sourceId: org.sourceId,
      });
      sources.add("ROR");
    }

    // Find mineral sites from USGS MRDS (utility / extraction category)
    const mineralSites = findMineralSitesForCity(
      queryRadius(mrdsGrid, city.latitude, city.longitude, MRDS_RADIUS_KM),
      {
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      MRDS_RADIUS_KM,
    );

    for (const site of mineralSites) {
      if (mrdsNearest.get(site.entityId) !== city.cityId) continue;
      entities.push({
        entityId: site.entityId,
        name: site.name,
        type: "utility",
        subtype: site.entitySubtype,
        lat: site.latitude,
        lon: site.longitude,
        exactSite: site.exactSite,
        source: "USGS MRDS",
        sourceId: site.sourceId,
      });
      sources.add("USGS MRDS");
    }

    // Skip cities with no source-backed entities — no per-city fact/artifact file is written for
    // them (the city still appears in the registry/search and renders its population from the city
    // record). This keeps the output to the ~tens-of-thousands of cities that actually have data.
    if (entities.length === 0) {
      skippedCount++;
      continue;
    }

    const facts: CityFacts = {
      cityId: city.cityId,
      fetchedAt: new Date().toISOString(),
      economic: {
        gdp: null, // Not globally covered yet
        population: city.population ?? null,
      },
      entities,
      sources: Array.from(sources),
    };

    await fs.writeFile(factFile, JSON.stringify(facts, null, 2));
    processedCount++;

    // Log progress every 1000 cities
    if (processedCount % 1000 === 0) {
      logger.log(`  Processed ${processedCount} cities...`);
    }
  }

  logger.log(`Local bulk join completed: ${processedCount} cities processed, ${skippedCount} skipped (already cached).`);
}

if (require.main === module) {
  fetchCitySources().catch(console.error);
}
