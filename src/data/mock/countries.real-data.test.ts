import { describe, expect, it } from "vitest";

import { getObservation } from "@/data/mock/countries";
import { historyYears, latestYear } from "@/data/mock/catalog";

describe("real country data cutover", () => {
  it("uses the real annual data window instead of a synthetic 2025 estimate", () => {
    expect(latestYear).toBe(2024);
    expect(historyYears).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    expect(getObservation("germany", "gdp-current-usd", 2025)).toBeUndefined();
  });

  it("reads a real sourced 2024 GDP observation for Germany", () => {
    const observation = getObservation("germany", "gdp-current-usd", 2024);

    expect(observation).toBeDefined();
    expect(observation?.source.id).toBe("world-bank");
    expect(observation?.status).toBe("actual");
    expect(Math.round(observation?.value ?? 0)).toBe(4_685_592_577_805);
  });
});
