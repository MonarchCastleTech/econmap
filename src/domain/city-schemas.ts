import { z } from "zod";
import { coverageStateSchema, observationStatusSchema, sourceMetaSchema } from "./schemas";

export const cityGeometryModeSchema = z.enum(["exact", "city_presence"]);
export const confidenceStateSchema = coverageStateSchema;
export const cityPlaceClassSchema = z.enum(["city", "subordinate_place", "region"]);
export const citySourceIdsSchema = z.object({
  geonames: z.string(),
  wikidata: z.string().optional(),
  osm: z.string().optional(),
});

export const cityRoleTagSchema = z.enum([
  "capital",
  "port city",
  "manufacturing hub",
  "energy city",
  "tourism city",
  "logistics hub",
  "financial center",
  "technology hub",
]);

const cityRecordSchema = z.object({
  cityId: z.string(),
  slug: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  placeClass: cityPlaceClassSchema.optional(),
  featureClass: z.string().optional(),
  featureCode: z.string().optional(),
  sourceIds: citySourceIdsSchema.optional(),
  countryIso2: z.string().length(2).optional(),
  countryIso3: z.string().length(3),
  countrySlug: z.string(),
  admin1Name: z.string().optional(),
  admin1Code: z.string().optional(),
  admin2Name: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  boundaryStatus: z.enum(["has_boundary", "point_only"]).default("point_only"),
  population: z.number().nullable().optional(),
  populationSource: z.string().optional(),
  registrySource: z.string(),
  recordStatus: z.enum(["active", "deprecated", "merged"]).default("active"),
  roleTags: z.array(cityRoleTagSchema).optional(),
  isMajorCity: z.boolean().default(false),
});

type CompatibleCityRecord = Omit<
  z.infer<typeof cityRecordSchema>,
  "placeClass" | "sourceIds"
> & {
  placeClass?: z.infer<typeof cityPlaceClassSchema>;
  sourceIds?: z.infer<typeof citySourceIdsSchema>;
};

export const citySchema = cityRecordSchema.transform(
  (city): CompatibleCityRecord => ({
    ...city,
    placeClass: city.placeClass ?? "city",
    sourceIds: city.sourceIds ?? {
      geonames: city.cityId.replace(/^geo-/, ""),
    },
  }),
);

export const cityEntitySchema = z.object({
  entityId: z.string(),
  cityId: z.string(),
  entityName: z.string(),
  entityType: z.enum(["company", "factory", "industrial_park", "port", "airport", "rail_hub", "logistics_hub", "utility", "research"]),
  entitySubtype: z.string().optional(),
  industry: z.string().optional(),
  parentCompany: z.string().optional(),
  operator: z.string().optional(),
  presenceType: z.enum([
    "headquarters",
    "regional_hq",
    "office",
    "manufacturing",
    "plant",
    "warehouse",
    "distribution",
    "industrial_park",
    "port",
    "airport",
    "rail_hub",
    "power_asset",
    "research",
  ]),
  exactSite: z.boolean(),
  geometryMode: cityGeometryModeSchema,
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  cityPresenceEvidence: z.string().optional(),
  importanceReason: z.string().optional(),
  employmentEstimate: z.number().nullable().optional(),
  status: z.enum(["active", "announced", "under_construction", "closed"]).optional(),
  sources: z.array(sourceMetaSchema),
  lastVerifiedAt: z.string(),
  confidenceState: confidenceStateSchema,
});

export const cityMetricSchema = z.object({
  indicatorId: z.string(),
  value: z.number().nullable(),
  unit: z.string(),
  year: z.number().int().optional(),
  status: observationStatusSchema,
  source: sourceMetaSchema,
});

export const citySearchIndexEntrySchema = z.object({
  cityId: z.string(),
  slug: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  placeClass: cityPlaceClassSchema.optional(),
  featureCode: z.string().optional(),
  countryIso3: z.string(),
  admin1Name: z.string().optional(),
  population: z.number().nullable().optional(),
  isMajorCity: z.boolean().default(false),
});

export const cityWorkspaceSchema = z.object({
  city: citySchema,
  summary: z.string().optional(),
  roleTags: z.array(cityRoleTagSchema),
  coverage: z.object({
    economicFactbook: coverageStateSchema,
    investorIntel: coverageStateSchema,
    urbanIntel: coverageStateSchema,
  }),
  economicFactbook: z.array(cityMetricSchema),
  investorIntel: z.array(cityMetricSchema),
  urbanIntel: z.array(cityMetricSchema),
  entityCounts: z.record(z.string(), z.number()),
  entityHighlights: z.array(cityEntitySchema),
  mapLayerSummary: z.object({
    availableLayers: z.array(z.string()),
  }),
  sources: z.array(sourceMetaSchema),
});

export const cityEntitiesBundleSchema = z.object({
  cityId: z.string().optional(),
  entities: z.array(cityEntitySchema),
  sources: z.array(sourceMetaSchema),
});

export const citySourcesBundleSchema = z.object({
  cityId: z.string(),
  sources: z.array(sourceMetaSchema),
});

export const cityCoverageShellCategoryStateSchema = z.enum(["mapped", "documented", "missing"]);

export const cityCoverageShellCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  state: cityCoverageShellCategoryStateSchema,
  count: z.number().int().nonnegative().default(0),
  detail: z.string(),
  sourceLabels: z.array(z.string()).default([]),
});

export const cityCoverageShellSchema = z.object({
  generatedAt: z.string(),
  cityId: z.string(),
  boundaryStatus: cityRecordSchema.shape.boundaryStatus,
  sourceCount: z.number().int().nonnegative(),
  mappedCategoryCount: z.number().int().nonnegative(),
  documentedCategoryCount: z.number().int().nonnegative(),
  missingCategoryCount: z.number().int().nonnegative(),
  categories: z.array(cityCoverageShellCategorySchema),
});

export const cityManifestSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  totalCityCount: z.number(),
  processedCityCount: z.number(),
  countryCounts: z.record(z.string(), z.number()),
  entityCountsByType: z.record(z.string(), z.number()),
  exactSiteCountsByType: z.record(z.string(), z.number()).default({}),
  exactSiteCount: z.number(),
  cityPresenceCount: z.number(),
  unresolvedCoverageCount: z.number(),
  sourceCounts: z.record(z.string(), z.number()),
  coverageShellCount: z.number().default(0),
  coverageShellBoundaryCounts: z.record(z.string(), z.number()).default({}),
  coverageShellObservedCounts: z.record(z.string(), z.number()).default({}),
  buildWarnings: z.array(z.string()),
});
