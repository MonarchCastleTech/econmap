import { once } from "node:events";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

type CoverageState =
  | "verified_exact"
  | "verified_city_presence"
  | "partial_coverage"
  | "not_covered_yet"
  | "not_applicable";

type CoverageShellCategoryState = "mapped" | "documented" | "missing";

type GenerateArtifactsOptions = {
  outDir?: string;
  registryFile?: string;
  resolvedDir?: string;
  logger?: Pick<Console, "log" | "warn">;
  now?: string;
  maxCombinedEntityFeatures?: number;
  maxLayerStringifyFeatures?: number;
  skipPerCityOutputs?: boolean;
};

const DEFAULT_OUT_DIR = path.join(process.cwd(), "src", "data", "generated", "cities");
const DEFAULT_REGISTRY_FILE = path.join(DEFAULT_OUT_DIR, "registry.json");
const DEFAULT_RESOLVED_DIR = path.join(process.cwd(), "data", "raw", "cities", "resolved");
const DEFAULT_MAX_COMBINED_ENTITY_FEATURES = 250_000;
const DEFAULT_MAX_LAYER_STRINGIFY_FEATURES = 25_000;
const COMBINED_ENTITIES_SKIPPED_WARNING =
  "Skipped combined entities GeoJSON because feature count exceeded the configured threshold.";
const FEATURED_CITY_TARGETS = [
  { name: "Istanbul", countryIso3: "TUR" },
  { name: "Ankara", countryIso3: "TUR" },
  { name: "Rome", countryIso3: "ITA" },
  { name: "Paris", countryIso3: "FRA" },
  { name: "London", countryIso3: "GBR" },
  { name: "Berlin", countryIso3: "DEU" },
  { name: "Madrid", countryIso3: "ESP" },
  { name: "Washington", countryIso3: "USA" },
] as const;

type CityRegistryEntry = {
  cityId: string;
  slug: string;
  name: string;
  aliases?: string[];
  countryIso2: string;
  countryIso3: string;
  countrySlug: string;
  admin1Name?: string;
  admin1Code?: string;
  admin2Name?: string;
  latitude: number;
  longitude: number;
  boundaryStatus: "has_boundary" | "point_only";
  population?: number | null;
  populationSource?: string;
  registrySource: string;
  recordStatus: "active" | "deprecated" | "merged";
  roleTags?: string[];
  isMajorCity: boolean;
};

type SourceMeta = {
  id: string;
  name: string;
  updatedAt: string;
  coverage: string;
  methodology: string;
  url?: string;
  sourceDate?: string;
  localIngestedAt?: string;
  coverageState?: CoverageState;
};

type ResolvedEntity = {
  entityId: string;
  cityId: string;
  entityName: string;
  entityType: string;
  entitySubtype?: string;
  presenceType: string;
  exactSite: boolean;
  geometryMode: "exact" | "city_presence";
  latitude?: number;
  longitude?: number;
  status: string;
  sources: SourceMeta[];
  lastVerifiedAt: string;
  confidenceState: CoverageState;
};

type ResolvedMetric = {
  indicatorId: string;
  value: number | null;
  unit: string;
  status: string;
  source: SourceMeta;
};

type ResolvedCity = {
  cityId: string;
  economicFactbook: ResolvedMetric[];
  entities: ResolvedEntity[];
  sources: SourceMeta[];
};

type CityWorkspace = {
  city: CityRegistryEntry;
  summary: string;
  roleTags: string[];
  coverage: {
    economicFactbook: CoverageState;
    investorIntel: CoverageState;
    urbanIntel: CoverageState;
  };
  economicFactbook: ResolvedMetric[];
  investorIntel: ResolvedMetric[];
  urbanIntel: ResolvedMetric[];
  entityCounts: Record<string, number>;
  entityHighlights: ResolvedEntity[];
  mapLayerSummary: {
    availableLayers: string[];
  };
  sources: SourceMeta[];
};

type CityCoverageShellCategory = {
  id: string;
  label: string;
  state: CoverageShellCategoryState;
  count: number;
  detail: string;
  sourceLabels: string[];
};

