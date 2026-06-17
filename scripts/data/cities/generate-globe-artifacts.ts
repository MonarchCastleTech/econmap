import fs from "node:fs/promises";
import path from "node:path";

import {
  baseImageryCatalogSchema,
  commandCenterManifestSchema,
  globeLayerManifestSchema,
  globeManifestSchema,
} from "../../../src/domain/command-center-schemas";

type GenerateGlobeArtifactsOptions = {
  baseImagerySourceDir?: string;
  bulkSourceManifest?: BulkSourceManifestLike;
  cityManifestFile?: string;
  cityRegistryFile?: string;
  cityMapDir?: string;
  commandCenterDir?: string;
  datasetWorkspacesDir?: string;
  globeDir?: string;
  logger?: Pick<Console, "log">;
  now?: string;
  processedIndexesDir?: string;
};

const DEFAULT_CITIES_DIR = path.join(process.cwd(), "src", "data", "generated", "cities");
const DEFAULT_CITY_MANIFEST_FILE = path.join(DEFAULT_CITIES_DIR, "manifest.json");
const DEFAULT_CITY_REGISTRY_FILE = path.join(DEFAULT_CITIES_DIR, "registry.json");
const DEFAULT_CITY_MAP_DIR = path.join(DEFAULT_CITIES_DIR, "map");
const DEFAULT_COMMAND_CENTER_DIR = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "command-center",
);
const DEFAULT_GLOBE_DIR = path.join(process.cwd(), "public", "data", "globe");
const DEFAULT_BASE_IMAGERY_SOURCE_DIR = path.join(process.cwd(), "data", "raw", "globe-imagery");
const DEFAULT_PROCESSED_INDEXES_DIR = path.join(process.cwd(), "data", "processed", "cities", "indexes");
const DEFAULT_BOOT_PREVIEW_FEATURE_LIMIT = 15_000;

type BulkSourceEntryLike = {
  exists: boolean;
  [key: string]: unknown;
};

type BulkSourceManifestLike = Record<string, Record<string, BulkSourceEntryLike>>;

type SourceMeta = {
  id: string;
  name: string;
  updatedAt: string;
  coverage: string;
  methodology: string;
  url?: string;
};

type CityManifest = {
  generatedAt: string;
  totalCityCount: number;
  processedCityCount: number;
  countryCounts: Record<string, number>;
  entityCountsByType: Record<string, number>;
  exactSiteCountsByType?: Record<string, number>;
  sourceCounts?: Record<string, number>;
};

type LayerSeed = {
  id: string;
  label: string;
  family:
    | "Base Earth"
    | "Atmosphere"
    | "Hydrology"
    | "Connectivity"
    | "Transport"
    | "Economic / Infrastructure"
    | "Political / Admin"
    | "Signals / Detection";
  sourceLabels: string[];
  tier: "boot" | "interactive" | "deep" | "city-focus";
  supportsTime: boolean;
  supportsCityFocus: boolean;
  inputRelativePath: string;
  bootPreviewFeatureLimit?: number;
  processedSources?: Array<{
    entityTypes?: string[];
    indexFile: string;
    sourceLabel: string;
  }>;
};

