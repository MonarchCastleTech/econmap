import { describe, expect, it } from "vitest";

import { citySchema, citySearchIndexEntrySchema } from "./city-schemas";

const IDENTITY = {
  placeClass: "city" as const,
  featureClass: "P" as const,
  featureCode: "PPLA",
  sourceIds: {
    geonames: "311046",
    wikidata: "Q35997",
  },
};

describe("city identity schemas", () => {
  it("preserves canonical identity on registry records", () => {
    const parsed = citySchema.parse({
      cityId: "geo-311046",
      slug: "geo-311046-izmir",
      name: "İzmir",
      aliases: ["Izmir"],
      countryIso2: "TR",
      countryIso3: "TUR",
      countrySlug: "turkiye",
      latitude: 38.4127,
      longitude: 27.1384,
      registrySource: "GeoNames",
      isMajorCity: true,
      ...IDENTITY,
    });

    expect(parsed).toMatchObject(IDENTITY);
  });

  it("preserves place classification in search entries", () => {
    const parsed = citySearchIndexEntrySchema.parse({
      cityId: "geo-862467",
      slug: "geo-862467-kecioren",
      name: "Keçiören",
      aliases: ["Kecioren"],
      countryIso3: "TUR",
      population: 939_279,
      isMajorCity: false,
      placeClass: "subordinate_place",
      featureCode: "PPLX",
    });

    expect(parsed).toMatchObject({
      placeClass: "subordinate_place",
      featureCode: "PPLX",
    });
  });

  it("keeps legacy generated records readable as cities", () => {
    const parsed = citySchema.parse({
      cityId: "geo-1",
      slug: "geo-1-legacy",
      name: "Legacy City",
      countryIso3: "TST",
      countrySlug: "test",
      latitude: 1,
      longitude: 2,
      registrySource: "GeoNames",
    });

    expect(parsed.placeClass).toBe("city");
    expect(parsed.sourceIds).toEqual({ geonames: "1" });
  });
});
