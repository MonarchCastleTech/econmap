import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import {
  cityCoverageShellSchema,
  cityEntitiesBundleSchema,
  cityManifestSchema,
  citySchema,
  citySearchIndexEntrySchema,
  citySourcesBundleSchema,
  cityWorkspaceSchema,
} from "@/domain/city-schemas";

const GENERATED_CITIES_DIR = path.join(process.cwd(), "src", "data", "generated", "cities");
const WORKSPACES_DIR = path.join(GENERATED_CITIES_DIR, "workspaces");
const ENTITIES_DIR = path.join(GENERATED_CITIES_DIR, "entities");
const SOURCES_DIR = path.join(GENERATED_CITIES_DIR, "sources");
const COVERAGE_DIR = path.join(GENERATED_CITIES_DIR, "coverage");
const REGISTRY_FILE = path.join(GENERATED_CITIES_DIR, "registry.json");
const MANIFEST_FILE = path.join(GENERATED_CITIES_DIR, "manifest.json");
const SEARCH_INDEX_FILE = path.join(GENERATED_CITIES_DIR, "search-index.json");
const SLUG_META_FILE = path.join(GENERATED_CITIES_DIR, "slug-meta.json");

// Slim slug -> {name, iso3, population} lookup. The city route's build-time
// functions use this (~11MB) instead of the full 113MB registry so static-export
// workers stay well under the default heap limit.
export type CitySlugMeta = Record<string, { n: string; i: string; p: number }>;

export type CityWorkspace = z.infer<typeof cityWorkspaceSchema>;
export type CityRegistryEntry = z.infer<typeof citySchema>;
export type CityManifest = z.infer<typeof cityManifestSchema>;
export type CitySearchIndexEntry = z.infer<typeof citySearchIndexEntrySchema>;
export type CityEntitiesBundle = z.infer<typeof cityEntitiesBundleSchema>;
export type CitySourcesBundle = z.infer<typeof citySourcesBundleSchema>;
export type CityCoverageShell = z.infer<typeof cityCoverageShellSchema>;

function parseGeneratedJson<T>(content: string): T {
  return JSON.parse(content) as T;
}

// The registry (117MB) and search index (62MB) are large and immutable per build. Memoize the
// parsed result per worker process so static export doesn't re-read+parse them ~40K times (once
// per city page via generateStaticParams/generateMetadata/page) — which exhausts the heap (OOM).
let registryCache: CityRegistryEntry[] | null = null;
let searchIndexCache: CitySearchIndexEntry[] | null = null;
let slugMetaCache: CitySlugMeta | null = null;

export async function loadCitySlugMeta(): Promise<CitySlugMeta> {
  if (slugMetaCache) return slugMetaCache;
  try {
    const content = await fs.readFile(SLUG_META_FILE, "utf-8");
    slugMetaCache = parseGeneratedJson<CitySlugMeta>(content);
    return slugMetaCache;
  } catch {
    return {};
  }
}

export async function loadCityWorkspace(cityId: string): Promise<CityWorkspace | null> {
  try {
    const workspaceFile = path.join(WORKSPACES_DIR, `${cityId}.json`);
    const content = await fs.readFile(workspaceFile, "utf-8");
    const workspace = JSON.parse(content);
    return cityWorkspaceSchema.parse(workspace);
  } catch {
    return null;
  }
}

export async function loadCityEntities(cityId: string): Promise<{
  entities: CityWorkspace["entityHighlights"];
  sources: CityWorkspace["sources"];
} | null> {
  try {
    const entitiesFile = path.join(ENTITIES_DIR, `${cityId}.json`);
    const content = await fs.readFile(entitiesFile, "utf-8");
    return cityEntitiesBundleSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function loadCitySources(cityId: string): Promise<CitySourcesBundle | null> {
  try {
    const sourcesFile = path.join(SOURCES_DIR, `${cityId}.json`);
    const content = await fs.readFile(sourcesFile, "utf-8");
    return citySourcesBundleSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function loadCityCoverageShell(cityId: string): Promise<CityCoverageShell | null> {
  try {
    const coverageFile = path.join(COVERAGE_DIR, `${cityId}.json`);
    const content = await fs.readFile(coverageFile, "utf-8");
    return cityCoverageShellSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function loadCityRegistry(): Promise<CityRegistryEntry[]> {
  if (registryCache) return registryCache;
  try {
    const content = await fs.readFile(REGISTRY_FILE, "utf-8");
    registryCache = parseGeneratedJson<CityRegistryEntry[]>(content);
    return registryCache;
  } catch {
    return [];
  }
}

export async function loadCityManifest(): Promise<CityManifest | null> {
  try {
    const content = await fs.readFile(MANIFEST_FILE, "utf-8");
    return cityManifestSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function loadCitySearchIndex(): Promise<CitySearchIndexEntry[]> {
  if (searchIndexCache) return searchIndexCache;
  try {
    const content = await fs.readFile(SEARCH_INDEX_FILE, "utf-8");
    searchIndexCache = parseGeneratedJson<CitySearchIndexEntry[]>(content);
    return searchIndexCache;
  } catch {
    return [];
  }
}

export async function findCityBySlug(slug: string): Promise<CityRegistryEntry | null> {
  const registry = await loadCityRegistry();
  return registry.find((city) => city.slug === slug) ?? null;
}

export async function findCityById(cityId: string): Promise<CityRegistryEntry | null> {
  const registry = await loadCityRegistry();
  return registry.find((city) => city.cityId === cityId) ?? null;
}

export async function searchCities(query: string, limit = 20): Promise<CityRegistryEntry[]> {
  const registry = await loadCityRegistry();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  return registry
    .filter((city) => {
      const nameMatch = city.name.toLowerCase().includes(normalizedQuery);
      const aliasMatch = city.aliases?.some((alias) =>
        alias.toLowerCase().includes(normalizedQuery)
      );
      const countryMatch = city.countryIso3.toLowerCase().includes(normalizedQuery);
      const adminMatch = city.admin1Name?.toLowerCase().includes(normalizedQuery);

      return nameMatch || aliasMatch || countryMatch || adminMatch;
    })
    .slice(0, limit);
}

export async function generateSearchIndex(): Promise<
  CitySearchIndexEntry[]
> {
  const searchIndex = await loadCitySearchIndex();
  if (searchIndex.length > 0) {
    return searchIndex;
  }

  const registry = await loadCityRegistry();
  return registry.map((city) => citySearchIndexEntrySchema.parse({
    cityId: city.cityId,
    slug: city.slug,
    name: city.name,
    aliases: city.aliases ?? [],
    countryIso3: city.countryIso3,
    admin1Name: city.admin1Name,
    population: city.population,
    isMajorCity: city.isMajorCity ?? false,
  }));
}
