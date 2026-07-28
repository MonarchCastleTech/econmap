import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CityIntelligenceBundle } from "@/domain/city-intelligence-schemas";
import { CityTimeMachine } from "@/features/osint/components/city-time-machine";

const intelligence: CityIntelligenceBundle = {
  schemaVersion: "1.0",
  generatedAt: "2026-07-28T00:00:00.000Z",
  cityId: "geo-1",
  telecomEvidence: "unknown",
  geographies: [],
  observations: [
    {
      id: "hazard-1",
      cityId: "geo-1",
      topic: "hazard",
      metric: "earthquake",
      state: "observed",
      value: 4.8,
      unit: "magnitude",
      evidenceKind: "measured",
      geographyKind: "radius",
      observedAt: "2026-07-28T01:00:00.000Z",
      sourceId: "usgs-earthquakes",
      sourceUrl: "https://earthquake.usgs.gov/earthquakes/eventpage/1",
      methodology: "Matched within 100 km.",
      confidence: "high",
    },
  ],
  deltas: [
    {
      id: "delta-1",
      observationId: "hazard-1",
      cityId: "geo-1",
      topic: "hazard",
      metric: "earthquake",
      kind: "added",
      detectedAt: "2026-07-28T02:00:00.000Z",
      sourceId: "usgs-earthquakes",
      currentState: "observed",
      currentValue: 4.8,
      observedAt: "2026-07-28T01:00:00.000Z",
    },
  ],
  alerts: [
    {
      id: "alert-1",
      cityId: "geo-1",
      topic: "hazard",
      severity: "warning",
      changeType: "added",
      title: "Operational hazard detected",
      summary: "earthquake was added from usgs-earthquakes.",
      sourceId: "usgs-earthquakes",
      observedAt: "2026-07-28T01:00:00.000Z",
      detectedAt: "2026-07-28T02:00:00.000Z",
    },
  ],
  sourceStatuses: [
    {
      sourceId: "ghsl-urban-centres",
      status: "unavailable",
      checkedAt: "2026-07-28T00:00:00.000Z",
      detail: "The official vector package is not present.",
    },
  ],
};

describe("CityTimeMachine", () => {
  it("shows recorded changes without losing provenance", () => {
    render(<CityTimeMachine intelligence={intelligence} />);

    expect(screen.getByRole("heading", { name: "City time machine" })).toBeInTheDocument();
    expect(screen.getByText("earthquake added")).toBeInTheDocument();
    expect(screen.getByText("USGS earthquakes")).toBeInTheDocument();
  });

  it("switches between geography and operational hazard views", () => {
    render(<CityTimeMachine intelligence={intelligence} />);

    fireEvent.click(screen.getByRole("button", { name: "Geography" }));
    expect(screen.getByText("Urban-centre boundary unavailable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hazards" }));
    expect(screen.getByText("Operational hazard detected")).toBeInTheDocument();
    expect(screen.getByText("Magnitude 4.8")).toBeInTheDocument();
  });
});
