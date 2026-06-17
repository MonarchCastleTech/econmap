import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadBaseImageryCatalogMock = vi.fn();
const loadCityFootprintCatalogMock = vi.fn();
const loadCityFootprintSelectionMock = vi.fn();
const loadFeaturedCommandCenterCitiesMock = vi.fn();
const loadCommandCenterManifestMock = vi.fn();
const loadGlobeManifestMock = vi.fn();

vi.mock("@/lib/command-center-home-data", () => ({
  loadBaseImageryCatalog: loadBaseImageryCatalogMock,
  loadCityFootprintCatalog: loadCityFootprintCatalogMock,
  loadCityFootprintSelection: loadCityFootprintSelectionMock,
  loadFeaturedCommandCenterCities: loadFeaturedCommandCenterCitiesMock,
  loadCommandCenterManifest: loadCommandCenterManifestMock,
  loadGlobeManifest: loadGlobeManifestMock,
}));

vi.mock("@/features/home/components/home-shell", () => ({
  HomeShell: (props: unknown) => (
    <pre data-testid="home-shell-props">{JSON.stringify(props, null, 2)}</pre>
  ),
}));

describe("app/page", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.resetModules();
    loadBaseImageryCatalogMock.mockReset();
    loadCityFootprintCatalogMock.mockReset();
    loadCityFootprintSelectionMock.mockReset();
    loadFeaturedCommandCenterCitiesMock.mockReset();
    loadCommandCenterManifestMock.mockReset();
    loadGlobeManifestMock.mockReset();

    loadCommandCenterManifestMock.mockResolvedValue({
      generatedAt: "2026-03-15T00:00:00.000Z",
      defaultViewId: "global-ops",
      globalIntelligence: [],
      opsTimeline: [],
      savedViews: [
        {
          id: "global-ops",
          label: "Global Ops",
          activeLayerIds: ["cities", "airports"],
          sourceLabels: ["GeoNames", "OurAirports"],
        },
      ],
      sourceSummary: [],
      tacticalLayerCatalog: [],
    });

    loadGlobeManifestMock.mockResolvedValue({
      generatedAt: "2026-03-15T00:00:00.000Z",
      layers: [
        {
          id: "cities",
          label: "Cities",
          family: "Political / Admin",
          sourceLabels: ["GeoNames"],
          tier: "boot",
          supportsTime: false,
          supportsCityFocus: true,
          assetPath: "/data/globe/layers/cities/vectors/current.geojson",
        },
        {
          id: "airports",
          label: "Airports",
          family: "Transport",
          sourceLabels: ["OurAirports"],
          tier: "interactive",
          supportsTime: false,
          supportsCityFocus: true,
          assetPath: "/data/globe/layers/airports/vectors/current.geojson",
        },
        {
          id: "ports",
          label: "Ports",
          family: "Transport",
          sourceLabels: ["UN/LOCODE", "World Port Index"],
          tier: "interactive",
          supportsTime: false,
          supportsCityFocus: true,
          assetPath: "/data/globe/layers/ports/vectors/current.geojson",
        },
      ],
    });

    loadBaseImageryCatalogMock.mockResolvedValue({
      generatedAt: "2026-03-15T00:00:00.000Z",
      defaultLayerId: "night-lights",
      layers: [
        {
          id: "true-color",
          label: "True Color",
          family: "Base Maps",
          status: "not_yet_published",
          availableDates: [],
          minZoom: 0,
          maxZoom: 8,
          attribution: ["NASA GIBS"],
          assetPathTemplate: "/data/globe/base-imagery/true-color/{date}/{z}/{x}/{y}.jpg",
          defaultOpacity: 1,
        },
        {
          id: "night-lights",
          label: "Night Lights",
          family: "Satellite",
          status: "published",
          availableDates: ["2016-01-01"],
          minZoom: 0,
          maxZoom: 3,
          attribution: ["NASA Black Marble"],
          assetPathTemplate: "/data/globe/base-imagery/night-lights/{date}/{z}/{x}/{y}.png",
          defaultOpacity: 1,
        },
      ],
    });

    loadFeaturedCommandCenterCitiesMock.mockResolvedValue([
      {
        cityId: "geo-745044",
        slug: "geo-745044-istanbul",
        name: "Istanbul",
        admin1Name: "Istanbul",
        countryIso3: "TUR",
        population: 15701602,
        isMajorCity: true,
        latitude: 41.0082,
        longitude: 28.9784,
      },
      {
        cityId: "geo-323786",
        slug: "geo-323786-ankara",
        name: "Ankara",
        admin1Name: "Ankara",
        countryIso3: "TUR",
        population: 3517182,
        isMajorCity: true,
        latitude: 39.9334,
        longitude: 32.8597,
      },
    ]);

    loadCityFootprintSelectionMock.mockResolvedValue({
      generatedAt: "2026-03-20T00:00:00.000Z",
      selectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
      cities: [],
    });
    loadCityFootprintCatalogMock.mockResolvedValue({
      generatedAt: "2026-03-20T00:00:00.000Z",
      selectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
      cities: [
        {
          cityId: "geo-745044",
          slug: "geo-745044-istanbul",
          name: "Istanbul",
          countryIso3: "TUR",
          assetPath: "/data/globe/reference/city-footprints/geo-745044.geojson",
          latitude: 41.01384,
          longitude: 28.94966,
          population: 15701602,
          areaSqKm: 8873.975,
          matchDistanceMeters: 0,
          sourceLabel: "Natural Earth Admin1",
        },
      ],
    });
  });

  it("boots the homepage in city-first mode on a blank visit", async () => {
    const Home = (await import("./page")).default;
    render(await Home());

    expect(JSON.parse(screen.getByTestId("home-shell-props").textContent ?? "{}")).toMatchObject({
      activeBaseImageryLayerId: "night-lights",
      activeDate: "2016-01-01",
      activeLayerIds: ["ports"],
      activeViewId: "global-ops",
      citySelectionAssetPath: "/data/globe/reference/city-footprints/selectable.geojson",
      selectedCitySlug: "geo-745044-istanbul",
      selectedCityPanel: null,
      selectedCitySummary: {
        cityId: "geo-745044",
        name: "Istanbul",
        countryIso3: "TUR",
        slug: "geo-745044-istanbul",
      },
      featuredCities: [
        { name: "Istanbul", slug: "geo-745044-istanbul" },
        { name: "Ankara", slug: "geo-323786-ankara" },
      ],
    });
  });

  it("renders the default Ports evidence layer and no other extra layers by default", async () => {
    const Home = (await import("./page")).default;
    render(await Home());

    expect(JSON.parse(screen.getByTestId("home-shell-props").textContent ?? "{}")).toMatchObject({
      activeLayerIds: ["ports"],
      activeViewId: "global-ops",
    });
  });

  it("resolves default base imagery to the published night-lights pack and its first date", async () => {
    loadBaseImageryCatalogMock.mockResolvedValueOnce({
      generatedAt: "2026-03-15T00:00:00.000Z",
      defaultLayerId: "true-color",
      layers: [
        {
          id: "true-color",
          label: "True Color",
          family: "Base Maps",
          status: "published",
          availableDates: ["2026-03-15"],
          minZoom: 0,
          maxZoom: 3,
          attribution: ["NASA GIBS"],
          assetPathTemplate: "/data/globe/base-imagery/true-color/{date}/{z}/{x}/{y}.jpg",
          defaultOpacity: 1,
        },
        {
          id: "night-lights",
          label: "Night Lights",
          family: "Satellite",
          status: "published",
          availableDates: ["2016-01-01"],
          minZoom: 0,
          maxZoom: 3,
          attribution: ["NASA Black Marble"],
          assetPathTemplate: "/data/globe/base-imagery/night-lights/{date}/{z}/{x}/{y}.png",
          defaultOpacity: 1,
        },
      ],
    });

    const Home = (await import("./page")).default;
    render(await Home());

    expect(JSON.parse(screen.getByTestId("home-shell-props").textContent ?? "{}")).toMatchObject({
      activeBaseImageryLayerId: "night-lights",
      activeDate: "2016-01-01",
    });
  });

  it("prefers the night-lights pack for default base imagery when true-color is excluded", async () => {
    loadBaseImageryCatalogMock.mockResolvedValueOnce({
      generatedAt: "2026-03-15T00:00:00.000Z",
      defaultLayerId: "night-lights",
      layers: [
        {
          id: "true-color",
          label: "True Color",
          family: "Base Maps",
          status: "published",
          availableDates: ["2026-03-15"],
          minZoom: 0,
          maxZoom: 3,
          attribution: ["NASA GIBS"],
          assetPathTemplate: "/data/globe/base-imagery/true-color/{date}/{z}/{x}/{y}.jpg",
          defaultOpacity: 1,
        },
        {
          id: "night-lights",
          label: "Night Lights",
          family: "Satellite",
          status: "published",
          availableDates: ["2016-01-01"],
          minZoom: 0,
          maxZoom: 3,
          attribution: ["NASA Black Marble"],
          assetPathTemplate: "/data/globe/base-imagery/night-lights/{date}/{z}/{x}/{y}.png",
          defaultOpacity: 1,
        },
      ],
    });

    const Home = (await import("./page")).default;
    render(await Home());

    expect(JSON.parse(screen.getByTestId("home-shell-props").textContent ?? "{}")).toMatchObject({
      activeBaseImageryLayerId: "night-lights",
      activeDate: "2016-01-01",
    });
  });

  it("ignores obsolete surface query state and stays on the 2D operator map", async () => {
    const Home = (await import("./page")).default;
    render(await Home());

    expect(screen.getByTestId("home-shell-props").textContent ?? "").not.toContain("activeSurfaceMode");
  });
});
