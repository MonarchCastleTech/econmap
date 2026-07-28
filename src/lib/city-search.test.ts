import { describe, expect, it } from "vitest";

import { rankCitySearchEntries } from "./city-search";

const entries = [
  {
    cityId: "orhangazi",
    name: "Orhangazi",
    aliases: [],
    admin1Name: "Bursa Province",
    countryIso3: "TUR",
    placeClass: "city" as const,
    population: 80_000,
  },
  {
    cityId: "bursa",
    name: "Bursa",
    aliases: [],
    admin1Name: "Bursa Province",
    countryIso3: "TUR",
    placeClass: "city" as const,
    population: 3_100_000,
  },
  {
    cityId: "paris-district",
    name: "Paris",
    aliases: [],
    admin1Name: "Texas",
    countryIso3: "USA",
    placeClass: "subordinate_place" as const,
    population: 24_000,
  },
  {
    cityId: "paris-city",
    name: "Paris",
    aliases: [],
    admin1Name: "Ile-de-France",
    countryIso3: "FRA",
    placeClass: "city" as const,
    population: 2_100_000,
  },
];

describe("rankCitySearchEntries", () => {
  it("ranks an exact city name above cities that only match its admin area", () => {
    expect(rankCitySearchEntries(entries, "Bursa").map((entry) => entry.cityId)).toEqual([
      "bursa",
      "orhangazi",
    ]);
  });

  it("ranks canonical cities above subordinate places for equal exact names", () => {
    expect(rankCitySearchEntries(entries, "Paris").map((entry) => entry.cityId)).toEqual([
      "paris-city",
    ]);
  });
});