const LAYER_SEEDS: LayerSeed[] = [
  {
    id: "cities",
    label: "Cities",
    family: "Political / Admin",
    sourceLabels: ["GeoNames"],
    tier: "boot",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: "cities.geojson",
    bootPreviewFeatureLimit: 5_000,
  },
  {
    id: "airports",
    label: "Airports",
    family: "Transport",
    sourceLabels: ["OurAirports"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "airports.geojson"),
    bootPreviewFeatureLimit: 4_000,
  },
  {
    id: "ports",
    label: "Ports",
    family: "Transport",
    sourceLabels: ["UN/LOCODE", "World Port Index"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "ports.geojson"),
    processedSources: [
      {
        indexFile: "wpi-ports.json",
        sourceLabel: "World Port Index",
        entityTypes: ["port"],
      },
      {
        indexFile: "unlocode-entities.json",
        sourceLabel: "UN/LOCODE",
        entityTypes: ["port"],
      },
    ],
  },
  {
    id: "rail-hubs",
    label: "Rail Hubs",
    family: "Transport",
    sourceLabels: ["UN/LOCODE"],
    tier: "deep",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "rail-hubs.geojson"),
    processedSources: [
      {
        indexFile: "unlocode-entities.json",
        sourceLabel: "UN/LOCODE",
        entityTypes: ["rail_hub"],
      },
    ],
  },
  {
    id: "logistics-hubs",
    label: "Logistics Hubs",
    family: "Economic / Infrastructure",
    sourceLabels: ["UN/LOCODE"],
    tier: "deep",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "logistics-hubs.geojson"),
    processedSources: [
      {
        indexFile: "unlocode-entities.json",
        sourceLabel: "UN/LOCODE",
        entityTypes: ["logistics_hub"],
      },
    ],
  },
  {
    id: "transit-feeds",
    label: "Transit Feeds",
    family: "Transport",
    sourceLabels: ["Mobility Database"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "transit-feeds.geojson"),
    bootPreviewFeatureLimit: 4_000,
    processedSources: [
      {
        indexFile: "transit-feeds.json",
        sourceLabel: "Mobility Database",
        entityTypes: ["transit_feed"],
      },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    family: "Economic / Infrastructure",
    sourceLabels: ["WRI Global Power Plant Database"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "utilities.geojson"),
    bootPreviewFeatureLimit: 4_000,
    processedSources: [
      {
        indexFile: "power-plants.json",
        sourceLabel: "WRI Global Power Plant Database",
        entityTypes: ["utility"],
      },
    ],
  },
  {
    id: "connectivity-fixed",
    label: "Fixed Broadband",
    family: "Connectivity",
    sourceLabels: ["Ookla"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "connectivity-fixed.geojson"),
    bootPreviewFeatureLimit: 4_000,
    processedSources: [
      {
        indexFile: "connectivity-fixed.json",
        sourceLabel: "Ookla",
        entityTypes: ["connectivity_fixed"],
      },
    ],
  },
  {
    id: "connectivity-mobile",
    label: "Mobile Broadband",
    family: "Connectivity",
    sourceLabels: ["Ookla"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "connectivity-mobile.geojson"),
    bootPreviewFeatureLimit: 4_000,
    processedSources: [
      {
        indexFile: "connectivity-mobile.json",
        sourceLabel: "Ookla",
        entityTypes: ["connectivity_mobile"],
      },
    ],
  },
  {
    id: "air-quality",
    label: "Air Quality",
    family: "Atmosphere",
    sourceLabels: ["WHO Air Quality"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "air-quality.geojson"),
    processedSources: [
      {
        indexFile: "air-quality.json",
        sourceLabel: "WHO Air Quality",
        entityTypes: ["air_quality"],
      },
    ],
  },
  {
    id: "water-stress",
    label: "Water Stress",
    family: "Hydrology",
    sourceLabels: ["WRI Aqueduct"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "water-stress.geojson"),
    processedSources: [
      {
        indexFile: "water-stress.json",
        sourceLabel: "WRI Aqueduct",
        entityTypes: ["water_stress"],
      },
    ],
  },
  {
    id: "research",
    label: "Research Anchors",
    family: "Economic / Infrastructure",
    sourceLabels: ["ROR"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    inputRelativePath: path.join("entities", "research.geojson"),
    processedSources: [
      {
        indexFile: "research-orgs.json",
        sourceLabel: "ROR",
        entityTypes: ["research"],
      },
    ],
  },
];

type BaseImagerySeed = {
  id: string;
  label: string;
  family: "Base Maps" | "Clouds" | "Satellite";
  attribution: string[];
  assetPathTemplate: string;
  defaultOpacity: number;
  minZoom: number;
  maxZoom: number;
};

type DatasetInventorySeed = {
  bulkGroupKey?: string;
  id: string;
  identifiedSources?: Array<{
    label: string;
    purpose: string;
    sourceUrl: string;
  }>;
  imageryLayerId?: string;
  label: string;
  processedIndexFile?: string;
  sourceMatchLabels?: string[];
  sourceLabels: string[];
};

const BASE_IMAGERY_SEEDS: BaseImagerySeed[] = [
  {
    id: "true-color",
    label: "True Color",
    family: "Base Maps",
    attribution: ["NASA GIBS"],
    assetPathTemplate: "/data/globe/base-imagery/true-color/{date}/{z}/{x}/{y}.jpg",
    defaultOpacity: 1,
    minZoom: 0,
    maxZoom: 8,
  },
  {
    id: "night-lights",
    label: "Night Lights",
    family: "Satellite",
    attribution: ["NASA Black Marble"],
    assetPathTemplate: "/data/globe/base-imagery/night-lights/{date}/{z}/{x}/{y}.jpg",
    defaultOpacity: 1,
    minZoom: 0,
    maxZoom: 8,
  },
  {
    id: "clouds",
    label: "Clouds",
    family: "Clouds",
    attribution: ["NASA GIBS"],
    assetPathTemplate: "/data/globe/base-imagery/clouds/{date}/{z}/{x}/{y}.png",
    defaultOpacity: 0.72,
    minZoom: 0,
    maxZoom: 8,
  },
];

const DATASET_INVENTORY_SEEDS: DatasetInventorySeed[] = [
  {
    id: "geonames",
    label: "GeoNames",
    bulkGroupKey: "geonames",
    sourceLabels: ["GeoNames"],
  },
  {
    id: "ourairports",
    label: "OurAirports",
    bulkGroupKey: "ourAirports",
    sourceLabels: ["OurAirports"],
  },
  {
    id: "un-locode",
    label: "UN/LOCODE",
    bulkGroupKey: "unlocode",
    processedIndexFile: "unlocode-entities.json",
    sourceLabels: ["UN/LOCODE"],
  },
  {
    id: "world-port-index",
    label: "World Port Index",
    bulkGroupKey: "worldPortIndex",
    processedIndexFile: "wpi-ports.json",
    sourceLabels: ["World Port Index"],
  },
  {
    id: "wri-global-power-plant-database",
    label: "WRI Global Power Plant Database",
    bulkGroupKey: "wri",
    processedIndexFile: "power-plants.json",
    sourceLabels: ["WRI Global Power Plant Database"],
  },
  {
    id: "research-organizations-registry",
    label: "Research Organizations Registry",
    bulkGroupKey: "researchOrganizations",
    processedIndexFile: "research-orgs.json",
    sourceMatchLabels: ["ROR", "Research Organization Registry"],
    sourceLabels: ["ROR"],
  },
  {
    id: "who-air-quality",
    label: "WHO Air Quality",
    bulkGroupKey: "who",
    sourceLabels: ["WHO Air Quality"],
  },
  {
    id: "natural-earth",
    label: "Natural Earth",
    bulkGroupKey: "naturalEarth",
    sourceLabels: ["Natural Earth"],
  },
  {
    id: "mobility-database",
    label: "Mobility Database",
    bulkGroupKey: "mobilityDatabase",
    sourceLabels: ["Mobility Database"],
  },
  {
    id: "peeringdb",
    label: "PeeringDB",
    sourceLabels: ["PeeringDB"],
    identifiedSources: [
      {
        label: "PeeringDB REST API",
        purpose: "Public IXP, facility, and interconnection registry for city-scale internet exchange mapping.",
        sourceUrl: "https://docs.peeringdb.com/api_specs/",
      },
    ],
  },
  {
    id: "overture-divisions",
    label: "Overture Divisions",
    sourceLabels: ["Overture Maps", "Overture Divisions"],
    identifiedSources: [
      {
        label: "Overture Divisions docs",
        purpose: "Global city, admin, and neighborhood boundary source for city shells and selection surfaces.",
        sourceUrl: "https://docs.overturemaps.org/guides/divisions/",
      },
    ],
  },
  {
    id: "overture-places",
    label: "Overture Places",
    sourceLabels: ["Overture Maps", "Overture Places"],
    identifiedSources: [
      {
        label: "Overture Places docs",
        purpose: "Global place and civic POI source for hospitals, schools, police, fire, and government facilities.",
        sourceUrl: "https://docs.overturemaps.org/guides/places/",
      },
    ],
  },
  {
    id: "overture-buildings",
    label: "Overture Buildings",
    sourceLabels: ["Overture Maps", "Overture Buildings"],
    identifiedSources: [
      {
        label: "Overture Buildings docs",
        purpose: "Global building-footprint source for warehouses, built-environment coverage, and data-center building discovery.",
        sourceUrl: "https://docs.overturemaps.org/guides/buildings/",
      },
    ],
  },
  {
    id: "overture-transportation",
    label: "Overture Transportation",
    sourceLabels: ["Overture Maps", "Overture Transportation"],
    identifiedSources: [
      {
        label: "Overture Transportation docs",
        purpose: "Global road, rail, and water transport network source for roads, bridges, tunnels, and network skeletons.",
        sourceUrl: "https://docs.overturemaps.org/guides/transportation/",
      },
    ],
  },
  {
    id: "geofabrik-openstreetmap",
    label: "Geofabrik OpenStreetMap",
    sourceLabels: ["Geofabrik", "OpenStreetMap"],
    identifiedSources: [
      {
        label: "Geofabrik OpenStreetMap Extracts",
        purpose:
          "Daily OpenStreetMap extracts for roads, bridges, tunnels, schools, police, fire, government, industrial, warehouse, and military-public-data parsing.",
        sourceUrl: "https://download.geofabrik.de/",
      },
    ],
  },
  {
    id: "openinframap",
    label: "OpenInfraMap",
    sourceLabels: ["OpenInfraMap", "OpenStreetMap"],
    identifiedSources: [
      {
        label: "OpenInfraMap",
        purpose: "OSM-derived power and telecom infrastructure source for substations, transmission, and backbone evidence.",
        sourceUrl: "https://openinframap.org/about",
      },
    ],
  },
  {
    id: "healthsites",
    label: "Healthsites",
    sourceLabels: ["Healthsites", "OpenStreetMap"],
    identifiedSources: [
      {
        label: "Healthsites",
        purpose: "Open healthcare facility commons for hospital and clinic coverage aligned with OpenStreetMap.",
        sourceUrl: "https://healthsites.io/map",
      },
    ],
  },
  {
    id: "world-bank-sez",
    label: "World Bank SEZ",
    sourceLabels: ["World Bank SEZ"],
    identifiedSources: [
      {
        label: "World Bank SEZ Data Catalog",
        purpose: "Public special economic zone catalog for identified SEZ coverage and queueing.",
        sourceUrl: "https://datacatalog.worldbank.org/search/dataset/0037742/special-economic-zones-sez",
      },
    ],
  },
  {
    id: "gleif",
    label: "GLEIF",
    bulkGroupKey: "gleif",
    sourceLabels: ["GLEIF"],
  },
  {
    id: "ghsl",
    label: "GHSL",
    bulkGroupKey: "ghsl",
    sourceLabels: ["GHSL"],
  },
  {
    id: "oecd",
    label: "OECD",
    bulkGroupKey: "oecd",
    sourceLabels: ["OECD"],
  },
  {
    id: "eurostat",
    label: "Eurostat",
    bulkGroupKey: "eurostat",
    sourceLabels: ["Eurostat"],
  },
  {
    id: "aqueduct",
    label: "WRI Aqueduct",
    bulkGroupKey: "aqueduct",
    sourceLabels: ["WRI Aqueduct"],
  },
  {
    id: "carbon-monitor",
    label: "Carbon Monitor",
    bulkGroupKey: "carbonMonitor",
    sourceLabels: ["Carbon Monitor"],
  },
  {
    id: "ookla",
    label: "Ookla",
    bulkGroupKey: "ookla",
    sourceLabels: ["Ookla"],
  },
  {
    id: "jrc-global-surface-water",
    label: "JRC Global Surface Water",
    bulkGroupKey: "jrc",
    sourceLabels: ["JRC Global Surface Water"],
  },
  {
    id: "nasa-gibs-true-color",
    label: "NASA GIBS True Color",
    imageryLayerId: "true-color",
    sourceLabels: ["NASA GIBS"],
  },
  {
    id: "nasa-black-marble-night-lights",
    label: "NASA Black Marble Night Lights",
    imageryLayerId: "night-lights",
    sourceLabels: ["NASA Black Marble"],
  },
  {
    id: "nasa-gibs-clouds",
    label: "NASA GIBS Clouds",
    imageryLayerId: "clouds",
    sourceLabels: ["NASA GIBS"],
  },
];

type RawBaseImageryMetadata = {
  availableDates?: string[];
  format?: string;
  maxZoom?: number;
  minZoom?: number;
};

type ProcessedSpatialRecord = Record<string, unknown> & {
  entityId?: string;
  entitySubtype?: string;
  entityType?: string;
  exactSite?: boolean;
  latitude?: number;
  longitude?: number;
  name?: string;
};

function buildSourceSummary(cityManifest: CityManifest, generatedAt: string) {
  return Object.entries(cityManifest.sourceCounts ?? {}).map(([sourceName, count]) => ({
    label: sourceName,
    value: `${count} city bundles`,
    sources: [
      {
        id: sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: sourceName,
        updatedAt: generatedAt,
        coverage: "accepted_dataset_rows",
        methodology: "Published from accepted dataset rows during offline build",
      } satisfies SourceMeta,
    ],
  }));
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listChildDirectories(dirPath: string) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

async function readRawBaseImageryMetadata(layerDir: string): Promise<RawBaseImageryMetadata | null> {
  const metadataFile = path.join(layerDir, "metadata.json");
  if (!(await fileExists(metadataFile))) {
    return null;
  }

  return JSON.parse(await fs.readFile(metadataFile, "utf-8")) as RawBaseImageryMetadata;
}

async function resolveBulkSourceManifest(manifest?: BulkSourceManifestLike): Promise<BulkSourceManifestLike> {
  if (manifest) {
    return manifest;
  }

  const bulkSourceManifestModule = await import("./bulk-source-manifest");
  return bulkSourceManifestModule.getBulkSourceManifest() as unknown as BulkSourceManifestLike;
}

function hasExistingBulkGroupEntry(manifest: BulkSourceManifestLike, groupKey?: string) {
  if (!groupKey) {
    return false;
  }

  const group = manifest[groupKey];
  if (!group) {
    return false;
  }

  return Object.values(group).some((entry) => entry?.exists);
}

function getBulkGroupEntries(manifest: BulkSourceManifestLike, groupKey?: string) {
  if (!groupKey) {
    return [];
  }

  const group = manifest[groupKey];
  if (!group) {
    return [];
  }

  return Object.values(group)
    .filter((entry): entry is BulkSourceEntryLike => Boolean(entry))
    .sort((left, right) => {
      const leftPath = typeof left.relativePath === "string" ? left.relativePath : "";
      const rightPath = typeof right.relativePath === "string" ? right.relativePath : "";
      return leftPath.localeCompare(rightPath);
    });
}

async function readProcessedIndexCount(indexesDir: string, indexFile?: string) {
  if (!indexFile) {
    return { count: 0, exists: false };
  }

  const filePath = path.join(indexesDir, indexFile);
  if (!(await fileExists(filePath))) {
    return { count: 0, exists: false };
  }

  const payload = JSON.parse(await fs.readFile(filePath, "utf-8")) as unknown;
  if (Array.isArray(payload)) {
    return { count: payload.length, exists: true };
  }

  if (payload && typeof payload === "object") {
    return { count: Object.keys(payload).length, exists: true };
  }

  return { count: 0, exists: true };
}

async function readProcessedLayerFeatures(indexesDir: string, seed: LayerSeed) {
  const candidateSources = seed.processedSources ?? [];
  if (candidateSources.length === 0) {
    return {
      features: [],
      sourceLabels: [] as string[],
    };
  }

  const featureCollections = await Promise.all(
    candidateSources.map(async ({ entityTypes = [], indexFile, sourceLabel }) => {
      const filePath = path.join(indexesDir, indexFile);
      if (!(await fileExists(filePath))) {
        return {
          features: [],
          sourceLabel,
        };
      }

      const payload = JSON.parse(await fs.readFile(filePath, "utf-8")) as unknown;
      const records = Array.isArray(payload) ? (payload as ProcessedSpatialRecord[]) : [];
      const desiredEntityTypes = new Set(entityTypes);
      const features = records
        .filter((record) => {
          if (typeof record.latitude !== "number" || typeof record.longitude !== "number") {
            return false;
          }

          if (desiredEntityTypes.size === 0) {
            return true;
          }

          return record.entityType ? desiredEntityTypes.has(record.entityType) : false;
        })
        .map((record) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [record.longitude, record.latitude],
          },
          properties: {
            ...record,
            label: typeof record.name === "string" ? record.name : record.entityId ?? seed.label,
            geometryMode: "exact",
            exactSite: record.exactSite ?? true,
            sourceLabels: [sourceLabel],
          },
        }));

      return {
        features,
        sourceLabel,
      };
    }),
  );

  return {
    features: featureCollections.flatMap((collection) => collection.features),
    sourceLabels: featureCollections
      .filter((collection) => collection.features.length > 0)
      .map((collection) => collection.sourceLabel),
  };
}

