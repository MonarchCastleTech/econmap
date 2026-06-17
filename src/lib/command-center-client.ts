/**
 * Client-side loader for the city dossier (static export).
 * Fetches per-city JSON from public/data/cities and the command-center manifest from
 * public/data/command-center, validating each payload against its schema.
 *
 * P0.3 fixes:
 *   - loadCommandCenterManifestClient now fetches the REAL command-center manifest
 *     (/data/command-center/manifest.json) instead of the unrelated globe manifest, and validates it.
 *   - The workspace is parsed through commandCenterCityWorkspaceSchema (rich, typed) instead of a
 *     hand-built hollow object cast with `as` — so the dossier keeps the city's real economic
 *     factbook, entity highlights, coverage and source labels.
 */

import {
  commandCenterCityWorkspaceSchema,
  commandCenterManifestSchema,
} from "@/domain/command-center-schemas";
import type {
  CommandCenterCityPanel,
  CommandCenterCityWorkspace,
  CommandCenterManifest,
} from "@/domain/types";
import {
  findCityById,
  findCityBySlug,
  loadCityCoverageShell,
  loadCityEntities,
  loadCitySources,
} from "@/lib/city-data-client";
import { loadDossier } from "@/lib/dossier-bundle-client";
import { assetUrl } from "@/lib/asset-url";

const COMMAND_CENTER_MANIFEST_URL = assetUrl("/data/command-center/manifest.json");

export type CommandCenterCityPanelRequest =
  | { cityId: string; slug?: never }
  | { cityId?: never; slug: string };

async function loadCommandCenterWorkspace(
  cityId: string,
): Promise<CommandCenterCityWorkspace | null> {
  // Reads the workspace from the shared dossier bundle (the sibling entities/sources/coverage
  // loaders hit the same cached Range fetch). Parsed with the command-center schema so intel/coverage
  // extensions default to [] when the city has no enrichment.
  const d = await loadDossier(cityId);
  if (!d?.w) return null;
  try {
    return commandCenterCityWorkspaceSchema.parse(d.w);
  } catch {
    return null;
  }
}

export async function loadCommandCenterCityPanelClient(
  request?: CommandCenterCityPanelRequest,
): Promise<CommandCenterCityPanel | null> {
  if (!request) return null;

  const city = request.cityId
    ? await findCityById(request.cityId)
    : request.slug
      ? await findCityBySlug(request.slug)
      : null;

  if (!city) return null;

  const [workspace, entities, sources, coverageShell] = await Promise.all([
    loadCommandCenterWorkspace(city.cityId),
    loadCityEntities(city.cityId),
    loadCitySources(city.cityId),
    loadCityCoverageShell(city.cityId),
  ]);

  if (!workspace) return null;

  return {
    city,
    workspace,
    coverageShell,
    entities,
    sources,
  };
}

export async function loadCommandCenterManifestClient(): Promise<CommandCenterManifest | null> {
  try {
    const res = await fetch(COMMAND_CENTER_MANIFEST_URL);
    if (!res.ok) return null;
    return commandCenterManifestSchema.parse(await res.json());
  } catch {
    return null;
  }
}
