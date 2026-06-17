// @vitest-environment node

import { describe, expect, it } from "vitest";

import { collectAliasesForGeoname } from "./parsers/geonames-aliases";

describe("GeoNames alternate names", () => {
  it("deduplicates aliases for a single geoname id", () => {
    const rows = [
      "1284819\t2994701\t\tRoc Mélé\t\t\t\t\t\t",
      "1284820\t2994701\t\tRoc Meler\t\t\t\t\t\t",
      "1284821\t2994701\t\tRoc Meler\t\t\t\t\t\t",
    ];

    expect(collectAliasesForGeoname("2994701", rows)).toEqual(["Roc Meler", "Roc Mélé"]);
  });
});
