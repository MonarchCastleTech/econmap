import fs from "node:fs/promises";
import path from "node:path";

import type { CityRegistryEntry, CityWorkspace } from "@/domain/types";

type WorldBankCoreObservation = {
  entityId: string;
  indicatorId: string;
  year: number;
  value: number | null;
  sourceId: string;
};

type WorldBankCoreData = {
  generatedAt: string;
  observations: WorldBankCoreObservation[];
};

export type CityIntelEnrichmentEntry = {
  generatedAt: string;
  economicFactbook: CityWorkspace["economicFactbook"];
  investorIntel: CityWorkspace["investorIntel"];
  urbanIntel: CityWorkspace["urbanIntel"];
  sources: CityWorkspace["sources"];
};

type CountryEconomySnapshot = {
  gdpCurrentUsd?: WorldBankCoreObservation;
  population?: WorldBankCoreObservation;
};

type CityIntelEnrichmentIndex = {
  generatedAt: string;
  cities: Record<string, CityIntelEnrichmentEntry>;
};

type CityMetric = CityWorkspace["economicFactbook"][number];

const CITY_INTEL_ENRICHMENT_FILES = [
  path.join(process.cwd(), "src", "data", "generated", "command-center", "city-intel-enrichment.json"),
  path.join(
    process.cwd(),
    "src",
    "data",
    "generated",
    "command-center",
    "city-connectivity-enrichment.json",
  ),
  path.join(
    process.cwd(),
    "src",
    "data",
    "generated",
    "command-center",
    "city-environment-enrichment.json",
  ),
  path.join(
    process.cwd(),
    "src",
    "data",
    "generated",
    "command-center",
    "city-economic-coverage-enrichment.json",
  ),
  path.join(
    process.cwd(),
    "src",
    "data",
    "generated",
    "command-center",
    "city-mobility-enrichment.json",
  ),
];

const WORLD_BANK_CORE_FILE = path.join(process.cwd(), "src", "data", "generated", "world-bank-core.json");

let cachedCityIntelEnrichmentIndex: CityIntelEnrichmentIndex | null = null;
let cachedWorldBankCountryEconomyIndex: Map<string, CountryEconomySnapshot> | null = null;

