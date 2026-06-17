import { describe, expect, it } from "vitest";

import { buildCompareTable, normalizeCompareValues } from "@/features/compare/compare-logic";

describe("compare logic", () => {
  it("builds comparable rows for selected countries", () => {
    const rows = buildCompareTable(
      ["united-states", "germany", "india"],
      ["gdp-current-usd", "inflation-cpi"],
    );

    expect(rows).toHaveLength(3);
    expect(rows[0]?.country.slug).toBe("united-states");
    expect(rows[1]?.values["inflation-cpi"]).toBeTypeOf("number");
  });

  it("normalizes values to a 0-100 range", () => {
    const rows = buildCompareTable(
      ["united-states", "germany", "india"],
      ["gdp-current-usd"],
    );

    const normalized = normalizeCompareValues(rows, "gdp-current-usd");
    expect(normalized[0]?.normalizedValue).toBe(100);
    expect(normalized[2]?.normalizedValue).toBeLessThanOrEqual(100);
  });
});
