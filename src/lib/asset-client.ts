import { AssetRecord, CountryAssetAggregation } from "@/domain/types";
import { assetUrl } from "@/lib/asset-url";

export async function fetchCountryAssets(countryIso3: string): Promise<AssetRecord[]> {
  try {
    const response = await fetch(assetUrl(`/data/assets/${countryIso3.toLowerCase()}.json`));
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch assets:", err);
    return [];
  }
}

export async function fetchAssetManifest(): Promise<Record<string, CountryAssetAggregation>> {
  try {
    const response = await fetch(assetUrl("/data/assets/manifest.json"));
    if (!response.ok) return {};
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch asset manifest:", err);
    return {};
  }
}

type CorridorBbox = { minLat: number; maxLat: number; minLon: number; maxLon: number };

// Lightweight per-corridor summary. Counts are computed over the FULL asset set
// (honest totals); the heavy asset arrays live in per-corridor detail files.
export type CorridorIndexEntry = {
  id: string;
  name: string;
  description: string;
  bbox: CorridorBbox;
  totalAssetCount: number;
  renderedAssetCount: number;
  criticalCount: number;
  energyCount: number;
  transportCount: number;
};

// Full detail for a single corridor. `assets` is capped to the top-N by priority
// for map rendering; `totalAssetCount` preserves the true population.
export type CorridorDetail = {
  id: string;
  name: string;
  description: string;
  bbox: CorridorBbox;
  totalAssetCount: number;
  renderedAssetCount: number;
  assets: AssetRecord[];
};

export async function fetchCorridorIndex(): Promise<CorridorIndexEntry[]> {
  try {
    const response = await fetch(assetUrl("/data/assets/corridors-index.json"));
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch corridor index:", err);
    return [];
  }
}

export async function fetchCorridorDetail(id: string): Promise<CorridorDetail | null> {
  try {
    const response = await fetch(assetUrl(`/data/assets/corridors/${id}.json`));
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch corridor detail:", err);
    return null;
  }
}
