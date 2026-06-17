import { z } from "zod";

import {
  cityCoverageShellSchema,
  cityEntitiesBundleSchema,
  cityMetricSchema,
  citySchema,
  citySourcesBundleSchema,
  cityWorkspaceSchema,
} from "./city-schemas";
import { coverageStateSchema, layerTierSchema, sourceMetaSchema } from "./schemas";

export { coverageStateSchema, layerTierSchema } from "./schemas";

export const layerFamilySchema = z.enum([
  "Base Earth",
  "Atmosphere",
  "Hydrology",
  "Connectivity",
  "Transport",
  "Economic / Infrastructure",
  "Political / Admin",
  "Signals / Detection",
]);

export const tacticalLayerCategorySchema = z.enum([
  "Base Maps",
  "Borders & Labels",
  "Weather",
  "Clouds",
  "Maritime",
  "Aviation",
  "Military / Tactical",
  "Satellite",
  "Environmental",
  "Custom Overlays",
]);

export const layerPublishStatusSchema = z.enum([
  "published",
  "loading",
  "not_yet_published",
  "error",
]);

export const tacticalLayerSourceTypeSchema = z.enum([
  "imagery",
  "raster",
  "vector",
  "geojson",
  "entities",
  "heatmap",
  "user-authored",
]);

export const globeLayerManifestSchema = z.object({
  id: z.string(),
  label: z.string(),
  family: layerFamilySchema.or(z.string()),
  sourceLabels: z.array(z.string()).min(1),
  tier: layerTierSchema,
  supportsTime: z.boolean(),
  supportsCityFocus: z.boolean(),
  assetPath: z.string(),
  bootAssetPath: z.string().optional(),
  // PMTiles wiring: the vector source-layer name inside layers.pmtiles for this layer (= id). Present
  // on layers tiled by scripts/data/globe/generate-pmtiles.ts; absent for excluded layers (cities).
  sourceLayer: z.string().optional(),
  bootFeatureCount: z.number().int().positive().optional(),
  featureCount: z.number().int().positive().optional(),
  defaultOpacity: z.number().min(0).max(1).optional(),
  refreshedAt: z.string().optional(),
});

export const tacticalLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: tacticalLayerCategorySchema.or(z.string()),
  sourceType: tacticalLayerSourceTypeSchema,
  status: layerPublishStatusSchema.default("published"),
  timeEnabled: z.boolean(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  legend: z.string().optional(),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
  attribution: z.array(z.string()).default([]),
  assetPath: z.string().optional(),
  sourceLabels: z.array(z.string()).default([]),
});

export const baseImageryLayerSchema = z.object({
  id: z.string(),
  label: z.string(),
  family: tacticalLayerCategorySchema.or(z.string()),
  status: layerPublishStatusSchema.default("published"),
  availableDates: z.array(z.string()).default([]),
  minZoom: z.number(),
  maxZoom: z.number(),
  attribution: z.array(z.string()).default([]),
  assetPathTemplate: z.string(),
  defaultOpacity: z.number().min(0).max(1).default(1),
});

export const baseImageryCatalogSchema = z.object({
  generatedAt: z.string(),
  defaultLayerId: z.string(),
  layers: z.array(baseImageryLayerSchema),
});

export const cityFootprintCatalogItemSchema = z.object({
  cityId: z.string(),
  slug: z.string(),
  name: z.string(),
  countryIso3: z.string(),
  assetPath: z.string(),
  areaSqKm: z.number().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  matchDistanceMeters: z.number().nonnegative().optional(),
  population: z.number().nonnegative().optional(),
  sourceLabel: z.string(),
});

export const cityFootprintCatalogSchema = z.object({
  generatedAt: z.string(),
  selectionAssetPath: z.string(),
  cities: z.array(cityFootprintCatalogItemSchema),
});

export const cityFootprintSelectionSchema = z.object({
  generatedAt: z.string(),
  selectionAssetPath: z.string(),
});

export const commandCenterSourceSummarySchema = z.object({
  label: z.string(),
  value: z.string(),
  sources: z.array(sourceMetaSchema).default([]),
});

export const commandCenterCoverageBoundaryTypeSchema = z.enum([
  "admin_selection_surface",
  "city_presence_surface",
  "point_only_surface",
]);

export const commandCenterCityWorkspaceSchema = cityWorkspaceSchema.extend({
  economicIntel: z.array(cityMetricSchema).default([]),
  transportIntel: z.array(cityMetricSchema).default([]),
  utilitiesIntel: z.array(cityMetricSchema).default([]),
  telecomIntel: z.array(cityMetricSchema).default([]),
  environmentIntel: z.array(cityMetricSchema).default([]),
  organizationIntel: z.array(cityMetricSchema).default([]),
  coverageBoundaryType: commandCenterCoverageBoundaryTypeSchema.default("admin_selection_surface"),
  sourceCoverageSummary: z.array(commandCenterSourceSummarySchema).default([]),
});

