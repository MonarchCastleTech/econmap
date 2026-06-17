import type { z } from "zod";
import {
  assetCategorySchema,
  assetStatusSchema,
  assetFreshnessSchema,
  assetRecordSchema,
  countryAssetAggregationSchema,
} from "@/domain/asset-schemas";

import {
  cityCoverageShellSchema,
  cityEntitiesBundleSchema,
  citySchema,
  citySearchIndexEntrySchema,
  citySourcesBundleSchema,
  cityWorkspaceSchema,
} from "@/domain/city-schemas";
import {
  blocSchema,
  coverageStateSchema,
  countryProfileSchema,
  countrySchema,
  dashboardSchema,
  forecastSeriesSchema,
  historicalEventSchema,
  indicatorDefinitionSchema,
  indicatorObservationSchema,
  layerTierSchema,
  riskScoreSchema,
  sourceMetaSchema,
  subnationalUnitSchema,
  tradeFlowSchema,
  watchlistSchema,
} from "@/domain/schemas";
import {
  baseImageryCatalogSchema,
  commandCenterCityPanelSchema,
  commandCenterCityAnalystNavigationSchema,
  commandCenterCityWorkspaceSchema,
  commandCenterCoverageBoundaryTypeSchema,
  commandCenterAnalystSectionSchema,
  commandCenterAnalystRowSchema,
  commandCenterAnalystRowStateSchema,
  baseImageryLayerSchema,
  cityFootprintCatalogSchema,
  cityFootprintCatalogItemSchema,
  cityFootprintSelectionSchema,
  commandCenterDatasetInventoryItemSchema,
  commandCenterDatasetInventoryStateSchema,
  commandCenterDatasetWorkspaceSchema,
  commandCenterManifestSchema,
  globeManifestSchema,
  globeLayerManifestSchema,
  layerPublishStatusSchema,
  layerFamilySchema,
  tacticalLayerCategorySchema,
  tacticalLayerSchema,
  tacticalLayerSourceTypeSchema,
} from "@/domain/command-center-schemas";

export type SourceMeta = z.infer<typeof sourceMetaSchema>;
export type Country = z.infer<typeof countrySchema>;
export type SubnationalUnit = z.infer<typeof subnationalUnitSchema>;
export type IndicatorDefinition = z.infer<typeof indicatorDefinitionSchema>;
export type IndicatorObservation = z.infer<typeof indicatorObservationSchema>;
export type CountryProfile = z.infer<typeof countryProfileSchema>;
export type TradeFlow = z.infer<typeof tradeFlowSchema>;
export type ForecastSeries = z.infer<typeof forecastSeriesSchema>;
export type HistoricalEvent = z.infer<typeof historicalEventSchema>;
export type RiskScore = z.infer<typeof riskScoreSchema>;
export type Bloc = z.infer<typeof blocSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type Watchlist = z.infer<typeof watchlistSchema>;
export type CoverageState = z.infer<typeof coverageStateSchema>;
export type LayerTier = z.infer<typeof layerTierSchema>;
export type LayerFamily = z.infer<typeof layerFamilySchema>;
export type TacticalLayerCategory = z.infer<typeof tacticalLayerCategorySchema>;
export type TacticalLayerSourceType = z.infer<typeof tacticalLayerSourceTypeSchema>;
export type LayerPublishStatus = z.infer<typeof layerPublishStatusSchema>;
export type CityRegistryEntry = z.infer<typeof citySchema>;
export type CitySearchIndexEntry = z.infer<typeof citySearchIndexEntrySchema>;
export type CityWorkspace = z.infer<typeof cityWorkspaceSchema>;
export type CityEntitiesBundle = z.infer<typeof cityEntitiesBundleSchema>;
export type CitySourcesBundle = z.infer<typeof citySourcesBundleSchema>;
export type CityCoverageShell = z.infer<typeof cityCoverageShellSchema>;
export type GlobeLayerManifest = z.infer<typeof globeLayerManifestSchema>;
export type GlobeManifest = z.infer<typeof globeManifestSchema>;
export type CommandCenterManifest = z.infer<typeof commandCenterManifestSchema>;
export type CommandCenterCoverageBoundaryType = z.infer<typeof commandCenterCoverageBoundaryTypeSchema>;
export type CommandCenterCityWorkspace = z.infer<typeof commandCenterCityWorkspaceSchema>;
export type CommandCenterCityPanel = z.infer<typeof commandCenterCityPanelSchema>;
export type CommandCenterAnalystRowState = z.infer<typeof commandCenterAnalystRowStateSchema>;
export type CommandCenterAnalystRow = z.infer<typeof commandCenterAnalystRowSchema>;
export type CommandCenterAnalystSection = z.infer<typeof commandCenterAnalystSectionSchema>;
export type CommandCenterCityAnalystNavigation = z.infer<typeof commandCenterCityAnalystNavigationSchema>;
export type CommandCenterDatasetInventoryItem = z.infer<typeof commandCenterDatasetInventoryItemSchema>;
export type CommandCenterDatasetInventoryState = z.infer<typeof commandCenterDatasetInventoryStateSchema>;
export type CommandCenterDatasetWorkspace = z.infer<typeof commandCenterDatasetWorkspaceSchema>;
export type TacticalLayer = z.infer<typeof tacticalLayerSchema>;
export type BaseImageryLayer = z.infer<typeof baseImageryLayerSchema>;
export type BaseImageryCatalog = z.infer<typeof baseImageryCatalogSchema>;
export type CityFootprintCatalogItem = z.infer<typeof cityFootprintCatalogItemSchema>;
export type CityFootprintCatalog = z.infer<typeof cityFootprintCatalogSchema>;
export type CityFootprintSelection = z.infer<typeof cityFootprintSelectionSchema>;

export type MapMode =
  | "choropleth"
  | "bubble"
  | "density"
  | "categorical"
  | "trade-flow"
  | "sector-overlay";

export type CommandPanelMode = "global" | "city";

export type AssetCategory = z.infer<typeof assetCategorySchema>;
export type AssetStatus = z.infer<typeof assetStatusSchema>;
export type AssetFreshness = z.infer<typeof assetFreshnessSchema>;
export type AssetRecord = z.infer<typeof assetRecordSchema>;
export type CountryAssetAggregation = z.infer<typeof countryAssetAggregationSchema>;


