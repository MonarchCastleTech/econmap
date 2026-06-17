import { describe, expect, it } from "vitest";

import { countrySchema, indicatorObservationSchema } from "@/domain/schemas";

describe("domain schemas", () => {
  it("parses a valid country record", () => {
    const parsed = countrySchema.parse({
      id: "country-united-states",
      slug: "united-states",
      iso2: "US",
      iso3: "USA",
      name: "United States",
      flag: "🇺🇸",
      capital: "Washington, D.C.",
      region: "North America",
      subregion: "Northern America",
      latitude: 38.9,
      longitude: -77.04,
      currencyCode: "USD",
      currencyName: "US Dollar",
      creditRating: "AA+",
      blocs: ["g20", "oecd"],
      showcase: true,
    });

    expect(parsed.name).toBe("United States");
    expect(parsed.showcase).toBe(true);
  });

  it("rejects invalid observation statuses", () => {
    expect(() =>
      indicatorObservationSchema.parse({
        id: "obs-1",
        entityType: "country",
        entityId: "united-states",
        indicatorId: "gdp-current-usd",
        year: 2025,
        value: 29.1,
        unit: "trillion_usd",
        status: "provisional",
        source: {
          id: "world-bank",
          name: "World Bank",
          updatedAt: "2026-01-15",
          coverage: "High",
          methodology: "Seeded demo source",
        },
      }),
    ).toThrowError(/status/i);
  });

  it("preserves forecast status metadata", () => {
    const parsed = indicatorObservationSchema.parse({
      id: "obs-forecast",
      entityType: "country",
      entityId: "india",
      indicatorId: "inflation-cpi",
      year: 2027,
      value: 4.7,
      unit: "percent",
      status: "forecast",
      source: {
        id: "mapfactbook-macro-lab",
        name: "MapFactbook Macro Lab",
        updatedAt: "2026-03-13",
        coverage: "Scenario",
        methodology: "Scenario-based seeded forecast",
      },
    });

    expect(parsed.status).toBe("forecast");
    expect(parsed.source.coverage).toBe("Scenario");
  });
});