type CityCoverageShell = {
  generatedAt: string;
  cityId: string;
  boundaryStatus: CityRegistryEntry["boundaryStatus"];
  sourceCount: number;
  mappedCategoryCount: number;
  documentedCategoryCount: number;
  missingCategoryCount: number;
  categories: CityCoverageShellCategory[];
};

type DerivedEntityMetricConfig = {
  indicatorId: string;
  entityTypes: string[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSources(sources: SourceMeta[]) {
  const seen = new Set<string>();
  const merged: SourceMeta[] = [];

  for (const source of sources) {
    const key = source.id || source.name;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(source);
  }

  return merged;
}

function getSourceSummaryLabel(source: SourceMeta) {
  if (source.id === "ror" || source.name === "Research Organization Registry") {
    return "ROR";
  }

  return source.name;
}

function getLatestSourceUpdatedAt(sources: SourceMeta[], fallbackDate: string) {
  return sources
    .map((source) => source.updatedAt)
    .filter((updatedAt): updatedAt is string => Boolean(updatedAt))
    .sort((left, right) => right.localeCompare(left))[0] ?? fallbackDate;
}

function buildSearchIndex(registry: CityRegistryEntry[]) {
  return registry.map((city) => ({
    cityId: city.cityId,
    slug: city.slug,
    name: city.name,
    aliases: city.aliases ?? [],
    countryIso3: city.countryIso3,
    admin1Name: city.admin1Name,
    population: city.population ?? null,
    isMajorCity: city.isMajorCity,
  }));
}

function buildFeaturedCities(registry: CityRegistryEntry[], limit = 8) {
  const selectedCities: CityRegistryEntry[] = [];
  const selectedCityIds = new Set<string>();

  for (const target of FEATURED_CITY_TARGETS) {
    const matchingCity = registry
      .filter((city) => city.name === target.name && city.countryIso3 === target.countryIso3)
      .sort((left, right) => (right.population ?? 0) - (left.population ?? 0))[0];

    if (!matchingCity || selectedCityIds.has(matchingCity.cityId)) {
      continue;
    }

    selectedCities.push(matchingCity);
    selectedCityIds.add(matchingCity.cityId);
  }

  if (selectedCities.length < limit) {
    const fallbackCities = registry
      .filter((city) => city.isMajorCity && !selectedCityIds.has(city.cityId))
      .sort((left, right) => (right.population ?? 0) - (left.population ?? 0))
      .slice(0, limit - selectedCities.length);

    for (const city of fallbackCities) {
      selectedCities.push(city);
      selectedCityIds.add(city.cityId);
    }
  }

  return selectedCities.slice(0, limit);
}

function countEntitiesByType(entities: ResolvedEntity[]) {
  const counts: Record<string, number> = {};

  for (const entity of entities) {
    counts[entity.entityType] = (counts[entity.entityType] ?? 0) + 1;
  }

  return counts;
}

function getLayerFileName(entityType: string) {
  switch (entityType) {
    case "airport":
      return "airports";
    case "port":
      return "ports";
    case "rail_hub":
      return "rail-hubs";
    case "logistics_hub":
      return "logistics-hubs";
    case "utility":
      return "utilities";
    case "research":
      return "research";
    default:
      return `${entityType}s`;
  }
}

function buildCoverageState(match: boolean, exact = true): CoverageState {
  if (!match) {
    return "not_covered_yet";
  }

  return exact ? "verified_exact" : "verified_city_presence";
}

const ENTITY_TYPE_PRIORITY: Record<string, number> = {
  utility: 0,
  port: 1,
  rail_hub: 2,
  logistics_hub: 3,
  research: 4,
  industrial_park: 5,
  factory: 6,
  company: 7,
  airport: 8,
};

const AIRPORT_SUBTYPE_PRIORITY: Record<string, number> = {
  large_airport: 0,
  medium_airport: 1,
  seaplane_base: 2,
  small_airport: 3,
  heliport: 4,
};

function sortEntitiesForCityIntel(entities: ResolvedEntity[]) {
  return [...entities].sort((left, right) => {
    const typePriority =
      (ENTITY_TYPE_PRIORITY[left.entityType] ?? Number.MAX_SAFE_INTEGER) -
      (ENTITY_TYPE_PRIORITY[right.entityType] ?? Number.MAX_SAFE_INTEGER);

    if (typePriority !== 0) {
      return typePriority;
    }

    if (left.entityType === "airport" && right.entityType === "airport") {
      const subtypePriority =
        (AIRPORT_SUBTYPE_PRIORITY[left.entitySubtype ?? ""] ?? Number.MAX_SAFE_INTEGER) -
        (AIRPORT_SUBTYPE_PRIORITY[right.entitySubtype ?? ""] ?? Number.MAX_SAFE_INTEGER);

      if (subtypePriority !== 0) {
        return subtypePriority;
      }
    }

    if (left.exactSite !== right.exactSite) {
      return left.exactSite ? -1 : 1;
    }

    return left.entityName.localeCompare(right.entityName);
  });
}

function hasInvestorIntel(entities: ResolvedEntity[]) {
  return entities.some((entity) =>
    ["airport", "port", "rail_hub", "logistics_hub", "utility"].includes(entity.entityType),
  );
}

function hasUrbanIntel(entities: ResolvedEntity[]) {
  return entities.some((entity) => ["research", "utility"].includes(entity.entityType));
}

const DERIVED_ENTITY_METRIC_CONFIGS: DerivedEntityMetricConfig[] = [
  { indicatorId: "airports", entityTypes: ["airport"] },
  { indicatorId: "ports", entityTypes: ["port"] },
  { indicatorId: "rail-hubs", entityTypes: ["rail_hub"] },
  { indicatorId: "logistics-hubs", entityTypes: ["logistics_hub"] },
  { indicatorId: "utilities", entityTypes: ["utility"] },
  { indicatorId: "organizations", entityTypes: ["research"] },
];

function buildDerivedMetricSource(
  indicatorId: string,
  entities: ResolvedEntity[],
  generatedAt: string,
): SourceMeta {
  const sources = uniqueSources(entities.flatMap((entity) => entity.sources));

  if (sources.length === 1) {
    return sources[0];
  }

  const sourceNames = sources.map((source) => source.name);

  return {
    id: slugify(`${indicatorId}-${sourceNames.join("-")}`),
    name: sourceNames.join(" / "),
    updatedAt: getLatestSourceUpdatedAt(sources, generatedAt),
    coverage: "city_presence",
    methodology: `Derived ${indicatorId} site count from published city entity evidence.`,
    coverageState: "verified_city_presence",
  };
}

function buildDerivedEntityMetrics(entities: ResolvedEntity[], generatedAt: string) {
  const metrics: ResolvedMetric[] = [];

  for (const config of DERIVED_ENTITY_METRIC_CONFIGS) {
    const matchingEntities = entities.filter((entity) => config.entityTypes.includes(entity.entityType));

    if (matchingEntities.length === 0) {
      continue;
    }

    metrics.push({
      indicatorId: config.indicatorId,
      value: matchingEntities.length,
      unit: "sites",
      status: "actual",
      source: buildDerivedMetricSource(config.indicatorId, matchingEntities, generatedAt),
    });
  }

  return metrics;
}

function buildWorkspace(
  city: CityRegistryEntry,
  resolved: ResolvedCity | null,
  citySources: SourceMeta[],
  generatedAt: string,
): CityWorkspace {
  const entities = sortEntitiesForCityIntel(resolved?.entities ?? []);
  const economicFactbook = resolved?.economicFactbook ?? [];
  const derivedEntityMetrics = buildDerivedEntityMetrics(entities, generatedAt);
  const entityCounts = countEntitiesByType(entities);
  const availableLayers = Array.from(new Set(entities.map((entity) => entity.entityType))).sort();

  return {
    city,
    summary:
      citySources.length > 0
        ? `${city.name} source-backed command workspace`
        : `${city.name} canonical registry workspace with no published enrichments yet`,
    roleTags: city.roleTags ?? [],
    coverage: {
      economicFactbook: buildCoverageState(economicFactbook.length > 0),
      investorIntel: buildCoverageState(hasInvestorIntel(entities), false),
      urbanIntel: buildCoverageState(hasUrbanIntel(entities), false),
    },
    economicFactbook,
    investorIntel: derivedEntityMetrics,
    urbanIntel: [],
    entityCounts,
    entityHighlights: entities.slice(0, 50),
    mapLayerSummary: {
      availableLayers,
    },
    sources: citySources,
  };
}

function buildCoverageShellCategory({
  id,
  label,
  state,
  count,
  detail,
  sourceLabels,
}: CityCoverageShellCategory): CityCoverageShellCategory {
  return {
    id,
    label,
    state,
    count,
    detail,
    sourceLabels,
  };
}

function countInfrastructureEntities(workspace: CityWorkspace) {
  return (workspace.entityCounts.airport ?? 0)
    + (workspace.entityCounts.port ?? 0)
    + (workspace.entityCounts.rail_hub ?? 0)
    + (workspace.entityCounts.logistics_hub ?? 0)
    + (workspace.entityCounts.utility ?? 0);
}

function countUrbanEntities(workspace: CityWorkspace) {
  return (workspace.entityCounts.research ?? 0)
    + (workspace.entityCounts.company ?? 0)
    + (workspace.entityCounts.factory ?? 0)
    + (workspace.entityCounts.industrial_park ?? 0);
}

function buildCoverageShell(
  city: CityRegistryEntry,
  workspace: CityWorkspace,
  citySources: SourceMeta[],
  generatedAt: string,
): CityCoverageShell {
  const sourceLabels = citySources.map((source) => source.name);
  const economicCount = workspace.economicFactbook.length;
  const infrastructureCount = countInfrastructureEntities(workspace);
  const urbanCount = countUrbanEntities(workspace);
  const categories: CityCoverageShellCategory[] = [
    buildCoverageShellCategory({
      id: "registry",
      label: "Canonical Registry",
      state: "documented",
      count: 1,
      detail: `${city.registrySource} registry record anchors the dossier shell.`,
      sourceLabels: [city.registrySource],
    }),
    buildCoverageShellCategory({
      id: "geometry",
      label: "Geometry Surface",
      state: city.boundaryStatus === "has_boundary" ? "mapped" : "documented",
      count: city.boundaryStatus === "has_boundary" ? 1 : 0,
      detail:
        city.boundaryStatus === "has_boundary"
          ? "Boundary-backed city surface is available."
          : "Point-only city shell is available; boundary geometry is still missing.",
      sourceLabels: [city.registrySource],
    }),
    buildCoverageShellCategory({
      id: "economic-factbook",
      label: "Economic Factbook",
      state: economicCount > 0 ? "documented" : "missing",
      count: economicCount,
      detail:
        economicCount > 0
          ? "Observed or attributed economic metrics are published for this city."
          : "No economic metrics are published for this city yet.",
      sourceLabels: economicCount > 0 ? sourceLabels : [],
    }),
    buildCoverageShellCategory({
      id: "infrastructure-intel",
      label: "Infrastructure Intelligence",
      state: infrastructureCount > 0 ? "mapped" : "missing",
      count: infrastructureCount,
      detail:
        infrastructureCount > 0
          ? "Infrastructure entities are mapped or directly evidenced for this city."
          : "No infrastructure entities are mapped for this city yet.",
      sourceLabels: infrastructureCount > 0 ? sourceLabels : [],
    }),
    buildCoverageShellCategory({
      id: "urban-intel",
      label: "Urban / Institutional Intelligence",
      state: urbanCount > 0 ? "documented" : "missing",
      count: urbanCount,
      detail:
        urbanCount > 0
          ? "Urban and institutional entities are documented for this city."
          : "No urban or institutional entities are documented for this city yet.",
      sourceLabels: urbanCount > 0 ? sourceLabels : [],
    }),
    buildCoverageShellCategory({
      id: "source-lineage",
      label: "Source Lineage",
      state: citySources.length > 0 ? "documented" : "missing",
      count: citySources.length,
      detail:
        citySources.length > 0
          ? "Traceable source labels are attached to the dossier shell."
          : "No source labels are attached to the dossier shell yet.",
      sourceLabels,
    }),
  ];

  const mappedCategoryCount = categories.filter((category) => category.state === "mapped").length;
  const documentedCategoryCount = categories.filter((category) => category.state === "documented").length;
  const missingCategoryCount = categories.filter((category) => category.state === "missing").length;

  return {
    generatedAt,
    cityId: city.cityId,
    boundaryStatus: city.boundaryStatus,
    sourceCount: citySources.length,
    mappedCategoryCount,
    documentedCategoryCount,
    missingCategoryCount,
    categories,
  };
}

function getLayerStreamingWarning(layerName: string) {
  return `Streamed layer GeoJSON for ${layerName} because feature count exceeded the configured threshold.`;
}

async function writeChunk(
  stream: ReturnType<typeof createWriteStream>,
  chunk: string,
) {
  if (!stream.write(chunk)) {
    await once(stream, "drain");
  }
}

async function writeFeatureCollectionFile(
  filePath: string,
  features: Array<Record<string, unknown>>,
  useStreaming: boolean,
) {
  if (!useStreaming) {
    await fs.writeFile(
      filePath,
      JSON.stringify(
        {
          type: "FeatureCollection",
          features,
        },
        null,
        2,
      ),
    );
    return;
  }

  const stream = createWriteStream(filePath, { encoding: "utf8" });
  const finished = new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  try {
    await writeChunk(stream, '{"type":"FeatureCollection","features":[');

    for (const [index, feature] of features.entries()) {
      await writeChunk(stream, `${index === 0 ? "\n" : ",\n"}${JSON.stringify(feature)}`);
    }

    stream.end(features.length > 0 ? "\n]}\n" : "]}\n");
    await finished;
  } catch (error) {
    stream.destroy(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function generateArtifacts(options: GenerateArtifactsOptions = {}) {
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;
  const registryFile = options.registryFile ?? DEFAULT_REGISTRY_FILE;
  const resolvedDir = options.resolvedDir ?? DEFAULT_RESOLVED_DIR;
  const logger = options.logger ?? console;
  const generatedAt = options.now ?? new Date().toISOString();
  const maxCombinedEntityFeatures =
    options.maxCombinedEntityFeatures ?? DEFAULT_MAX_COMBINED_ENTITY_FEATURES;
  const maxLayerStringifyFeatures =
    options.maxLayerStringifyFeatures ?? DEFAULT_MAX_LAYER_STRINGIFY_FEATURES;
  const skipPerCityOutputs = options.skipPerCityOutputs ?? false;

  const outWorkspaces = path.join(outDir, "workspaces");
  const outEntities = path.join(outDir, "entities");
  const outSources = path.join(outDir, "sources");
  const outCoverage = path.join(outDir, "coverage");
  const outMap = path.join(outDir, "map");
  const outMapEntities = path.join(outMap, "entities");
  const outCommandCenterDir = path.resolve(outDir, "..", "command-center");
  const combinedEntitiesPath = path.join(outMap, "entities.geojson");

  logger.log("Generating app-readable city artifacts...");
  await fs.mkdir(outWorkspaces, { recursive: true });
  await fs.mkdir(outEntities, { recursive: true });
  await fs.mkdir(outSources, { recursive: true });
  await fs.mkdir(outCoverage, { recursive: true });
  await fs.mkdir(outMapEntities, { recursive: true });
  await fs.mkdir(outCommandCenterDir, { recursive: true });

  const registry = JSON.parse(await fs.readFile(registryFile, "utf-8")) as CityRegistryEntry[];

  const cityGeoJson = {
    type: "FeatureCollection",
    features: [] as Array<Record<string, unknown>>,
  };

  let processedCount = 0;
  let exactSiteCount = 0;
  let cityPresenceCount = 0;
  const entityCountsByType: Record<string, number> = {};
  const exactSiteCountsByType: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const coverageShellBoundaryCounts: Record<string, number> = {
    has_boundary: 0,
    point_only: 0,
  };
  const coverageShellObservedCounts: Record<string, number> = {
    economicFactbook: 0,
    investorIntel: 0,
    urbanIntel: 0,
    sourceLineage: 0,
  };
  const layerEntities: Record<string, Array<Record<string, unknown>>> = {};
  const searchIndex = buildSearchIndex(registry);
  const featuredCities = buildFeaturedCities(registry);
  const buildWarnings: string[] = [];
  let combinedEntityFeatures: Array<Record<string, unknown>> | null = [];
  const publishedExactSiteKeys = new Set<string>();
  let coverageShellCount = 0;

  for (const city of registry) {
    const resolvedFile = path.join(resolvedDir, `${city.cityId}.json`);
    let resolved: ResolvedCity | null = null;

    try {
      resolved = JSON.parse(await fs.readFile(resolvedFile, "utf-8")) as ResolvedCity;
      processedCount++;
    } catch {
      resolved = null;
    }

    cityGeoJson.features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [city.longitude, city.latitude] },
      properties: {
        cityId: city.cityId,
        slug: city.slug,
        name: city.name,
        countryIso3: city.countryIso3,
        population: city.population ?? null,
        roleTags: city.roleTags ?? [],
        sourceLabels: [city.registrySource],
      },
    });

    const metricSources = (resolved?.economicFactbook ?? []).map((metric) => metric.source);
    const entitySources = (resolved?.entities ?? []).flatMap((entity) => entity.sources);
    const citySources = uniqueSources([
      {
        id: slugify(city.registrySource),
        name: city.registrySource,
        updatedAt: generatedAt,
        coverage: "global",
        methodology: "Canonical city registry record",
        coverageState: "verified_exact",
      },
      ...(resolved?.sources ?? []),
      ...metricSources,
      ...entitySources,
    ]);

    for (const source of citySources) {
      const sourceLabel = getSourceSummaryLabel(source);
      sourceCounts[sourceLabel] = (sourceCounts[sourceLabel] ?? 0) + 1;
    }

    const workspace = buildWorkspace(city, resolved, citySources, generatedAt);
    const coverageShell = buildCoverageShell(city, workspace, citySources, generatedAt);
    coverageShellCount++;
    coverageShellBoundaryCounts[city.boundaryStatus] = (coverageShellBoundaryCounts[city.boundaryStatus] ?? 0) + 1;
    if (workspace.economicFactbook.length > 0) {
      coverageShellObservedCounts.economicFactbook += 1;
    }
    if (countInfrastructureEntities(workspace) > 0) {
      coverageShellObservedCounts.investorIntel += 1;
    }
    if (countUrbanEntities(workspace) > 0) {
      coverageShellObservedCounts.urbanIntel += 1;
    }
    if (citySources.length > 0) {
      coverageShellObservedCounts.sourceLineage += 1;
    }

    // Only write per-city dossier files for cities that actually have resolved source data; cities
    // with none stay registry/search-only (their page degrades to the city summary), which keeps
    // the published artifact tree to ~tens of thousands of files instead of all 189K.
    if (!skipPerCityOutputs && resolved) {
      const prioritizedEntities = sortEntitiesForCityIntel(resolved?.entities ?? []);
      await fs.writeFile(
        path.join(outWorkspaces, `${city.cityId}.json`),
        JSON.stringify(workspace, null, 2),
      );
      await fs.writeFile(
        path.join(outEntities, `${city.cityId}.json`),
        JSON.stringify(
          {
            cityId: city.cityId,
            entities: prioritizedEntities,
            sources: citySources,
          },
          null,
          2,
        ),
      );
      await fs.writeFile(
        path.join(outSources, `${city.cityId}.json`),
        JSON.stringify(
          {
            cityId: city.cityId,
            sources: citySources,
          },
          null,
          2,
        ),
      );
      await fs.writeFile(
        path.join(outCoverage, `${city.cityId}.json`),
        JSON.stringify(coverageShell, null, 2),
      );
    }

    for (const entity of resolved?.entities ?? []) {
      entityCountsByType[entity.entityType] = (entityCountsByType[entity.entityType] ?? 0) + 1;

      if (entity.geometryMode === "exact" && entity.latitude !== undefined && entity.longitude !== undefined) {
        const exactSiteKey = `${entity.entityType}:${entity.entityId}`;
        if (publishedExactSiteKeys.has(exactSiteKey)) {
          continue;
        }

        publishedExactSiteKeys.add(exactSiteKey);
        exactSiteCount++;
        exactSiteCountsByType[entity.entityType] = (exactSiteCountsByType[entity.entityType] ?? 0) + 1;
        const feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [entity.longitude, entity.latitude],
          },
          properties: {
            entityId: entity.entityId,
            cityId: city.cityId,
            label: entity.entityName,
            entityType: entity.entityType,
            entitySubtype: entity.entitySubtype,
            geometryMode: entity.geometryMode,
            confidenceState: entity.confidenceState,
            exactSite: entity.exactSite,
            countryIso3: city.countryIso3,
            sourceLabels: entity.sources.map((source) => source.name),
            importanceReason: entity.presenceType,
          },
        };

        if (combinedEntityFeatures !== null) {
          if (combinedEntityFeatures.length >= maxCombinedEntityFeatures) {
            combinedEntityFeatures = null;

            if (!buildWarnings.includes(COMBINED_ENTITIES_SKIPPED_WARNING)) {
              buildWarnings.push(COMBINED_ENTITIES_SKIPPED_WARNING);
              logger.warn(COMBINED_ENTITIES_SKIPPED_WARNING);
            }
          } else {
            combinedEntityFeatures.push(feature);
          }
        }

        const layerName = getLayerFileName(entity.entityType);
        layerEntities[layerName] ??= [];
        layerEntities[layerName].push(feature);
      } else {
        cityPresenceCount++;
      }
    }
  }

  await fs.writeFile(path.join(outDir, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  await fs.writeFile(
    path.join(outCommandCenterDir, "featured-cities.json"),
    JSON.stringify(featuredCities, null, 2),
  );
  await fs.writeFile(path.join(outMap, "cities.geojson"), JSON.stringify(cityGeoJson, null, 2));

  for (const [layerName, features] of Object.entries(layerEntities)) {
    const useStreaming = features.length > maxLayerStringifyFeatures;

    if (useStreaming) {
      const warning = getLayerStreamingWarning(layerName);

      if (!buildWarnings.includes(warning)) {
        buildWarnings.push(warning);
        logger.warn(warning);
      }
    }

    await writeFeatureCollectionFile(
      path.join(outMapEntities, `${layerName}.geojson`),
      features,
      useStreaming,
    );
    features.length = 0;
  }

  await fs.rm(combinedEntitiesPath, { force: true });

  if (combinedEntityFeatures !== null) {
    await fs.writeFile(
      combinedEntitiesPath,
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: combinedEntityFeatures,
        },
        null,
        2,
      ),
    );
  }

  const countryCounts = registry.reduce<Record<string, number>>((counts, city) => {
    counts[city.countryIso3] = (counts[city.countryIso3] ?? 0) + 1;
    return counts;
  }, {});

  const manifest = {
    schemaVersion: "2.0.0",
    generatedAt,
    totalCityCount: registry.length,
    processedCityCount: processedCount,
    countryCounts,
    entityCountsByType,
    exactSiteCountsByType,
    exactSiteCount,
    cityPresenceCount,
    unresolvedCoverageCount: registry.length - processedCount,
    sourceCounts,
    coverageShellCount,
    coverageShellBoundaryCounts,
    coverageShellObservedCounts,
    buildWarnings,
  };

  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  logger.log("=== Artifact Generation Summary ===");
  logger.log(`Total cities: ${registry.length}`);
  logger.log(`Processed cities: ${processedCount}`);
  logger.log(`Exact-site entities: ${exactSiteCount}`);
  logger.log(`City-presence entities: ${cityPresenceCount}`);
  logger.log(`Generated artifacts under ${outDir}`);

  return {
    manifest,
    searchIndex,
  };
}

if (require.main === module) {
  generateArtifacts().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
