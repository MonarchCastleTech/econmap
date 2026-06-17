// @vitest-environment node

import { describe, expect, it } from "vitest";

import { findPowerPlantsForCity, normalizePowerPlantRow } from "./wri-powerplants-parser";

describe("findPowerPlantsForCity", () => {
  it("matches ISO3-coded WRI plants against ISO2 city records when the city also provides ISO3", () => {
    const plant = normalizePowerPlantRow({
      country: "TUR",
      country_long: "Turkey",
      name: "Ambarli Gas Plant",
      gppd_idnr: "TUR-1",
      capacity_mw: "1200",
      latitude: "41.027",
      longitude: "28.71",
      primary_fuel: "Gas",
    });

    expect(plant).not.toBeNull();

    const city = {
      name: "Istanbul",
      countryIso2: "TR",
      countryIso3: "TUR",
      latitude: 41.01384,
      longitude: 28.94966,
    };

    expect(findPowerPlantsForCity([plant!], city, 100)).toHaveLength(1);
  });
});
