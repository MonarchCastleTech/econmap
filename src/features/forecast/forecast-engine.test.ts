import { describe, expect, it } from "vitest";

import { getForecastScenario } from "@/features/forecast/forecast-engine";

describe("forecast engine", () => {
  it("returns the requested scenario path for a country and indicator", () => {
    const scenario = getForecastScenario("india", "gdp-growth", "optimistic");

    expect(scenario.scenario).toBe("optimistic");
    expect(scenario.values).toHaveLength(3);
    expect(scenario.values[0]?.year).toBe(2026);
  });
});
