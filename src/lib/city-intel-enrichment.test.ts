import { afterEach, describe, expect, it, vi } from "vitest";

import type { CityRegistryEntry, CityWorkspace } from "@/domain/types";
import {
  applyCityIntelEnrichment,
  buildWorldBankCountryEconomyIndex,
} from "@/lib/city-intel-enrichment";

afterEach(() => {
  vi.doUnmock("node:fs/promises");
  vi.resetModules();
});

function buildCity(overrides: Partial<CityRegistryEntry> = {}): CityRegistryEntry {
  return {
    cityId: "geo-1",
    slug: "istanbul",
    name: "Istanbul",
    aliases: [],
    countryIso2: "TR",
    countryIso3: "TUR",
    countrySlug: "turkiye",
    admin1Name: "Istanbul",
    admin1Code: "34",
    latitude: 41.0082,
    longitude: 28.9784,
    boundaryStatus: "has_boundary",
    population: 15_701_602,
    populationSource: "GeoNames",
    registrySource: "GeoNames",
    recordStatus: "active",
    isMajorCity: true,
    ...overrides,
  };
}

function buildWorkspace(overrides: Partial<CityWorkspace> = {}): CityWorkspace {
  const city = buildCity();

  return {
    city,
    summary: `${city.name} source-backed command workspace`,
    roleTags: [],
    coverage: {
      economicFactbook: "verified_exact",
      investorIntel: "verified_city_presence",
      urbanIntel: "not_covered_yet",
    },
    economicFactbook: [
      {
        indicatorId: "population",
        value: city.population ?? null,
        unit: "persons",
        status: "actual",
        source: {
          id: "geonames",
          name: "GeoNames",
          updatedAt: "2026-03-20",
          coverage: "global",
          methodology: "Canonical city registry record",
          url: "https://www.geonames.org/",
        },
      },
    ],
    investorIntel: [],
    urbanIntel: [],
    entityCounts: {},
    entityHighlights: [],
    mapLayerSummary: { availableLayers: [] },
    sources: [
      {
        id: "geonames",
        name: "GeoNames",
        updatedAt: "2026-03-20",
        coverage: "global",
        methodology: "Canonical city registry record",
        url: "https://www.geonames.org/",
      },
    ],
    ...overrides,
  };
}