export const commandCenterCityPanelSchema = z.object({
  city: citySchema,
  workspace: commandCenterCityWorkspaceSchema.nullable(),
  coverageShell: cityCoverageShellSchema.nullable().default(null),
  entities: cityEntitiesBundleSchema.nullable(),
  sources: citySourcesBundleSchema.nullable(),
});

export const commandCenterAnalystRowStateSchema = z.enum([
  "mapped",
  "documented",
  "queued",
  "missing",
]);

export const commandCenterAnalystRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  state: commandCenterAnalystRowStateSchema,
  mappedCount: z.number().int().nonnegative().default(0),
  documentedCount: z.number().int().nonnegative().default(0),
  queuedDatasetCount: z.number().int().nonnegative().default(0),
  sourceLabels: z.array(z.string()).default([]),
  detail: z.string().optional(),
});

export const commandCenterAnalystSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  rows: z.array(commandCenterAnalystRowSchema).default([]),
});

export const commandCenterCityAnalystNavigationSchema = z.object({
  dossierSections: commandCenterAnalystSectionSchema,
  infrastructureCategories: commandCenterAnalystSectionSchema,
  institutionsPublicServices: commandCenterAnalystSectionSchema,
  telecomConnectivity: commandCenterAnalystSectionSchema,
  utilitiesEnergy: commandCenterAnalystSectionSchema,
  logisticsTransport: commandCenterAnalystSectionSchema,
  environmentHazards: commandCenterAnalystSectionSchema,
  sourceCoverageDataQuality: commandCenterAnalystSectionSchema,
  missingCoverage: commandCenterAnalystSectionSchema,
});

export const commandCenterDatasetInventoryStateSchema = z.enum([
  "published_to_website",
  "processed_with_data",
  "processed_without_data",
  "downloaded_local_source",
  "identified_public_source",
]);

export const commandCenterDatasetInventoryItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: commandCenterDatasetInventoryStateSchema,
  sourceLabels: z.array(z.string()).min(1),
  detail: z.string(),
  websiteSurfaces: z.array(z.string()).default([]),
  workspacePath: z.string().optional(),
});

export const commandCenterDatasetWorkspaceFileSchema = z.object({
  relativePath: z.string(),
  purpose: z.string(),
  sourceUrl: z.string(),
  required: z.boolean(),
  exists: z.boolean(),
  sizeBytes: z.number().nullable(),
});

export const commandCenterDatasetWorkspaceSchema = z.object({
  generatedAt: z.string(),
  dataset: commandCenterDatasetInventoryItemSchema,
  sourcePack: z.object({
    fileCount: z.number().int().nonnegative(),
    totalSizeBytes: z.number().nonnegative(),
    files: z.array(commandCenterDatasetWorkspaceFileSchema),
  }),
  processedIndex: z.object({
    fileName: z.string().nullable(),
    exists: z.boolean(),
    rowCount: z.number().int().nonnegative(),
  }),
  cityBundleCount: z.number().int().nonnegative().default(0),
  imageryDateCount: z.number().int().nonnegative().default(0),
  notes: z.array(z.string()).default([]),
});

export const commandCenterGlobalIntelligenceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  coverageState: coverageStateSchema,
  sourceLabels: z.array(z.string()).min(1),
});

export const opsTimelineEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  timestamp: z.string(),
  detail: z.string().optional(),
  sourceLabels: z.array(z.string()).default([]),
});

export const operationalSavedViewSchema = z.object({
  id: z.string(),
  label: z.string(),
  activeLayerIds: z.array(z.string()),
  sourceLabels: z.array(z.string()).default([]),
});

export const commandCenterManifestSchema = z.object({
  generatedAt: z.string(),
  defaultViewId: z.string(),
  globalIntelligence: z.array(commandCenterGlobalIntelligenceItemSchema),
  opsTimeline: z.array(opsTimelineEventSchema),
  savedViews: z.array(operationalSavedViewSchema),
  sourceSummary: z.array(commandCenterSourceSummarySchema),
  datasetInventory: z.array(commandCenterDatasetInventoryItemSchema).default([]),
  tacticalLayerCatalog: z.array(tacticalLayerSchema).default([]),
  baseImageryCatalogPath: z.string().optional(),
});

export const globeManifestSchema = z.object({
  generatedAt: z.string(),
  layers: z.array(globeLayerManifestSchema),
  // Single range-addressable PMTiles archive holding every tiled operational layer (one source-layer
  // per layer id). Written by scripts/data/globe/generate-pmtiles.ts; the 2D map reads one vector
  // source from here instead of fetching per-layer geojson shards.
  pmtilesPath: z.string().optional(),
  baseImageryCatalogPath: z.string().optional(),
});
