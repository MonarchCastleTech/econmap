import { z } from "zod";

export const observationStatusSchema = z.enum(["actual", "estimate", "forecast"]);
export const entityTypeSchema = z.enum(["country", "region", "bloc"]);
export const coverageStateSchema = z.enum([
  "verified_exact",
  "verified_city_presence",
  "partial_coverage",
  "not_covered_yet",
  "not_applicable",
]);
export const layerTierSchema = z.enum(["boot", "interactive", "deep", "city-focus"]);

export const sourceMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
  coverage: z.string(),
  methodology: z.string(),
  note: z.string().optional(),
  url: z.string().url().optional(),
  sourceDate: z.string().optional(),
  localIngestedAt: z.string().optional(),
  coverageState: coverageStateSchema.optional(),
});

export const countrySchema = z.object({
  id: z.string(),
  slug: z.string(),
  iso2: z.string().length(2),
  iso3: z.string().length(3),
  name: z.string(),
  flag: z.string(),
  capital: z.string(),
  region: z.string(),
  subregion: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  currencyCode: z.string(),
  currencyName: z.string(),
  creditRating: z.string(),
  blocs: z.array(z.string()),
  showcase: z.boolean().default(false),
});

export const subnationalUnitSchema = z.object({
  id: z.string(),
  slug: z.string(),
  countrySlug: z.string(),
  name: z.string(),
  type: z.enum(["state", "province", "region"]),
  latitude: z.number(),
  longitude: z.number(),
  population: z.number(),
  gdpCurrentUsd: z.number(),
  unemployment: z.number(),
  medianIncome: z.number(),
  urbanization: z.number(),
  infrastructureScore: z.number(),
  topSectors: z.array(
    z.object({
      name: z.string(),
      share: z.number(),
    }),
  ),
});

export const indicatorDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  unit: z.string(),
  description: z.string(),
  notes: z.string().optional(),
  sourceId: z.string(),
  latestYear: z.number().int(),
  coverageNote: z.string().optional(),
});

export const indicatorObservationSchema = z.object({
  id: z.string(),
  entityType: entityTypeSchema,
  entityId: z.string(),
  indicatorId: z.string(),
  year: z.number().int(),
  value: z.number().nullable(),
  unit: z.string(),
  status: observationStatusSchema,
  source: sourceMetaSchema,
  note: z.string().optional(),
});

export const tradeFlowSchema = z.object({
  id: z.string(),
  reporterSlug: z.string(),
  partnerSlug: z.string(),
  year: z.number().int(),
  flowType: z.enum(["exports", "imports", "total"]),
  commodityGroup: z.string(),
  valueUsd: z.number(),
  sharePercent: z.number(),
  source: sourceMetaSchema,
});

export const forecastScenarioSchema = z.object({
  scenario: z.enum(["baseline", "optimistic", "pessimistic"]),
  values: z.array(
    z.object({
      year: z.number().int(),
      value: z.number(),
      source: sourceMetaSchema,
    }),
  ),
});

export const forecastSeriesSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  indicatorId: z.string(),
  unit: z.string(),
  scenarios: z.array(forecastScenarioSchema),
});

export const historicalEventSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  year: z.number().int(),
  title: z.string(),
  kind: z.enum([
    "crisis",
    "devaluation",
    "reform",
    "imf-program",
    "recession",
    "sanctions",
    "election",
    "conflict",
    "policy-shift",
  ]),
  summary: z.string(),
});

export const riskDimensionSchema = z.object({
  id: z.string(),
  label: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  narrative: z.string(),
});

export const riskScoreSchema = z.object({
  entityId: z.string(),
  score: z.number().min(0).max(100),
  band: z.enum(["low", "moderate", "elevated", "high"]),
  methodology: z.string(),
  dimensions: z.array(riskDimensionSchema),
});

export const blocSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  memberSlugs: z.array(z.string()),
  description: z.string(),
});

export const dashboardWidgetSchema = z.object({
  id: z.string(),
  type: z.enum(["line", "bar", "kpi", "table", "map", "story"]),
  metricId: z.string().optional(),
  entityIds: z.array(z.string()),
});

export const dashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  widgets: z.array(dashboardWidgetSchema),
});

export const watchlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(z.string()),
});

export const countryProfileSchema = z.object({
  country: countrySchema,
  overview: z.array(
    z.object({
      label: z.string(),
      indicatorId: z.string(),
      value: z.number().nullable(),
      unit: z.string(),
      status: observationStatusSchema,
    }),
  ),
  highlights: z.array(z.string()),
  topExports: z.array(z.object({ name: z.string(), share: z.number() })),
  topImports: z.array(z.object({ name: z.string(), share: z.number() })),
  sectorMix: z.array(z.object({ name: z.string(), share: z.number() })),
  sourceSummary: z.array(sourceMetaSchema),
});
