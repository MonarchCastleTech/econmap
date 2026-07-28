import { describe, expect, it } from "vitest";

import type { CityObservation } from "@/domain/city-intelligence-schemas";
import {
  alertsFromDeltas,
  diffCityObservations,
} from "./delta-engine";

function observation(
  overrides: Partial<CityObservation> = {},
): CityObservation {
  return {
    id: "geo-1:ookla:mobile-download",
    cityId: "geo-1",
    topic: "connectivity",
    metric: "mobile-download",
    state: "observed",
    value: 50,
    unit: "Mbps",
    evidenceKind: "measured",
    geographyKind: "urban_centre",
    observedAt: "2026-03-31T00:00:00.000Z",
    sourceId: "ookla-open-data",
    sourceUrl: "https://registry.opendata.aws/speedtest-global-performance/",
    methodology: "Quarterly tile aggregate.",
    confidence: "medium",
    ...overrides,
  };
}

describe("city intelligence delta engine", () => {
  it("emits deterministic added, changed, removed, and expired deltas", () => {
    const previous = [
      observation(),
      observation({
        id: "geo-1:usgs:quake-old",
        topic: "hazard",
        metric: "earthquake",
        sourceId: "usgs-earthquakes",
        value: 4.1,
      }),
      observation({
        id: "geo-2:firms:fire-old",
        cityId: "geo-2",
        topic: "hazard",
        metric: "active-fire",
        sourceId: "nasa-firms",
        value: true,
        validTo: "2026-07-01T00:00:00.000Z",
      }),
    ];
    const current = [
      observation({
        value: 64,
        observedAt: "2026-06-30T00:00:00.000Z",
      }),
      observation({
        id: "geo-1:fcc:5g",
        topic: "telecom_coverage",
        metric: "5g-coverage",
        value: true,
        unit: "boolean",
        evidenceKind: "regulator_reported",
        technology: "5G-NR",
        sourceId: "fcc-bdc",
      }),
    ];

    const first = diffCityObservations(
      previous,
      current,
      "2026-07-28T00:00:00.000Z",
    );
    const second = diffCityObservations(
      [...previous].reverse(),
      [...current].reverse(),
      "2026-07-28T00:00:00.000Z",
    );

    expect(first).toEqual(second);
    expect(first.map((delta) => delta.kind)).toEqual([
      "changed",
      "added",
      "removed",
      "expired",
    ]);
    expect(first[0]).toMatchObject({
      previousValue: 50,
      currentValue: 64,
    });
  });

  it("does not emit a delta for semantically identical observations", () => {
    expect(
      diffCityObservations(
        [observation()],
        [observation()],
        "2026-07-28T00:00:00.000Z",
      ),
    ).toEqual([]);
  });

  it("turns active hazards and evidence changes into ordered alerts", () => {
    const deltas = diffCityObservations(
      [],
      [
        observation({
          id: "geo-1:firms:fire",
          topic: "hazard",
          metric: "active-fire",
          evidenceKind: "satellite_detected",
          sourceId: "nasa-firms",
          value: true,
        }),
        observation({
          id: "geo-1:fcc:5g",
          topic: "telecom_coverage",
          metric: "5g-coverage",
          evidenceKind: "regulator_reported",
          technology: "5G-NR",
          sourceId: "fcc-bdc",
          value: true,
        }),
      ],
      "2026-07-28T00:00:00.000Z",
    );

    const alerts = alertsFromDeltas(deltas);

    expect(alerts.map((alert) => alert.severity)).toEqual(["critical", "watch"]);
    expect(alerts[0].summary).toContain("active-fire");
    expect(alerts[1].summary).toContain("5g-coverage");
  });
});
