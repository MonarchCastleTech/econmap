import { z } from "zod";

export const intelligenceStateSchema = z.enum([
  "observed",
  "not_observed",
  "unknown",
  "unavailable",
  "not_applicable",
]);

export const cityIntelligenceTopicSchema = z.enum([
  "population",
  "connectivity",
  "telecom_coverage",
  "network_quality",
  "environment",
  "hazard",
  "infrastructure",
  "source_coverage",
]);

export const evidenceKindSchema = z.enum([
  "regulator_reported",
  "operator_reported",
  "measured",
  "satellite_detected",
  "modelled",
  "registry",
  "derived",
]);

export const intelligenceGeographyKindSchema = z.enum([
  "point",
  "administrative",
  "urban_centre",
  "metro",
  "radius",
]);

export const intelligenceConfidenceSchema = z.enum(["high", "medium", "low", "unknown"]);

export const observationValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.null(),
]);

export const cityObservationSchema = z
  .object({
    id: z.string().min(1),
    cityId: z.string().min(1),
    topic: cityIntelligenceTopicSchema,
    metric: z.string().min(1),
    state: intelligenceStateSchema,
    value: observationValueSchema.optional(),
    unit: z.string().min(1).optional(),
    evidenceKind: evidenceKindSchema,
    technology: z.string().min(1).nullable().optional(),
    operator: z.string().min(1).nullable().optional(),
    geographyKind: intelligenceGeographyKindSchema,
    geographyId: z.string().min(1).optional(),
    observedAt: z.string().datetime(),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional(),
    publishedAt: z.string().datetime().optional(),
    sourceId: z.string().min(1),
    sourceUrl: z.string().url(),
    methodology: z.string().min(1),
    confidence: intelligenceConfidenceSchema,
    sampleCount: z.number().int().nonnegative().optional(),
    note: z.string().optional(),
  })
  .superRefine((observation, context) => {
    const is5g = /(^|[^a-z0-9])(5g|nr)([^a-z0-9]|$)/i.test(
      `${observation.metric} ${observation.technology ?? ""}`,
    );
    const permitted5gCoverageEvidence =
      observation.evidenceKind === "regulator_reported" ||
      observation.evidenceKind === "operator_reported";

    if (
      observation.topic === "telecom_coverage" &&
      observation.state === "observed" &&
      is5g &&
      !permitted5gCoverageEvidence
    ) {
      context.addIssue({
        code: "custom",
        path: ["evidenceKind"],
        message:
          "Observed 5G coverage requires regulator-reported or operator-reported technology-specific evidence.",
      });
    }
  });

export const telecomEvidenceTierSchema = z.enum([
  "regulator_confirmed",
  "operator_claimed",
  "measured_performance",
  "unknown",
]);

export type CityObservation = z.infer<typeof cityObservationSchema>;
export type TelecomEvidenceTier = z.infer<typeof telecomEvidenceTierSchema>;

function isObserved5gCoverage(observation: CityObservation): boolean {
  return (
    observation.topic === "telecom_coverage" &&
    observation.state === "observed" &&
    /(^|[^a-z0-9])(5g|nr)([^a-z0-9]|$)/i.test(
      `${observation.metric} ${observation.technology ?? ""}`,
    )
  );
}

export function deriveTelecomEvidenceTier(
  observations: readonly CityObservation[],
): TelecomEvidenceTier {
  if (
    observations.some(
      (observation) =>
        isObserved5gCoverage(observation) &&
        observation.evidenceKind === "regulator_reported",
    )
  ) {
    return "regulator_confirmed";
  }

  if (
    observations.some(
      (observation) =>
        isObserved5gCoverage(observation) &&
        observation.evidenceKind === "operator_reported",
    )
  ) {
    return "operator_claimed";
  }

  if (
    observations.some(
      (observation) =>
        observation.state === "observed" &&
        observation.evidenceKind === "measured" &&
        (observation.topic === "connectivity" ||
          observation.topic === "network_quality"),
    )
  ) {
    return "measured_performance";
  }

  return "unknown";
}

export const cityIntelligenceDeltaSchema = z.object({
  id: z.string().min(1),
  observationId: z.string().min(1),
  cityId: z.string().min(1),
  topic: cityIntelligenceTopicSchema,
  metric: z.string().min(1),
  kind: z.enum(["added", "changed", "removed", "expired"]),
  detectedAt: z.string().datetime(),
  sourceId: z.string().min(1),
  previousState: intelligenceStateSchema.optional(),
  currentState: intelligenceStateSchema.optional(),
  previousValue: observationValueSchema.optional(),
  currentValue: observationValueSchema.optional(),
  observedAt: z.string().datetime(),
});

export const cityAlertSchema = z.object({
  id: z.string().min(1),
  cityId: z.string().min(1),
  topic: cityIntelligenceTopicSchema,
  severity: z.enum(["info", "watch", "warning", "critical"]),
  changeType: z.enum(["added", "changed", "removed", "expired", "source_stale"]),
  title: z.string().min(1),
  summary: z.string().min(1),
  sourceId: z.string().min(1),
  observedAt: z.string().datetime(),
  detectedAt: z.string().datetime(),
});

export const cityIntelligenceGeographySchema = z.object({
  id: z.string().min(1),
  cityId: z.string().min(1),
  kind: intelligenceGeographyKindSchema,
  state: intelligenceStateSchema,
  name: z.string().min(1),
  sourceId: z.string().min(1),
  sourceUrl: z.string().url(),
  observedAt: z.string().datetime(),
  methodology: z.string().min(1),
  confidence: intelligenceConfidenceSchema,
  geometryRef: z.string().optional(),
  population: z.number().nonnegative().nullable().optional(),
  areaSqKm: z.number().nonnegative().nullable().optional(),
});

export const intelligenceSourceStatusSchema = z.object({
  sourceId: z.string().min(1),
  status: z.enum([
    "available",
    "unavailable",
    "credential_required",
    "licensed",
    "not_configured",
    "error",
  ]),
  checkedAt: z.string().datetime(),
  detail: z.string().min(1),
  snapshotDate: z.string().datetime().optional(),
});

export const cityIntelligenceBundleSchema = z.object({
  schemaVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  cityId: z.string().min(1),
  telecomEvidence: telecomEvidenceTierSchema,
  geographies: z.array(cityIntelligenceGeographySchema),
  observations: z.array(cityObservationSchema),
  deltas: z.array(cityIntelligenceDeltaSchema),
  alerts: z.array(cityAlertSchema),
  sourceStatuses: z.array(intelligenceSourceStatusSchema),
});

export const cityIntelligenceIndexSchema = z.object({
  schemaVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  cities: z.record(z.string(), cityIntelligenceBundleSchema),
  sourceStatuses: z.array(intelligenceSourceStatusSchema),
});

export const cityAlertFeedSchema = z.object({
  schemaVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  alerts: z.array(cityAlertSchema),
});

export type CityIntelligenceDelta = z.infer<typeof cityIntelligenceDeltaSchema>;
export type CityAlert = z.infer<typeof cityAlertSchema>;
export type CityIntelligenceBundle = z.infer<typeof cityIntelligenceBundleSchema>;
export type CityIntelligenceIndex = z.infer<typeof cityIntelligenceIndexSchema>;
export type IntelligenceSourceStatus = z.infer<typeof intelligenceSourceStatusSchema>;
