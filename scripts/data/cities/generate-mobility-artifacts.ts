import fs from "node:fs/promises";
import path from "node:path";

import { createCsvRecordStream } from "./parsers/csv-stream";

type CityRegistryEntry = {
  cityId: string;
  slug: string;
  name: string;
  aliases?: string[];
  countryIso2?: string;
  countryIso3: string;
  latitude: number;
  longitude: number;
  population?: number | null;
};

type MobilityFeedRow = {
  id?: string;
  data_type?: string;
  "location.country_code"?: string;
  "location.municipality"?: string;
  provider?: string;
  is_official?: string;
  "location.bounding_box.minimum_latitude"?: string;
  "location.bounding_box.maximum_latitude"?: string;
  "location.bounding_box.minimum_longitude"?: string;
  "location.bounding_box.maximum_longitude"?: string;
  "location.bounding_box.extracted_on"?: string;
  status?: string;
};

type GenerateMobilityArtifactsOptions = {
  mobilityCsv?: string;
  now?: string;
  outputFile?: string;
  processedIndexesDir?: string;
  registryFile?: string;
};

type AggregatedTransitCity = {
  city: CityRegistryEntry;
  feedIds: Set<string>;
  officialFeedIds: Set<string>;
  providers: Set<string>;
  latestObservedAt: string;
};

const DEFAULT_REGISTRY_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "cities",
  "registry.json",
);
const DEFAULT_MOBILITY_CSV = path.join(
  process.cwd(),
  "data",
  "raw",
  "cities",
  "bulk",
  "mobilitydatabase",
  "feeds_v2.csv",
);
const DEFAULT_PROCESSED_INDEXES_DIR = path.join(
  process.cwd(),
  "data",
  "processed",
  "cities",
  "indexes",
);
const DEFAULT_OUTPUT_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "command-center",
  "city-mobility-enrichment.json",
);

function normalizeLabel(value?: string | null) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toBoolean(value?: string | null) {
  return (value ?? "").trim().toLowerCase() === "true";
}

function toNumber(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOnly(value?: string | null, fallback = new Date().toISOString().slice(0, 10)) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.length >= 10) {
    return trimmed.slice(0, 10);
  }

  return fallback;
}

function haversineKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = ((latitudeB - latitudeA) * Math.PI) / 180;
  const longitudeDelta = ((longitudeB - longitudeA) * Math.PI) / 180;
  const start = (latitudeA * Math.PI) / 180;
  const end = (latitudeB * Math.PI) / 180;

  const haversineValue =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(start) * Math.cos(end) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineValue));
}

function chooseCity(candidates: CityRegistryEntry[], row: MobilityFeedRow) {
  if (candidates.length === 1) {
    return candidates[0];
  }

  const minimumLatitude = toNumber(row["location.bounding_box.minimum_latitude"]);
  const maximumLatitude = toNumber(row["location.bounding_box.maximum_latitude"]);
  const minimumLongitude = toNumber(row["location.bounding_box.minimum_longitude"]);
  const maximumLongitude = toNumber(row["location.bounding_box.maximum_longitude"]);

  if (
    minimumLatitude === null ||
    maximumLatitude === null ||
    minimumLongitude === null ||
    maximumLongitude === null
  ) {
    return [...candidates].sort((left, right) => (right.population ?? 0) - (left.population ?? 0))[0];
  }

  const centerLatitude = (minimumLatitude + maximumLatitude) / 2;
  const centerLongitude = (minimumLongitude + maximumLongitude) / 2;

  return [...candidates].sort((left, right) => {
    const leftDistance = haversineKm(centerLatitude, centerLongitude, left.latitude, left.longitude);
    const rightDistance = haversineKm(centerLatitude, centerLongitude, right.latitude, right.longitude);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return (right.population ?? 0) - (left.population ?? 0);
  })[0];
}

function buildCityLookup(registry: CityRegistryEntry[]) {
  const lookup = new Map<string, CityRegistryEntry[]>();

  for (const city of registry) {
    const countryIso2 = city.countryIso2?.toUpperCase();
    if (!countryIso2) {
      continue;
    }

    const labels = new Set([normalizeLabel(city.name), ...(city.aliases ?? []).map(normalizeLabel)].filter(Boolean));
    for (const label of labels) {
      const key = `${countryIso2}:${label}`;
      const existing = lookup.get(key) ?? [];
      existing.push(city);
      lookup.set(key, existing);
    }
  }

  return lookup;
}

function buildSourceMeta(updatedAt: string) {
  return {
    id: "mobility-database",
    name: "Mobility Database",
    updatedAt,
    coverage: "selected_city_match",
    methodology:
      "Active GTFS feed catalog entries matched to registry cities by country and municipality or alias.",
    url: "https://files.mobilitydatabase.org/feeds_v2.csv",
  };
}

