import { describe, expect, it } from "vitest";

import {
  baseImageryCatalogSchema,
  commandCenterManifestSchema,
  coverageStateSchema,
  globeLayerManifestSchema,
  tacticalLayerSchema,
} from "@/domain/command-center-schemas";

describe("command-center schemas", () => {
  it("uses the approved coverage states", () => {
    expect(() => coverageStateSchema.parse("partial_coverage")).not.toThrow();
    expect(() => coverageStateSchema.parse("known_unknown")).toThrow();
  });

  it("parses a shipped homepage manifest", () => {
    expect(() =>
      commandCenterManifestSchema.parse({
        generatedAt: "2026-03-15T00:00:00.000Z",
        defaultViewId: "global-ops",
        globalIntelligence: [],
        opsTimeline: [],
        savedViews: [],
        sourceSummary: [],
        datasetInventory: [
          {
            id: "geonames",
            label: "GeoNames",
            status: "published_to_website",
            sourceLabels: ["GeoNames"],
            detail: "Surfaced on the website via city bundles and the cities globe layer.",
            websiteSurfaces: ["city bundles", "globe layer"],
          },
        ],
      }),
    ).not.toThrow();
  });

  it("parses a shipped globe layer manifest", () => {
    expect(() =>
      globeLayerManifestSchema.parse({
        id: "airports",
        label: "Airports",
        family: "Transport",
        sourceLabels: ["OurAirports"],
        tier: "interactive",
        supportsCityFocus: true,
        supportsTime: false,
        assetPath: "/data/globe/layers/airports/meta.json",
      }),
    ).not.toThrow();
  });

  it("parses a base imagery catalog with local available dates", () => {
    expect(() =>
      baseImageryCatalogSchema.parse({
        generatedAt: "2026-03-15T00:00:00.000Z",
        defaultLayerId: "true-color",
        layers: [
          {
            id: "true-color",
            label: "True Color",
            family: "Base Maps",
            availableDates: ["2026-03-15"],
            minZoom: 0,
            maxZoom: 8,
            attribution: ["NASA GIBS"],
            assetPathTemplate: "/data/globe/base-imagery/true-color/{date}/{z}/{x}/{y}.jpg",
            defaultOpacity: 1,
          },
        ],
      }),
    ).not.toThrow();
  });

  it("parses visible-but-unpublished layer state", () => {
    expect(() =>
      tacticalLayerSchema.parse({
        id: "weather-radar",
        name: "Weather Radar",
        category: "Weather",
        sourceType: "raster",
        status: "not_yet_published",
        timeEnabled: true,
        opacity: 0.8,
        visible: false,
        attribution: [],
      }),
    ).not.toThrow();
  });
});
