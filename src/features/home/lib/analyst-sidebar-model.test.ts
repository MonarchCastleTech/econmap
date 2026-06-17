import { describe, expect, it } from "vitest";

import {
  buildAnalystSidebarSections,
  buildCommandCenterCityAnalystNavigation,
  buildSavedCitiesWatchlist,
} from "./analyst-sidebar-model";
import type { CommandCenterCityPanel, CommandCenterManifest, GlobeManifest } from "@/domain/types";

const ourairportsSource = {
  id: "ourairports",
  name: "OurAirports",
  updatedAt: "2026-01-01",
  coverage: "global",
  methodology: "registry",
};

const airportEntity = {
  entityId: "airport-1",
  cityId: "geo-1",
  entityName: "Testopolis Intl",
  entityType: "airport" as const,
  presenceType: "airport" as const,
  exactSite: true,
  geometryMode: "exact" as const,
  sources: [ourairportsSource],
  lastVerifiedAt: "2026-01-01",
  confidenceState: "verified_exact" as const,
};

const city = {
  cityId: "geo-1",
  slug: "geo-1-testopolis",
  name: "Testopolis",
  countryIso3: "TUR",
  countrySlug: "turkey",
  latitude: 41,
  longitude: 29,
  registrySource: "GeoNames",
};

const workspace = {
  city,
  summary: "Test workspace",
  roleTags: [],
  coverage: {
    economicFactbook: "verified_exact" as const,
    investorIntel: "not_covered_yet" as const,
    urbanIntel: "not_covered_yet" as const,
  },
  economicFactbook: [],
  investorIntel: [],
  urbanIntel: [],
  entityCounts: { airport: 3 },
  entityHighlights: [airportEntity],
  mapLayerSummary: { availableLayers: ["airports"] },
  sources: [ourairportsSource],
  economicIntel: [],
  transportIntel: [],
  utilitiesIntel: [],
  telecomIntel: [],
  environmentIntel: [],
  organizationIntel: [],
  coverageBoundaryType: "admin_selection_surface" as const,
  sourceCoverageSummary: [],
};

const panel = {
  city,
  workspace,
  coverageShell: null,
  entities: { cityId: "geo-1", entities: [airportEntity], sources: [] },
  sources: { cityId: "geo-1", sources: [] },
} as unknown as CommandCenterCityPanel;

const manifest = {
  generatedAt: "2026-01-01T00:00:00.000Z",
  defaultViewId: "global-ops",
  globalIntelligence: [],
  opsTimeline: [],
  savedViews: [],
  sourceSummary: [],
  datasetInventory: [
    {
      id: "ourairports",
      label: "OurAirports",
      status: "published_to_website" as const,
      sourceLabels: ["OurAirports"],
      detail: "Airports",
      websiteSurfaces: [],
    },
    {
      id: "peeringdb",
      label: "PeeringDB",
      status: "identified_public_source" as const,
      sourceLabels: ["PeeringDB"],
      detail: "Internet exchange points",
      websiteSurfaces: [],
    },
  ],
  tacticalLayerCatalog: [],
} as unknown as CommandCenterManifest;

function findRow(
  section:
    | {
        rows: ReadonlyArray<{
          id: string;
          state?: string;
          mappedCount?: number;
          queuedDatasetCount?: number;
          sourceLabels?: string[];
        }>;
      }
    | undefined,
  id: string,
) {
  return section?.rows.find((row) => row.id === id);
}

describe("buildCommandCenterCityAnalystNavigation (live analyst model)", () => {
  const nav = buildCommandCenterCityAnalystNavigation({ panel, commandCenterManifest: manifest });

  it("exposes all analyst sections used by the sidebar", () => {
    for (const key of [
      "dossierSections",
      "infrastructureCategories",
      "institutionsPublicServices",
      "telecomConnectivity",
      "utilitiesEnergy",
      "logisticsTransport",
      "environmentHazards",
      "sourceCoverageDataQuality",
      "missingCoverage",
    ] as const) {
      expect(nav[key], `missing section ${key}`).toBeTruthy();
    }
  });

  it("marks a source-backed category as mapped with its real entity count and source label", () => {
    const airports = findRow(nav.logisticsTransport, "airports");
    expect(airports?.state).toBe("mapped");
    expect(airports?.mappedCount).toBe(3);
    expect(airports?.sourceLabels).toContain("OurAirports");
  });

  it("marks an identified-but-unpublished dataset category as queued with its dataset source label", () => {
    const ixps = findRow(nav.telecomConnectivity, "ixps");
    expect(ixps?.state).toBe("queued");
    expect(ixps?.queuedDatasetCount).toBe(1);
    expect(ixps?.sourceLabels).toContain("PeeringDB");
  });

  it("marks a category with no source-backed evidence as missing", () => {
    const hospitals = findRow(nav.institutionsPublicServices, "hospitals-clinics");
    expect(hospitals?.state).toBe("missing");
  });

  it("collects queued and missing rows into the explicit missing-coverage section", () => {
    const ids = nav.missingCoverage.rows.map((row) => row.id);
    expect(ids).toContain("ixps");
    expect(ids).toContain("hospitals-clinics");
    // a mapped category must NOT be listed as a gap
    expect(ids).not.toContain("airports");
  });

  it("shows infrastructure foundation rows instead of re-summarising other sections", () => {
    const ids = nav.infrastructureCategories.rows.map((row) => row.id);
    expect(ids).toContain("city-boundaries");
    expect(ids).toContain("transport-network-foundation");
    // must not duplicate the logistics/telecom sections that already render below
    expect(ids).not.toContain("logistics-transport");
    expect(ids).not.toContain("telecom-connectivity");
  });
});

