import { describe, expect, it } from "vitest";

import { indicatorCatalog } from "@/data/contracts/indicator-catalog";
import { sourceCatalog } from "@/data/contracts/source-registry";
import { indicatorDefinitions } from "@/data/normalized/indicators";

describe("data contracts", () => {
  it("defines an acquisition strategy for every current indicator", () => {
    expect(indicatorCatalog.map((entry) => entry.id).sort()).toEqual(
      indicatorDefinitions.map((indicator) => indicator.id).sort(),
    );
  });

  it("only references known source ids", () => {
    const knownSourceIds = new Set(sourceCatalog.map((source) => source.id));

    indicatorCatalog.forEach((entry) => {
      entry.actualSources.forEach((sourceId) => {
        expect(knownSourceIds.has(sourceId)).toBe(true);
      });

      entry.estimateSources.forEach((sourceId) => {
        expect(knownSourceIds.has(sourceId)).toBe(true);
      });

      entry.forecastSources.forEach((sourceId) => {
        expect(knownSourceIds.has(sourceId)).toBe(true);
      });
    });
  });

  it("treats GDP per capita as a derived metric instead of a fetched one", () => {
    const strategy = indicatorCatalog.find((entry) => entry.id === "gdp-per-capita");

    expect(strategy).toBeDefined();
    expect(strategy?.kind).toBe("derived");
    expect(strategy?.derivedFrom).toEqual(["gdp-current-usd", "population"]);
  });
});
