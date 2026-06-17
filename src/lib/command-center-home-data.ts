import fs from "node:fs/promises";
import path from "node:path";

import {
  baseImageryCatalogSchema,
  cityFootprintCatalogSchema,
  cityFootprintSelectionSchema,
  commandCenterDatasetWorkspaceSchema,
  commandCenterManifestSchema,
  globeManifestSchema,
} from "@/domain/command-center-schemas";
import type {
  BaseImageryCatalog,
  CityFootprintCatalog,
  CityFootprintSelection,
  CityRegistryEntry,
  CommandCenterDatasetWorkspace,
  CommandCenterManifest,
  GlobeManifest,
} from "@/domain/types";

const COMMAND_CENTER_MANIFEST_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "command-center",
  "manifest.json",
);
const GLOBE_MANIFEST_FILE = path.join(process.cwd(), "public", "data", "globe", "manifest.json");
const BASE_IMAGERY_CATALOG_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "globe",
  "base-imagery",
  "catalog.json",
);
const CITY_FOOTPRINT_CATALOG_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "globe",
  "reference",
  "city-footprints",
  "catalog.json",
);
const COMMAND_CENTER_DATASETS_DIR = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "command-center",
  "datasets",
);
const FEATURED_CITIES_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "command-center",
  "featured-cities.json",
);

let cachedCommandCenterManifestPromise: Promise<CommandCenterManifest> | null = null;
let cachedGlobeManifestPromise: Promise<GlobeManifest> | null = null;
let cachedBaseImageryCatalogPromise: Promise<BaseImageryCatalog> | null = null;
let cachedCityFootprintCatalogPromise: Promise<CityFootprintCatalog> | null = null;
let cachedCityFootprintSelectionPromise: Promise<CityFootprintSelection> | null = null;
let cachedFeaturedCitiesPromise: Promise<CityRegistryEntry[]> | null = null;

function shouldUseCachedArtifacts() {
  return process.env.NODE_ENV === "production";
}

function parseGeneratedJson<T>(content: string): T {
  return JSON.parse(content) as T;
}

async function readCommandCenterManifest() {
  const content = await fs.readFile(COMMAND_CENTER_MANIFEST_FILE, "utf-8");
  return commandCenterManifestSchema.parse(JSON.parse(content));
}

async function readGlobeManifest() {
  const content = await fs.readFile(GLOBE_MANIFEST_FILE, "utf-8");
  return globeManifestSchema.parse(JSON.parse(content));
}

async function readBaseImageryCatalog() {
  const content = await fs.readFile(BASE_IMAGERY_CATALOG_FILE, "utf-8");
  return baseImageryCatalogSchema.parse(JSON.parse(content));
}

async function readCityFootprintCatalog() {
  const content = await fs.readFile(CITY_FOOTPRINT_CATALOG_FILE, "utf-8");
  return cityFootprintCatalogSchema.parse(JSON.parse(content));
}

async function readCityFootprintSelection() {
  const content = await fs.readFile(CITY_FOOTPRINT_CATALOG_FILE, "utf-8");
  return cityFootprintSelectionSchema.parse(JSON.parse(content));
}

async function readDatasetWorkspace(datasetId: string) {
  const content = await fs.readFile(path.join(COMMAND_CENTER_DATASETS_DIR, `${datasetId}.json`), "utf-8");
  return commandCenterDatasetWorkspaceSchema.parse(JSON.parse(content));
}

async function readFeaturedCitiesArtifact() {
  try {
    const content = await fs.readFile(FEATURED_CITIES_FILE, "utf-8");
    return parseGeneratedJson<CityRegistryEntry[]>(content);
  } catch {
    return [];
  }
}

export async function loadCommandCenterManifest() {
  if (!shouldUseCachedArtifacts()) {
    return readCommandCenterManifest();
  }

  cachedCommandCenterManifestPromise ??= readCommandCenterManifest();
  return cachedCommandCenterManifestPromise;
}

export async function loadGlobeManifest() {
  if (!shouldUseCachedArtifacts()) {
    return readGlobeManifest();
  }

  cachedGlobeManifestPromise ??= readGlobeManifest();
  return cachedGlobeManifestPromise;
}

export async function loadBaseImageryCatalog() {
  if (!shouldUseCachedArtifacts()) {
    return readBaseImageryCatalog();
  }

  cachedBaseImageryCatalogPromise ??= readBaseImageryCatalog();
  return cachedBaseImageryCatalogPromise;
}

export async function loadCityFootprintCatalog() {
  if (!shouldUseCachedArtifacts()) {
    return readCityFootprintCatalog();
  }

  cachedCityFootprintCatalogPromise ??= readCityFootprintCatalog();
  return cachedCityFootprintCatalogPromise;
}

export async function loadCityFootprintSelection() {
  if (!shouldUseCachedArtifacts()) {
    return readCityFootprintSelection();
  }

  cachedCityFootprintSelectionPromise ??= readCityFootprintSelection();
  return cachedCityFootprintSelectionPromise;
}

export async function loadCommandCenterDatasetWorkspace(
  datasetId: string,
): Promise<CommandCenterDatasetWorkspace> {
  return readDatasetWorkspace(datasetId);
}

export async function loadFeaturedCommandCenterCities(limit = 8): Promise<CityRegistryEntry[]> {
  if (!shouldUseCachedArtifacts()) {
    const featuredCities = await readFeaturedCitiesArtifact();
    return featuredCities.slice(0, limit);
  }

  cachedFeaturedCitiesPromise ??= readFeaturedCitiesArtifact();
  const featuredCities = await cachedFeaturedCitiesPromise;
  return featuredCities.slice(0, limit);
}
