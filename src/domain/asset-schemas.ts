import { z } from "zod";
import { coverageStateSchema, sourceMetaSchema } from "./schemas";

export const assetCategorySchema = z.enum([
  "transport",
  "energy",
  "water",
  "public_services",
  "telecom",
  "industrial",
]);

export const assetStatusSchema = z.enum([
  "active",
  "announced",
  "under_construction",
  "closed",
  "decommissioned",
  "unknown",
]);

export const assetFreshnessSchema = z.enum(["fresh", "stale", "historic"]);

export const assetRecordSchema = z.object({
  assetId: z.string(),
  name: z.string(),
  category: assetCategorySchema,
  subtype: z.string(),
  countryIso3: z.string().length(3),
  admin1: z.string().optional(),
  cityId: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  geometry: z.any().optional(), // Flexible for GeoJSON
  operator: z.string().optional(),
  owner: z.string().optional(),
  status: assetStatusSchema.default("unknown"),
  capacity: z.number().nullable().optional(),
  capacityUnit: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  sourceIds: z.array(z.string()),
  lastObservedAt: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  license: z.string().optional(),
  freshness: assetFreshnessSchema.default("stale"),
  coverageState: coverageStateSchema,
});

export const countryAssetAggregationSchema = z.object({
  countryIso3: z.string().length(3),
  categoryCounts: z.record(assetCategorySchema, z.number()),
  totalAssets: z.number(),
  completenessScore: z.number().min(0).max(1),
  lastUpdatedAt: z.string(),
});
