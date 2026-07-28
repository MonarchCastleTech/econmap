import { describe, expect, it } from "vitest";

import {
  cityIntelligenceBundleSchema,
  cityObservationSchema,
  deriveTelecomEvidenceTier,
} from "@/domain/city-intelligence-schemas";

const baseObservation = {
  id: "geo-1:ookla:mobile-download:2026-q2",
  cityId: "geo-1",
  topic: "connectivity",
  metric: "mobile-download",
  state: "observed",
  value: 84.2,
  unit: "Mbps",
  evidenceKind: "measured",
  geographyKind: "urban_centre",
  observedAt: "2026-06-30T00:00:00.000Z",
  publishedAt: "2026-07-15T00:00:00.000Z",
  sourceId: "ookla-open-data",
  sourceUrl: "https://registry.opendata.aws/speedtest-global-performance/",
  methodology: "GPS-quality mobile tests aggregated to the matched urban centre.",
  confidence: "medium",
} as const;

describe("city intelligence schemas", () => {
  it("accepts a source-attributed measured connectivity observation", () => {
    expect(cityObservationSchema.parse(baseObservation)).toMatchObject({
      metric: "mobile-download",
      evidenceKind: "measured",
    });
  });

  it("rejects measured throughput presented as 5G coverage", () => {
    const parsed = cityObservationSchema.safeParse({
      ...baseObservation,
      topic: "telecom_coverage",
      metric: "5g-coverage",
      technology: "5G-NR",
    });

    expect(parsed.success).toBe(false);
  });

  it("derives regulator confirmed coverage above operator claims and measurements", () => {
    const measured = cityObservationSchema.parse(baseObservation);
    const operatorClaim = cityObservationSchema.parse({
      ...baseObservation,
      id: "geo-1:gsma:5g",
      topic: "telecom_coverage",
      metric: "5g-coverage",
      value: true,
      unit: "boolean",
      evidenceKind: "operator_reported",
      technology: "5G-NR",
      sourceId: "gsma-coverage",
      sourceUrl: "https://www.gsma.com/coverage/",
    });
    const regulatorReport = cityObservationSchema.parse({
      ...operatorClaim,
      id: "geo-1:fcc:5g",
      evidenceKind: "regulator_reported",
      sourceId: "fcc-bdc",
      sourceUrl: "https://broadbandmap.fcc.gov/",
    });

    expect(deriveTelecomEvidenceTier([measured])).toBe("measured_performance");
    expect(deriveTelecomEvidenceTier([measured, operatorClaim])).toBe("operator_claimed");
    expect(deriveTelecomEvidenceTier([measured, operatorClaim, regulatorReport])).toBe("regulator_confirmed");
  });

  it("accepts a baseline-only bundle with explicit source availability", () => {
    const parsed = cityIntelligenceBundleSchema.parse({
      schemaVersion: "1.0",
      generatedAt: "2026-07-28T00:00:00.000Z",
      cityId: "geo-1",
      telecomEvidence: "unknown",
      geographies: [],
      observations: [],
      deltas: [],
      alerts: [],
      sourceStatuses: [
        {
          sourceId: "gsma-coverage",
          status: "licensed",
          checkedAt: "2026-07-28T00:00:00.000Z",
          detail: "A licensed source package was not supplied.",
        },
      ],
    });

    expect(parsed.sourceStatuses[0].status).toBe("licensed");
  });
});
