import {
  cityAlertFeedSchema,
  cityIntelligenceIndexSchema,
  type CityAlert,
  type CityIntelligenceBundle,
  type CityIntelligenceIndex,
} from "@/domain/city-intelligence-schemas";
import { assetUrl } from "@/lib/asset-url";

let indexPromise: Promise<CityIntelligenceIndex | null> | null = null;
let alertsPromise: Promise<CityAlert[]> | null = null;

async function fetchIndex(): Promise<CityIntelligenceIndex | null> {
  try {
    const response = await fetch(assetUrl("/data/cities/intelligence.json"));
    if (!response.ok) return null;
    return cityIntelligenceIndexSchema.parse(await response.json());
  } catch {
    return null;
  }
}

function loadIndex(): Promise<CityIntelligenceIndex | null> {
  indexPromise ??= fetchIndex();
  return indexPromise;
}

export async function loadCityIntelligence(
  cityId: string,
): Promise<CityIntelligenceBundle> {
  const index = await loadIndex();
  const published = index?.cities[cityId];
  if (published) return published;

  return {
    schemaVersion: index?.schemaVersion ?? "1.0",
    generatedAt: index?.generatedAt ?? "1970-01-01T00:00:00.000Z",
    cityId,
    telecomEvidence: "unknown",
    geographies: [],
    observations: [],
    deltas: [],
    alerts: [],
    sourceStatuses: index?.sourceStatuses ?? [],
  };
}

async function fetchAlerts(): Promise<CityAlert[]> {
  try {
    const response = await fetch(assetUrl("/data/cities/alerts.json"));
    if (!response.ok) return [];
    return cityAlertFeedSchema.parse(await response.json()).alerts;
  } catch {
    return [];
  }
}

export function loadCityAlerts(): Promise<CityAlert[]> {
  alertsPromise ??= fetchAlerts();
  return alertsPromise;
}

export function __resetCityIntelligenceCache(): void {
  indexPromise = null;
  alertsPromise = null;
}
