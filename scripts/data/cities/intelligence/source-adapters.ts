import fs from "node:fs/promises";
import path from "node:path";

import {
  intelligenceSourceStatusSchema,
  type IntelligenceSourceStatus,
} from "../../../../src/domain/city-intelligence-schemas";

export type IntelligenceSourceContract = {
  id: string;
  label: string;
  url: string;
  scope: string;
  cadence: string;
  evidence: string;
  methodology: string;
  gapReason: string;
  snapshotPaths: string[];
  access: "public_bulk" | "public_api" | "credential" | "licensed" | "manual";
  credentialKey?: string;
};

export const INTELLIGENCE_SOURCE_CONTRACTS: IntelligenceSourceContract[] = [
  {
    id: "ookla-open-data",
    label: "Speedtest by Ookla Open Data",
    url: "https://registry.opendata.aws/speedtest-global-performance/",
    scope: "Global fixed and mobile network performance tiles.",
    cadence: "Quarterly",
    evidence: "Measured performance; radio technology is not established.",
    methodology:
      "Aggregate GPS-quality fixed and mobile performance tiles to a declared city geography.",
    gapReason:
      "Sparse tests do not prove no service, and mobile throughput does not prove 5G coverage.",
    snapshotPaths: [
      "data/raw/cities/enrichment/ookla/2025-10-01_performance_mobile_tiles.parquet",
      "data/raw/cities/enrichment/ookla/2025-10-01_performance_fixed_tiles.parquet",
    ],
    access: "public_bulk",
  },
  {
    id: "mlab-ndt",
    label: "Measurement Lab NDT",
    url: "https://www.measurementlab.net/data/",
    scope: "Global user-initiated network performance measurements.",
    cadence: "Daily publication; monthly EconMap aggregation",
    evidence: "Measured download, upload, latency, loss, and sample counts.",
    methodology:
      "Aggregate curated NDT measurements to city geographies while publishing sample counts and periods.",
    gapReason:
      "No tests in a city-period is an observation gap and does not establish network unavailability.",
    snapshotPaths: ["data/raw/cities/intelligence/mlab.json"],
    access: "credential",
    credentialKey: "GOOGLE_APPLICATION_CREDENTIALS",
  },
  {
    id: "ripe-atlas",
    label: "RIPE Atlas",
    url: "https://atlas.ripe.net/docs/apis/",
    scope: "Global probe-based ping, traceroute, DNS, TLS, and HTTP measurements.",
    cadence: "Continuous; daily EconMap snapshot",
    evidence: "Measured network reachability and path quality.",
    methodology:
      "Aggregate public probe results by obfuscated probe geography and retain probe and measurement counts.",
    gapReason:
      "Probe density is uneven, so absent probes or results cannot establish service quality.",
    snapshotPaths: ["data/raw/cities/intelligence/ripe-atlas.json"],
    access: "public_api",
  },
  {
    id: "fcc-bdc",
    label: "FCC Broadband Data Collection",
    url: "https://broadbandmap.fcc.gov/",
    scope: "United States provider-reported fixed and mobile technology coverage.",
    cadence: "Biannual",
    evidence: "Regulator-published provider reports including 5G-NR.",
    methodology:
      "Intersect technology-specific FCC coverage polygons with declared city geographies.",
    gapReason:
      "The source covers the United States only and represents modelled provider-reported outdoor coverage.",
    snapshotPaths: ["data/raw/cities/intelligence/fcc-bdc.json"],
    access: "manual",
  },
  {
    id: "gsma-coverage",
    label: "GSMA Network Coverage Maps",
    url: "https://www.gsma.com/coverage/",
    scope: "Global operator-submitted mobile technology coverage.",
    cadence: "Operator updates",
    evidence: "Operator-reported technology coverage.",
    methodology:
      "Intersect licensed technology-specific coverage geometry with declared city geographies.",
    gapReason:
      "The global raster dataset is licensed and cannot be shipped until authorized source data is supplied.",
    snapshotPaths: ["data/raw/cities/intelligence/gsma.json"],
    access: "licensed",
  },
  {
    id: "ghsl-urban-centres",
    label: "Global Human Settlement Layer Urban Centres",
    url: "https://human-settlement.emergency.copernicus.eu/",
    scope: "Global urban-centre geometry, population, and built-up classifications.",
    cadence: "Release cycle",
    evidence: "Satellite and census-derived harmonized urban geography.",
    methodology:
      "Match canonical city points and names to GHSL urban-centre polygons without replacing administrative identity.",
    gapReason:
      "Urban-centre metrics remain unavailable until the official GHSL vector and statistics package is present.",
    snapshotPaths: [
      "data/raw/cities/enrichment/ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_vector.zip",
      "data/raw/cities/enrichment/ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_statistics/GHS_WUP_MTUC_MT_GLOBE_R2025A_v1_1.xlsx",
    ],
    access: "manual",
  },
  {
    id: "openaq",
    label: "OpenAQ",
    url: "https://docs.openaq.org/",
    scope: "Global station-backed air-quality measurements.",
    cadence: "Near real time; daily EconMap snapshot",
    evidence: "Measured environmental observations.",
    methodology:
      "Select active stations within declared city geographies and publish parameter, station, and sample counts.",
    gapReason:
      "A city without a matched station has unknown air quality rather than clean air.",
    snapshotPaths: ["data/raw/cities/intelligence/openaq.json"],
    access: "credential",
    credentialKey: "OPENAQ_API_KEY",
  },
  {
    id: "nasa-firms",
    label: "NASA FIRMS",
    url: "https://firms.modaps.eosdis.nasa.gov/active_fire/",
    scope: "Global satellite-detected active fires and thermal anomalies.",
    cadence: "Near real time; daily EconMap snapshot",
    evidence: "Satellite-detected operational hazard.",
    methodology:
      "Match recent VIIRS and MODIS detections to city geographies or a published radius.",
    gapReason:
      "No detection is not proof of no fire, and cloud or satellite timing can affect observation.",
    snapshotPaths: ["data/raw/cities/intelligence/nasa-firms.json"],
    access: "credential",
    credentialKey: "FIRMS_MAP_KEY",
  },
  {
    id: "usgs-earthquakes",
    label: "USGS Earthquake Hazards Program",
    url: "https://earthquake.usgs.gov/earthquakes/feed/",
    scope: "Global reviewed and automatic earthquake event feeds.",
    cadence: "Continuous; daily EconMap snapshot",
    evidence: "Authoritative earthquake event observation.",
    methodology:
      "Match GeoJSON earthquake events to cities using event distance, magnitude, and a published radius.",
    gapReason:
      "Feed absence or an unmatched event is not a general seismic-risk assessment.",
    snapshotPaths: ["data/raw/cities/intelligence/usgs-earthquakes.json"],
    access: "public_api",
  },
];

