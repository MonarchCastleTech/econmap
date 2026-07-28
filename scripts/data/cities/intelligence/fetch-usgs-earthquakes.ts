import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  cityObservationSchema,
  type CityObservation,
} from "../../../../src/domain/city-intelligence-schemas";

const FEED_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const MATCH_RADIUS_KM = 100;
const MIN_MAGNITUDE = 2.5;
const MAX_CITIES_PER_EVENT = 25;

type CityPoint = {
  cityId: string;
  name: string;
  countryIso3: string;
  latitude: number;
  longitude: number;
  placeClass?: string;
  recordStatus?: string;
};

type UsgsFeature = {
  id?: unknown;
  properties?: {
    mag?: unknown;
    place?: unknown;
    time?: unknown;
    updated?: unknown;
    url?: unknown;
  };
  geometry?: {
    coordinates?: unknown;
  };
};

type UsgsFeed = { features?: UsgsFeature[] };

function toNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function toIso(value: unknown): string | null {
  const milliseconds = toNumber(value);
  if (milliseconds === null) return null;
  const date = new Date(milliseconds);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function haversineKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const radians = Math.PI / 180;
  const deltaLatitude = (latitudeB - latitudeA) * radians;
  const deltaLongitude = (longitudeB - longitudeA) * radians;
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA * radians) *
      Math.cos(latitudeB * radians) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function latitudeIndex(cities: readonly CityPoint[]): Map<number, CityPoint[]> {
  const index = new Map<number, CityPoint[]>();
  for (const city of cities) {
    if (
      !Number.isFinite(city.latitude) ||
      !Number.isFinite(city.longitude) ||
      (city.placeClass && city.placeClass !== "city") ||
      (city.recordStatus && city.recordStatus !== "active")
    ) {
      continue;
    }
    const bucket = Math.floor(city.latitude);
    index.set(bucket, [...(index.get(bucket) ?? []), city]);
  }
  return index;
}

export function normalizeUsgsEarthquakes(
  feed: UsgsFeed,
  cities: readonly CityPoint[],
  generatedAt: string,
): CityObservation[] {
  const index = latitudeIndex(cities);
  const observations: CityObservation[] = [];

  for (const feature of feed.features ?? []) {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const longitude = toNumber(coordinates[0]);
    const latitude = toNumber(coordinates[1]);
    const magnitude = toNumber(feature.properties?.mag);
    const observedAt = toIso(feature.properties?.time);
    const publishedAt = toIso(feature.properties?.updated) ?? generatedAt;
    const eventId =
      typeof feature.id === "string" && feature.id.length > 0
        ? feature.id
        : null;
    if (
      longitude === null ||
      latitude === null ||
      magnitude === null ||
      magnitude < MIN_MAGNITUDE ||
      !observedAt ||
      !eventId
    ) {
      continue;
    }

    const nearby: Array<{ city: CityPoint; distanceKm: number }> = [];
    const latitudeBucket = Math.floor(latitude);
    for (let bucket = latitudeBucket - 2; bucket <= latitudeBucket + 2; bucket += 1) {
      for (const city of index.get(bucket) ?? []) {
        const distanceKm = haversineKm(
          latitude,
          longitude,
          city.latitude,
          city.longitude,
        );
        if (distanceKm <= MATCH_RADIUS_KM) nearby.push({ city, distanceKm });
      }
    }

    nearby
      .sort(
        (a, b) =>
          a.distanceKm - b.distanceKm ||
          a.city.cityId.localeCompare(b.city.cityId),
      )
      .slice(0, MAX_CITIES_PER_EVENT)
      .forEach(({ city, distanceKm }) => {
        const place =
          typeof feature.properties?.place === "string"
            ? feature.properties.place
            : "USGS earthquake event";
        const eventUrl =
          typeof feature.properties?.url === "string"
            ? feature.properties.url
            : FEED_URL;
        const validTo = new Date(
          Date.parse(observedAt) + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        observations.push(
          cityObservationSchema.parse({
            id: `${city.cityId}:usgs-earthquakes:${eventId}`,
            cityId: city.cityId,
            topic: "hazard",
            metric: "earthquake",
            state: "observed",
            value: magnitude,
            unit: "magnitude",
            evidenceKind: "measured",
            geographyKind: "radius",
            observedAt,
            validFrom: observedAt,
            validTo,
            publishedAt,
            sourceId: "usgs-earthquakes",
            sourceUrl: eventUrl,
            methodology: `USGS event matched to canonical cities within a ${MATCH_RADIUS_KM} km radius; this city is ${distanceKm.toFixed(1)} km from the epicentre.`,
            confidence: "high",
            note: `${place}; depth ${toNumber(coordinates[2]) ?? "unknown"} km.`,
          }),
        );
      });
  }

  return observations.sort(
    (a, b) => a.cityId.localeCompare(b.cityId) || a.id.localeCompare(b.id),
  );
}

export async function fetchUsgsEarthquakes(rootDir: string): Promise<number> {
  const registryPath = path.join(
    rootDir,
    "src/data/generated/cities/registry.json",
  );
  const cities = JSON.parse(await fs.readFile(registryPath, "utf8")) as CityPoint[];
  const response = await fetch(FEED_URL, {
    headers: { Accept: "application/geo+json, application/json" },
  });
  if (!response.ok) {
    throw new Error(`USGS feed returned HTTP ${response.status}.`);
  }
  const feed = (await response.json()) as UsgsFeed;
  const generatedAt = new Date().toISOString();
  const observations = normalizeUsgsEarthquakes(feed, cities, generatedAt);
  const outputPath = path.join(
    rootDir,
    "data/raw/cities/intelligence/usgs-earthquakes.json",
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        sourceId: "usgs-earthquakes",
        generatedAt,
        feedUrl: FEED_URL,
        observations,
        geographies: [],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return observations.length;
}

async function main(): Promise<void> {
  const count = await fetchUsgsEarthquakes(process.cwd());
  process.stdout.write(`${JSON.stringify({ observations: count })}\n`);
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (entry === import.meta.url) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