function shouldUseCachedArtifacts() {
  return process.env.NODE_ENV === "production";
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function metricKey(metric: CityMetric) {
  return `${metric.indicatorId}:${metric.year ?? "na"}:${metric.source.id}`;
}

function uniqueMetrics(metrics: CityMetric[]) {
  const seen = new Set<string>();
  const merged: CityMetric[] = [];

  for (const metric of metrics) {
    const key = metricKey(metric);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(metric);
  }

  return merged;
}

function isEconomicCoverageMetric(metric: CityMetric) {
  return [
    /employment/i,
    /gdp/i,
    /gross-domestic/i,
    /income/i,
    /labou?r/i,
    /productivity/i,
    /unemployment/i,
    /wage/i,
  ].some((pattern) => pattern.test(metric.indicatorId));
}

function partitionInvestorMetrics(metrics: CityMetric[]) {
  const economicMetrics: CityMetric[] = [];
  const investorMetrics: CityMetric[] = [];

  for (const metric of metrics) {
    if (isEconomicCoverageMetric(metric)) {
      economicMetrics.push(metric);
      continue;
    }

    investorMetrics.push(metric);
  }

  return {
    economicMetrics,
    investorMetrics,
  };
}

function uniqueSources(sources: CityWorkspace["sources"]) {
  const seen = new Set<string>();
  const merged: CityWorkspace["sources"] = [];

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

function mergeCityIntelEnrichmentEntry(
  currentEntry: CityIntelEnrichmentEntry | undefined,
  nextEntry: CityIntelEnrichmentEntry,
): CityIntelEnrichmentEntry {
  if (!currentEntry) {
    return nextEntry;
  }

  return {
    generatedAt: currentEntry.generatedAt > nextEntry.generatedAt ? currentEntry.generatedAt : nextEntry.generatedAt,
    economicFactbook: uniqueMetrics([...currentEntry.economicFactbook, ...nextEntry.economicFactbook]),
    investorIntel: uniqueMetrics([...currentEntry.investorIntel, ...nextEntry.investorIntel]),
    urbanIntel: uniqueMetrics([...currentEntry.urbanIntel, ...nextEntry.urbanIntel]),
    sources: uniqueSources([...currentEntry.sources, ...nextEntry.sources]),
  };
}

function mergeCityIntelEnrichmentIndexes(indexes: CityIntelEnrichmentIndex[]) {
  const generatedAt = indexes.reduce(
    (latest, index) => (index.generatedAt > latest ? index.generatedAt : latest),
    new Date(0).toISOString(),
  );
  const cities: Record<string, CityIntelEnrichmentEntry> = {};

  for (const index of indexes) {
    for (const [cityId, entry] of Object.entries(index.cities)) {
      cities[cityId] = mergeCityIntelEnrichmentEntry(cities[cityId], entry);
    }
  }

  return {
    generatedAt,
    cities,
  };
}

async function readCityIntelEnrichmentIndex(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as CityIntelEnrichmentIndex;
  } catch {
    return {
      generatedAt: new Date(0).toISOString(),
      cities: {},
    } satisfies CityIntelEnrichmentIndex;
  }
}

function getCountryEntityId(city: CityRegistryEntry) {
  if (!city.countryIso2) {
    return null;
  }

  const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(city.countryIso2.toUpperCase());
  if (!countryName) {
    return null;
  }

  return slugify(countryName);
}

function buildCountryGdpEstimateMetric(
  city: CityRegistryEntry,
  snapshot: CountryEconomySnapshot | undefined,
): CityWorkspace["economicFactbook"][number] | null {
  if (!city.population || !snapshot?.gdpCurrentUsd?.value || !snapshot.population?.value) {
    return null;
  }

  const perCapitaUsd = snapshot.gdpCurrentUsd.value / snapshot.population.value;
  const estimate = city.population * perCapitaUsd;

  if (!Number.isFinite(estimate) || estimate <= 0) {
    return null;
  }

  return {
    indicatorId: "gdp-country-per-capita-proxy",
    value: Math.round(estimate),
    unit: "USD",
    year: Math.min(snapshot.gdpCurrentUsd.year, snapshot.population.year),
    status: "estimate",
    source: {
      id: "world-bank-geonames-city-gdp-proxy",
      name: "World Bank / GeoNames City GDP Proxy",
      updatedAt: new Date().toISOString().slice(0, 10),
      coverage: "country_to_city_proxy",
      methodology:
        "Derived by multiplying the latest World Bank country GDP per capita by the GeoNames city population.",
      note: "Estimate, not an observed municipal GDP series.",
    },
  };
}

export function buildWorldBankCountryEconomyIndex(data: WorldBankCoreData) {
  const index = new Map<string, CountryEconomySnapshot>();

  for (const observation of data.observations) {
    if (observation.value === null) {
      continue;
    }

    if (!["gdp-current-usd", "population"].includes(observation.indicatorId)) {
      continue;
    }

    const current = index.get(observation.entityId) ?? {};
    const existing = current[observation.indicatorId === "gdp-current-usd" ? "gdpCurrentUsd" : "population"];

    if (!existing || observation.year > existing.year) {
      if (observation.indicatorId === "gdp-current-usd") {
        current.gdpCurrentUsd = observation;
      } else {
        current.population = observation;
      }

      index.set(observation.entityId, current);
    }
  }

  return index;
}

export async function loadCityIntelEnrichmentIndex() {
  if (shouldUseCachedArtifacts() && cachedCityIntelEnrichmentIndex) {
    return cachedCityIntelEnrichmentIndex;
  }

  const mergedIndex = mergeCityIntelEnrichmentIndexes(
    await Promise.all(CITY_INTEL_ENRICHMENT_FILES.map((filePath) => readCityIntelEnrichmentIndex(filePath))),
  );

  if (shouldUseCachedArtifacts()) {
    cachedCityIntelEnrichmentIndex = mergedIndex;
  }

  return mergedIndex;
}

export async function loadWorldBankCountryEconomyIndex() {
  if (shouldUseCachedArtifacts() && cachedWorldBankCountryEconomyIndex) {
    return cachedWorldBankCountryEconomyIndex;
  }

  try {
    const content = await fs.readFile(WORLD_BANK_CORE_FILE, "utf-8");
    const parsed = JSON.parse(content) as WorldBankCoreData;
    const index = buildWorldBankCountryEconomyIndex(parsed);

    if (shouldUseCachedArtifacts()) {
      cachedWorldBankCountryEconomyIndex = index;
    }

    return index;
  } catch {
    const emptyIndex = new Map<string, CountryEconomySnapshot>();

    if (shouldUseCachedArtifacts()) {
      cachedWorldBankCountryEconomyIndex = emptyIndex;
    }

    return emptyIndex;
  }
}

export function applyCityIntelEnrichment({
  city,
  workspace,
  enrichmentEntry,
  worldBankCountryEconomyIndex,
}: {
  city: CityRegistryEntry;
  workspace: CityWorkspace;
  enrichmentEntry: CityIntelEnrichmentEntry | null;
  worldBankCountryEconomyIndex: Map<string, CountryEconomySnapshot>;
}) {
  const existingMetrics = workspace.economicFactbook ?? [];
  const workspaceInvestorMetrics = partitionInvestorMetrics(workspace.investorIntel ?? []);
  const enrichmentInvestorMetrics = partitionInvestorMetrics(enrichmentEntry?.investorIntel ?? []);
  const existingHasGdp = [...existingMetrics, ...workspaceInvestorMetrics.economicMetrics].some((metric) =>
    /(^|-)gdp($|-)|gross-domestic/i.test(metric.indicatorId),
  );

  const countryEntityId = getCountryEntityId(city);
  const worldBankEstimate =
    !existingHasGdp &&
    ![...(enrichmentEntry?.economicFactbook ?? []), ...enrichmentInvestorMetrics.economicMetrics].some((metric) =>
      /(^|-)gdp($|-)|gross-domestic/i.test(metric.indicatorId),
    )
      ? buildCountryGdpEstimateMetric(city, countryEntityId ? worldBankCountryEconomyIndex.get(countryEntityId) : undefined)
      : null;

  const economicFactbook = uniqueMetrics([
    ...existingMetrics,
    ...workspaceInvestorMetrics.economicMetrics,
    ...(enrichmentEntry?.economicFactbook ?? []),
    ...enrichmentInvestorMetrics.economicMetrics,
    ...(worldBankEstimate ? [worldBankEstimate] : []),
  ]);

  const investorIntel = uniqueMetrics([
    ...workspaceInvestorMetrics.investorMetrics,
    ...enrichmentInvestorMetrics.investorMetrics,
  ]);
  const urbanIntel = uniqueMetrics([
    ...(workspace.urbanIntel ?? []),
    ...(enrichmentEntry?.urbanIntel ?? []),
  ]);

  const sources = uniqueSources([
    ...(workspace.sources ?? []),
    ...(enrichmentEntry?.sources ?? []),
    ...economicFactbook.map((metric) => metric.source),
    ...investorIntel.map((metric) => metric.source),
    ...urbanIntel.map((metric) => metric.source),
  ]);

  const hasObservedEconomicMetric = economicFactbook.some((metric) => metric.status === "actual" && metric.indicatorId !== "population");
  const hasAnyEconomicMetric = economicFactbook.some((metric) => metric.indicatorId !== "population");
  const hasObservedUrbanMetric = urbanIntel.some((metric) => metric.status === "actual");

  return {
    ...workspace,
    economicFactbook,
    investorIntel,
    urbanIntel,
    coverage: {
      ...workspace.coverage,
      economicFactbook: hasObservedEconomicMetric
        ? "verified_exact"
        : hasAnyEconomicMetric
          ? "partial_coverage"
          : workspace.coverage.economicFactbook,
      urbanIntel: hasObservedUrbanMetric ? "partial_coverage" : workspace.coverage.urbanIntel,
    },
    sources,
  };
}
