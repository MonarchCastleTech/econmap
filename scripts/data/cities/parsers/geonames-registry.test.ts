import { describe, expect, it } from "vitest";

import { parseGeoNamesRegistryRow } from "./geonames-registry";

const META = {
  countryIso3: "TUR",
  countryName: "Türkiye",
};

function row({
  id,
  name,
  featureClass = "P",
  featureCode,
  population,
  countryIso2 = "TR",
}: {
  id: string;
  name: string;
  featureClass?: string;
  featureCode: string;
  population: number;
  countryIso2?: string;
}) {
  const fields = Array.from({ length: 19 }, () => "");
  fields[0] = id;
  fields[1] = name;
  fields[4] = "40.1";
  fields[5] = "29.1";
  fields[6] = featureClass;
  fields[7] = featureCode;
  fields[8] = countryIso2;
  fields[10] = "16";
  fields[14] = String(population);
  return fields.join("\t");
}

describe("parseGeoNamesRegistryRow place identity", () => {
  it.each([
    ["Bursa", "PPLA", 3_101_833],
    ["Antalya", "PPLA", 1_344_000],
    ["Diyarbakır", "PPLA", 1_129_000],
    ["İzmir", "PPLA", 2_938_000],
    ["Muş", "PPLA", 113_000],
    ["Mexico City", "PPLC", 9_209_944],
    ["Paris", "PPLC", 2_102_650],
    ["Toulouse", "PPLA", 493_465],
  ])("classifies %s as a city", (name, featureCode, population) => {
    const parsed = parseGeoNamesRegistryRow(
      row({ id: `id-${name}`, name, featureCode, population }),
      META,
    );

    expect(parsed).toMatchObject({
      name,
      placeClass: "city",
      featureClass: "P",
      featureCode,
      sourceIds: {
        geonames: `id-${name}`,
      },
    });
  });

  it.each([
    ["Keçiören", "PPLX", 939_279, undefined],
    ["Esenyurt", "PPL", 983_571, "Esenyurt"],
    ["Varto", "PPLA2", 18_762, "Varto İlçesi"],
    ["Nilüfer", "PPLA2", 536_365, "Nilüfer"],
  ])("keeps %s as a subordinate place", (name, featureCode, population, admin2Name) => {
    const parsed = parseGeoNamesRegistryRow(
      row({ id: `id-${name}`, name, featureCode, population }),
      { ...META, admin2Name },
    );

    expect(parsed).toMatchObject({
      name,
      placeClass: "subordinate_place",
      isMajorCity: false,
    });
  });

  it.each([
    ["İzmir", "geo-izmir-izmir"],
    ["Muş", "geo-mus-mus"],
    ["Diyarbakır", "geo-diyarbakir-diyarbakir"],
  ])("creates a stable ASCII slug for %s", (name, expectedSlug) => {
    const parsed = parseGeoNamesRegistryRow(
      row({ id: expectedSlug.split("-")[1], name, featureCode: "PPLA", population: 100_000 }),
      META,
    );

    expect(parsed?.slug).toBe(expectedSlug);
  });

  it("does not admit California administrative-region rows into the city registry", () => {
    const parsed = parseGeoNamesRegistryRow(
      row({
        id: "5332921",
        name: "California",
        featureClass: "A",
        featureCode: "ADM1",
        population: 39_000_000,
        countryIso2: "US",
      }),
      { countryIso3: "USA", countryName: "United States" },
    );

    expect(parsed).toBeNull();
  });
});
