import { describe, expect, it } from "vitest";

import { indicatorCatalog } from "@/data/contracts/indicator-catalog";
import { sourceCatalog } from "@/data/contracts/source-registry";
import { blocs } from "@/data/normalized/blocs";
import { historicalEvents } from "@/data/normalized/events";
import { forecastSeries } from "@/data/normalized/forecasts";
import { indicatorDefinitions } from "@/data/normalized/indicators";
import { subnationalUnits } from "@/data/normalized/regions";

describe("normalized data modules", () => {
  it("keeps indicator definitions aligned with the acquisition contract", () => {
    expect(indicatorDefinitions.map((indicator) => indicator.id).sort()).toEqual(
      indicatorCatalog.map((entry) => entry.id).sort(),
    );

    expect(indicatorDefinitions.find((indicator) => indicator.id === "gdp-per-capita")?.sourceId).toBe(
      "mapfactbook-lab",
    );
    expect(indicatorDefinitions.find((indicator) => indicator.id === "business-climate")?.sourceId).toBe(
      "mapfactbook-lab",
    );
  });

  it("only uses known sources in indicator definitions", () => {
    const knownSourceIds = new Set(sourceCatalog.map((source) => source.id));

    indicatorDefinitions.forEach((indicator) => {
      expect(knownSourceIds.has(indicator.sourceId)).toBe(true);
    });
  });

  it("exposes parsed normalized forecast, region, event, and bloc datasets", () => {
    expect(forecastSeries.length).toBeGreaterThan(0);
    expect(subnationalUnits.length).toBeGreaterThan(0);
    expect(historicalEvents.length).toBeGreaterThan(0);
    expect(blocs.length).toBeGreaterThan(0);
  });
});
