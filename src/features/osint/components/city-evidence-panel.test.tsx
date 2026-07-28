import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CityIntelligenceBundle } from "@/domain/city-intelligence-schemas";
import { CityEvidencePanel } from "@/features/osint/components/city-evidence-panel";

function bundle(
  overrides: Partial<CityIntelligenceBundle> = {},
): CityIntelligenceBundle {
  return {
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
        detail: "Licensed data not supplied.",
      },
    ],
    ...overrides,
  };
}

describe("CityEvidencePanel", () => {
  it("states that 5G is unknown instead of promoting generic mobile speed", () => {
    render(
      <CityEvidencePanel
        intelligence={bundle({
          telecomEvidence: "measured_performance",
          observations: [
            {
              id: "o1",
              cityId: "geo-1",
              topic: "connectivity",
              metric: "mobile-download",
              state: "observed",
              value: 80,
              unit: "Mbps",
              evidenceKind: "measured",
              geographyKind: "urban_centre",
              observedAt: "2026-06-30T00:00:00.000Z",
              sourceId: "ookla-open-data",
              sourceUrl: "https://registry.opendata.aws/speedtest-global-performance/",
              methodology: "Quarterly aggregate.",
              confidence: "medium",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Measured performance only")).toBeInTheDocument();
    expect(screen.getByText(/does not establish 5G coverage/i)).toBeInTheDocument();
    expect(screen.getByText("80 Mbps")).toBeInTheDocument();
  });

  it("labels regulator technology evidence explicitly", () => {
    render(
      <CityEvidencePanel
        intelligence={bundle({ telecomEvidence: "regulator_confirmed" })}
      />,
    );

    expect(screen.getByText("Regulator-confirmed 5G")).toBeInTheDocument();
  });
});