export async function generateMobilityArtifacts(options: GenerateMobilityArtifactsOptions = {}) {
  const registryFile = options.registryFile ?? DEFAULT_REGISTRY_FILE;
  const mobilityCsv = options.mobilityCsv ?? DEFAULT_MOBILITY_CSV;
  const processedIndexesDir = options.processedIndexesDir ?? DEFAULT_PROCESSED_INDEXES_DIR;
  const outputFile = options.outputFile ?? DEFAULT_OUTPUT_FILE;
  const generatedAt = options.now ?? new Date().toISOString();

  const registry = JSON.parse(await fs.readFile(registryFile, "utf-8")) as CityRegistryEntry[];
  const cityLookup = buildCityLookup(registry);
  const aggregatedCities = new Map<string, AggregatedTransitCity>();

  for await (const row of createCsvRecordStream<MobilityFeedRow>(mobilityCsv)) {
    if ((row.status ?? "").trim().toLowerCase() !== "active") {
      continue;
    }

    if (!((row.data_type ?? "").trim().toLowerCase().startsWith("gtfs"))) {
      continue;
    }

    const municipality = normalizeLabel(row["location.municipality"]);
    const countryIso2 = (row["location.country_code"] ?? "").trim().toUpperCase();

    if (!municipality || !countryIso2) {
      continue;
    }

    const candidates = cityLookup.get(`${countryIso2}:${municipality}`) ?? [];
    if (candidates.length === 0) {
      continue;
    }

    const selectedCity = chooseCity(candidates, row);
    const currentEntry = aggregatedCities.get(selectedCity.cityId) ?? {
      city: selectedCity,
      feedIds: new Set<string>(),
      officialFeedIds: new Set<string>(),
      providers: new Set<string>(),
      latestObservedAt: toDateOnly(row["location.bounding_box.extracted_on"], generatedAt.slice(0, 10)),
    };

    if (row.id) {
      currentEntry.feedIds.add(row.id);
    }

    if (row.id && toBoolean(row.is_official)) {
      currentEntry.officialFeedIds.add(row.id);
    }

    if (row.provider?.trim()) {
      currentEntry.providers.add(row.provider.trim());
    }

    const extractedOn = toDateOnly(row["location.bounding_box.extracted_on"], generatedAt.slice(0, 10));
    if (extractedOn > currentEntry.latestObservedAt) {
      currentEntry.latestObservedAt = extractedOn;
    }

    aggregatedCities.set(selectedCity.cityId, currentEntry);
  }

  const processedIndex = Array.from(aggregatedCities.values())
    .sort((left, right) => right.feedIds.size - left.feedIds.size || left.city.name.localeCompare(right.city.name))
    .map(({ city, feedIds, officialFeedIds, providers, latestObservedAt }) => ({
      entityId: `transit-feeds-${city.cityId}`,
      entityType: "transit_feed",
      entitySubtype: "gtfs_feed_catalog",
      name: city.name,
      cityId: city.cityId,
      slug: city.slug,
      countryIso3: city.countryIso3,
      latitude: city.latitude,
      longitude: city.longitude,
      population: city.population ?? null,
      exactSite: false,
      sourceId: "mobility-database",
      sourceLabel: "Mobility Database",
      feedCount: feedIds.size,
      officialFeedCount: officialFeedIds.size,
      providerCount: providers.size,
      latestObservedAt,
    }));

  const enrichmentCities = Object.fromEntries(
    processedIndex.map((record) => {
      const source = buildSourceMeta(record.latestObservedAt);
      const year = Number.parseInt(record.latestObservedAt.slice(0, 4), 10);

      return [
        record.cityId,
        {
          generatedAt,
          economicFactbook: [],
          investorIntel: [
            {
              indicatorId: "transit-feeds",
              value: record.feedCount,
              unit: "feeds",
              year,
              status: "actual",
              source,
            },
            {
              indicatorId: "official-transit-feeds",
              value: record.officialFeedCount,
              unit: "feeds",
              year,
              status: "actual",
              source,
            },
            {
              indicatorId: "transit-providers",
              value: record.providerCount,
              unit: "providers",
              year,
              status: "actual",
              source,
            },
          ],
          urbanIntel: [],
          sources: [source],
        },
      ];
    }),
  );

  await fs.mkdir(processedIndexesDir, { recursive: true });
  await fs.mkdir(path.dirname(outputFile), { recursive: true });

  await fs.writeFile(
    path.join(processedIndexesDir, "transit-feeds.json"),
    JSON.stringify(processedIndex, null, 2),
  );
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        generatedAt,
        cities: enrichmentCities,
      },
      null,
      2,
    ),
  );

  return {
    generatedAt,
    cityCount: processedIndex.length,
    processedIndex,
  };
}

if (require.main === module) {
  generateMobilityArtifacts().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