describe("buildSavedCitiesWatchlist (user-authored watchlist)", () => {
  const recent = [
    {
      cityId: "geo-1",
      slug: "geo-1-izmir",
      name: "Izmir",
      countryIso3: "TUR",
      latitude: 38.4,
      longitude: 27.1,
    },
  ];

  it("returns null when nothing is saved", () => {
    expect(buildSavedCitiesWatchlist([], recent)).toBeNull();
  });

  it("builds a watchlist resolving names from recent cities, falling back to slug", () => {
    const wl = buildSavedCitiesWatchlist(["geo-1-izmir", "geo-2-unknown"], recent);
    expect(wl?.id).toBe("saved-cities");
    expect(wl?.cityCount).toBe(2);
    expect(wl?.cityLabels).toEqual(["Izmir", "geo-2-unknown"]);
    expect(wl?.href).toBe("/?city=geo-1-izmir");
    expect(wl?.sourceLabels).toEqual(["Your watchlist"]);
  });
});

describe("buildAnalystSidebarSections (layer toggle href on the blank home page)", () => {
  // Ports datasets published + a published ports globe layer, no selected city.
  const portsManifest = {
    generatedAt: "2026-01-01T00:00:00.000Z",
    defaultViewId: "global-ops",
    globalIntelligence: [],
    opsTimeline: [],
    savedViews: [],
    sourceSummary: [],
    datasetInventory: [
      {
        id: "world-port-index",
        label: "World Port Index",
        status: "published_to_website" as const,
        sourceLabels: ["World Port Index"],
        detail: "Ports",
        websiteSurfaces: [],
      },
      {
        id: "un-locode",
        label: "UN/LOCODE",
        status: "published_to_website" as const,
        sourceLabels: ["UN/LOCODE"],
        detail: "Ports and logistics nodes",
        websiteSurfaces: [],
      },
    ],
    tacticalLayerCatalog: [],
  } as unknown as CommandCenterManifest;

  const globeManifest = {
    generatedAt: "2026-01-01T00:00:00.000Z",
    layers: [
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
  } as unknown as GlobeManifest;

  function buildSections(activeLayerIds: string[]) {
    const navigation = buildCommandCenterCityAnalystNavigation({
      panel: null,
      commandCenterManifest: portsManifest,
    });
    return buildAnalystSidebarSections({
      navigation,
      globeManifest,
      commandCenterManifest: portsManifest,
      activeLayerIds,
      activeViewId: "global-ops",
      activeBaseImageryLayerId: "night-lights",
      activeDate: undefined,
      searchQuery: "",
      selectedCitySlug: undefined,
    });
  }

  function findPortsRow(sections: ReturnType<typeof buildSections>) {
    for (const section of sections) {
      const row = section.rows.find((r) => r.id === "ports");
      if (row) return row;
    }
    return undefined;
  }

  it("emits a toggle-ON href for the ports layer when it is inactive (no city selected)", () => {
    const row = findPortsRow(buildSections([]));
    expect(row).toBeDefined();
    expect(row!.active).toBe(false);
    expect(row!.href).toBeDefined();
    // Clicking turns the layer ON, so the next-state href carries layers=ports.
    expect(row!.href).toContain("ports");
  });

  it("emits a toggle-OFF href for the ports layer when it is active", () => {
    const row = findPortsRow(buildSections(["ports"]));
    expect(row).toBeDefined();
    expect(row!.active).toBe(true);
    expect(row!.href).toBeDefined();
    // Clicking turns the layer OFF, so the next-state href no longer carries layers=ports.
    expect(row!.href).not.toContain("layers=ports");
  });
});
