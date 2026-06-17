import fs from "node:fs/promises";
import path from "node:path";

const REGISTRY_FILE = path.join(process.cwd(), "src", "data", "generated", "cities", "registry.json");
const FACTS_DIR = path.join(process.cwd(), "data", "raw", "cities", "facts");
const RESOLVED_DIR = path.join(process.cwd(), "data", "raw", "cities", "resolved");

type CityRegistryEntry = {
  cityId: string;
  slug: string;
  name: string;
  countryIso2: string;
  countryIso3: string;
  countrySlug: string;
  admin1Name?: string;
  admin1Code?: string;
  latitude: number;
  longitude: number;
  population?: number | null;
  roleTags?: string[];
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

type SourceMeta = {
  id: string;
  name: string;
  updatedAt: string;
  coverage: string;
  methodology: string;
  url?: string;
};

type ResolvedEntity = {
  entityId: string;
  cityId: string;
  entityName: string;
  entityType: "airport" | "port" | "rail_hub" | "logistics_hub" | "utility" | "research";
  entitySubtype?: string;
  presenceType: string;
  exactSite: boolean;
  geometryMode: "exact" | "city_presence";
  latitude?: number;
  longitude?: number;
  status: "active";
  sources: SourceMeta[];
  lastVerifiedAt: string;
  confidenceState: "verified_exact" | "verified_city_presence";
};

type ResolvedCity = {
  cityId: string;
  economicFactbook: Array<{
    indicatorId: string;
    value: number | null;
    unit: string;
    status: "actual" | "estimate";
    source: SourceMeta;
  }>;
  entities: ResolvedEntity[];
  sources: SourceMeta[];
};

type ResolveEntitiesOptions = {
  registryFile?: string;
  factsDir?: string;
  resolvedDir?: string;
  forceRebuild?: boolean;
  logger?: Pick<Console, "log" | "warn">;
};

function createSourceMeta(sourceName: string): SourceMeta {
  const sourceConfigs: Record<string, Omit<SourceMeta, "id" | "updatedAt">> = {
    OurAirports: {
      name: "OurAirports",
      coverage: "global",
      methodology: "Crowdsourced airport database with official aviation sources",
      url: "https://ourairports.com/data/",
    },
    "UN/LOCODE": {
      name: "UN/LOCODE",
      coverage: "global",
      methodology: "United Nations location codes for trade and transport",
      url: "https://service.unece.org/trade/locode/",
    },
    "World Port Index": {
      name: "World Port Index",
      coverage: "global",
      methodology: "U.S. National Geospatial Intelligence Commission port facilities database",
      url: "https://msi.nga.mil/",
    },
    WRI: {
      name: "WRI Global Power Plant Database",
      coverage: "global",
      methodology: "World Resources Institute global power plant inventory",
      url: "https://datasets.wri.org/dataset/globalpowerplantdatabase",
    },
    ROR: {
      name: "Research Organization Registry",
      coverage: "global",
      methodology: "Open persistent identifier for research organizations",
      url: "https://ror.org/",
    },
    "USGS MRDS": {
      name: "USGS Mineral Resources Data System",
      coverage: "global",
      methodology:
        "U.S. Geological Survey mineral-site inventory with exact coordinates (public domain; systematic updates ceased 2011, US-heavy)",
      url: "https://mrdata.usgs.gov/mrds/",
    },
    GeoNames: {
      name: "GeoNames",
      coverage: "global",
      methodology: "Crowdsourced geographical database",
      url: "https://www.geonames.org/",
    },
  };

  const config = sourceConfigs[sourceName] ?? {
    name: sourceName,
    coverage: "unknown",
    methodology: "Source-backed data",
  };

  return {
    id: sourceName.toLowerCase().replace(/\s+/g, "-"),
    updatedAt: new Date().toISOString().split("T")[0],
    ...config,
  };
}

export async function resolveEntities(options: ResolveEntitiesOptions = {}) {
  const registryFile = options.registryFile ?? REGISTRY_FILE;
  const factsDir = options.factsDir ?? FACTS_DIR;
  const resolvedDir = options.resolvedDir ?? RESOLVED_DIR;
  const forceRebuild = options.forceRebuild ?? false;
  const logger = options.logger ?? console;

  logger.log("Starting entity resolution for cities from local bulk data...");
  if (forceRebuild) {
    await fs.rm(resolvedDir, { recursive: true, force: true });
  }
  await fs.mkdir(resolvedDir, { recursive: true });

  const registry = JSON.parse(await fs.readFile(registryFile, "utf-8")) as CityRegistryEntry[];

  let resolvedCount = 0;
  let skippedCount = 0;

  for (const city of registry) {
    const factFile = path.join(factsDir, `${city.cityId}.json`);
    const resolvedFile = path.join(resolvedDir, `${city.cityId}.json`);

    // Skip if already resolved (resumable)
    const resolvedExists = !forceRebuild && (await fs.access(resolvedFile).then(() => true).catch(() => false));
    if (resolvedExists && !forceRebuild) {
      skippedCount++;
      continue;
    }

    try {
      const facts = JSON.parse(await fs.readFile(factFile, "utf-8")) as CityFacts;

      // Resolve entities with proper source metadata
      const resolvedEntities: ResolvedEntity[] = facts.entities.map((e) => {
        const hasExactCoords = e.lat !== undefined && e.lon !== undefined && e.lat !== 0 && e.lon !== 0;

        let presenceType = "office";
        let entityType = e.type as ResolvedEntity["entityType"];

        switch (e.type) {
          case "airport":
            presenceType = "airport";
            break;
          case "port":
            presenceType = "port";
            break;
          case "rail_hub":
            presenceType = "rail_hub";
            break;
          case "logistics_hub":
            presenceType = "distribution";
            break;
          case "utility":
            presenceType = "power_asset";
            break;
          case "research":
            presenceType = "research";
            break;
        }

        return {
          entityId: e.entityId,
          cityId: city.cityId,
          entityName: e.name,
          entityType,
          entitySubtype: e.subtype,
          presenceType,
          exactSite: e.exactSite && hasExactCoords,
          geometryMode: hasExactCoords ? "exact" : "city_presence",
          latitude: hasExactCoords ? e.lat : undefined,
          longitude: hasExactCoords ? e.lon : undefined,
          status: "active" as const,
          sources: [createSourceMeta(e.source)],
          lastVerifiedAt: new Date().toISOString(),
          confidenceState: hasExactCoords ? "verified_exact" : "verified_city_presence",
        };
      });

      // Build source list
      const sources = Array.from(new Set([...facts.sources, "GeoNames"])).map(createSourceMeta);

      // Build economic factbook with source attribution
      const economicFactbook: ResolvedCity["economicFactbook"] = [];

      if (facts.economic.population !== null && facts.economic.population !== undefined) {
        economicFactbook.push({
          indicatorId: "population",
          value: facts.economic.population,
          unit: "persons",
          status: "actual" as const,
          source: createSourceMeta("GeoNames"),
        });
      }

      const resolved: ResolvedCity = {
        cityId: city.cityId,
        economicFactbook,
        entities: resolvedEntities,
        sources,
      };

      await fs.writeFile(resolvedFile, JSON.stringify(resolved, null, 2));
      resolvedCount++;
    } catch (err) {
      logger.warn(`Could not resolve data for ${city.cityId}: ${err}`);
    }

    // Log progress every 1000 cities
    if (resolvedCount % 1000 === 0 && resolvedCount > 0) {
      logger.log(`  Resolved ${resolvedCount} cities...`);
    }
  }

  logger.log(`Entity resolution completed: ${resolvedCount} cities resolved, ${skippedCount} skipped (already cached).`);
}

if (require.main === module) {
  resolveEntities().catch(console.error);
}
