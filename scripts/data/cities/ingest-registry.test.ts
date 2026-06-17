import { describe, expect, it } from "vitest";
import { parseGeoNamesRegistryRow } from "./parsers/geonames-registry";

describe("GeoNames registry parser", () => {
  it("keeps populated-place rows and maps iso/admin metadata", () => {
    const row = "3039154\tSant Julià de Lòria\tSant Julia de Loria\t...\t42.46372\t1.49129\tP\tPPLA\tAD\t\t06\t\t\t\t8022\t...\tEurope/Andorra\t2024-02-01";
    const parsed = parseGeoNamesRegistryRow(row, {
      countryIso3: "AND",
      countryName: "Andorra",
      admin1Name: "Sant Julia de Loria",
    });

    expect(parsed?.cityId).toBe("geo-3039154");
    expect(parsed?.countryIso3).toBe("AND");
    expect(parsed?.admin1Name).toBe("Sant Julia de Loria");
  });
});