describe("city-intel-enrichment", () => {
  it("merges actual city GDP, labour, and company coverage ahead of the homepage brief", () => {
    const city = buildCity();
    const workspace = buildWorkspace();

    const enriched = applyCityIntelEnrichment({
      city,
      workspace,
      enrichmentEntry: {
        generatedAt: "2026-03-20T00:00:00.000Z",
        economicFactbook: [
          {
            indicatorId: "gdp-current-ppp",
            value: 801_599_000_000,
            unit: "USD PPP",
            year: 2023,
            status: "actual",
            source: {
              id: "oecd-fua-economy",
              name: "OECD FUA Economy",
              updatedAt: "2026-03-20",
              coverage: "oecd_fua",
              methodology: "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
              url: "https://www.oecd.org/",
            },
          },
        ],
        investorIntel: [
          {
            indicatorId: "labour-force",
            value: 6_410_000,
            unit: "persons",
            year: 2023,
            status: "actual",
            source: {
              id: "oecd-fua-labour",
              name: "OECD FUA Labour",
              updatedAt: "2026-03-20",
              coverage: "oecd_fua",
              methodology: "Latest OECD FUA labour observation matched to a city selection surface.",
              url: "https://www.oecd.org/",
            },
          },
          {
            indicatorId: "employment",
            value: 5_980_000,
            unit: "persons",
            year: 2023,
            status: "actual",
            source: {
              id: "oecd-fua-labour",
              name: "OECD FUA Labour",
              updatedAt: "2026-03-20",
              coverage: "oecd_fua",
              methodology: "Latest OECD FUA labour observation matched to a city selection surface.",
              url: "https://www.oecd.org/",
            },
          },
          {
            indicatorId: "company-presence",
            value: 42_315,
            unit: "LEIs",
            year: 2026,
            status: "actual",
            source: {
              id: "gleif-lei",
              name: "GLEIF LEI",
              updatedAt: "2026-03-20",
              coverage: "legal-entity-city-match",
              methodology:
                "Active GLEIF legal entities counted when legal or headquarters city matches the selected city.",
              url: "https://www.gleif.org/",
            },
          },
        ],
        urbanIntel: [],
        sources: [
          {
            id: "oecd-fua-economy",
            name: "OECD FUA Economy",
            updatedAt: "2026-03-20",
            coverage: "oecd_fua",
            methodology: "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
            url: "https://www.oecd.org/",
          },
          {
            id: "oecd-fua-labour",
            name: "OECD FUA Labour",
            updatedAt: "2026-03-20",
            coverage: "oecd_fua",
            methodology: "Latest OECD FUA labour observation matched to a city selection surface.",
            url: "https://www.oecd.org/",
          },
          {
            id: "gleif-lei",
            name: "GLEIF LEI",
            updatedAt: "2026-03-20",
            coverage: "legal-entity-city-match",
            methodology:
              "Active GLEIF legal entities counted when legal or headquarters city matches the selected city.",
            url: "https://www.gleif.org/",
          },
        ],
      },
      worldBankCountryEconomyIndex: new Map(),
    });

    expect(enriched.economicFactbook.map((metric) => metric.indicatorId)).toEqual(
      expect.arrayContaining(["gdp-current-ppp", "labour-force", "employment"]),
    );
    expect(enriched.investorIntel.map((metric) => metric.indicatorId)).toEqual(
      expect.arrayContaining(["company-presence"]),
    );
    expect(enriched.investorIntel.map((metric) => metric.indicatorId)).not.toEqual(
      expect.arrayContaining(["labour-force", "employment"]),
    );
    expect(enriched.sources.map((source) => source.name)).toEqual(
      expect.arrayContaining(["OECD FUA Economy", "OECD FUA Labour", "GLEIF LEI"]),
    );
  });

  it("derives a source-backed GDP estimate from country GDP per capita when city GDP is unavailable", () => {
    const city = buildCity();
    const workspace = buildWorkspace();

    const countryEconomyIndex = buildWorldBankCountryEconomyIndex({
      generatedAt: "2026-03-20T00:00:00.000Z",
      observations: [
        {
          entityId: "turkiye",
          indicatorId: "gdp-current-usd",
          year: 2024,
          value: 1_322_408_000_000,
          sourceId: "world-bank",
        },
        {
          entityId: "turkiye",
          indicatorId: "population",
          year: 2024,
          value: 85_372_377,
          sourceId: "world-bank",
        },
      ],
    });

    const enriched = applyCityIntelEnrichment({
      city,
      workspace,
      enrichmentEntry: null,
      worldBankCountryEconomyIndex: countryEconomyIndex,
    });

    const derivedMetric = enriched.economicFactbook.find(
      (metric) => metric.indicatorId === "gdp-country-per-capita-proxy",
    );

    expect(derivedMetric).toMatchObject({
      unit: "USD",
      year: 2024,
      status: "estimate",
    });
    expect(derivedMetric?.value).toBeGreaterThan(240_000_000_000);
    expect(derivedMetric?.value).toBeLessThan(250_000_000_000);
    expect(derivedMetric?.source.name).toBe("World Bank / GeoNames City GDP Proxy");
  });

  it("marks urban coverage when fixed and mobile broadband metrics are merged into the city brief", () => {
    const city = buildCity();
    const workspace = buildWorkspace();

    const enriched = applyCityIntelEnrichment({
      city,
      workspace,
      enrichmentEntry: {
        generatedAt: "2026-03-21T00:00:00.000Z",
        economicFactbook: [],
        investorIntel: [],
        urbanIntel: [
          {
            indicatorId: "fixed-download-mbps",
            value: 166.7,
            unit: "Mbps",
            year: 2025,
            status: "actual",
            source: {
              id: "ookla-fixed",
              name: "Ookla Open Data",
              updatedAt: "2026-03-21",
              coverage: "city_selection_surface",
              methodology:
                "Weighted average of fixed broadband tiles intersecting the visible city selection surface.",
              url: "https://www.speedtest.net/insights/open-data/",
            },
          },
          {
            indicatorId: "mobile-download-mbps",
            value: 60,
            unit: "Mbps",
            year: 2025,
            status: "actual",
            source: {
              id: "ookla-mobile",
              name: "Ookla Open Data",
              updatedAt: "2026-03-21",
              coverage: "city_selection_surface",
              methodology:
                "Weighted average of mobile broadband tiles intersecting the visible city selection surface.",
              url: "https://www.speedtest.net/insights/open-data/",
            },
          },
        ],
        sources: [
          {
            id: "ookla-fixed",
            name: "Ookla Open Data",
            updatedAt: "2026-03-21",
            coverage: "city_selection_surface",
            methodology:
              "Weighted average of fixed broadband tiles intersecting the visible city selection surface.",
            url: "https://www.speedtest.net/insights/open-data/",
          },
          {
            id: "ookla-mobile",
            name: "Ookla Open Data",
            updatedAt: "2026-03-21",
            coverage: "city_selection_surface",
            methodology:
              "Weighted average of mobile broadband tiles intersecting the visible city selection surface.",
            url: "https://www.speedtest.net/insights/open-data/",
          },
        ],
      },
      worldBankCountryEconomyIndex: new Map(),
    });

    expect(enriched.urbanIntel.map((metric) => metric.indicatorId)).toEqual(
      expect.arrayContaining(["fixed-download-mbps", "mobile-download-mbps"]),
    );
    expect(enriched.sources.map((source) => source.name)).toContain("Ookla Open Data");
    expect(enriched.coverage.urbanIntel).toBe("partial_coverage");
  });

  it("loads economic coverage enrichment alongside the existing generated city intel files", async () => {
    const readFile = vi.fn(async (filePath: string) => {
      const normalized = String(filePath).replace(/\\/g, "/");

      if (normalized.endsWith("/src/data/generated/command-center/city-intel-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-20T00:00:00.000Z",
          cities: {
            "geo-1": {
              generatedAt: "2026-03-20T00:00:00.000Z",
              economicFactbook: [],
              investorIntel: [],
              urbanIntel: [],
              sources: [],
            },
          },
        });
      }

      if (normalized.endsWith("/src/data/generated/command-center/city-connectivity-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-21T00:00:00.000Z",
          cities: {
            "geo-1": {
              generatedAt: "2026-03-21T00:00:00.000Z",
              economicFactbook: [],
              investorIntel: [],
              urbanIntel: [
                {
                  indicatorId: "fixed-download-mbps",
                  value: 166.7,
                  unit: "Mbps",
                  year: 2025,
                  status: "actual",
                  source: {
                    id: "ookla-fixed",
                    name: "Ookla Open Data",
                    updatedAt: "2026-03-21",
                    coverage: "city_selection_surface",
                    methodology: "Fixed broadband city aggregate.",
                    url: "https://www.speedtest.net/insights/open-data/",
                  },
                },
              ],
              sources: [],
            },
          },
        });
      }

      if (normalized.endsWith("/src/data/generated/command-center/city-environment-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-22T00:00:00.000Z",
          cities: {
            "geo-1": {
              generatedAt: "2026-03-22T00:00:00.000Z",
              economicFactbook: [],
              investorIntel: [],
              urbanIntel: [
                {
                  indicatorId: "pm25",
                  value: 18.6,
                  unit: "ug/m3",
                  year: 2023,
                  status: "actual",
                  source: {
                    id: "who-air-quality",
                    name: "WHO Air Quality",
                    updatedAt: "2026-03-22",
                    coverage: "city_selection_surface",
                    methodology: "Latest WHO PM2.5 observation matched to a city selection surface.",
                    url: "https://www.who.int/",
                  },
                },
                {
                  indicatorId: "water-stress",
                  value: 3.6,
                  unit: "score",
                  status: "actual",
                  source: {
                    id: "wri-aqueduct",
                    name: "WRI Aqueduct",
                    updatedAt: "2026-03-22",
                    coverage: "admin1_to_city_match",
                    methodology: "Aqueduct baseline water stress score matched from admin coverage to a city selection surface.",
                    url: "https://www.wri.org/aqueduct",
                  },
                },
              ],
              sources: [],
            },
          },
        });
      }

      if (normalized.endsWith("/src/data/generated/command-center/city-economic-coverage-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-23T00:00:00.000Z",
          cities: {
            "geo-1": {
              generatedAt: "2026-03-23T00:00:00.000Z",
              economicFactbook: [
                {
                  indicatorId: "gdp-current-ppp",
                  value: 801_599_000_000,
                  unit: "USD PPP",
                  year: 2023,
                  status: "actual",
                  source: {
                    id: "oecd-fua-economy",
                    name: "OECD FUA Economy",
                    updatedAt: "2026-03-23",
                    coverage: "oecd_fua",
                    methodology: "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
                    url: "https://www.oecd.org/",
                  },
                },
              ],
              investorIntel: [
                {
                  indicatorId: "company-presence",
                  value: 42_315,
                  unit: "LEIs",
                  year: 2026,
                  status: "actual",
                  source: {
                    id: "gleif-lei",
                    name: "GLEIF LEI",
                    updatedAt: "2026-03-23",
                    coverage: "legal-entity-city-match",
                    methodology:
                      "Active GLEIF legal entities counted when legal or headquarters city matches the selected city.",
                    url: "https://www.gleif.org/",
                  },
                },
              ],
              urbanIntel: [],
              sources: [],
            },
          },
        });
      }

      throw new Error(`Unexpected file read: ${filePath}`);
    });

    vi.resetModules();
    vi.doMock("node:fs/promises", () => ({
      default: { readFile },
      readFile,
    }));

    const module = await import("./city-intel-enrichment");
    const index = await module.loadCityIntelEnrichmentIndex();

    expect(index.cities["geo-1"].urbanIntel.map((metric) => metric.indicatorId)).toEqual(
      expect.arrayContaining(["fixed-download-mbps", "pm25", "water-stress"]),
    );
    expect(index.cities["geo-1"].economicFactbook.map((metric) => metric.indicatorId)).toContain(
      "gdp-current-ppp",
    );
    expect(index.cities["geo-1"].investorIntel.map((metric) => metric.indicatorId)).toContain(
      "company-presence",
    );
  });
});