async function firstExisting(
  rootDir: string,
  relativePaths: readonly string[],
): Promise<{ relativePath: string; modifiedAt: string } | null> {
  for (const relativePath of relativePaths) {
    try {
      const stat = await fs.stat(path.join(rootDir, relativePath));
      if (stat.isFile() && stat.size > 0) {
        return { relativePath, modifiedAt: stat.mtime.toISOString() };
      }
    } catch {
      // Absence is represented by an explicit source status below.
    }
  }
  return null;
}

export async function assessIntelligenceSources(options: {
  rootDir: string;
  env: Record<string, string | undefined>;
  checkedAt: string;
}): Promise<IntelligenceSourceStatus[]> {
  const statuses: IntelligenceSourceStatus[] = [];

  for (const contract of INTELLIGENCE_SOURCE_CONTRACTS) {
    const existing = await firstExisting(options.rootDir, contract.snapshotPaths);
    if (existing) {
      statuses.push(
        intelligenceSourceStatusSchema.parse({
          sourceId: contract.id,
          status: "available",
          checkedAt: options.checkedAt,
          snapshotDate: existing.modifiedAt,
          detail: `Local source snapshot available at ${existing.relativePath}.`,
        }),
      );
      continue;
    }

    if (contract.access === "licensed") {
      statuses.push(
        intelligenceSourceStatusSchema.parse({
          sourceId: contract.id,
          status: "licensed",
          checkedAt: options.checkedAt,
          detail: contract.gapReason,
        }),
      );
      continue;
    }

    if (
      contract.access === "credential" &&
      contract.credentialKey &&
      !options.env[contract.credentialKey]
    ) {
      statuses.push(
        intelligenceSourceStatusSchema.parse({
          sourceId: contract.id,
          status: "credential_required",
          checkedAt: options.checkedAt,
          detail: `${contract.credentialKey} is not configured. ${contract.gapReason}`,
        }),
      );
      continue;
    }

    const status =
      contract.access === "public_api" || contract.access === "credential"
        ? "not_configured"
        : "unavailable";
    statuses.push(
      intelligenceSourceStatusSchema.parse({
        sourceId: contract.id,
        status,
        checkedAt: options.checkedAt,
        detail: `No normalized local snapshot is present. ${contract.gapReason}`,
      }),
    );
  }

  return statuses;
}
