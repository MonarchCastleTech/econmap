import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetCityIntelligenceCache,
  loadCityAlerts,
  loadCityIntelligence,
} from "@/lib/city-intelligence-client";

const INDEX = {
  schemaVersion: "1.0",
  generatedAt: "2026-07-28T00:00:00.000Z",
  sourceStatuses: [
    {
      sourceId: "gsma-coverage",
      status: "licensed",
      checkedAt: "2026-07-28T00:00:00.000Z",
      detail: "Licensed source unavailable.",
    },
  ],
  cities: {
    "geo-1": {
      schemaVersion: "1.0",
      generatedAt: "2026-07-28T00:00:00.000Z",
      cityId: "geo-1",
      telecomEvidence: "unknown",
      geographies: [],
      observations: [],
      deltas: [],
      alerts: [],
      sourceStatuses: [],
    },
  },
};

beforeEach(() => {
  __resetCityIntelligenceCache();
  vi.restoreAllMocks();
});

describe("city intelligence client", () => {
  it("loads and caches a published city bundle", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(INDEX), { status: 200 }));

    expect(await loadCityIntelligence("geo-1")).toMatchObject({
      cityId: "geo-1",
      telecomEvidence: "unknown",
    });
    await loadCityIntelligence("geo-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("synthesizes an honest baseline bundle for cities without observations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(INDEX), { status: 200 }),
    );

    const bundle = await loadCityIntelligence("geo-999");

    expect(bundle).toMatchObject({
      cityId: "geo-999",
      telecomEvidence: "unknown",
      observations: [],
      sourceStatuses: INDEX.sourceStatuses,
    });
  });

  it("loads the global alert feed and degrades to an empty list on failure", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            schemaVersion: "1.0",
            generatedAt: "2026-07-28T00:00:00.000Z",
            alerts: [
              {
                id: "a1",
                cityId: "geo-1",
                topic: "hazard",
                severity: "warning",
                changeType: "added",
                title: "Earthquake detected",
                summary: "A nearby event was detected.",
                sourceId: "usgs-earthquakes",
                observedAt: "2026-07-28T00:00:00.000Z",
                detectedAt: "2026-07-28T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 },
        ),
      );
    expect(await loadCityAlerts()).toHaveLength(1);

    __resetCityIntelligenceCache();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(await loadCityAlerts()).toEqual([]);
  });
});
