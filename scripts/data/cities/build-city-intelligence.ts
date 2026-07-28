import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  cityAlertFeedSchema,
  cityIntelligenceBundleSchema,
  cityIntelligenceGeographySchema,
  cityIntelligenceIndexSchema,
  cityObservationSchema,
  deriveTelecomEvidenceTier,
  type CityAlert,
  type CityIntelligenceDelta,
  type CityIntelligenceIndex,
  type CityObservation,
} from "../../../src/domain/city-intelligence-schemas";
import {
  alertsFromDeltas,
  diffCityObservations,
} from "./intelligence/delta-engine";
import {
  assessIntelligenceSources,
  INTELLIGENCE_SOURCE_CONTRACTS,
} from "./intelligence/source-adapters";

type Geography = ReturnType<typeof cityIntelligenceGeographySchema.parse>;

type NormalizedSnapshot = {
  observations?: unknown[];
  geographies?: unknown[];
};

export type BuildCityIntelligenceResult = {
  cityCount: number;
  observationCount: number;
  deltaCount: number;
  alertCount: number;
  availableSourceCount: number;
};

async function readJson(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

async function readPreviousIndex(filePath: string): Promise<CityIntelligenceIndex | null> {
  const value = await readJson(filePath);
  const parsed = cityIntelligenceIndexSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function loadNormalizedSnapshots(rootDir: string): Promise<{
  observations: CityObservation[];
  geographies: Geography[];
}> {
  const directory = path.join(rootDir, "data/raw/cities/intelligence");
  let files: string[] = [];
  try {
    files = (await fs.readdir(directory))
      .filter((name) => name.endsWith(".json"))
      .sort();
  } catch {
    return { observations: [], geographies: [] };
  }

  const observations = new Map<string, CityObservation>();
  const geographies = new Map<string, Geography>();

  for (const file of files) {
    const snapshot = (await readJson(path.join(directory, file))) as NormalizedSnapshot | null;
    if (!snapshot || typeof snapshot !== "object") continue;

    for (const candidate of snapshot.observations ?? []) {
      const parsed = cityObservationSchema.safeParse(candidate);
      if (!parsed.success) {
        throw new Error(
          `Invalid city intelligence observation in ${file}: ${parsed.error.message}`,
        );
      }
      const existing = observations.get(parsed.data.id);
      if (!existing || parsed.data.observedAt >= existing.observedAt) {
        observations.set(parsed.data.id, parsed.data);
      }
    }

    for (const candidate of snapshot.geographies ?? []) {
      const parsed = cityIntelligenceGeographySchema.safeParse(candidate);
      if (!parsed.success) {
        throw new Error(
          `Invalid city intelligence geography in ${file}: ${parsed.error.message}`,
        );
      }
      geographies.set(parsed.data.id, parsed.data);
    }
  }

  return {
    observations: [...observations.values()].sort(
      (a, b) => a.cityId.localeCompare(b.cityId) || a.id.localeCompare(b.id),
    ),
    geographies: [...geographies.values()].sort(
      (a, b) => a.cityId.localeCompare(b.cityId) || a.id.localeCompare(b.id),
    ),
  };
}

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function previousHistory(index: CityIntelligenceIndex | null): {
  observations: CityObservation[];
  deltas: CityIntelligenceDelta[];
  alerts: CityAlert[];
} {
  if (!index) return { observations: [], deltas: [], alerts: [] };
  const bundles = Object.values(index.cities);
  return {
    observations: bundles.flatMap((bundle) => bundle.observations),
    deltas: bundles.flatMap((bundle) => bundle.deltas),
    alerts: bundles.flatMap((bundle) => bundle.alerts),
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeImmutableJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}

export async function buildCityIntelligence(options: {
  rootDir: string;
  generatedAt: string;
  env: Record<string, string | undefined>;
}): Promise<BuildCityIntelligenceResult> {
  const publicIndexPath = path.join(
    options.rootDir,
    "public/data/cities/intelligence.json",
  );
  const previousIndex = await readPreviousIndex(publicIndexPath);
  const previous = previousHistory(previousIndex);
  const current = await loadNormalizedSnapshots(options.rootDir);
  const sourceStatuses = await assessIntelligenceSources({
    rootDir: options.rootDir,
    env: options.env,
    checkedAt: options.generatedAt,
  });

  const freshDeltas = diffCityObservations(
    previous.observations,
    current.observations,
    options.generatedAt,
  );
  const freshAlerts = alertsFromDeltas(freshDeltas);
  const allDeltas = uniqueById([...previous.deltas, ...freshDeltas]);
  const allAlerts = uniqueById([...previous.alerts, ...freshAlerts]);
  const cityIds = [
    ...new Set([
      ...current.observations.map((item) => item.cityId),
      ...current.geographies.map((item) => item.cityId),
      ...allDeltas.map((item) => item.cityId),
      ...allAlerts.map((item) => item.cityId),
    ]),
  ].sort();

  const cities = Object.fromEntries(
    cityIds.map((cityId) => {
      const observations = current.observations.filter(
        (item) => item.cityId === cityId,
      );
      const bundle = cityIntelligenceBundleSchema.parse({
        schemaVersion: "1.0",
        generatedAt: options.generatedAt,
        cityId,
        telecomEvidence: deriveTelecomEvidenceTier(observations),
        geographies: current.geographies.filter((item) => item.cityId === cityId),
        observations,
        deltas: allDeltas
          .filter((item) => item.cityId === cityId)
          .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
          .slice(0, 100),
        alerts: allAlerts
          .filter((item) => item.cityId === cityId)
          .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
          .slice(0, 100),
        sourceStatuses,
      });
      return [cityId, bundle];
    }),
  );

  const index = cityIntelligenceIndexSchema.parse({
    schemaVersion: "1.0",
    generatedAt: options.generatedAt,
    cities,
    sourceStatuses,
  });
  const feed = cityAlertFeedSchema.parse({
    schemaVersion: "1.0",
    generatedAt: options.generatedAt,
    alerts: allAlerts
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
      .slice(0, 5000),
  });
  const snapshot = {
    schemaVersion: "1.0",
    generatedAt: options.generatedAt,
    observations: current.observations,
    geographies: current.geographies,
    sourceStatuses,
  };
  const date = options.generatedAt.slice(0, 10);
  const generatedRoot = path.join(
    options.rootDir,
    "src/data/generated/city-intelligence",
  );

  await Promise.all([
    writeJson(publicIndexPath, index),
    writeJson(
      path.join(options.rootDir, "public/data/cities/alerts.json"),
      feed,
    ),
    writeJson(
      path.join(options.rootDir, "public/data/cities/source-contracts.json"),
      INTELLIGENCE_SOURCE_CONTRACTS,
    ),
    writeJson(path.join(generatedRoot, "latest.json"), snapshot),
    writeImmutableJson(
      path.join(generatedRoot, "snapshots", `${date}.json`),
      snapshot,
    ),
  ]);

  return {
    cityCount: cityIds.length,
    observationCount: current.observations.length,
    deltaCount: allDeltas.length,
    alertCount: allAlerts.length,
    availableSourceCount: sourceStatuses.filter(
      (source) => source.status === "available",
    ).length,
  };
}

async function main(): Promise<void> {
  const result = await buildCityIntelligence({
    rootDir: process.cwd(),
    generatedAt: new Date().toISOString(),
    env: process.env,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (entry === import.meta.url) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