function summarizeBulkGroup(manifest: BulkSourceManifestLike, groupKey?: string) {
  if (!groupKey) {
    return {
      fileCount: 0,
      totalSizeBytes: 0,
    };
  }

  const group = manifest[groupKey];
  if (!group) {
    return {
      fileCount: 0,
      totalSizeBytes: 0,
    };
  }

  const existingEntries = Object.values(group).filter((entry) => entry?.exists);
  return {
    fileCount: existingEntries.length,
    totalSizeBytes: existingEntries.reduce((sum, entry) => {
      const sizeBytes = typeof entry.sizeBytes === "number" ? entry.sizeBytes : 0;
      return sum + sizeBytes;
    }, 0),
  };
}

function formatSurfaceList(websiteSurfaces: string[]) {
  if (websiteSurfaces.length === 1) {
    return websiteSurfaces[0];
  }

  return `${websiteSurfaces.slice(0, -1).join(", ")} and ${websiteSurfaces.at(-1)}`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatBytes(value: number) {
  if (value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 100 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function getSourceMatchLabels(seed: DatasetInventorySeed) {
  return Array.from(new Set([...(seed.sourceMatchLabels ?? []), ...seed.sourceLabels]));
}

function buildDatasetWorkspaceNotes({
  hasDownloadedSource,
  identifiedSourceCount,
  imageryDateCount,
  processedIndexCount,
  processedIndexExists,
  processedIndexFile,
  websiteSurfaces,
}: {
  hasDownloadedSource: boolean;
  identifiedSourceCount: number;
  imageryDateCount: number;
  processedIndexCount: number;
  processedIndexExists: boolean;
  processedIndexFile?: string;
  websiteSurfaces: string[];
}) {
  const notes: string[] = [];

  if (websiteSurfaces.length === 1 && websiteSurfaces[0] === "dataset workspace") {
    notes.push("Dataset workspace is the only published website surface for this dataset in the current build.");
  }

  if (processedIndexFile) {
    if (!processedIndexExists) {
      notes.push("Processed index file is not published for this dataset in the current build.");
    } else if (processedIndexCount === 0) {
      notes.push("Processed index is empty in this build even though the local source pack exists.");
    }
  } else {
    notes.push("No processed index is published for this dataset in the current build.");
  }

  if (!hasDownloadedSource && imageryDateCount === 0) {
    notes.push(
      identifiedSourceCount > 0
        ? "Real public source is identified but no local source pack entry is present in this build."
        : "No local source pack entry is present in this build.",
    );
  }

  if (imageryDateCount > 0) {
    notes.push(
      `${formatCount(imageryDateCount)} shipped ${imageryDateCount === 1 ? "date window is" : "date windows are"} published for this imagery family.`,
    );
  }

  return notes;
}

function getAssetExtensionForRawImageryFormat(format?: string) {
  switch (format) {
    case "image/png":
      return "png";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function getExpectedFeatureCount(seed: LayerSeed, cityManifest: CityManifest) {
  if (seed.id === "cities") {
    return cityManifest.totalCityCount;
  }

  const exactSiteEntityTypeByLayerId: Record<string, string> = {
    airports: "airport",
    ports: "port",
    "rail-hubs": "rail_hub",
    "logistics-hubs": "logistics_hub",
    utilities: "utility",
    research: "research",
  };

  const entityType = exactSiteEntityTypeByLayerId[seed.id];
  if (!entityType) {
    return undefined;
  }

  return cityManifest.exactSiteCountsByType?.[entityType];
}

function buildBootPreviewFeatures(features: unknown[], featureLimit = DEFAULT_BOOT_PREVIEW_FEATURE_LIMIT) {
  if (features.length <= featureLimit) {
    return null;
  }

  const nextFeatures: unknown[] = [];
  const step = features.length / featureLimit;

  for (let index = 0; index < featureLimit; index += 1) {
    nextFeatures.push(features[Math.floor(index * step)]);
  }

  return nextFeatures;
}

type ShardKey = "world" | "nw" | "ne" | "sw" | "se";

function extractFeatureCoordinates(feature: Record<string, unknown>) {
  const geometry = feature.geometry as Record<string, unknown> | undefined;
  if (!geometry) {
    return null;
  }

  if (geometry.type === "Point") {
    const coordinates = geometry.coordinates as [number, number] | undefined;
    if (
      Array.isArray(coordinates) &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      return coordinates;
    }
  }

  return null;
}

function resolveShardKey(longitude: number, latitude: number): Exclude<ShardKey, "world"> {
  if (latitude >= 0) {
    return longitude >= 0 ? "ne" : "nw";
  }

  return longitude >= 0 ? "se" : "sw";
}

function buildFeatureShards(features: Record<string, unknown>[]) {
  const shards: Record<ShardKey, Record<string, unknown>[]> = {
    world: [...features],
    nw: [],
    ne: [],
    sw: [],
    se: [],
  };

  for (const feature of features) {
    const coordinates = extractFeatureCoordinates(feature);
    if (!coordinates) {
      continue;
    }

    const [longitude, latitude] = coordinates;
    shards[resolveShardKey(longitude, latitude)].push(feature);
  }

  return Object.entries(shards).filter(([, shardFeatures]) => shardFeatures.length > 0) as Array<
    [ShardKey, Record<string, unknown>[]]
  >;
}

function resolveDefaultBaseImageryLayerId(
  layers: Array<{
    id: string;
    status: string;
  }>,
) {
  const publishedLayerIds = new Set(
    layers.filter((layer) => layer.status === "published").map((layer) => layer.id),
  );

  if (publishedLayerIds.has("night-lights")) {
    return "night-lights";
  }

  if (publishedLayerIds.has("true-color")) {
    return "true-color";
  }

  return layers[0]?.id ?? "true-color";
}

export async function generateGlobeArtifacts(options: GenerateGlobeArtifactsOptions = {}) {
  const baseImagerySourceDir = options.baseImagerySourceDir ?? DEFAULT_BASE_IMAGERY_SOURCE_DIR;
  const bulkSourceManifest = await resolveBulkSourceManifest(options.bulkSourceManifest);
  const cityManifestFile = options.cityManifestFile ?? DEFAULT_CITY_MANIFEST_FILE;
  const cityRegistryFile = options.cityRegistryFile ?? DEFAULT_CITY_REGISTRY_FILE;
  const cityMapDir = options.cityMapDir ?? DEFAULT_CITY_MAP_DIR;
  const commandCenterDir = options.commandCenterDir ?? DEFAULT_COMMAND_CENTER_DIR;
  const datasetWorkspacesDir = options.datasetWorkspacesDir ?? path.join(commandCenterDir, "datasets");
  const globeDir = options.globeDir ?? DEFAULT_GLOBE_DIR;
  const logger = options.logger ?? console;
  const generatedAt = options.now ?? new Date().toISOString();
  const processedIndexesDir = options.processedIndexesDir ?? DEFAULT_PROCESSED_INDEXES_DIR;

  await fs.mkdir(commandCenterDir, { recursive: true });
  await fs.mkdir(datasetWorkspacesDir, { recursive: true });
  await fs.mkdir(globeDir, { recursive: true });
  await fs.mkdir(path.join(globeDir, "base-imagery"), { recursive: true });
  const naturalEarthReferencePublished =
    (await fileExists(path.join(globeDir, "reference", "natural-earth-countries.geojson"))) &&
    (await fileExists(path.join(globeDir, "reference", "natural-earth-admin1.geojson")));

  const cityManifest = JSON.parse(await fs.readFile(cityManifestFile, "utf-8")) as CityManifest;
  const cityRegistry = JSON.parse(await fs.readFile(cityRegistryFile, "utf-8")) as Array<{
    cityId: string;
    countryIso3: string;
  }>;

  const layerOutputs: Array<ReturnType<typeof globeLayerManifestSchema.parse>> = [];
  const layerFeatureCounts = new Map<string, number>();

  for (const seed of LAYER_SEEDS) {
    const inputFile = path.join(cityMapDir, seed.inputRelativePath);
    const layerDir = path.join(globeDir, "layers", seed.id);
    const vectorsDir = path.join(layerDir, "vectors");
    const snapshotsDir = path.join(layerDir, "snapshots");
    let featureCount = getExpectedFeatureCount(seed, cityManifest);
    let publishedSourceLabels = [...seed.sourceLabels];
    let shouldPublish = false;
    let outputVectorPayload: string | null = null;

    if (await fileExists(inputFile)) {
      shouldPublish = true;
      outputVectorPayload = await fs.readFile(inputFile, "utf-8");

      if (featureCount === undefined) {
        const featureCollection = JSON.parse(outputVectorPayload) as { features?: unknown[] };
        featureCount = featureCollection.features?.length ?? 0;
      }
    }

    if (!shouldPublish || featureCount === 0) {
      const processedLayer = await readProcessedLayerFeatures(processedIndexesDir, seed);
      if (processedLayer.features.length > 0) {
        shouldPublish = true;
        featureCount = processedLayer.features.length;
        publishedSourceLabels = processedLayer.sourceLabels;
        outputVectorPayload = JSON.stringify(
          {
            type: "FeatureCollection",
            features: processedLayer.features,
          },
          null,
          2,
        );
      }
    }

    if (!shouldPublish || !outputVectorPayload || featureCount === undefined || featureCount === 0) {
      continue;
    }

    await fs.mkdir(vectorsDir, { recursive: true });
    await fs.mkdir(snapshotsDir, { recursive: true });

    const outputVectorFile = path.join(vectorsDir, "current.geojson");
    await fs.writeFile(outputVectorFile, outputVectorPayload);

    let assetPath = `/data/globe/layers/${seed.id}/vectors/current.geojson`;
    let bootAssetPath: string | undefined;
    let bootFeatureCount: number | undefined;
    const featureCollection = JSON.parse(outputVectorPayload) as {
      features?: Record<string, unknown>[];
      type?: string;
    };
    const previewFeatures = buildBootPreviewFeatures(
      featureCollection.features ?? [],
      seed.bootPreviewFeatureLimit,
    );

    if (previewFeatures) {
      const shardsDir = path.join(layerDir, "shards");
      await fs.mkdir(shardsDir, { recursive: true });

      await Promise.all(
        buildFeatureShards(featureCollection.features ?? []).map(async ([shardKey, shardFeatures]) => {
          await fs.writeFile(
            path.join(shardsDir, `${shardKey}.geojson`),
            JSON.stringify(
              {
                type: featureCollection.type ?? "FeatureCollection",
                features: shardFeatures,
              },
              null,
              2,
            ),
          );
        }),
      );

      assetPath = `/data/globe/layers/${seed.id}/shards/{region}.geojson`;
    }

    if (previewFeatures) {
      bootAssetPath = `/data/globe/layers/${seed.id}/vectors/boot.geojson`;
      bootFeatureCount = previewFeatures.length;
      await fs.writeFile(
        path.join(vectorsDir, "boot.geojson"),
        JSON.stringify(
          {
            type: featureCollection.type ?? "FeatureCollection",
            features: previewFeatures,
          },
          null,
          2,
        ),
      );
    }

    const layerMeta = globeLayerManifestSchema.parse({
      id: seed.id,
      label: seed.label,
      family: seed.family,
      sourceLabels: publishedSourceLabels,
      tier: seed.tier,
      supportsTime: seed.supportsTime,
      supportsCityFocus: seed.supportsCityFocus,
      assetPath,
      bootAssetPath,
      bootFeatureCount,
      featureCount,
      defaultOpacity: seed.id === "cities" ? 0.9 : 0.8,
      refreshedAt: generatedAt,
    });

    await fs.writeFile(path.join(layerDir, "meta.json"), JSON.stringify(layerMeta, null, 2));
    await fs.writeFile(
      path.join(snapshotsDir, "summary.json"),
      JSON.stringify(
        {
          generatedAt,
          featureCount,
        },
        null,
        2,
      ),
    );

    layerOutputs.push(layerMeta);
    layerFeatureCounts.set(seed.id, featureCount);
  }

  const baseImageryLayers = await Promise.all(
    BASE_IMAGERY_SEEDS.map(async (seed) => {
      const sourceLayerDir = path.join(baseImagerySourceDir, seed.id);
      const metadata = await readRawBaseImageryMetadata(sourceLayerDir);
      const availableDates = metadata?.availableDates?.length
        ? [...metadata.availableDates].sort((left, right) => left.localeCompare(right))
        : await listChildDirectories(sourceLayerDir);
      const isPublished = availableDates.length > 0;
      const status = isPublished ? "published" : "not_yet_published";

      if (isPublished) {
        const outputLayerDir = path.join(globeDir, "base-imagery", seed.id);
        await fs.mkdir(outputLayerDir, { recursive: true });

        for (const availableDate of availableDates) {
          await fs.cp(path.join(sourceLayerDir, availableDate), path.join(outputLayerDir, availableDate), {
            recursive: true,
            force: true,
          });
        }
      }

      return {
        id: seed.id,
        label: seed.label,
        family: seed.family,
        status,
        availableDates: isPublished ? availableDates : [],
        minZoom: metadata?.minZoom ?? seed.minZoom,
        maxZoom: metadata?.maxZoom ?? seed.maxZoom,
        attribution: seed.attribution,
        assetPathTemplate: seed.assetPathTemplate.replace(
          /\.(jpg|png)$/i,
          `.${getAssetExtensionForRawImageryFormat(metadata?.format)}`,
        ),
        defaultOpacity: seed.defaultOpacity,
      };
    }),
  );

  const baseImageryCatalog = baseImageryCatalogSchema.parse({
    generatedAt,
    defaultLayerId: resolveDefaultBaseImageryLayerId(baseImageryLayers),
    layers: baseImageryLayers,
  });

  const datasetInventory = await Promise.all(
    DATASET_INVENTORY_SEEDS.map(async (seed) => {
      const imageryLayer = seed.imageryLayerId
        ? baseImageryLayers.find((layer) => layer.id === seed.imageryLayerId)
        : null;
      const bulkGroupEntries = getBulkGroupEntries(bulkSourceManifest, seed.bulkGroupKey);
      const identifiedSourceEntries = seed.identifiedSources ?? [];
      const bulkGroupSummary = summarizeBulkGroup(bulkSourceManifest, seed.bulkGroupKey);
      const processedIndex = await readProcessedIndexCount(processedIndexesDir, seed.processedIndexFile);
      const sourceMatchLabels = getSourceMatchLabels(seed);
      const sourceBundleCount = sourceMatchLabels.reduce(
        (sum, sourceLabel) => sum + (cityManifest.sourceCounts?.[sourceLabel] ?? 0),
        0,
      );
      const imageryDateCount = imageryLayer?.status === "published" ? imageryLayer.availableDates.length : 0;
      const hasDownloadedSource = hasExistingBulkGroupEntry(bulkSourceManifest, seed.bulkGroupKey);
      const hasIdentifiedPublicSource = identifiedSourceEntries.length > 0;
      const hasLiveLayer =
        layerOutputs.some(
          (layer) =>
            (layerFeatureCounts.get(layer.id) ?? 0) > 0 &&
            layer.sourceLabels.some((sourceLabel) => sourceMatchLabels.includes(sourceLabel)),
        );

      const websiteSurfaces = ["dataset workspace"];
      if (sourceBundleCount > 0) {
        websiteSurfaces.push("city bundles");
      }
      if (hasLiveLayer) {
        websiteSurfaces.push("globe layer");
      }
      if (imageryLayer?.status === "published") {
        websiteSurfaces.push("base imagery");
      }
      if (seed.id === "natural-earth" && naturalEarthReferencePublished) {
        websiteSurfaces.push("tactical base");
      }

      const status =
        sourceBundleCount > 0 || hasLiveLayer || imageryDateCount > 0 || (seed.id === "natural-earth" && naturalEarthReferencePublished)
          ? ("published_to_website" as const)
          : processedIndex.exists && processedIndex.count > 0
            ? ("processed_with_data" as const)
            : processedIndex.exists
              ? ("processed_without_data" as const)
              : hasDownloadedSource
                ? ("downloaded_local_source" as const)
                : hasIdentifiedPublicSource
                  ? ("identified_public_source" as const)
                  : ("downloaded_local_source" as const);

      const bulkSourceEvidence =
        bulkGroupSummary.fileCount > 0
          ? `Local source pack: ${formatCount(bulkGroupSummary.fileCount)} ${bulkGroupSummary.fileCount === 1 ? "file" : "files"} / ${formatBytes(bulkGroupSummary.totalSizeBytes)}.`
          : "Local source pack is not registered in this build.";
      const publicSourceEvidence =
        identifiedSourceEntries.length > 0
          ? `Public source registry tracks ${formatCount(identifiedSourceEntries.length)} ${identifiedSourceEntries.length === 1 ? "endpoint" : "endpoints"}: ${identifiedSourceEntries.map((entry) => entry.label).join(", ")}.`
          : "";

      const evidenceLead =
        status === "published_to_website"
          ? imageryDateCount > 0
            ? `${formatCount(imageryDateCount)} shipped ${imageryDateCount === 1 ? "date" : "dates"} are surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
            : sourceBundleCount > 0
              ? `${formatCount(sourceBundleCount)} city bundles are surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
              : hasLiveLayer || seed.id === "natural-earth"
                ? `Accepted dataset rows are surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
                : `Surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
          : status === "processed_with_data"
            ? `Processed local index contains ${formatCount(processedIndex.count)} accepted rows and is surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
            : status === "processed_without_data"
              ? `Processed index is empty in this build and is surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
              : status === "identified_public_source"
                ? `Real public source is identified and surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`
                : `Downloaded local source is surfaced on the website via ${formatSurfaceList(websiteSurfaces)}.`;

      const datasetItem = {
        id: seed.id,
        label: seed.label,
        status,
        sourceLabels: seed.sourceLabels,
        detail: [evidenceLead, bulkSourceEvidence, publicSourceEvidence].filter(Boolean).join(" "),
        websiteSurfaces,
        workspacePath: `/datasets/${seed.id}`,
      };

      const sourceRegistryFiles =
        bulkGroupEntries.length > 0
          ? bulkGroupEntries.map((entry) => ({
              relativePath: typeof entry.relativePath === "string" ? entry.relativePath : "",
              purpose: typeof entry.purpose === "string" ? entry.purpose : "",
              sourceUrl: typeof entry.sourceUrl === "string" ? entry.sourceUrl : "",
              required: Boolean(entry.required),
              exists: Boolean(entry.exists),
              sizeBytes: typeof entry.sizeBytes === "number" ? entry.sizeBytes : null,
            }))
          : identifiedSourceEntries.map((entry) => ({
              relativePath: entry.label,
              purpose: entry.purpose,
              sourceUrl: entry.sourceUrl,
              required: false,
              exists: false,
              sizeBytes: null,
            }));

      const datasetWorkspace = {
        generatedAt,
        dataset: datasetItem,
        sourcePack: {
          fileCount: sourceRegistryFiles.length,
          totalSizeBytes: bulkGroupSummary.totalSizeBytes,
          files: sourceRegistryFiles,
        },
        processedIndex: {
          fileName: seed.processedIndexFile ?? null,
          exists: processedIndex.exists,
          rowCount: processedIndex.count,
        },
        cityBundleCount: sourceBundleCount,
        imageryDateCount,
        notes: buildDatasetWorkspaceNotes({
          hasDownloadedSource,
          identifiedSourceCount: identifiedSourceEntries.length,
          imageryDateCount,
          processedIndexCount: processedIndex.count,
          processedIndexExists: processedIndex.exists,
          processedIndexFile: seed.processedIndexFile,
          websiteSurfaces,
        }),
      };

      await fs.writeFile(
        path.join(datasetWorkspacesDir, `${seed.id}.json`),
        JSON.stringify(datasetWorkspace, null, 2),
      );

      return datasetItem;
    }),
  );

  const savedViewSeeds = [
    {
      id: "global-ops",
      label: "Global Ops",
      desiredLayerIds: ["cities", "airports", "ports"],
    },
    {
      id: "infrastructure-watch",
      label: "Infrastructure Watch",
      desiredLayerIds: ["cities", "utilities", "research"],
    },
  ] as const;

  const savedViews = savedViewSeeds.map((view) => {
    const activeLayerIds = view.desiredLayerIds.filter((layerId) => layerOutputs.some((layer) => layer.id === layerId));
    const sourceLabels = Array.from(
      new Set(
        activeLayerIds.flatMap(
          (layerId) => layerOutputs.find((layer) => layer.id === layerId)?.sourceLabels ?? [],
        ),
      ),
    );

    return {
      id: view.id,
      label: view.label,
      activeLayerIds,
      sourceLabels,
    };
  });

  const globeManifest = globeManifestSchema.parse({
    generatedAt,
    layers: layerOutputs,
    baseImageryCatalogPath: "/data/globe/base-imagery/catalog.json",
  });

  const commandCenterManifest = commandCenterManifestSchema.parse({
    generatedAt,
    defaultViewId: "global-ops",
    globalIntelligence: [
      {
        id: "published-city-backbone",
        title: "Published City Backbone",
        body: `${cityManifest.processedCityCount} of ${cityManifest.totalCityCount} cities have published intelligence bundles.`,
        coverageState:
          cityManifest.processedCityCount === cityManifest.totalCityCount
            ? "verified_exact"
            : "partial_coverage",
        sourceLabels: ["GeoNames"],
      },
      {
        id: "layer-availability",
        title: "Operational Layers Online",
        body: `${layerOutputs.length} shipped layers are packaged into the globe manifest.`,
        coverageState: layerOutputs.length > 0 ? "verified_exact" : "not_covered_yet",
        sourceLabels: Array.from(new Set(layerOutputs.flatMap((layer) => layer.sourceLabels))),
      },
    ],
    opsTimeline: [
      {
        id: "offline-build",
        label: "Offline build published",
        timestamp: generatedAt,
        detail: `${cityManifest.totalCityCount} city records and ${layerOutputs.length} operational layers shipped`,
        sourceLabels: ["GeoNames"],
      },
    ],
    savedViews,
    sourceSummary: buildSourceSummary(cityManifest, generatedAt),
    datasetInventory,
    baseImageryCatalogPath: "/data/globe/base-imagery/catalog.json",
  });

  await fs.writeFile(path.join(commandCenterDir, "manifest.json"), JSON.stringify(commandCenterManifest, null, 2));
  await fs.writeFile(path.join(globeDir, "manifest.json"), JSON.stringify(globeManifest, null, 2));
  await fs.writeFile(
    path.join(globeDir, "base-imagery", "catalog.json"),
    JSON.stringify(baseImageryCatalog, null, 2),
  );
  await fs.writeFile(
    path.join(commandCenterDir, "registry-summary.json"),
    JSON.stringify(
      {
        generatedAt,
        // Single source of truth: every global count derives from the city manifest,
        // not an independent recount. registryRowCount is informational only (the raw
        // registry array length) and must NOT be asserted against any manifest field.
        totalCities: cityManifest.totalCityCount,
        countriesCovered: Object.keys(cityManifest.countryCounts).length,
        registryRowCount: cityRegistry.length,
      },
      null,
      2,
    ),
  );

  logger.log(`Generated command-center manifest and ${layerOutputs.length} globe layers.`);

  return {
    commandCenterManifest,
    globeManifest,
  };
}

if (require.main === module) {
  generateGlobeArtifacts().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
