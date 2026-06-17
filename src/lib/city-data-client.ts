/**
 * Client-side data loading for static export.
 * Replaces server-side fs.readFile calls with fetch() from public/data/.
 */

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
import { loadDossier } from "@/lib/dossier-bundle-client";
import { assetUrl } from "@/lib/asset-url";

const BASE = assetUrl("/data/cities");

export type CityWorkspace = z.infer<typeof cityWorkspaceSchema>;
export type CityRegistryEntry = z.infer<typeof citySchema>;
export type CityManifest = z.infer<typeof cityManifestSchema>;
export type CitySearchIndexEntry = z.infer<typeof citySearchIndexEntrySchema>;
export type CityEntitiesBundle = z.infer<typeof cityEntitiesBundleSchema>;
export type CitySourcesBundle = z.infer<typeof citySourcesBundleSchema>;
export type CityCoverageShell = z.infer<typeof cityCoverageShellSchema>;

async function fetchJson<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
): Promise<z.output<S> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    // Use the schema's OUTPUT type (defaults applied), not a single T conflated for input+output.
    return schema.parse(data) as z.output<S>;
  } catch {
    return null;
  }
}

// The four per-city dossier reads come from ONE Range-addressable bundle (see
// dossier-bundle-client.ts): a single byte-range fetch returns {w,e,s,c} and the in-flight cache
// dedupes the concurrent calls, replacing 4 file fetches with 1. Data is verbatim — every source
// label / provenance field is preserved.
export async function loadCityWorkspace(cityId: string): Promise<CityWorkspace | null> {
  const d = await loadDossier(cityId);
  return d?.w ? cityWorkspaceSchema.parse(d.w) : null;
}

export async function loadCityEntities(cityId: string): Promise<{
  entities: CityWorkspace["entityHighlights"];
  sources: CityWorkspace["sources"];
} | null> {
  const d = await loadDossier(cityId);
  return d?.e ? cityEntitiesBundleSchema.parse(d.e) : null;
}

export async function loadCitySources(cityId: string): Promise<CitySourcesBundle | null> {
  const d = await loadDossier(cityId);
  return d?.s ? citySourcesBundleSchema.parse(d.s) : null;
}

export async function loadCityCoverageShell(cityId: string): Promise<CityCoverageShell | null> {
  const d = await loadDossier(cityId);
  return d?.c ? cityCoverageShellSchema.parse(d.c) : null;
}

export async function loadCityRegistry(): Promise<CityRegistryEntry[]> {
  const res = await fetch(`${BASE}/registry.json`);
  if (!res.ok) return [];
  // Skip validation for large registry (50MB+)
  return (await res.json()) as CityRegistryEntry[];
}

export async function loadCityManifest(): Promise<CityManifest | null> {
  return fetchJson(`${BASE}/manifest.json`, cityManifestSchema);
}

export async function loadCitySearchIndex(): Promise<CitySearchIndexEntry[]> {
  const res = await fetch(`${BASE}/search-index.json`);
  if (!res.ok) return [];
  return (await res.json()) as CitySearchIndexEntry[];
}

export async function findCityBySlug(slug: string): Promise<CityRegistryEntry | null> {
  // Registry-free (S1): the cityId is encoded in the slug (geo-NNNN-...), and the full city object is
  // embedded in the workspace (cityWorkspaceSchema.city = citySchema). So read it from the dossier
  // bundle instead of fetching the 117MB registry.json. Cities without a published dossier resolve to
  // null (honest — they have no source-backed page).
  const cityId = slug.match(/^(geo-\d+)-/)?.[1] ?? slug;
  const workspace = await loadCityWorkspace(cityId);
  return workspace?.city ?? null;
}

export async function findCityById(cityId: string): Promise<CityRegistryEntry | null> {
  const workspace = await loadCityWorkspace(cityId);
  return workspace?.city ?? null;
}

export async function searchCities(query: string, limit = 20): Promise<CityRegistryEntry[]> {
  const registry = await loadCityRegistry();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return [];

  return registry
    .filter((city) => {
      const nameMatch = city.name.toLowerCase().includes(normalizedQuery);
      const aliasMatch = city.aliases?.some((alias) =>
        alias.toLowerCase().includes(normalizedQuery),
      );
      const countryMatch = city.countryIso3.toLowerCase().includes(normalizedQuery);
      const adminMatch = city.admin1Name?.toLowerCase().includes(normalizedQuery);
      return nameMatch || aliasMatch || countryMatch || adminMatch;
    })
    .slice(0, limit);
}

export async function generateSearchIndex(): Promise<CitySearchIndexEntry[]> {
  const searchIndex = await loadCitySearchIndex();
  if (searchIndex.length > 0) return searchIndex;

  const registry = await loadCityRegistry();
  return registry.map((city) =>
    citySearchIndexEntrySchema.parse({
      cityId: city.cityId,
      slug: city.slug,
      name: city.name,
      aliases: city.aliases ?? [],
      countryIso3: city.countryIso3,
      admin1Name: city.admin1Name,
      population: city.population,
      isMajorCity: city.isMajorCity ?? false,
    }),
  );
}
