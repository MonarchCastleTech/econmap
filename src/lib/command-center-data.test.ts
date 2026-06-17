import { beforeEach, describe, expect, it, vi } from "vitest";

const readFile = vi.fn();
const findCityBySlug = vi.fn();
const loadCityCoverageShell = vi.fn();
const loadCityEntities = vi.fn();
const loadCitySearchIndex = vi.fn();
const loadCitySources = vi.fn();
const loadCityWorkspace = vi.fn();

vi.mock("node:fs/promises", () => ({
  default: { readFile },
  readFile,
}));

vi.mock("@/lib/city-data", () => ({
  findCityBySlug,
  loadCityCoverageShell,
  loadCityEntities,
  loadCitySearchIndex,
  loadCitySources,
  loadCityWorkspace,
}));

describe("command-center-data", () => {
  beforeEach(() => {
    vi.resetModules();
    readFile.mockReset();
    findCityBySlug.mockReset();
    loadCityCoverageShell.mockReset();
    loadCityEntities.mockReset();
    loadCitySearchIndex.mockReset();
    loadCitySources.mockReset();
    loadCityWorkspace.mockReset();
  });

  it("skips loading the city search index for blank homepage queries", async () => {
    const commandCenterData = await import("./command-center-data");

    const results = await commandCenterData.searchCommandCenterCities("");

    expect(results).toEqual([]);
    expect(loadCitySearchIndex).not.toHaveBeenCalled();
  });

  it("builds a featured-city deck from real major cities and resolves duplicate names by country", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify([
        {
          cityId: "geo-745044",
          slug: "geo-745044-istanbul",
          name: "Istanbul",
          aliases: [],
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkiye",
          admin1Name: "Istanbul",
          admin1Code: null,
          latitude: 41.0082,
          longitude: 28.9784,
          boundaryStatus: "point_only",
          population: 15701602,
          populationSource: "GeoNames",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
        {
          cityId: "geo-323786",
          slug: "geo-323786-ankara",
          name: "Ankara",
          aliases: [],
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkiye",
          admin1Name: "Ankara",
          admin1Code: null,
          latitude: 39.9334,
          longitude: 32.8597,
          boundaryStatus: "point_only",
          population: 3517182,
          populationSource: "GeoNames",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
        {
          cityId: "geo-3169070",
          slug: "geo-3169070-rome",
          name: "Rome",
          aliases: [],
          countryIso2: "IT",
          countryIso3: "ITA",
          countrySlug: "italy",
          admin1Name: "Lazio",
          admin1Code: null,
          latitude: 41.8919,
          longitude: 12.5113,
          boundaryStatus: "point_only",
          population: 2318895,
          populationSource: "GeoNames",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
        {
          cityId: "geo-2988507",
          slug: "geo-2988507-paris",
          name: "Paris",
          aliases: [],
          countryIso2: "FR",
          countryIso3: "FRA",
          countrySlug: "france",
          admin1Name: "Ile-de-France",
          admin1Code: null,
          latitude: 48.8534,
          longitude: 2.3488,
          boundaryStatus: "point_only",
          population: 2138551,
          populationSource: "GeoNames",
          registrySource: "GeoNames",
          recordStatus: "active",
          isMajorCity: true,
        },
      ]),
    );

    const commandCenterData = await import("./command-center-data");

    const results = await commandCenterData.loadFeaturedCommandCenterCities();

    expect(results.map((result) => `${result.name}-${result.countryIso3}`)).toEqual([
      "Istanbul-TUR",
      "Ankara-TUR",
      "Rome-ITA",
      "Paris-FRA",
    ]);
    expect(results[3]).toMatchObject({
      slug: "geo-2988507-paris",
      latitude: 48.8534,
      longitude: 2.3488,
    });
    expect(loadCitySearchIndex).not.toHaveBeenCalled();
    expect(loadCityWorkspace).not.toHaveBeenCalled();
  });

  it("loads and ranks city results when a query is present", async () => {
    loadCitySearchIndex.mockResolvedValue([
      {
        cityId: "geo-1",
        slug: "izmir",
        name: "Izmir",
        aliases: ["Smyrna"],
        countryIso3: "TUR",
        admin1Name: "Izmir",
        population: 4320519,
      },
      {
        cityId: "geo-2",
        slug: "izmit",
        name: "Izmit",
        aliases: [],
        countryIso3: "TUR",
        admin1Name: "Kocaeli",
        population: 367990,
      },
      {
        cityId: "geo-3",
        slug: "ankara",
        name: "Ankara",
        aliases: [],
        countryIso3: "TUR",
        admin1Name: "Ankara",
        population: 5607000,
      },
    ]);

    const commandCenterData = await import("./command-center-data");

    const results = await commandCenterData.searchCommandCenterCities("izm");

    expect(loadCitySearchIndex).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.slug)).toEqual(["izmir", "izmit"]);
  });

  it("loads the city panel from a known city id without reopening the full registry", async () => {
    loadCityWorkspace.mockResolvedValue({
      city: {
        cityId: "geo-1",
        slug: "izmir",
        name: "Izmir",
        aliases: [],
        countryIso2: "TR",
        countryIso3: "TUR",
        countrySlug: "turkey",
        admin1Name: "Izmir",
        admin1Code: "35",
        admin2Name: null,
        latitude: 38.4237,
        longitude: 27.1428,
        boundaryStatus: "point_only",
        population: 4320519,
        populationSource: "GeoNames",
        registrySource: "GeoNames",
        recordStatus: "active",
      },
      summary: "Izmir source-backed command workspace",
      roleTags: [],
      coverage: {
        economicFactbook: "verified_exact",
        investorIntel: "not_covered_yet",
        urbanIntel: "not_covered_yet",
      },
      economicFactbook: [],
      investorIntel: [],
      urbanIntel: [],
      entityCounts: {},
      entityHighlights: [],
      mapLayerSummary: { availableLayers: [] },
      sources: [],
    });
    loadCityCoverageShell.mockResolvedValue({
      generatedAt: "2026-03-26T00:00:00.000Z",
      cityId: "geo-1",
      boundaryStatus: "point_only",
      sourceCount: 1,
      mappedCategoryCount: 0,
      documentedCategoryCount: 3,
      missingCategoryCount: 2,
      categories: [
        {
          id: "geometry",
          label: "Geometry Surface",
          state: "documented",
          count: 0,
          detail: "Point-only city shell is available; boundary geometry is still missing.",
          sourceLabels: ["GeoNames"],
        },
      ],
    });
    loadCityEntities.mockResolvedValue({ entities: [], sources: [] });
    loadCitySources.mockResolvedValue({ sources: [] });

    const commandCenterData = await import("./command-center-data");

    const panel = await commandCenterData.loadCommandCenterCityPanel({
      slug: "izmir",
      cityId: "geo-1",
    });

    expect(findCityBySlug).not.toHaveBeenCalled();
    expect(loadCityWorkspace).toHaveBeenCalledWith("geo-1");
    expect(loadCityCoverageShell).toHaveBeenCalledWith("geo-1");
    expect(panel?.city.slug).toBe("izmir");
    expect(panel?.coverageShell?.boundaryStatus).toBe("point_only");
  });

  it("merges generated city enrichment metrics into the selected city panel", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      const normalized = String(filePath).replace(/\\/g, "/");

      if (normalized.endsWith("/src/data/generated/command-center/city-intel-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-20T00:00:00.000Z",
          cities: {
            "geo-1": {
              generatedAt: "2026-03-20T00:00:00.000Z",
              economicFactbook: [
                {
                  indicatorId: "gdp-current-ppp",
                  value: 801599000000,
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
              investorIntel: [],
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
              ],
            },
          },
        });
      }

      if (normalized.endsWith("/src/data/generated/world-bank-core.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-20T00:00:00.000Z",
          observations: [],
        });
      }

      throw new Error(`Unexpected file read: ${filePath}`);
    });

    loadCityWorkspace.mockResolvedValue({
      city: {
        cityId: "geo-1",
        slug: "izmir",
        name: "Izmir",
        aliases: [],
        countryIso2: "TR",
        countryIso3: "TUR",
        countrySlug: "turkiye",
        admin1Name: "Izmir",
        admin1Code: "35",
        latitude: 38.4237,
        longitude: 27.1428,
        boundaryStatus: "point_only",
        population: 4320519,
        populationSource: "GeoNames",
        registrySource: "GeoNames",
        recordStatus: "active",
      },
      summary: "Izmir source-backed command workspace",
      roleTags: [],
      coverage: {
        economicFactbook: "verified_exact",
        investorIntel: "not_covered_yet",
        urbanIntel: "not_covered_yet",
      },
      economicFactbook: [
        {
          indicatorId: "population",
          value: 4320519,
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
      entityCounts: { airport: 1 },
      entityHighlights: [],
      mapLayerSummary: { availableLayers: ["cities", "airports"] },
      sources: [],
    });
    loadCityCoverageShell.mockResolvedValue({
      generatedAt: "2026-03-26T00:00:00.000Z",
      cityId: "geo-1",
      boundaryStatus: "point_only",
      sourceCount: 1,
      mappedCategoryCount: 0,
      documentedCategoryCount: 4,
      missingCategoryCount: 2,
      categories: [
        {
          id: "geometry",
          label: "Geometry Surface",
          state: "documented",
          count: 0,
          detail: "Point-only city shell is available; boundary geometry is still missing.",
          sourceLabels: ["GeoNames"],
        },
      ],
    });
    loadCityEntities.mockResolvedValue({ entities: [], sources: [] });
    loadCitySources.mockResolvedValue({ cityId: "geo-1", sources: [] });

    const commandCenterData = await import("./command-center-data");

    const panel = await commandCenterData.loadCommandCenterCityPanel({
      slug: "izmir",
      cityId: "geo-1",
    });

    expect(panel?.workspace?.economicFactbook.map((metric) => metric.indicatorId)).toEqual(
      expect.arrayContaining(["population", "gdp-current-ppp"]),
    );
    expect(panel?.workspace?.sources.map((source) => source.name)).toContain("OECD FUA Economy");
    expect(panel?.workspace?.economicFactbook.some((metric) => metric.indicatorId === "gdp-current-ppp")).toBe(
      true,
    );
    expect(panel?.workspace?.telecomIntel).toBeDefined();
    expect(panel?.workspace?.environmentIntel).toBeDefined();
    expect(panel?.workspace?.transportIntel).toBeDefined();
    expect(panel?.workspace?.coverageBoundaryType).toBe("point_only_surface");
    expect(panel?.coverageShell?.categories[0]?.id).toBe("geometry");
  });

  it("prefers observed Washington economic coverage and company presence over proxy fallback", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      const normalized = String(filePath).replace(/\\/g, "/");

      if (normalized.endsWith("/src/data/generated/command-center/city-intel-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-20T00:00:00.000Z",
          cities: {},
        });
      }

      if (normalized.endsWith("/src/data/generated/command-center/city-connectivity-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-21T00:00:00.000Z",
          cities: {},
        });
      }

      if (normalized.endsWith("/src/data/generated/command-center/city-environment-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-22T00:00:00.000Z",
          cities: {},
        });
      }

      if (normalized.endsWith("/src/data/generated/command-center/city-economic-coverage-enrichment.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-23T00:00:00.000Z",
          cities: {
            "geo-4140963": {
              generatedAt: "2026-03-23T00:00:00.000Z",
              economicFactbook: [
                {
                  indicatorId: "gdp-current-ppp",
                  value: 699_000_000_000,
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
                  indicatorId: "employment",
                  value: 3_420_000,
                  unit: "persons",
                  year: 2023,
                  status: "actual",
                  source: {
                    id: "oecd-fua-labour",
                    name: "OECD FUA Labour",
                    updatedAt: "2026-03-23",
                    coverage: "oecd_fua",
                    methodology: "Latest OECD or Eurostat labour observation matched to a city selection surface.",
                    url: "https://www.oecd.org/",
                  },
                },
                {
                  indicatorId: "company-presence",
                  value: 31_822,
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
              sources: [
                {
                  id: "oecd-fua-economy",
                  name: "OECD FUA Economy",
                  updatedAt: "2026-03-23",
                  coverage: "oecd_fua",
                  methodology: "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
                  url: "https://www.oecd.org/",
                },
                {
                  id: "oecd-fua-labour",
                  name: "OECD FUA Labour",
                  updatedAt: "2026-03-23",
                  coverage: "oecd_fua",
                  methodology: "Latest OECD or Eurostat labour observation matched to a city selection surface.",
                  url: "https://www.oecd.org/",
                },
                {
                  id: "gleif-lei",
                  name: "GLEIF LEI",
                  updatedAt: "2026-03-23",
                  coverage: "legal-entity-city-match",
                  methodology:
                    "Active GLEIF legal entities counted when legal or headquarters city matches the selected city.",
                  url: "https://www.gleif.org/",
                },
              ],
            },
          },
        });
      }

      if (normalized.endsWith("/src/data/generated/world-bank-core.json")) {
        return JSON.stringify({
          generatedAt: "2026-03-23T00:00:00.000Z",
          observations: [
            {
              entityId: "united-states",
              indicatorId: "gdp-current-usd",
              year: 2024,
              value: 29_167_779_000_000,
              sourceId: "world-bank",
            },
            {
              entityId: "united-states",
              indicatorId: "population",
              year: 2024,
              value: 340_110_988,
              sourceId: "world-bank",
            },
          ],
        });
      }

      throw new Error(`Unexpected file read: ${filePath}`);
    });

    loadCityWorkspace.mockResolvedValue({
      city: {
        cityId: "geo-4140963",
        slug: "geo-4140963-washington",
        name: "Washington",
        aliases: ["Washington, D.C.", "Washington DC"],
        countryIso2: "US",
        countryIso3: "USA",
        countrySlug: "united-states",
        admin1Name: "District of Columbia",
        admin1Code: "DC",
        latitude: 38.8951,
        longitude: -77.0364,
        boundaryStatus: "point_only",
        population: 689_545,
        populationSource: "GeoNames",
        registrySource: "GeoNames",
        recordStatus: "active",
        isMajorCity: true,
      },
      summary: "Washington source-backed command workspace",
      roleTags: [],
      coverage: {
        economicFactbook: "not_covered_yet",
        investorIntel: "not_covered_yet",
        urbanIntel: "not_covered_yet",
      },
      economicFactbook: [
        {
          indicatorId: "population",
          value: 689_545,
          unit: "persons",
          status: "actual",
          source: {
            id: "geonames",
            name: "GeoNames",
            updatedAt: "2026-03-23",
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
      mapLayerSummary: { availableLayers: ["cities"] },
      sources: [
        {
          id: "geonames",
          name: "GeoNames",
          updatedAt: "2026-03-23",
          coverage: "global",
          methodology: "Canonical city registry record",
          url: "https://www.geonames.org/",
        },
      ],
    });
    loadCityEntities.mockResolvedValue({ entities: [], sources: [] });
    loadCitySources.mockResolvedValue({ cityId: "geo-4140963", sources: [] });

    const commandCenterData = await import("./command-center-data");

    const panel = await commandCenterData.loadCommandCenterCityPanel({
      slug: "geo-4140963-washington",
      cityId: "geo-4140963",
    });

    expect(panel?.workspace?.economicFactbook.some((metric) => metric.indicatorId === "gdp-current-ppp")).toBe(
      true,
    );
    expect(panel?.workspace?.economicFactbook.some((metric) => metric.indicatorId === "employment")).toBe(true);
    expect(panel?.workspace?.investorIntel.some((metric) => metric.indicatorId === "company-presence")).toBe(
      true,
    );
    expect(panel?.workspace?.sources.map((source) => source.name)).not.toContain(
      "World Bank / GeoNames City GDP Proxy",
    );
    expect(
      panel?.workspace?.sourceCoverageSummary.some((item) => item.value.toLowerCase().includes("estimate")),
    ).toBe(false);
  });

  it("classifies generic workspace metrics into transport, utilities, organization, telecom, environment, and economic buckets", async () => {
    loadCityWorkspace.mockResolvedValue({
      city: {
        cityId: "geo-698740",
        slug: "geo-698740-odesa",
        name: "Odesa",
        aliases: [],
        countryIso2: "UA",
        countryIso3: "UKR",
        countrySlug: "ukraine",
        admin1Name: "Odesa",
        admin1Code: "51",
        latitude: 46.4857,
        longitude: 30.7438,
        boundaryStatus: "has_boundary",
        population: 1015826,
        populationSource: "GeoNames",
        registrySource: "GeoNames",
        recordStatus: "active",
      },
      summary: "Odesa source-backed command workspace",
      roleTags: [],
      coverage: {
        economicFactbook: "verified_exact",
        investorIntel: "verified_city_presence",
        urbanIntel: "verified_city_presence",
      },
      economicFactbook: [
        {
          indicatorId: "population",
          value: 1015826,
          unit: "persons",
          status: "actual",
          source: {
            id: "geonames",
            name: "GeoNames",
            updatedAt: "2026-03-21",
            coverage: "global",
            methodology: "Canonical city registry record",
          },
        },
      ],
      investorIntel: [
        {
          indicatorId: "airports",
          value: 7,
          unit: "sites",
          status: "actual",
          source: {
            id: "ourairports-unlocode",
            name: "OurAirports / UN/LOCODE",
            updatedAt: "2026-03-21",
            coverage: "city_presence",
            methodology: "Airport observations joined to city evidence bundles.",
          },
        },
        {
          indicatorId: "ports",
          value: 4,
          unit: "sites",
          status: "actual",
          source: {
            id: "world-port-index",
            name: "World Port Index",
            updatedAt: "2026-03-21",
            coverage: "global",
            methodology: "Port registry joined to city evidence bundles.",
          },
        },
        {
          indicatorId: "utilities",
          value: 1,
          unit: "sites",
          status: "actual",
          source: {
            id: "wri",
            name: "WRI",
            updatedAt: "2026-03-21",
            coverage: "global",
            methodology: "Power plant registry joined to city evidence bundles.",
          },
        },
        {
          indicatorId: "organizations",
          value: 29,
          unit: "sites",
          status: "actual",
          source: {
            id: "ror",
            name: "ROR",
            updatedAt: "2026-03-21",
            coverage: "city_presence",
            methodology: "Research organizations joined to city evidence bundles.",
          },
        },
        {
          indicatorId: "labour-force",
          value: 490000,
          unit: "persons",
          status: "actual",
          source: {
            id: "oecd-fua-labour",
            name: "OECD FUA Labour",
            updatedAt: "2026-03-21",
            coverage: "oecd_fua",
            methodology: "Labour observations matched to a city selection surface.",
          },
        },
      ],
      urbanIntel: [
        {
          indicatorId: "telecom",
          value: 92,
          unit: "Mbps",
          status: "actual",
          source: {
            id: "ookla",
            name: "Ookla",
            updatedAt: "2026-03-21",
            coverage: "city_sample",
            methodology: "Fixed broadband observation matched to city evidence bundles.",
          },
        },
        {
          indicatorId: "environment",
          value: 13,
          unit: "ug/m3",
          status: "actual",
          source: {
            id: "who-air-quality",
            name: "WHO Air Quality",
            updatedAt: "2026-03-21",
            coverage: "city_sample",
            methodology: "Air quality observation matched to city evidence bundles.",
          },
        },
      ],
      entityCounts: { airport: 4, port: 4, utility: 1, research: 29 },
      entityHighlights: [],
      mapLayerSummary: { availableLayers: ["cities", "airports", "ports", "utilities", "research"] },
      sources: [
        {
          id: "geonames",
          name: "GeoNames",
          updatedAt: "2026-03-21",
          coverage: "global",
          methodology: "Canonical city registry record",
        },
      ],
    });
    loadCityEntities.mockResolvedValue({ entities: [], sources: [] });
    loadCitySources.mockResolvedValue({ cityId: "geo-698740", sources: [] });

    const commandCenterData = await import("./command-center-data");

    const panel = await commandCenterData.loadCommandCenterCityPanel({
      slug: "geo-698740-odesa",
      cityId: "geo-698740",
    });

    expect(panel?.workspace?.transportIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "airports",
          value: 7,
        }),
        expect.objectContaining({
          indicatorId: "ports",
          value: 4,
        }),
      ]),
    );
    expect(panel?.workspace?.utilitiesIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "utilities",
          value: 1,
        }),
      ]),
    );
    expect(panel?.workspace?.organizationIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "organizations",
          value: 29,
        }),
      ]),
    );
    expect(panel?.workspace?.telecomIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "telecom",
          value: 92,
        }),
      ]),
    );
    expect(panel?.workspace?.environmentIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "environment",
          value: 13,
        }),
      ]),
    );
    expect(panel?.workspace?.environmentIntel.map((metric) => metric.indicatorId)).not.toContain("airports");
    expect(panel?.workspace?.economicIntel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorId: "population",
          value: 1015826,
        }),
        expect.objectContaining({
          indicatorId: "labour-force",
          value: 490000,
        }),
      ]),
    );
    expect(panel?.workspace?.organizationIntel.map((metric) => metric.indicatorId)).not.toContain("labour-force");
  });

  it("reads command-center artifacts fresh in development mode", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");
    readFile
      .mockResolvedValueOnce(
        JSON.stringify({
          generatedAt: "2026-03-15T00:00:00.000Z",
          defaultViewId: "global-ops",
          globalIntelligence: [],
          opsTimeline: [],
          savedViews: [],
          sourceSummary: [],
          datasetInventory: [],
          tacticalLayerCatalog: [],
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          generatedAt: "2026-03-15T01:00:00.000Z",
          defaultViewId: "global-ops",
          globalIntelligence: [],
          opsTimeline: [],
          savedViews: [],
          sourceSummary: [],
          datasetInventory: [],
          tacticalLayerCatalog: [],
        }),
      );

    try {
      const commandCenterData = await import("./command-center-data");

      const first = await commandCenterData.loadCommandCenterManifest();
      const second = await commandCenterData.loadCommandCenterManifest();

      expect(first.generatedAt).toBe("2026-03-15T00:00:00.000Z");
      expect(second.generatedAt).toBe("2026-03-15T01:00:00.000Z");
      expect(readFile).toHaveBeenCalledTimes(2);
    } finally {
      if (previousNodeEnv === undefined) {
        vi.unstubAllEnvs();
      } else {
        vi.stubEnv("NODE_ENV", previousNodeEnv);
      }
    }
  });

  it("loads a generated dataset workspace by id", async () => {
    readFile.mockResolvedValue(
      JSON.stringify({
        generatedAt: "2026-03-16T00:00:00.000Z",
        dataset: {
          id: "who-air-quality",
          label: "WHO Air Quality",
          status: "downloaded_local_source",
          sourceLabels: ["WHO Air Quality"],
          detail: "Downloaded local source is present on disk and surfaced on the website via dataset workspace.",
          websiteSurfaces: ["dataset workspace"],
          workspacePath: "/datasets/who-air-quality",
        },
        sourcePack: {
          fileCount: 1,
          totalSizeBytes: 4321000,
          files: [
            {
              relativePath: "who/who_ambient_air_quality_database_v2024.xlsx",
              purpose: "WHO city-level ambient air quality observations.",
              sourceUrl: "https://cdn.who.int/",
              required: false,
              exists: true,
              sizeBytes: 4321000,
            },
          ],
        },
        processedIndex: {
          fileName: null,
          exists: false,
          rowCount: 0,
        },
        cityBundleCount: 0,
        imageryDateCount: 0,
        notes: ["No processed index is published for this dataset in the current build."],
      }),
    );

    const commandCenterData = await import("./command-center-data");

    const workspace = await commandCenterData.loadCommandCenterDatasetWorkspace("who-air-quality");

    expect(workspace?.dataset.id).toBe("who-air-quality");
    expect(workspace?.dataset.workspacePath).toBe("/datasets/who-air-quality");
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("loads the published city-footprint catalog from shipped globe reference assets", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify({
      generatedAt: "2026-03-20T00:00:00.000Z",
      selectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
        cities: [
          {
            cityId: "geo-745044",
            slug: "geo-745044-istanbul",
            name: "Istanbul",
            countryIso3: "TUR",
            assetPath: "/data/globe/reference/city-footprints/geo-745044.geojson",
            areaSqKm: 1539.2,
            matchDistanceMeters: 4357,
            sourceLabel: "GHSL",
          },
        ],
      }),
    );

    const commandCenterData = await import("./command-center-data");

    const catalog = await commandCenterData.loadCityFootprintCatalog();

    expect(catalog).toMatchObject({
      selectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
      cities: [
        {
          cityId: "geo-745044",
          slug: "geo-745044-istanbul",
          name: "Istanbul",
          sourceLabel: "GHSL",
        },
      ],
    });
  });

  it("loads only the minimal city-footprint selection contract for homepage boot", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        generatedAt: "2026-03-20T00:00:00.000Z",
        selectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
        cities: [
          {
            cityId: "geo-745044",
            slug: "geo-745044-istanbul",
            name: "Istanbul",
            countryIso3: "TUR",
            assetPath: "/data/globe/reference/city-footprints/geo-745044.geojson",
            areaSqKm: 1539.2,
            matchDistanceMeters: 4357,
            sourceLabel: "GHSL",
          },
        ],
      }),
    );

    const commandCenterData = await import("./command-center-data");

    const selection = await commandCenterData.loadCityFootprintSelection();

    expect(selection).toEqual({
      generatedAt: "2026-03-20T00:00:00.000Z",
      selectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
    });
  });
});
