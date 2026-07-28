import { describe, expect, it } from "vitest";

import { normalizeUsgsEarthquakes } from "./fetch-usgs-earthquakes";

describe("USGS earthquake intelligence adapter", () => {
  it("matches an event to nearby canonical cities and publishes its radius methodology", () => {
    const observations = normalizeUsgsEarthquakes(
      {
        features: [
          {
            id: "quake-1",
            properties: {
              mag: 4.8,
              place: "near Bursa",
              time: Date.parse("2026-07-28T01:00:00.000Z"),
              updated: Date.parse("2026-07-28T01:05:00.000Z"),
              url: "https://earthquake.usgs.gov/earthquakes/eventpage/quake-1",
            },
            geometry: { coordinates: [29.05, 40.2, 8] },
          },
        ],
      },
      [
        {
          cityId: "geo-750269",
          name: "Bursa",
          countryIso3: "TUR",
          latitude: 40.1956,
          longitude: 29.0601,
        },
        {
          cityId: "geo-2988507",
          name: "Paris",
          countryIso3: "FRA",
          latitude: 48.8534,
          longitude: 2.3488,
        },
      ],
      "2026-07-28T02:00:00.000Z",
    );

    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      cityId: "geo-750269",
      metric: "earthquake",
      value: 4.8,
      evidenceKind: "measured",
      geographyKind: "radius",
      sourceId: "usgs-earthquakes",
    });
    expect(observations[0].methodology).toContain("100 km");
    expect(observations[0].note).toContain("near Bursa");
  });

  it("ignores malformed and distant events", () => {
    const observations = normalizeUsgsEarthquakes(
      {
        features: [
          {
            id: "bad",
            properties: { mag: null, place: null, time: null, updated: null },
            geometry: { coordinates: [] },
          },
          {
            id: "far",
            properties: {
              mag: 2,
              place: "far away",
              time: Date.parse("2026-07-28T01:00:00.000Z"),
              updated: Date.parse("2026-07-28T01:00:00.000Z"),
            },
            geometry: { coordinates: [-150, -60, 1] },
          },
        ],
      },
      [
        {
          cityId: "geo-750269",
          name: "Bursa",
          countryIso3: "TUR",
          latitude: 40.1956,
          longitude: 29.0601,
        },
      ],
      "2026-07-28T02:00:00.000Z",
    );

    expect(observations).toEqual([]);
  });
});
