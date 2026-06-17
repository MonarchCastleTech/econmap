import { describe, expect, it } from "vitest";

import {
  getAvailableDatesForImageryLayer,
  getImageryLevelBounds,
  getPublishedTacticalLayers,
  isTacticalLayerPublished,
} from "@/features/home/lib/globe-catalog";

describe("globe-catalog", () => {
  it("returns only published tactical layers", () => {
    expect(
      getPublishedTacticalLayers([
        {
          id: "cities",
          name: "Cities",
          category: "Borders & Labels",
          sourceType: "vector",
          status: "published",
          timeEnabled: false,
          opacity: 1,
          visible: true,
          attribution: ["GeoNames"],
          sourceLabels: ["GeoNames"],
        },
        {
          id: "weather-radar",
          name: "Weather Radar",
          category: "Weather",
          sourceType: "raster",
          status: "not_yet_published",
          timeEnabled: true,
          opacity: 0.8,
          visible: false,
          attribution: [],
          sourceLabels: [],
        },
      ]).map((layer) => layer.id),
    ).toEqual(["cities"]);
  });

  it("returns available dates for a published imagery layer", () => {
    expect(
      getAvailableDatesForImageryLayer(
        {
          generatedAt: "2026-03-15T00:00:00.000Z",
          defaultLayerId: "true-color",
          layers: [
            {
              id: "true-color",
              label: "True Color",
              family: "Base Maps",
              status: "published",
              availableDates: ["2026-03-14", "2026-03-15"],
              minZoom: 0,
              maxZoom: 8,
              attribution: ["NASA GIBS"],
              assetPathTemplate: "/data/globe/base-imagery/true-color/{date}/{z}/{x}/{y}.jpg",
              defaultOpacity: 1,
            },
          ],
        },
        "true-color",
      ),
    ).toEqual(["2026-03-14", "2026-03-15"]);
  });

  it("treats only published tactical layers as renderable", () => {
    expect(
      isTacticalLayerPublished({
        id: "night-lights",
        name: "Night Lights",
        category: "Satellite",
        sourceType: "imagery",
        status: "published",
        timeEnabled: true,
        opacity: 1,
        visible: true,
        attribution: ["NASA Black Marble"],
        sourceLabels: ["NASA Black Marble"],
      }),
    ).toBe(true);
  });

  it("returns imagery zoom bounds for a published local imagery pack", () => {
    expect(
      getImageryLevelBounds(
        {
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
          ],
        },
        "true-color",
      ),
    ).toEqual({
      maximumLevel: 3,
      minimumLevel: 0,
    });
  });
});
