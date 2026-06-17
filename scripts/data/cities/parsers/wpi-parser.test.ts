// @vitest-environment node

import { describe, expect, it } from "vitest";

import { normalizeWpiRow } from "./wpi-parser";

describe("normalizeWpiRow", () => {
  it("derives an ISO2 country code from UN/LOCODE when the source country field is a country name", () => {
    const port = normalizeWpiRow({
      "World Port Index Number": "14000",
      "Main Port Name": "Istanbul",
      "Alternate Port Name": "Haydarpasa",
      "UN/LOCODE": "TR IST",
      "Country Code": "Turkey",
      "Region Name": "Turkey W Coast",
      "North Water Body": "Sea of Marmara",
      Latitude: "41.0100",
      Longitude: "28.9700",
      "Harbor Type": "River (Natural)",
    });

    expect(port).not.toBeNull();
    expect(port?.countryIso2).toBe("TR");
    expect(port?.countryName).toBe("Turkey");
  });
});
